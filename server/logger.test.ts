import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequestLogger, createRequestId } from './logger';

describe('logger', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates unique request ids', () => {
    const first = createRequestId();
    const second = createRequestId();
    expect(first).not.toBe(second);
    expect(first).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    );
  });

  it('writes structured JSON logs with requestId', () => {
    const logger = createRequestLogger('req-123');
    logger.info('test event', { cacheHit: true });

    expect(console.log).toHaveBeenCalledTimes(1);
    const payload = JSON.parse(String(vi.mocked(console.log).mock.calls[0][0]));
    expect(payload).toMatchObject({
      level: 'info',
      message: 'test event',
      requestId: 'req-123',
      cacheHit: true,
    });
    expect(payload.timestamp).toBeTruthy();
  });

  it('routes warn and error levels to correct console methods', () => {
    const logger = createRequestLogger('req-456');
    logger.warn('careful');
    logger.error('failed');

    expect(console.warn).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenCalledTimes(1);
  });
});
