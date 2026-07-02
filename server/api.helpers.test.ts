import { describe, it, expect } from 'vitest';
import { toClientError, assertPayloadSize } from './api';

describe('api helpers', () => {
  it('sanitizes server messages that mention secrets', () => {
    const error = toClientError(new Error('Invalid OPENROUTER_API_KEY provided'));
    expect(error.message).toContain('API kljucem');
    expect(error.statusCode).toBe(500);
  });

  it('rejects oversized payloads', () => {
    const hugePayload = { messages: [{ role: 'user', content: 'x'.repeat(1_100_000) }] };
    expect(() => assertPayloadSize(hugePayload)).toThrow(/prevelik/i);
  });
});
