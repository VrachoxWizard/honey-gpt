import { describe, it, expect } from 'vitest';
import { CONSTANTS } from './constants';

describe('constants', () => {
  it('defines share endpoint limits', () => {
    expect(CONSTANTS.MAX_SHARE_PARAM_LENGTH).toBeGreaterThan(0);
    expect(CONSTANTS.SHARE_OG_RATE_LIMIT_PER_MIN).toBeGreaterThan(0);
  });

  it('defines core API and timeout values', () => {
    expect(CONSTANTS.OPENROUTER_URL).toContain('openrouter.ai');
    expect(CONSTANTS.MAX_REQUEST_BODY_BYTES).toBe(1_000_000);
    expect(CONSTANTS.HANDLER_TIMEOUT_MS).toBeGreaterThan(CONSTANTS.STREAM_TIMEOUT_MS);
  });
});
