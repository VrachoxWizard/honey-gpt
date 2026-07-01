export interface OpenRouterStreamChunk {
  choices?: Array<{
    delta?: { content?: string };
  }>;
  model?: string;
  error?: string;
}

/**
 * Parses Server-Sent Events (SSE) data from a text buffer.
 * Processes all complete lines in the buffer, executes onPayload for each parsed JSON data object,
 * and returns the remaining incomplete line data to be buffered for the next chunk.
 */
export function parseSSEChunks(
  buffer: string,
  onPayload: (payload: OpenRouterStreamChunk) => void
): string {
  const lines = buffer.split('\n');
  const remaining = lines.pop() || '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('data: ')) {
      const dataStr = trimmed.slice(6);
      if (dataStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(dataStr);
        onPayload(parsed);
      } catch {
        // Ignore partial JSON parsing errors
      }
    }
  }

  return remaining;
}
