import { checkRateLimitRedis } from './redis.js';

const WINDOW_MS = 60 * 1000; // 1 minuta
const MAX_REQUESTS = 20; // Maksimalno 20 zahtjeva u minuti po IP-u

type IpRecord = {
  timestamps: number[];
};

const ipCache = new Map<string, IpRecord>();

// Čišćenje starih zapisa svakih 1 minutu radi prevencije curenja memorije
if (typeof setInterval !== 'undefined') {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of ipCache.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);
      if (record.timestamps.length === 0) {
        ipCache.delete(ip);
      }
    }
  }, WINDOW_MS);
  if (timer && typeof timer.unref === 'function') {
    timer.unref();
  }
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetTime: number;
};

export async function checkRateLimit(ip: string): Promise<RateLimitResult> {
  // Pokusaj provjeriti rate limit preko Redisa (ako je konfiguriran)
  const redisRes = await checkRateLimitRedis(ip, MAX_REQUESTS);
  if (redisRes !== null) {
    return redisRes;
  }

  // Fallback na in-memory limiter
  const now = Date.now();
  let record = ipCache.get(ip);

  if (!record) {
    record = { timestamps: [] };
    ipCache.set(ip, record);
  }

  // Zadrži samo one vremenske oznake unutar trenutnog prozora
  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (record.timestamps.length >= MAX_REQUESTS) {
    const oldestTs = record.timestamps[0];
    const resetTime = oldestTs + WINDOW_MS;
    return {
      allowed: false,
      remaining: 0,
      resetTime,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: MAX_REQUESTS - record.timestamps.length,
    resetTime: now + WINDOW_MS,
  };
}

export function getClientIp(
  headers: Record<string, string | string[] | undefined>,
  socketRemoteAddress?: string
): string {
  const xRealIp = headers['x-real-ip'];
  if (typeof xRealIp === 'string' && xRealIp.trim()) {
    return xRealIp.trim();
  }

  const xForwardedFor = headers['x-forwarded-for'];
  if (typeof xForwardedFor === 'string') {
    return xForwardedFor.split(',')[0].trim();
  }

  return socketRemoteAddress || '127.0.0.1';
}
