import { describe, it, expect, beforeEach } from 'vitest';
import { getModelCandidates, validateRequestedModel } from './models';
import { resetEnvCache } from './env';

describe('models', () => {
  beforeEach(() => {
    resetEnvCache();
    process.env.OPENROUTER_MODEL = 'google/gemini-2.5-flash';
    process.env.OPENROUTER_FALLBACK_MODELS = 'meta-llama/llama-3.3-70b-instruct';
  });

  it('returns allowed user model first', () => {
    const models = getModelCandidates('google/gemini-2.5-pro', 'Pozdrav');
    expect(models[0]).toBe('google/gemini-2.5-pro');
  });

  it('routes coding prompts to coder model', () => {
    const models = getModelCandidates(undefined, 'Imam bug u typescript kodu');
    expect(models[0]).toBe('qwen/qwen-2.5-coder-32b-instruct');
  });

  it('routes image messages to vision-capable models', () => {
    const models = getModelCandidates(undefined, 'Što vidiš na slici?', true);
    expect(models[0]).toBe('google/gemini-2.5-flash');
  });

  it('rejects unknown requested models', () => {
    expect(validateRequestedModel('totally/unknown-model')).toBeUndefined();
    expect(validateRequestedModel('google/gemini-2.5-flash')).toBe('google/gemini-2.5-flash');
  });
});
