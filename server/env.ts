import { z } from 'zod';
import { httpError } from './api.js';

const envSchema = z.object({
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_MODEL: z.string().default('google/gemini-2.5-flash'),
  OPENROUTER_MAX_TOKENS: z.coerce.number().int().positive().max(8192).default(2048),
  OPENROUTER_FALLBACK_MODELS: z.string().default('meta-llama/llama-3.3-70b-instruct'),
  OPENROUTER_SITE_URL: z.string().default('https://honey-gpt.vercel.app'),
  OPENROUTER_APP_NAME: z.string().default('Hanicar-gpt'),
  CORS_ORIGIN: z.string().default('https://honey-gpt.vercel.app'),
  UPSTASH_REDIS_REST_URL: z.string().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  API_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
});

export type AppEnv = {
  openRouterApiKey: string | undefined;
  defaultModel: string;
  maxTokens: number;
  fallbackModels: string[];
  siteUrl: string;
  appName: string;
  corsOrigin: string;
  upstashRedisUrl: string | undefined;
  upstashRedisToken: string | undefined;
  apiSecret: string | undefined;
  sentryDsn: string | undefined;
  isProduction: boolean;
};

let cachedEnv: AppEnv | null = null;
let redisWarningLogged = false;

function parseFallbackModels(raw: string): string[] {
  return raw
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);
}

export function getEnv(): AppEnv {
  if (cachedEnv) return cachedEnv;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw httpError(500, 'Neispravna konfiguracija okoline.');
  }

  const data = parsed.data;
  cachedEnv = {
    openRouterApiKey: data.OPENROUTER_API_KEY?.trim(),
    defaultModel: data.OPENROUTER_MODEL.trim(),
    maxTokens: data.OPENROUTER_MAX_TOKENS,
    fallbackModels: parseFallbackModels(data.OPENROUTER_FALLBACK_MODELS),
    siteUrl: data.OPENROUTER_SITE_URL.trim(),
    appName: data.OPENROUTER_APP_NAME.trim(),
    corsOrigin: data.CORS_ORIGIN.trim(),
    upstashRedisUrl: data.UPSTASH_REDIS_REST_URL?.trim(),
    upstashRedisToken: data.UPSTASH_REDIS_REST_TOKEN?.trim(),
    apiSecret: data.API_SECRET?.trim(),
    sentryDsn: data.SENTRY_DSN?.trim(),
    isProduction: process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production',
  };

  return cachedEnv;
}

export function resetEnvCache(): void {
  cachedEnv = null;
  redisWarningLogged = false;
}

export function checkEnv(): void {
  const apiKey = getEnv().openRouterApiKey;
  if (!apiKey || !apiKey.startsWith('sk-or-') || apiKey.length < 20) {
    throw httpError(
      500,
      'Nedostaje OPENROUTER_API_KEY. Dodaj ga u .env lokalno ili u Vercel Environment Variables.'
    );
  }
}

export function isRedisConfigured(): boolean {
  const env = getEnv();
  return Boolean(env.upstashRedisUrl && env.upstashRedisToken);
}

export function warnIfProductionWithoutRedis(): void {
  const env = getEnv();
  if (redisWarningLogged || !env.isProduction || isRedisConfigured()) {
    return;
  }

  redisWarningLogged = true;
  console.warn(
    '[Hanicar] UPSTASH Redis nije konfiguriran u produkciji. Rate limit i cache rade samo in-memory po instanci.'
  );
}
