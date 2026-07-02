import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./api.js', () => ({
  handleChatPayloadStream: vi.fn(async (_payload, onChunk) => {
    onChunk({ token: 'Blagoslov' });
    onChunk({ model: 'google/gemini-2.5-flash' });
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

vi.mock('./limiter.js', () => ({
  checkRateLimit: vi.fn(async () => ({
    allowed: true,
    remaining: 19,
    resetTime: Date.now() + 60_000,
  })),
  checkTokenBudget: vi.fn(async () => ({ allowed: true, remaining: 50_000 })),
  recordTokenUsage: vi.fn(async () => {}),
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

vi.mock('./env.js', () => ({
  checkEnv: vi.fn(),
  getEnv: vi.fn(() => ({
    corsOrigin: 'https://example.com',
    apiSecret: undefined,
    requireRedis: false,
    isProduction: false,
  })),
  warnIfProductionWithoutRedis: vi.fn(),
  assertRedisIfRequired: vi.fn(),
  isRedisConfigured: vi.fn(() => false),
}));

vi.mock('./monitoring.js', () => ({
  initMonitoring: vi.fn(async () => {}),
  captureException: vi.fn(async () => {}),
}));

vi.mock('./circuit-breaker.js', () => ({
  isCircuitOpen: vi.fn(async () => false),
}));

vi.mock('./metrics.js', () => ({
  incrementMetric: vi.fn(async () => {}),
  recordRequestMetrics: vi.fn(async () => {}),
}));

vi.mock('./prompts.js', () => ({
  getPromptVersion: vi.fn(() => 'v2'),
}));

import { handleChatRequest } from './handler';

describe('handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles OPTIONS preflight', async () => {
    const writes: string[] = [];
    const result = await handleChatRequest(
      { method: 'OPTIONS', body: null },
      {
        write: (chunk) => writes.push(chunk),
        setHeader: () => {},
        writeHead: () => {},
        end: () => {},
      }
    );

    expect(result.statusCode).toBe(204);
  });

  it('streams SSE for valid POST requests', async () => {
    const writes: string[] = [];
    await handleChatRequest(
      {
        method: 'POST',
        body: { messages: [{ role: 'user', content: 'Pozdrav' }] },
        headers: {},
      },
      {
        write: (chunk) => writes.push(chunk),
        setHeader: () => {},
        writeHead: () => {},
        end: () => {},
      }
    );

    expect(writes.some((chunk) => chunk.includes('Blagoslov'))).toBe(true);
    expect(writes.at(-1)).toBe('data: [DONE]\n\n');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    const { checkRateLimit } = await import('./limiter.js');
    vi.mocked(checkRateLimit).mockResolvedValueOnce({
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 60_000,
    });

    const result = await handleChatRequest(
      { method: 'POST', body: { messages: [] }, headers: {} },
      {
        write: () => {},
        setHeader: () => {},
        writeHead: () => {},
        end: () => {},
      }
    );

    expect(result.statusCode).toBe(429);
  });

  it('returns 503 when circuit breaker is open', async () => {
    const { isCircuitOpen } = await import('./circuit-breaker.js');
    vi.mocked(isCircuitOpen).mockResolvedValueOnce(true);

    const result = await handleChatRequest(
      { method: 'POST', body: { messages: [] }, headers: {} },
      {
        write: () => {},
        setHeader: () => {},
        writeHead: () => {},
        end: () => {},
      }
    );

    expect(result.statusCode).toBe(503);
  });

  it('returns 429 when token budget is exceeded', async () => {
    const { checkTokenBudget } = await import('./limiter.js');
    vi.mocked(checkTokenBudget).mockResolvedValueOnce({ allowed: false, remaining: 0 });

    const result = await handleChatRequest(
      { method: 'POST', body: { messages: [] }, headers: {} },
      {
        write: () => {},
        setHeader: () => {},
        writeHead: () => {},
        end: () => {},
      }
    );

    expect(result.statusCode).toBe(429);
  });
});
