import { describe, it, expect, vi, beforeEach } from 'vitest';
import { handleChatPayloadStream } from './api';

vi.mock('./moderation.js', () => ({
  resolveRiskLevel: vi.fn(),
}));

vi.mock('./hanicar.js', () => ({
  streamHanicarReply: vi.fn(async (_messages, onChunk) => {
    onChunk({ token: 'ok' });
  }),
}));

import { resolveRiskLevel } from './moderation.js';
import { streamHanicarReply } from './hanicar.js';

describe('handleChatPayloadStream moderation', () => {
  beforeEach(() => {
    vi.mocked(resolveRiskLevel).mockReset();
    vi.mocked(streamHanicarReply).mockClear();
  });

  it('rejects requests when LLM moderation returns block', async () => {
    vi.mocked(resolveRiskLevel).mockResolvedValue('block');

    await expect(
      handleChatPayloadStream({ messages: [{ role: 'user', content: 'test' }] }, vi.fn())
    ).rejects.toThrow('Poruka nije dopuštena');

    expect(streamHanicarReply).not.toHaveBeenCalled();
  });

  it('streams when moderation returns safe', async () => {
    vi.mocked(resolveRiskLevel).mockResolvedValue('safe');
    const onChunk = vi.fn();

    await handleChatPayloadStream({ messages: [{ role: 'user', content: 'test' }] }, onChunk);

    expect(streamHanicarReply).toHaveBeenCalled();
    expect(onChunk).toHaveBeenCalledWith({ token: 'ok' });
  });
});
