import { describe, it, expect } from 'vitest';
import { formatChatError, mapHttpStatusToMessage } from './errors';

describe('errors', () => {
  it('maps known HTTP statuses to Croatian messages', () => {
    expect(mapHttpStatusToMessage(429)).toMatch(/Previše molitvi/i);
    expect(mapHttpStatusToMessage(503)).toMatch(/privremeno nedostupan/i);
    expect(mapHttpStatusToMessage(504)).toMatch(/predugo molio/i);
    expect(mapHttpStatusToMessage(413)).toMatch(/prevelik/i);
  });

  it('uses fallback for unknown statuses', () => {
    expect(mapHttpStatusToMessage(418, 'Čajnik')).toBe('Čajnik');
    expect(mapHttpStatusToMessage(500)).toMatch(/Server nije uspio/i);
  });

  it('appends request id when provided', () => {
    expect(formatChatError('Greška', 'req-1')).toBe('Greška (ID: req-1)');
    expect(formatChatError('Greška')).toBe('Greška');
  });
});
