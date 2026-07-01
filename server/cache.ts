import { createHash } from 'node:crypto';
import { LRUCache } from 'lru-cache';
import { getCacheRedis, setCacheRedis } from './redis.js';
import { CONSTANTS } from './constants.js';
import type { ChatMessage, HanicarReply, ToneMode } from './shared-types.js';

// Lokalna predmemorija (LRU) u memoriji poslužitelja
export const chatCache = new LRUCache<string, HanicarReply>({
  max: CONSTANTS.LRU_MAX_ENTRIES,
  ttl: CONSTANTS.LRU_TTL_MS,
});

export function generateCacheKey(
  messages: ChatMessage[],
  model: string,
  toneMode?: ToneMode,
  newsHeadlines?: string[]
): string {
  const serializedMessages = messages
    .map((m) => `${m.role}:${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`)
    .join('|');
  const serializedNews = newsHeadlines ? newsHeadlines.join(',') : '';
  const rawKey = `${model}#${toneMode || 'default'}#${serializedNews}#${serializedMessages}`;
  
  return createHash('sha256').update(rawKey).digest('hex');
}

export async function getCachedReply(key: string): Promise<HanicarReply | undefined> {
  // Prvo provjeri LRU u memoriji
  const localCache = chatCache.get(key);
  if (localCache) {
    return localCache;
  }

  // Zatim provjeri Redis
  const redisCacheVal = await getCacheRedis(key);
  if (redisCacheVal) {
    try {
      const parsed = JSON.parse(redisCacheVal) as HanicarReply;
      if (parsed) {
        // Spremi lokalno za buduce brze upite na istoj instanci
        chatCache.set(key, parsed);
        return parsed;
      }
    } catch {
      // Ignoriramo neispravan JSON iz predmemorije
    }
  }

  return undefined;
}

export async function setCachedReply(key: string, reply: HanicarReply): Promise<void> {
  chatCache.set(key, reply);
  // Redis set faila silently tako da ne moramo handlati ovdje
  await setCacheRedis(key, JSON.stringify(reply));
}
