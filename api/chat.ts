import { handleChatPayloadStream, toClientError } from '../server/api.js';
import { checkRateLimit, getClientIp } from '../server/limiter.js';
import { checkEnv, getEnv, warnIfProductionWithoutRedis } from '../server/env.js';
import { createRequestId, createRequestLogger } from '../server/logger.js';
import { validateOptionalApiSecret } from '../server/security.js';
import { captureException, initMonitoring } from '../server/monitoring.js';

type VercelRequest = {
  method?: string;
  body: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
};

type VercelResponse = {
  status(statusCode: number): VercelResponse;
  json(payload: unknown): void;
  end(): void;
  setHeader(name: string, value: string): void;
  write(chunk: string): void;
  writeHead(statusCode: number, headers: Record<string, string>): void;
};

let monitoringReady: Promise<void> | null = null;

function ensureMonitoring(): Promise<void> {
  if (!monitoringReady) {
    monitoringReady = initMonitoring();
  }
  return monitoringReady;
}

export default async function handler(request: VercelRequest, response: VercelResponse) {
  await ensureMonitoring();
  warnIfProductionWithoutRedis();

  const requestId = createRequestId();
  const logger = createRequestLogger(requestId);
  const startedAt = Date.now();
  const env = getEnv();

  response.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Api-Secret');
  response.setHeader('X-Request-Id', requestId);

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Haničar-GPT prima samo POST zahtjeve.' });
    return;
  }

  try {
    checkEnv();
    validateOptionalApiSecret(request.headers || {}, env.apiSecret);
  } catch (error) {
    const clientError = toClientError(error);
    response.status(clientError.statusCode).json({ error: clientError.message });
    return;
  }

  const headers = request.headers || {};
  const clientIp = getClientIp(headers, request.socket?.remoteAddress);
  const limiterRes = await checkRateLimit(clientIp);

  response.setHeader('X-RateLimit-Limit', '20');
  response.setHeader('X-RateLimit-Remaining', String(limiterRes.remaining));
  response.setHeader('X-RateLimit-Reset', String(limiterRes.resetTime));

  if (!limiterRes.allowed) {
    response.status(429).json({
      error: 'Previše zahtjeva. Molimo pričekajte trenutak prije novih pitanja za Haničara.',
    });
    return;
  }

  try {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store',
      Connection: 'keep-alive',
    });

    await handleChatPayloadStream(request.body, (chunk) => {
      response.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    response.write('data: [DONE]\n\n');
    response.end();

    logger.info('Chat request completed', {
      latencyMs: Date.now() - startedAt,
      clientIp,
    });
  } catch (error) {
    const clientError = toClientError(error);
    logger.error('Chat request failed', {
      latencyMs: Date.now() - startedAt,
      statusCode: clientError.statusCode,
      clientIp,
    });
    await captureException(error, { requestId });

    try {
      response.write(`data: ${JSON.stringify({ error: clientError.message })}\n\n`);
      response.end();
    } catch {
      response.status(clientError.statusCode).json({ error: clientError.message });
    }
  }
}
