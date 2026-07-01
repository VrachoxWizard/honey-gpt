import ky from 'ky';
import { CONSTANTS } from './constants.js';
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

export async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: any[]
): Promise<OpenRouterResponse> {
  return ky
    .post(CONSTANTS.OPENROUTER_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://honey-gpt.vercel.app',
        'X-Title': 'Haničar GPT',
      },
      json: {
        model,
        messages,
        max_tokens: CONSTANTS.DEFAULT_MAX_TOKENS,
        temperature: CONSTANTS.LLM_TEMPERATURE,
      },
      timeout: CONSTANTS.SYNC_TIMEOUT_MS,
      retry: { limit: 1 },
    })
    .json<OpenRouterResponse>();
}

export async function streamOpenRouter(
  apiKey: string,
  model: string,
  messages: any[],
  onChunk: (chunk: { token?: string; model?: string }) => void
): Promise<string> {
  const response = await ky.post(CONSTANTS.OPENROUTER_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://honey-gpt.vercel.app',
      'X-Title': 'Haničar GPT',
    },
    json: {
      model,
      messages,
      max_tokens: CONSTANTS.DEFAULT_MAX_TOKENS,
      temperature: CONSTANTS.LLM_TEMPERATURE,
      stream: true,
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
    
    sseBuffer = parseSSEChunks(sseBuffer, (payload: OpenRouterStreamChunk) => {
      if (payload.error) {
        throw new Error(payload.error);
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
    });
  }

  return fullResponseText;
}
