import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../server/api.js', () => ({
  handleChatPayloadStream: vi.fn(async (_payload, onChunk) => {
    onChunk({ token: 'Blagoslov' });
    onChunk({ model: 'google/gemini-2.5-flash' });
  }),
  toClientError: vi.fn((error: unknown) => ({
    statusCode: 500,
    message: error instanceof Error ? error.message : 'error',
  })),
}));

vi.mock('../server/limiter.js', () => ({
  checkRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 19,
    resetTime: Date.now() + 60_000,
  })),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('../server/env.js', () => ({
  checkEnv: vi.fn(),
  getEnv: vi.fn(() => ({
    corsOrigin: 'https://example.com',
    apiSecret: undefined,
  })),
  warnIfProductionWithoutRedis: vi.fn(),
}));

vi.mock('../server/monitoring.js', () => ({
  initMonitoring: vi.fn(async () => {}),
  captureException: vi.fn(async () => {}),
}));

import handler from './chat';

describe('api/chat handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles OPTIONS preflight', async () => {
    const response = createMockResponse();
    await handler({ method: 'OPTIONS', body: null }, response);

    expect(response.statusCode).toBe(204);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('https://example.com');
  });

  it('streams SSE for valid POST requests', async () => {
    const response = createMockResponse();
    await handler(
      {
        method: 'POST',
        body: { messages: [{ role: 'user', content: 'Pozdrav' }] },
        headers: {},
      },
      response
    );

    expect(response.statusCode).toBe(200);
    expect(response.headers['Content-Type']).toContain('text/event-stream');
    expect(response.writes.some((chunk) => chunk.includes('Blagoslov'))).toBe(true);
    expect(response.writes.at(-1)).toBe('data: [DONE]\n\n');
  });
});

function createMockResponse() {
  const response = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    writes: [] as string[],
    setHeader(name: string, value: string) {
      response.headers[name] = value;
      return response;
    },
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.writes.push(JSON.stringify(payload));
      return response;
    },
    writeHead(code: number, headers: Record<string, string>) {
      response.statusCode = code;
      Object.assign(response.headers, headers);
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
