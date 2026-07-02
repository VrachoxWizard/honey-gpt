import { describe, it, expect, beforeEach } from 'vitest';
import {
  isCircuitOpen,
  recordProviderFailure,
  recordProviderSuccess,
  resetCircuitForTests,
} from './circuit-breaker';

describe('circuit-breaker', () => {
  beforeEach(() => {
    resetCircuitForTests();
  });

  it('opens circuit after repeated failures', async () => {
    for (let i = 0; i < 5; i++) {
      await recordProviderFailure();
    }

    expect(await isCircuitOpen()).toBe(true);
  });

  it('closes circuit after success', async () => {
    for (let i = 0; i < 5; i++) {
      await recordProviderFailure();
    }
    await recordProviderSuccess();
    expect(await isCircuitOpen()).toBe(false);
  });
});
