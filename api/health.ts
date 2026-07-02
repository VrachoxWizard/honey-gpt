import { checkEnv, getEnv, isRedisConfigured } from '../server/env.js';
import { isConfiguredOpenRouterKey } from '../server/openrouter.js';

type VercelRequest = {
  method?: string;
};

type VercelResponse = {
  setHeader(name: string, value: string): VercelResponse;
  status(statusCode: number): VercelResponse;
  json(payload: unknown): void;
  end(): void;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  const env = getEnv();
  response.setHeader('Access-Control-Allow-Origin', env.corsOrigin);
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'GET') {
    response.status(405).json({ error: 'Health endpoint podržava samo GET.' });
    return;
  }

  const openRouterKeyConfigured = (() => {
    try {
      checkEnv();
      return isConfiguredOpenRouterKey(env.openRouterApiKey);
    } catch {
      return false;
    }
  })();

  response.status(200).json({
    ok: openRouterKeyConfigured,
    redis: isRedisConfigured(),
    openrouterKeyConfigured: openRouterKeyConfigured,
    version: '2.0.0',
  });
}
