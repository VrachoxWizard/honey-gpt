import { describe, it, expect } from 'vitest';
import { checkRateLimit, getClientIp } from './limiter';

describe('Rate Limiter', () => {
  it('should return client IP from headers', () => {
    const headers = { 'x-forwarded-for': '1.2.3.4, 5.6.7.8' };
    const ip = getClientIp(headers);
    expect(ip).toBe('1.2.3.4');
  });

  it('should fallback to x-real-ip if x-forwarded-for is missing', () => {
    const headers = { 'x-real-ip': '8.8.8.8' };
    const ip = getClientIp(headers);
    expect(ip).toBe('8.8.8.8');
  });

  it('should fallback to socket address if all headers missing', () => {
    const ip = getClientIp({}, '192.168.1.1');
    expect(ip).toBe('192.168.1.1');
  });

  it('should allow requests within limit and block when exceeded', async () => {
    const ip = 'test-limiter-ip';

    // Limit je 20 zahtjeva u minuti po IP-u
    for (let i = 0; i < 20; i++) {
      const res = await checkRateLimit(ip);
      expect(res.allowed).toBe(true);
      expect(res.remaining).toBe(20 - (i + 1));
    }

    const blocked = await checkRateLimit(ip);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetTime).toBeGreaterThan(Date.now());
  });
});
