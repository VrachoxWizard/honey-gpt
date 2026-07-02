import type { ToneMode } from './codex';
import { parseSSEChunks } from '@shared/sse-parser';
import { formatChatError, mapHttpStatusToMessage } from './errors';

export interface SendConversationOptions {
  messages: Array<{ role: string; content: string | object[] }>;
  model: string;
  toneMode: ToneMode;
  signal: AbortSignal;
  onToken: (token: string) => void;
  onModel: (model: string) => void;
  onRequestId?: (requestId: string) => void;
  onSummaryFailed?: () => void;
  onRetry?: () => void;
}

export interface ServerStreamChunk {
  token?: string;
  model?: string;
  error?: string;
  meta?: {
    requestId?: string;
    model?: string;
    cacheHit?: boolean;
    promptVersion?: string;
    summaryFailed?: boolean;
  };
  done?: boolean;
}

const RETRYABLE_STATUS = new Set([502, 503, 504]);
const RETRY_DELAYS_MS = [500, 1500];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getChatEndpoints() {
  const configuredEndpoint = import.meta.env.VITE_CHAT_ENDPOINT;
  return configuredEndpoint ? [configuredEndpoint] : ['/api/chat'];
}

function isRetryableError(error: Error): boolean {
  return /fetch|network|mrež|timeout|502|503|504/i.test(error.message);
}

function getChatHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const apiSecret = import.meta.env.VITE_API_SECRET;
  if (apiSecret) {
    headers['X-Api-Secret'] = apiSecret;
  }
  return headers;
}

async function makeChatRequest(
  endpoint: string,
  options: SendConversationOptions
): Promise<Response> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getChatHeaders(),
    body: JSON.stringify({
      messages: options.messages,
      model: options.model,
      toneMode: options.toneMode,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    if (response.status === 404) throw new Error('Endpoint not found');
    const payload = await response.json().catch(() => ({}));
    const requestId = response.headers?.get?.('X-Request-Id') || undefined;
    const message = formatChatError(
      mapHttpStatusToMessage(response.status, payload.error),
      requestId
    );
    if (requestId) {
      options.onRequestId?.(requestId);
    }
    if (RETRYABLE_STATUS.has(response.status)) {
      throw new Error(`HTTP ${response.status}: ${message}`);
    }
    throw new Error(message);
  }

  const requestId = response.headers?.get?.('X-Request-Id');
  if (requestId) {
    options.onRequestId?.(requestId);
  }

  return response;
}

async function streamChatResponse(
  response: Response,
  options: SendConversationOptions
): Promise<void> {
  const contentType = response.headers?.get?.('Content-Type') || '';

  if (contentType.includes('text/event-stream')) {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('Streaming body is empty.');
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let streamError: Error | null = null;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      buffer = parseSSEChunks<ServerStreamChunk>(buffer, (data) => {
        if (data.error) {
          streamError = new Error(formatChatError(data.error, data.meta?.requestId));
          return;
        }
        if (data.meta?.requestId) {
          options.onRequestId?.(data.meta.requestId);
        }
        if (data.meta?.summaryFailed) {
          options.onSummaryFailed?.();
        }
        if (data.token) options.onToken(data.token);
        if (data.model) options.onModel(data.model);
        if (data.meta?.model) options.onModel(data.meta.model);
      });
    }

    if (streamError) throw streamError;
  } else {
    const payload = await response.json();
    if (!payload.text) throw new Error('Odgovor nema tekst.');
    if (payload.model) options.onModel(payload.model);
    options.onToken(payload.text);
  }
}

async function attemptConversation(
  endpoint: string,
  options: SendConversationOptions
): Promise<void> {
  const response = await makeChatRequest(endpoint, options);
  await streamChatResponse(response, options);
}

export async function sendConversation(options: SendConversationOptions): Promise<void> {
  const endpoints = getChatEndpoints();
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      try {
        await attemptConversation(endpoint, options);
        return;
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return;
          }
          if (error.message === 'Endpoint not found' && endpoints.length > 1) {
            break;
          }
          lastError = error;
          if (attempt < RETRY_DELAYS_MS.length && isRetryableError(error)) {
            options.onRetry?.();
            await sleep(RETRY_DELAYS_MS[attempt]);
            continue;
          }
        } else {
          lastError = new Error('Mrežna greška.');
        }
        break;
      }
    }
  }

  if (lastError) throw lastError;
  throw new Error('Chat endpoint nije dostupan.');
}
