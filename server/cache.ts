import { createHash } from 'node:crypto';
import { LRUCache } from 'lru-cache';
import { getCacheRedis, setCacheRedis } from './redis.js';
import { CONSTANTS } from './constants.js';
import type { ChatMessage, HanicarReply, ToneMode } from '@shared/types';

export const chatCache = new LRUCache<string, HanicarReply>({
  max: CONSTANTS.LRU_MAX_ENTRIES,
  ttl: CONSTANTS.LRU_TTL_MS,
});

const inFlightRequests = new Map<string, Promise<HanicarReply>>();

export function generateCacheKey(
  messages: ChatMessage[],
  model: string,
  toneMode?: ToneMode,
  newsHeadlines?: string[]
): string {
  const serializedMessages = messages
    .map(
      (m) => `${m.role}:${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`
    )
    .join('|');
  const serializedNews = newsHeadlines ? newsHeadlines.join(',') : '';
  const rawKey = `${model}#${toneMode || 'default'}#${serializedNews}#${serializedMessages}`;

  return createHash('sha256').update(rawKey).digest('hex');
}

export function shouldUseResponseCache(messages: ChatMessage[], toneMode?: ToneMode): boolean {
  if (toneMode && toneMode !== 'sanctus') {
    return false;
  }

  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.length <= 1;
}

export function getCacheTtlMs(messages: ChatMessage[]): number {
  const userMessages = messages.filter((message) => message.role === 'user');
  return userMessages.length <= 1 ? CONSTANTS.LRU_TTL_MS : CONSTANTS.MULTI_TURN_CACHE_TTL_MS;
}

export async function getCachedReply(key: string): Promise<HanicarReply | undefined> {
  const localCache = chatCache.get(key);
  if (localCache) {
    return localCache;
  }

  const redisCacheVal = await getCacheRedis(key);
  if (redisCacheVal) {
    try {
      const parsed = JSON.parse(redisCacheVal) as HanicarReply;
      if (parsed) {
        chatCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Ignoriramo neispravan JSON iz predmemorije
    }
  }

  return undefined;
}

export async function setCachedReply(
  key: string,
  reply: HanicarReply,
  ttlMs: number = CONSTANTS.LRU_TTL_MS
): Promise<void> {
  chatCache.set(key, reply, { ttl: ttlMs });
  await setCacheRedis(key, JSON.stringify(reply), Math.ceil(ttlMs / 1000));
}

export async function getOrCreateInFlightReply(
  key: string,
  factory: () => Promise<HanicarReply>
): Promise<HanicarReply> {
  const existing = inFlightRequests.get(key);
  if (existing) {
    return existing;
  }

  const pending = factory().finally(() => {
    inFlightRequests.delete(key);
  });
  inFlightRequests.set(key, pending);
  return pending;
}

export function resetCacheForTests(): void {
  chatCache.clear();
  inFlightRequests.clear();
}
