import { handleChatPayloadStream, toClientError, type StreamChunk } from './api.js';
import { checkRateLimit, checkTokenBudget, getClientIp, recordTokenUsage } from './limiter.js';
import { checkEnv, getEnv, warnIfProductionWithoutRedis } from './env.js';
import { createRequestId, createRequestLogger } from './logger.js';
import { validateOptionalApiSecret } from './security.js';
import { captureException, initMonitoring } from './monitoring.js';
import { isCircuitOpen } from './circuit-breaker.js';
import { incrementMetric } from './metrics.js';
import { CONSTANTS } from './constants.js';
import { getPromptVersion } from './prompts.js';
import { httpError } from './api.js';

export type ChatHandlerRequest = {
  method?: string;
  body: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socketRemoteAddress?: string;
};

export type ChatHandlerResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body?: string;
  streamed?: boolean;
};

export type ChatHandlerCallbacks = {
  write: (chunk: string) => void;
  setHeader: (name: string, value: string) => void;
  writeHead: (statusCode: number, headers: Record<string, string>) => void;
  end: () => void;
};

let monitoringReady: Promise<void> | null = null;

function ensureMonitoring(): Promise<void> {
  if (!monitoringReady) {
    monitoringReady = initMonitoring();
  }
  return monitoringReady;
}

function writeSse(write: (chunk: string) => void, chunk: StreamChunk): void {
  write(`data: ${JSON.stringify(chunk)}\n\n`);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(httpError(504, message));
    }, timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

export async function handleChatRequest(
  request: ChatHandlerRequest,
  callbacks: ChatHandlerCallbacks
): Promise<ChatHandlerResponse> {
  await ensureMonitoring();
  warnIfProductionWithoutRedis();

  const requestId = createRequestId();
  const logger = createRequestLogger(requestId);
  const startedAt = Date.now();
  const env = getEnv();
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': env.corsOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Api-Secret',
    'X-Request-Id': requestId,
  };

  for (const [key, value] of Object.entries(headers)) {
    callbacks.setHeader(key, value);
  }

  if (request.method === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  if (request.method !== 'POST') {
    return {
      statusCode: 405,
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: 'Haničar-GPT prima samo POST zahtjeve.' }),
    };
  }

  try {
    checkEnv();
    validateOptionalApiSecret(request.headers || {}, env.apiSecret);
  } catch (error) {
    const clientError = toClientError(error);
    return {
      statusCode: clientError.statusCode,
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({ error: clientError.message }),
    };
  }

  const clientIp = getClientIp(request.headers || {}, request.socketRemoteAddress);
  const limiterRes = await checkRateLimit(clientIp);
  headers['X-RateLimit-Limit'] = '20';
  headers['X-RateLimit-Remaining'] = String(limiterRes.remaining);
  headers['X-RateLimit-Reset'] = String(limiterRes.resetTime);

  if (!limiterRes.allowed) {
    await incrementMetric('errors429');
    return {
      statusCode: 429,
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: 'Previše zahtjeva. Molimo pričekajte trenutak prije novih pitanja za Haničara.',
      }),
    };
  }

  const tokenBudget = await checkTokenBudget(clientIp);
  if (!tokenBudget.allowed) {
    await incrementMetric('errors429');
    return {
      statusCode: 429,
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: 'Dnevni token budžet je iscrpljen. Haničar molitvu nastavlja sutra.',
      }),
    };
  }

  if (await isCircuitOpen()) {
    await incrementMetric('errors502');
    return {
      statusCode: 503,
      headers: { ...headers, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        error: 'OpenRouter je privremeno nedostupan. Molimo pokušajte za minutu.',
      }),
    };
  }

  const streamHeaders = {
    ...headers,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-store',
    Connection: 'keep-alive',
  };

  callbacks.writeHead(200, streamHeaders);

  let cacheHit = false;
  let modelUsed = '';
  let tokensUsed = 0;
  let statusCode = 200;

  try {
    await withTimeout(
      handleChatPayloadStream(
        request.body,
        (chunk) => {
          if (chunk.meta?.cacheHit !== undefined) {
            cacheHit = chunk.meta.cacheHit;
          }
          if (chunk.model) {
            modelUsed = chunk.model;
          }
          if (chunk.meta?.tokensUsed) {
            tokensUsed = chunk.meta.tokensUsed;
          }
          writeSse(callbacks.write, chunk);
        },
        {
          requestId,
          clientIp,
          logger,
          onCacheHit: (hit) => {
            cacheHit = hit;
          },
          onUsage: async (usage) => {
            tokensUsed = usage.totalTokens;
            await recordTokenUsage(clientIp, usage.totalTokens);
          },
        }
      ),
      CONSTANTS.HANDLER_TIMEOUT_MS,
      'Haničar je predugo molio. Molimo pokušajte s kraćim pitanjem.'
    );

    writeSse(callbacks.write, {
      meta: {
        requestId,
        model: modelUsed || undefined,
        cacheHit,
        promptVersion: getPromptVersion(),
      },
    });
    callbacks.write('data: [DONE]\n\n');
    callbacks.end();

    logger.info('Chat request completed', {
      latencyMs: Date.now() - startedAt,
      clientIp,
      cacheHit,
      model: modelUsed,
      promptVersion: getPromptVersion(),
    });

    await incrementMetric('requests');
    if (cacheHit) {
      await incrementMetric('cacheHits');
    }
    if (tokensUsed > 0) {
      await incrementMetric('tokens', tokensUsed);
    }

    return { statusCode, headers: streamHeaders, streamed: true };
  } catch (error) {
    const clientError = toClientError(error);
    statusCode = clientError.statusCode;
    logger.error('Chat request failed', {
      latencyMs: Date.now() - startedAt,
      statusCode: clientError.statusCode,
      clientIp,
    });
    await captureException(error, { requestId });

    if (clientError.statusCode === 429) {
      await incrementMetric('errors429');
    }
    if (clientError.statusCode >= 502) {
      await incrementMetric('errors502');
    }

    writeSse(callbacks.write, { error: clientError.message });
    callbacks.write('data: [DONE]\n\n');
    callbacks.end();

    return { statusCode, headers: streamHeaders, streamed: true };
  }
}
