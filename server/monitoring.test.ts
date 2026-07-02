import { describe, it, expect } from 'vitest';
import { initMonitoring, captureException } from './monitoring';
import { resetEnvCache } from './env';

describe('monitoring', () => {
  it('no-ops when sentry is not configured', async () => {
    resetEnvCache();
    delete process.env.SENTRY_DSN;
    await expect(initMonitoring()).resolves.toBeUndefined();
    await expect(captureException(new Error('test'))).resolves.toBeUndefined();
  });
});
