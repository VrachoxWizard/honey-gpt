import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./env.js', () => ({
  isRedisConfigured: vi.fn(() => true),
}));

vi.mock('ky', () => ({
  default: {
    post: vi.fn(() => ({
      json: vi.fn(async () => [{ result: 3 }, { result: 'OK' }]),
    })),
  },
}));

describe('redis helpers', () => {
  beforeEach(async () => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
  });

  it('increments redis counters when configured', async () => {
    const { incrementRedisCounter } = await import('./redis');
    const value = await incrementRedisCounter('hanicar:test', 2);
    expect(value).toBe(3);
  });
});
