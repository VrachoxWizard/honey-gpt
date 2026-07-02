import ky from 'ky';
import { CONSTANTS } from './constants.js';
import { getEnv } from './env.js';
import { parseSSEChunks, type OpenRouterStreamChunk } from './sse-parser.js';

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export interface StreamOpenRouterOptions {
  temperature?: number;
  maxTokens?: number;
  onUsage?: (usage: NonNullable<OpenRouterResponse['usage']>) => void;
}

export function isConfiguredOpenRouterKey(apiKey: string | undefined): boolean {
  return Boolean(apiKey && apiKey.startsWith('sk-or-') && apiKey.length > 20);
}

export function isRetryableOpenRouterError(message: string): boolean {
  return /\b(429|500|502|503|504|rate limit|timeout|temporarily|unavailable|overloaded)\b/i.test(
    message
  );
}

export function isQuotaLikeError(message: string): boolean {
  return /\b(429|quota|rate limit|credits|payment|required)\b/i.test(message);
}

function getOpenRouterHeaders(apiKey: string): Record<string, string> {
  const env = getEnv();
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    'HTTP-Referer': env.siteUrl,
    'X-Title': env.appName,
  };
}

export async function streamOpenRouter(
  apiKey: string,
  model: string,
  messages: unknown[],
  onChunk: (chunk: { token?: string; model?: string }) => void,
  options: StreamOpenRouterOptions = {}
): Promise<string> {
  const env = getEnv();
  const temperature = options.temperature ?? CONSTANTS.LLM_TEMPERATURE;
  const maxTokens = options.maxTokens ?? env.maxTokens;

  const response = await ky.post(CONSTANTS.OPENROUTER_URL, {
    headers: getOpenRouterHeaders(apiKey),
    json: {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
      stream: true,
      stream_options: { include_usage: true },
    },
    timeout: CONSTANTS.STREAM_TIMEOUT_MS,
    retry: { limit: 0 },
    onDownloadProgress: () => {
      // Ky stream requires this listener to work correctly in Node for some versions
    },
  });

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  let fullResponseText = '';
  let sseBuffer = '';
  let modelEmitted = false;

  const decoder = new TextDecoder();
  for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
    sseBuffer += decoder.decode(chunk, { stream: true });

    sseBuffer = parseSSEChunks(
      sseBuffer,
      (payload: OpenRouterStreamChunk & { usage?: OpenRouterResponse['usage'] }) => {
        if (payload.error) {
          throw new Error(payload.error);
        }
        if (payload.usage && options.onUsage) {
          options.onUsage(payload.usage);
        }
        if (payload.model && !modelEmitted) {
          onChunk({ model: payload.model });
          modelEmitted = true;
        }
        const token = payload.choices?.[0]?.delta?.content;
        if (token) {
          fullResponseText += token;
          onChunk({ token });
        }
      }
    );
  }

  return fullResponseText;
}

export async function callOpenRouterSync(
  apiKey: string,
  model: string,
  messages: unknown[],
  options: StreamOpenRouterOptions = {}
): Promise<OpenRouterResponse> {
  const temperature = options.temperature ?? CONSTANTS.SUMMARIZATION_TEMPERATURE;
  const maxTokens = options.maxTokens ?? CONSTANTS.SUMMARIZATION_MAX_TOKENS;

  return ky
    .post(CONSTANTS.OPENROUTER_URL, {
      headers: getOpenRouterHeaders(apiKey),
      json: {
        model,
        messages,
        max_tokens: maxTokens,
        temperature,
      },
      timeout: CONSTANTS.SYNC_TIMEOUT_MS,
      retry: {
        limit: 2,
        methods: ['post'],
        statusCodes: [429, 500, 502, 503, 504],
      },
    })
    .json<OpenRouterResponse>();
}
