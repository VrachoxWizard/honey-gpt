import ky from 'ky';
import { CONSTANTS } from './constants';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL?.trim();
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();

export const isRedisEnabled = Boolean(redisUrl && redisToken);

type RedisCommand = (string | number)[];
interface RedisPipelineResult {
  result: unknown;
  error?: string;
}

// Pomocni klijent za slanje zahtjeva Upstash REST API-ju
async function runRedisCommands(commands: RedisCommand[]): Promise<unknown[]> {
  if (!isRedisEnabled) {
    throw new Error('Redis nije konfiguriran.');
  }

  try {
    const response = await ky.post(`${redisUrl}/pipeline`, {
      headers: {
        Authorization: `Bearer ${redisToken}`,
        'Content-Type': 'application/json',
      },
      json: commands,
      timeout: CONSTANTS.REDIS_TIMEOUT_MS, // Kratki timeout da ne blokiramo korisnika ako Redis spava
      retry: { limit: 1 },
    }).json<RedisPipelineResult[]>();

    return response.map(res => {
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

/**
 * Provjerava rate limit za zadani IP koristeci Redis.
 * Zadrzava isti limit od maksimalno 20 zahtjeva u minuti po IP-u.
 */
export async function checkRateLimitRedis(ip: string, maxRequests = 20): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: number;
} | null> {
  if (!isRedisEnabled) return null;

  const now = Date.now();
  const currentMinute = Math.floor(now / 60000);
  const key = `hanicar:ratelimit:${ip}:${currentMinute}`;
  const resetTime = (currentMinute + 1) * 60000;

  try {
    const results = await runRedisCommands([
      ['INCR', key],
      ['EXPIRE', key, CONSTANTS.REDIS_KEY_EXPIRE_SECONDS], // Ključ ističe za sprječavanje curenja memorije
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
  } catch {
    // U slucaju greske na Redisu, vracamo null kako bi pozivatelj pao natrag na in-memory limiter
    return null;
  }
}

/**
 * Dohvaca vrijednost iz Redis cachea.
 */
export async function getCacheRedis(key: string): Promise<string | null> {
  if (!isRedisEnabled) return null;

  try {
    const results = await runRedisCommands([
      ['GET', `hanicar:cache:${key}`],
    ]);
    const result = results[0];
    return typeof result === 'string' ? result : null;
  } catch {
    return null;
  }
}

/**
 * Sprema vrijednost u Redis cache s trajanjem od 30 minuta (1800 sekundi).
 */
export async function setCacheRedis(key: string, value: string, ttlSeconds = 1800): Promise<boolean> {
  if (!isRedisEnabled) return false;

  try {
    await runRedisCommands([
      ['SET', `hanicar:cache:${key}`, value, 'EX', ttlSeconds],
    ]);
    return true;
  } catch {
    return false;
  }
}
