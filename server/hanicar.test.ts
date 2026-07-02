import { describe, it, expect, vi, beforeEach } from 'vitest';
import { streamHanicarReply } from './hanicar';
import { resetCacheForTests } from './cache';
import { resetEnvCache } from './env';

vi.mock('./openrouter.js', () => ({
  isConfiguredOpenRouterKey: vi.fn(() => true),
  isRetryableOpenRouterError: vi.fn(() => false),
  isQuotaLikeError: vi.fn(() => false),
  streamOpenRouter: vi.fn(async (_apiKey, _model, _messages, onChunk) => {
    onChunk({ token: 'Blagoslov' });
    onChunk({ model: 'google/gemini-2.5-flash' });
    return 'Blagoslov';
  }),
}));

vi.mock('./summary.js', () => ({
  summarizeConversationIfNeeded: vi.fn(async () => ''),
}));

vi.mock('./news.js', () => ({
  fetchCroatianNews: vi.fn(async () => []),
}));

vi.mock('./prompts.js', async () => {
  const actual = await vi.importActual<typeof import('./prompts')>('./prompts');
  return {
    ...actual,
    getLorePhrases: vi.fn(async () => []),
  };
});

describe('hanicar', () => {
  beforeEach(() => {
    resetEnvCache();
    resetCacheForTests();
    process.env.OPENROUTER_API_KEY = 'sk-or-v1-test-key-1234567890';
  });

  it('streams model reply for valid requests', async () => {
    const tokens: string[] = [];
    await streamHanicarReply(
      [{ role: 'user', content: 'Pozdrav' }],
      (chunk) => {
        if (chunk.token) tokens.push(chunk.token);
      },
      { toneMode: 'humilis' }
    );

    expect(tokens.join('')).toBe('Blagoslov');
  });

  it('rejects requests without user messages', async () => {
    await expect(
      streamHanicarReply([{ role: 'assistant', content: 'Samo ja' }], () => {})
    ).rejects.toThrow(/korisnicku poruku/i);
  });
});
