import { describe, it, expect, vi, beforeEach } from 'vitest';
import { summarizeConversationIfNeeded } from './summary';
import { CONSTANTS } from './constants';

vi.mock('./openrouter.js', () => ({
  callOpenRouterSync: vi.fn(async () => ({
    choices: [{ message: { content: 'Korisnik je pitao o Wi-Fi-ju.' } }],
  })),
}));

vi.mock('./models.js', () => ({
  resolveDefaultModel: vi.fn(() => 'google/gemini-2.5-flash'),
}));

describe('summary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips summarization for short conversations', async () => {
    const summary = await summarizeConversationIfNeeded(
      [{ role: 'user', content: 'Pozdrav' }],
      'sk-or-v1-test-key-1234567890'
    );
    expect(summary.text).toBe('');
    expect(summary.failed).toBe(false);
  });

  it('summarizes long conversations with enough content', async () => {
    const messages = Array.from({ length: CONSTANTS.SUMMARIZATION_THRESHOLD + 2 }, (_, index) => ({
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Poruka broj ${index} `.repeat(20),
    }));

    const summary = await summarizeConversationIfNeeded(messages, 'sk-or-v1-test-key-1234567890');
    expect(summary.text).toContain('Wi-Fi');
    expect(summary.failed).toBe(false);
  });

  it('degrades gracefully (failed: true, empty text) when the summarization call times out or errors', async () => {
    const { callOpenRouterSync } = await import('./openrouter.js');
    vi.mocked(callOpenRouterSync).mockRejectedValueOnce(new Error('SYNC_TIMEOUT_MS exceeded'));

    const messages = Array.from({ length: CONSTANTS.SUMMARIZATION_THRESHOLD + 2 }, (_, index) => ({
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Poruka broj ${index} `.repeat(20),
    }));

    const summary = await summarizeConversationIfNeeded(messages, 'sk-or-v1-test-key-1234567890');
    expect(summary.text).toBe('');
    expect(summary.failed).toBe(true);
  });

  it('degrades gracefully when the model returns no usable text', async () => {
    const { callOpenRouterSync } = await import('./openrouter.js');
    vi.mocked(callOpenRouterSync).mockResolvedValueOnce({
      id: 'test-id',
      model: 'test-model',
      choices: [{ message: { role: 'assistant', content: '' } }],
    });

    const messages = Array.from({ length: CONSTANTS.SUMMARIZATION_THRESHOLD + 2 }, (_, index) => ({
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      content: `Poruka broj ${index} `.repeat(20),
    }));

    const summary = await summarizeConversationIfNeeded(messages, 'sk-or-v1-test-key-1234567890');
    expect(summary.text).toBe('');
    expect(summary.failed).toBe(true);
  });
});
