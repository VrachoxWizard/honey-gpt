import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./redis.js', () => ({
  checkRateLimitRedis: vi.fn(async () => null),
  getRedisCounter: vi.fn(async () => 0),
  incrementRedisCounter: vi.fn(async () => null),
}));

vi.mock('./env.js', () => ({
  getEnv: vi.fn(() => ({ dailyTokenBudgetPerIp: 1000 })),
}));

import {
  checkRateLimit,
  checkTokenBudget,
  getClientIp,
  recordTokenUsage,
  resetLimiterForTests,
} from './limiter';

describe('limiter', () => {
  beforeEach(() => {
    resetLimiterForTests();
    vi.clearAllMocks();
  });

  it('allows requests until the in-memory limit is reached', async () => {
    for (let i = 0; i < 20; i++) {
      const result = await checkRateLimit('10.0.0.1');
      expect(result.allowed).toBe(true);
    }

    const blocked = await checkRateLimit('10.0.0.1');
    expect(blocked.allowed).toBe(false);
  });

  it('tracks token budget in memory when redis is unavailable', async () => {
    await recordTokenUsage('10.0.0.2', 900);
    const nearLimit = await checkTokenBudget('10.0.0.2');
    expect(nearLimit.allowed).toBe(true);

    await recordTokenUsage('10.0.0.2', 200);
    const blocked = await checkTokenBudget('10.0.0.2');
    expect(blocked.allowed).toBe(false);
  });

  it('extracts client IP from proxy headers', () => {
    expect(getClientIp({ 'x-real-ip': ' 1.2.3.4 ' })).toBe('1.2.3.4');
    expect(getClientIp({ 'x-forwarded-for': '5.6.7.8, 9.9.9.9' })).toBe('5.6.7.8');
    expect(getClientIp({}, '127.0.0.1')).toBe('127.0.0.1');
  });
});
