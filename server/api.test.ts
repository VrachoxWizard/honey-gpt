import { describe, it, expect } from 'vitest';
import { parseOptions } from './api';

describe('Backend options parsing', () => {
  it('should parse valid options', () => {
    const payload = {
      messages: [],
      model: 'google/gemini-2.5-flash',
      toneMode: 'clericus'
    };
    const options = parseOptions(payload);
    expect(options.model).toBe('google/gemini-2.5-flash');
    expect(options.toneMode).toBe('clericus');
  });

  it('should ignore invalid toneMode values', () => {
    const payload = {
      messages: [],
      toneMode: 'invalid_mode'
    };
    const options = parseOptions(payload);
    expect(options.toneMode).toBeUndefined();
  });

  it('should return empty options for invalid payload', () => {
    expect(parseOptions(null)).toEqual({});
    expect(parseOptions('string')).toEqual({});
  });
});
