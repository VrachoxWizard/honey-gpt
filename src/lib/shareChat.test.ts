import { describe, it, expect } from 'vitest';
import { encodeSharedChat, decodeSharedChat } from './shareChat';

describe('shareChat', () => {
  it('round-trips shared chat payloads', () => {
    const payload = {
      version: 1 as const,
      title: 'Test',
      exportedAt: 1,
      messages: [{ id: '1', role: 'user' as const, content: 'Bok', timestamp: 1 }],
    };

    const encoded = encodeSharedChat(payload);
    expect(decodeSharedChat(encoded)).toEqual(payload);
  });
});
