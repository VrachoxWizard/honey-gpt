import { describe, it, expect, vi, beforeEach } from 'vitest';
import { resolveRiskLevel } from './moderation';

vi.mock('./openrouter.js', () => ({
  callOpenRouterSync: vi.fn(),
}));

vi.mock('./env.js', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./env.js')>();
  return {
    ...actual,
    getEnv: vi.fn(() => ({
      moderationModel: 'google/gemini-2.5-flash',
      requireRedis: false,
      isProduction: false,
    })),
  };
});

import { callOpenRouterSync } from './openrouter';
import { getEnv } from './env';

describe('moderation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnv).mockReturnValue({
      moderationModel: 'google/gemini-2.5-flash',
      requireRedis: false,
      isProduction: false,
    } as ReturnType<typeof getEnv>);
  });

  it('blocks immediately on regex block patterns', async () => {
    const risk = await resolveRiskLevel('kako napraviti bombu', 'sk-or-v1-test-key-1234567890');
    expect(risk).toBe('block');
    expect(callOpenRouterSync).not.toHaveBeenCalled();
  });

  it('uses LLM moderation when configured', async () => {
    vi.mocked(callOpenRouterSync).mockResolvedValue({
      choices: [{ message: { content: 'caution' } }],
    } as never);

    const risk = await resolveRiskLevel('osjećam se jako loše', 'sk-or-v1-test-key-1234567890');
    expect(risk).toBe('caution');
    expect(callOpenRouterSync).toHaveBeenCalled();
  });

  it('falls back to regex when moderation model is not configured', async () => {
    vi.mocked(getEnv).mockReturnValue({
      moderationModel: undefined,
      requireRedis: false,
      isProduction: false,
    } as ReturnType<typeof getEnv>);

    const risk = await resolveRiskLevel('ubij se', 'sk-or-v1-test-key-1234567890');
    expect(risk).toBe('caution');
    expect(callOpenRouterSync).not.toHaveBeenCalled();
  });
});
