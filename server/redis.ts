import ky from 'ky';
import { CONSTANTS } from './constants.js';
import { isRedisConfigured } from './env.js';

const redisUrl = () => process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = () => process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

export const isRedisEnabled = isRedisConfigured;

type RedisCommand = (string | number)[];
interface RedisPipelineResult {
  result: unknown;
  error?: string;
}

async function runRedisCommands(commands: RedisCommand[]): Promise<unknown[]> {
  if (!isRedisEnabled()) {
    throw new Error('Redis nije konfiguriran.');
  }

  try {
    const response = await ky
      .post(`${redisUrl()}/pipeline`, {
        headers: {
          Authorization: `Bearer ${redisToken()}`,
          'Content-Type': 'application/json',
        },
        json: commands,
        timeout: CONSTANTS.REDIS_TIMEOUT_MS,
        retry: { limit: 1 },
      })
      .json<RedisPipelineResult[]>();

    return response.map((res) => {
      if (res.error) {
        throw new Error(res.error);
      }
      return res.result;
    });
  } catch (error) {
    console.error('Greška u komunikaciji s Redisom:', error);
    throw error;
  }
}

export async function checkRateLimitRedis(
  ip: string,
  maxRequests = 20,
  bucket = 'hanicar:ratelimit'
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
} | null> {
  if (!isRedisEnabled()) return null;

  const now = Date.now();
  const currentMinute = Math.floor(now / 60000);
  const key = `${bucket}:${ip}:${currentMinute}`;
  const resetTime = (currentMinute + 1) * 60000;

  try {
    const results = await runRedisCommands([
      ['INCR', key],
      ['EXPIRE', key, CONSTANTS.REDIS_KEY_EXPIRE_SECONDS],
    ]);

    const count = Number(results[0]);

    if (count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime,
      };
    }

    return {
      allowed: true,
      remaining: maxRequests - count,
      resetTime,
    };
  } catch (err) {
    console.warn(`[Redis] Rate limit greška, fallback na in-memory: ${(err as Error).message}`);
    return null;
  }
}

export async function getCacheRedis(key: string): Promise<string | null> {
  if (!isRedisEnabled()) return null;

  try {
    const results = await runRedisCommands([['GET', `hanicar:cache:${key}`]]);
    const result = results[0];
    return typeof result === 'string' ? result : null;
  } catch {
    return null;
  }
}

export async function setCacheRedis(
  key: string,
  value: string,
  ttlSeconds = 1800
): Promise<boolean> {
  if (!isRedisEnabled()) return false;

  try {
    await runRedisCommands([['SET', `hanicar:cache:${key}`, value, 'EX', ttlSeconds]]);
    return true;
  } catch {
    return false;
  }
}

export async function getRedisValue(key: string): Promise<string | null> {
  if (!isRedisEnabled()) return null;

  try {
    const results = await runRedisCommands([['GET', key]]);
    const result = results[0];
    return typeof result === 'string' ? result : null;
  } catch {
    return null;
  }
}

export async function setRedisValue(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean> {
  if (!isRedisEnabled()) return false;

  try {
    await runRedisCommands([['SET', key, value, 'EX', ttlSeconds]]);
    return true;
  } catch {
    return false;
  }
}

export async function incrementRedisCounter(key: string, amount = 1): Promise<number | null> {
  if (!isRedisEnabled()) return null;

  try {
    const results = await runRedisCommands([
      ['INCRBY', key, amount],
      ['EXPIRE', key, CONSTANTS.TOKEN_BUDGET_REDIS_TTL_SECONDS],
    ]);
    return Number(results[0]);
  } catch {
    return null;
  }
}

export async function getRedisCounter(key: string): Promise<number> {
  const value = await getRedisValue(key);
  return value ? Number(value) : 0;
}
