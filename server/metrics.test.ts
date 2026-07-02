import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('./redis.js', () => ({
  incrementRedisCounter: vi.fn(async () => null),
}));

vi.mock('./env.js', () => ({
  isRedisConfigured: vi.fn(() => false),
}));

import { incrementMetric, getMemoryMetricCount, resetMetricsForTests } from './metrics';

describe('metrics', () => {
  beforeEach(() => {
    resetMetricsForTests();
  });

  it('stores metrics in memory when redis is unavailable', async () => {
    await incrementMetric('requests', 2);
    expect(getMemoryMetricCount('requests')).toBe(2);
  });
});
