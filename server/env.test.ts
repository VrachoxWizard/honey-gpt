import { describe, it, expect, beforeEach } from 'vitest';
import { getEnv, resetEnvCache, isRedisConfigured } from './env';

describe('env', () => {
  beforeEach(() => {
    resetEnvCache();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it('reads model defaults from environment', () => {
    process.env.OPENROUTER_MODEL = 'google/gemini-2.5-pro';
    process.env.OPENROUTER_MAX_TOKENS = '1024';
    process.env.OPENROUTER_FALLBACK_MODELS =
      'meta-llama/llama-3.3-70b-instruct,deepseek/deepseek-r1';

    const env = getEnv();
    expect(env.defaultModel).toBe('google/gemini-2.5-pro');
    expect(env.maxTokens).toBe(1024);
    expect(env.fallbackModels).toEqual([
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-r1',
    ]);
  });

  it('detects redis configuration', () => {
    expect(isRedisConfigured()).toBe(false);
    process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token';
    resetEnvCache();
    expect(isRedisConfigured()).toBe(true);
  });

  it('rejects invalid URL env values', () => {
    process.env.CORS_ORIGIN = 'not-a-url';
    expect(() => getEnv()).toThrow();
  });
});
