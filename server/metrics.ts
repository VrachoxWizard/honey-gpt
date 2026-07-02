import { incrementRedisCounter } from './redis.js';
import { isRedisConfigured } from './env.js';
import { logSystem } from './logger.js';

export type MetricName = 'requests' | 'cacheHits' | 'tokens' | 'errors429' | 'errors502';

const memoryMetrics = new Map<string, number>();
let redisMetricsWarningLogged = false;

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function metricKey(name: MetricName): string {
  return `hanicar:metrics:${getDateKey()}:${name}`;
}

function incrementMemoryMetric(key: string, amount: number): void {
  memoryMetrics.set(key, (memoryMetrics.get(key) || 0) + amount);
}

export async function incrementMetric(name: MetricName, amount = 1): Promise<void> {
  const key = metricKey(name);
  const updated = await incrementRedisCounter(key, amount);
  if (updated !== null) return;

  incrementMemoryMetric(key, amount);

  if (!redisMetricsWarningLogged && !isRedisConfigured()) {
    redisMetricsWarningLogged = true;
    logSystem('warn', 'Redis nije konfiguriran — metrike se spremaju samo in-memory', {
      metric: name,
    });
  }
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

export function resetMetricsForTests(): void {
  memoryMetrics.clear();
  redisMetricsWarningLogged = false;
}

export function getMemoryMetricCount(name: MetricName): number {
  return memoryMetrics.get(metricKey(name)) || 0;
}
