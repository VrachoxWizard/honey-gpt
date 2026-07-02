import { describe, it, expect } from 'vitest';
import { parseSSEChunks } from './sse-parser';

describe('parseSSEChunks', () => {
  it('parses complete SSE lines and keeps the remainder', () => {
    const payloads: string[] = [];
    const remaining = parseSSEChunks<{ token?: string }>(
      'data: {"token":"He"}\n\ndata: {"token":"l',
      (payload) => {
        if (payload.token) payloads.push(payload.token);
      }
    );

    expect(payloads).toEqual(['He']);
    expect(remaining).toBe('data: {"token":"l');
  });
});
