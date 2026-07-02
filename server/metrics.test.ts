import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./redis.js', () => ({
  incrementRedisCounter: vi.fn(async () => 1),
}));

import { incrementMetric, recordRequestMetrics } from './metrics';
import { incrementRedisCounter } from './redis';

describe('metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments named metrics', async () => {
    await incrementMetric('requests');
    expect(incrementRedisCounter).toHaveBeenCalled();
  });

  it('records request metrics bundle', async () => {
    await recordRequestMetrics({ cacheHit: true, tokens: 120, statusCode: 200 });
    expect(incrementRedisCounter).toHaveBeenCalled();
  });
});
