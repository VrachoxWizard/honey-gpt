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

function getChatEndpoints() {
  const configuredEndpoint = import.meta.env.VITE_CHAT_ENDPOINT;
  return configuredEndpoint ? [configuredEndpoint] : ['/api/chat'];
}

export interface ServerStreamChunk {
  token?: string;
  model?: string;
  error?: string;
}

export async function sendConversation(options: SendConversationOptions): Promise<void> {
  const endpoints = getChatEndpoints();
  let lastError: Error | null = null;
  let success = false;

  for (const endpoint of endpoints) {
    try {
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

      if (response.status === 404 && endpoints.length > 1) continue;

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || 'Server nije prihvatio zahtjev.');
      }

      const contentType = response.headers.get('Content-Type') || '';

      if (contentType.includes('text/event-stream')) {
        const reader = response.body?.getReader();
        if (!reader) throw new Error('Streaming body is empty.');
        const decoder = new TextDecoder('utf-8');
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          buffer = parseSSEChunks<ServerStreamChunk>(buffer, (data) => {
            if (data.error) throw new Error(data.error);
            if (data.token) options.onToken(data.token);
            if (data.model) options.onModel(data.model);
          });
        }
        success = true;
        break;
      } else {
        const payload = await response.json();
        if (!payload.text) throw new Error('Odgovor nema tekst.');
        if (payload.model) options.onModel(payload.model);
        options.onToken(payload.text);
        success = true;
        break;
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        success = true; // Not an error
        break;
      }
      lastError = error instanceof Error ? error : new Error('Mrežna greška.');
    }
  }

  if (!success && lastError) throw lastError;
  if (!success) throw new Error('Chat endpoint nije dostupan.');
}
