import { incrementRedisCounter } from './redis.js';

export type MetricName = 'requests' | 'cacheHits' | 'tokens' | 'errors429' | 'errors502';

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function metricKey(name: MetricName): string {
  return `hanicar:metrics:${getDateKey()}:${name}`;
}

export async function incrementMetric(name: MetricName, amount = 1): Promise<void> {
  await incrementRedisCounter(metricKey(name), amount);
}

export async function recordRequestMetrics(options: {
  cacheHit: boolean;
  tokens?: number;
  statusCode?: number;
}): Promise<void> {
  await incrementMetric('requests');
  if (options.cacheHit) {
    await incrementMetric('cacheHits');
  }
  if (options.tokens && options.tokens > 0) {
    await incrementMetric('tokens', options.tokens);
  }
  if (options.statusCode === 429) {
    await incrementMetric('errors429');
  }
  if (options.statusCode === 502 || options.statusCode === 503) {
    await incrementMetric('errors502');
  }
}
