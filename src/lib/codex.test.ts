import { describe, it, expect } from 'vitest';
import { AVAILABLE_MODELS, RITES, modelDisplayName, riteOf } from './codex';

describe('codex', () => {
  it('exposes all rites with required metadata', () => {
    expect(RITES.length).toBeGreaterThanOrEqual(6);
    expect(RITES[0]).toMatchObject({ key: expect.any(String), name: expect.any(String) });
  });

  it('returns rite by key with fallback', () => {
    expect(riteOf('concilium').name).toBe('Zbor Građana');
    expect(riteOf('unknown' as never).key).toBe('sanctus');
  });

  it('lists allowed models with display names', () => {
    expect(AVAILABLE_MODELS.length).toBeGreaterThan(0);
    expect(modelDisplayName(AVAILABLE_MODELS[0].id)).toBeTruthy();
  });
});
