import { describe, it, expect } from 'vitest';
import {
  isConfiguredOpenRouterKey,
  isRetryableOpenRouterError,
  isQuotaLikeError,
} from './openrouter';

describe('openrouter helpers', () => {
  it('validates configured api keys', () => {
    expect(isConfiguredOpenRouterKey('sk-or-v1-test-key-1234567890')).toBe(true);
    expect(isConfiguredOpenRouterKey('invalid')).toBe(false);
  });

  it('detects retryable provider errors', () => {
    expect(isRetryableOpenRouterError('HTTP 429 rate limit exceeded')).toBe(true);
    expect(isRetryableOpenRouterError('Invalid prompt')).toBe(false);
  });

  it('detects quota-like errors', () => {
    expect(isQuotaLikeError('Insufficient credits')).toBe(true);
    expect(isQuotaLikeError('Bad request')).toBe(false);
  });
});
