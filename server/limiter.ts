import { checkRateLimitRedis, getRedisCounter, incrementRedisCounter } from './redis.js';
import { getEnv } from './env.js';
import { CONSTANTS } from './constants.js';

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 20;

type IpRecord = {
  timestamps: number[];
};

const ipCache = new Map<string, IpRecord>();
const tokenBudgetMemory = new Map<string, number>();

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

function getDailyTokenKey(ip: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return `hanicar:tokens:${ip}:${date}`;
}

export async function checkRateLimit(
  ip: string,
  options: { maxRequests?: number; bucket?: string } = {}
): Promise<RateLimitResult> {
  const maxRequests = options.maxRequests ?? MAX_REQUESTS;
  const bucket = options.bucket ?? 'hanicar:ratelimit';
  const redisRes = await checkRateLimitRedis(ip, maxRequests, bucket);
  if (redisRes !== null) {
    return redisRes;
  }

  const cacheKey = `${bucket}:${ip}`;
  const now = Date.now();
  let record = ipCache.get(cacheKey);

  if (!record) {
    record = { timestamps: [] };
    ipCache.set(cacheKey, record);
  }

  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS);

  if (record.timestamps.length >= maxRequests) {
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
    remaining: maxRequests - record.timestamps.length,
    resetTime: now + WINDOW_MS,
  };
}

export async function checkShareEndpointRateLimit(ip: string): Promise<RateLimitResult> {
  return checkRateLimit(ip, {
    maxRequests: CONSTANTS.SHARE_OG_RATE_LIMIT_PER_MIN,
    bucket: 'hanicar:share-ratelimit',
  });
}

export async function checkTokenBudget(
  ip: string
): Promise<{ allowed: boolean; remaining: number }> {
  const budget = getEnv().dailyTokenBudgetPerIp;
  if (budget <= 0) {
    return { allowed: true, remaining: budget };
  }

  const key = getDailyTokenKey(ip);
  const used = (await getRedisCounter(key)) || tokenBudgetMemory.get(key) || 0;
  return {
    allowed: used < budget,
    remaining: Math.max(0, budget - used),
  };
}

export async function recordTokenUsage(ip: string, tokens: number): Promise<void> {
  const budget = getEnv().dailyTokenBudgetPerIp;
  if (budget <= 0 || tokens <= 0) return;

  const key = getDailyTokenKey(ip);
  const updated = await incrementRedisCounter(key, tokens);
  if (updated === null) {
    tokenBudgetMemory.set(key, (tokenBudgetMemory.get(key) || 0) + tokens);
  }
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

export function resetLimiterForTests(): void {
  ipCache.clear();
  tokenBudgetMemory.clear();
}
