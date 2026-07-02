import { describe, it, expect, vi } from 'vitest';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  captureException: vi.fn(),
}));

import * as Sentry from '@sentry/react';
import { initClientMonitoring } from './monitoring';

describe('monitoring', () => {
  it('does not initialize Sentry without DSN', () => {
    initClientMonitoring();
    expect(Sentry.init).not.toHaveBeenCalled();
  });
});
