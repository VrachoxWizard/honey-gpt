import type { ToneMode } from './codex';
import { parseSSEChunks } from '../../server/sse-parser';

export interface SendConversationOptions {
  messages: Array<{ role: string; content: string | object[] }>;
  model: string;
  toneMode: ToneMode;
  signal: AbortSignal;
  onToken: (token: string) => void;
  onModel: (model: string) => void;
}

export interface ServerStreamChunk {
  token?: string;
  model?: string;
  error?: string;
}

function getChatEndpoints() {
  const configuredEndpoint = import.meta.env.VITE_CHAT_ENDPOINT;
  return configuredEndpoint ? [configuredEndpoint] : ['/api/chat'];
}

async function makeChatRequest(
  endpoint: string,
  options: SendConversationOptions
): Promise<Response> {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
    throw new Error(payload.error || 'Server nije prihvatio zahtjev.');
  }

  return response;
}

async function streamChatResponse(
  response: Response,
  options: SendConversationOptions
): Promise<void> {
  const contentType = response.headers.get('Content-Type') || '';

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
          streamError = new Error(data.error);
          return;
        }
        if (data.token) options.onToken(data.token);
        if (data.model) options.onModel(data.model);
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

export async function sendConversation(options: SendConversationOptions): Promise<void> {
  const endpoints = getChatEndpoints();
  let lastError: Error | null = null;
  let success = false;

  for (const endpoint of endpoints) {
    try {
      const response = await makeChatRequest(endpoint, options);
      await streamChatResponse(response, options);
      success = true;
      break;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          success = true;
          break;
        }
        if (error.message === 'Endpoint not found' && endpoints.length > 1) {
          continue;
        }
      }
      lastError = error instanceof Error ? error : new Error('Mrežna greška.');
    }
  }

  if (!success && lastError) throw lastError;
  if (!success) throw new Error('Chat endpoint nije dostupan.');
}
