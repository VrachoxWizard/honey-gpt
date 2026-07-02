import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../server/api.js', () => ({
  handleChatPayloadStream: vi.fn(async (_payload, onChunk) => {
    onChunk({ token: 'Blagoslov' });
  }),
  toClientError: vi.fn((error: unknown) => ({
    statusCode: 500,
    message: error instanceof Error ? error.message : 'error',
  })),
  httpError: (statusCode: number, message: string) => {
    const err = new Error(message) as Error & { statusCode: number };
    err.statusCode = statusCode;
    return err;
  },
}));

vi.mock('../server/handler.js', () => ({
  handleChatRequest: vi.fn(async (_request, callbacks) => {
    callbacks.writeHead(200, { 'Content-Type': 'text/event-stream' });
    callbacks.write('data: {"token":"Blagoslov"}\n\n');
    callbacks.write('data: [DONE]\n\n');
    callbacks.end();
    return { statusCode: 200, headers: {}, streamed: true };
  }),
}));

import handler from './chat';

describe('api/chat adapter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('delegates POST requests to shared handler', async () => {
    const response = createMockResponse();
    await handler(
      {
        method: 'POST',
        body: { messages: [{ role: 'user', content: 'Pozdrav' }] },
        headers: {},
      },
      response
    );

    expect(response.writes.some((chunk) => chunk.includes('Blagoslov'))).toBe(true);
  });
});

function createMockResponse() {
  const response = {
    writes: [] as string[],
    setHeader() {
      return response;
    },
    writeHead(_statusCode: number, _headers: Record<string, string>) {
      return response;
    },
    write(chunk: string) {
      response.writes.push(chunk);
      return true;
    },
    end() {
      return response;
    },
  };

  return response;
}
