import { describe, it, expect } from 'vitest';
import { parseSSEChunks } from './sse-parser';

describe('parseSSEChunks', () => {
  it('parses complete SSE lines and keeps remainder', () => {
    const payloads: unknown[] = [];
    const remaining = parseSSEChunks(
      'data: {"token":"He"}\n\ndata: {"token":"llo"}\npartial',
      (payload) => payloads.push(payload)
    );

    expect(payloads).toEqual([{ token: 'He' }, { token: 'llo' }]);
    expect(remaining).toBe('partial');
  });

  it('ignores DONE markers and empty lines', () => {
    const payloads: unknown[] = [];
    parseSSEChunks('data: [DONE]\n\ndata: {"model":"test"}\n', (payload) => payloads.push(payload));

    expect(payloads).toEqual([{ model: 'test' }]);
  });

  it('ignores invalid JSON lines', () => {
    const payloads: unknown[] = [];
    parseSSEChunks('data: {broken json}\n', (payload) => payloads.push(payload));
    expect(payloads).toHaveLength(0);
  });
});
