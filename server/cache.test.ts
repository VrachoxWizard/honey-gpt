import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateCacheKey,
  shouldUseResponseCache,
  getCacheTtlMs,
  getCachedReply,
  setCachedReply,
  resetCacheForTests,
} from './cache';
import { CONSTANTS } from './constants';

describe('cache', () => {
  beforeEach(() => {
    resetCacheForTests();
  });

  it('generates stable cache keys', () => {
    const messages = [{ role: 'user' as const, content: 'Pozdrav' }];
    const keyA = generateCacheKey(messages, 'google/gemini-2.5-flash', 'sanctus');
    const keyB = generateCacheKey(messages, 'google/gemini-2.5-flash', 'sanctus');
    const keyC = generateCacheKey(messages, 'google/gemini-2.5-flash', 'humilis');

    expect(keyA).toBe(keyB);
    expect(keyA).not.toBe(keyC);
  });

  it('caches only sanctus conversations up to five user turns', () => {
    const singleTurn = [{ role: 'user' as const, content: 'Pozdrav' }];
    const multiTurn = [
      { role: 'user' as const, content: 'Prvo' },
      { role: 'assistant' as const, content: 'Odgovor' },
      { role: 'user' as const, content: 'Drugo' },
    ];

    expect(shouldUseResponseCache(singleTurn, 'sanctus')).toBe(true);
    expect(shouldUseResponseCache(singleTurn, 'humilis')).toBe(false);
    expect(shouldUseResponseCache(multiTurn, 'sanctus')).toBe(true);
  });

  it('includes prompt version and risk level in cache keys', () => {
    const messages = [{ role: 'user' as const, content: 'Pozdrav' }];
    const base = generateCacheKey(messages, 'google/gemini-2.5-flash', 'sanctus');
    const withVersion = generateCacheKey(
      messages,
      'google/gemini-2.5-flash',
      'sanctus',
      undefined,
      'v2',
      'safe'
    );
    const withCaution = generateCacheKey(
      messages,
      'google/gemini-2.5-flash',
      'sanctus',
      undefined,
      'v2',
      'caution'
    );

    expect(withVersion).not.toBe(base);
    expect(withCaution).not.toBe(withVersion);
  });

  it('uses shorter TTL for multi-turn cache keys', () => {
    const singleTurn = [{ role: 'user' as const, content: 'Pozdrav' }];
    const multiTurn = [
      { role: 'user' as const, content: 'Prvo' },
      { role: 'user' as const, content: 'Drugo' },
    ];

    expect(getCacheTtlMs(singleTurn)).toBe(CONSTANTS.LRU_TTL_MS);
    expect(getCacheTtlMs(multiTurn)).toBe(CONSTANTS.MULTI_TURN_CACHE_TTL_MS);
  });

  it('stores and reads replies from local cache', async () => {
    const key = 'test-key';
    await setCachedReply(key, { text: 'Blagoslov', model: 'google/gemini-2.5-flash' });
    const cached = await getCachedReply(key);

    expect(cached?.text).toBe('Blagoslov');
  });
});
