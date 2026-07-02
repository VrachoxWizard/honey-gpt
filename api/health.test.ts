import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../server/env.js', () => ({
  getEnv: vi.fn(() => ({
    corsOrigin: 'https://example.com',
    openRouterApiKey: 'sk-or-test-key',
    sentryDsn: 'https://sentry.example.com/1',
    requireRedis: true,
  })),
  checkEnv: vi.fn(),
  isRedisConfigured: vi.fn(() => true),
}));

vi.mock('../server/openrouter.js', () => ({
  isConfiguredOpenRouterKey: vi.fn(() => true),
}));

import handler from './health';

describe('api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns health payload for GET', async () => {
    const response = createMockResponse();
    await handler({ method: 'GET' }, response);

    expect(response.statusCode).toBe(200);
    expect(response.payload).toMatchObject({
      ok: true,
      redis: true,
      openrouterKeyConfigured: true,
      sentryConfigured: true,
      requireRedis: true,
      version: '2.0.0',
    });
  });

  it('never exposes secret values, only safe booleans', async () => {
    const response = createMockResponse();
    await handler({ method: 'GET' }, response);

    const payload = response.payload as Record<string, unknown>;
    const serialized = JSON.stringify(payload);
    expect(serialized).not.toContain('sk-or-test-key');
    expect(serialized).not.toContain('sentry.example.com');
    expect(typeof payload.sentryConfigured).toBe('boolean');
    expect(typeof payload.requireRedis).toBe('boolean');
  });

  it('rejects non-GET methods', async () => {
    const response = createMockResponse();
    await handler({ method: 'POST' }, response);
    expect(response.statusCode).toBe(405);
  });

  it('handles OPTIONS preflight', async () => {
    const response = createMockResponse();
    await handler({ method: 'OPTIONS' }, response);
    expect(response.statusCode).toBe(204);
    expect(response.end).toHaveBeenCalled();
  });
});

function createMockResponse() {
  const response = {
    statusCode: 200,
    payload: null as unknown,
    setHeader: vi.fn(() => response),
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.payload = payload;
    },
    end: vi.fn(),
  };

  return response;
}
