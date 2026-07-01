import { describe, it, expect } from 'vitest';
import { validateAndParsePayload } from './api';

describe('Backend payload validation', () => {
  it('should parse valid options and messages', () => {
    const payload = {
      messages: [
        { role: 'user', content: 'Pozdrav' }
      ],
      model: 'google/gemini-2.5-flash',
      toneMode: 'clericus',
    };
    const data = validateAndParsePayload(payload);
    expect(data.model).toBe('google/gemini-2.5-flash');
    expect(data.toneMode).toBe('clericus');
    expect(data.messages).toHaveLength(1);
    expect(data.messages[0].role).toBe('user');
  });

  it('should fail validation on invalid toneMode values', () => {
    const payload = {
      messages: [],
      toneMode: 'invalid_mode',
    };
    expect(() => validateAndParsePayload(payload)).toThrow();
  });

  it('should fail validation for empty or invalid payload', () => {
    expect(() => validateAndParsePayload(null)).toThrow();
    expect(() => validateAndParsePayload('string')).toThrow();
  });
});
