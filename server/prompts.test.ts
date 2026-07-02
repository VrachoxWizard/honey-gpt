import { describe, it, expect, vi } from 'vitest';
import {
  detectSentiment,
  detectCodingOrLogic,
  buildSystemPrompt,
  buildOpenRouterMessages,
  getSeasonalInstructions,
} from './prompts';

describe('Prompts / Sentiment & Coding Detection', () => {
  describe('detectSentiment', () => {
    it('should detect angry sentiment', () => {
      expect(detectSentiment('Ovo je glupost, ništa ne radi!')).toBe('angry');
      expect(detectSentiment('Mrzim kad se sranje dogodi.')).toBe('angry');
    });

    it('should detect sad sentiment', () => {
      expect(detectSentiment('Jako sam tužan i depresivan danas.')).toBe('sad');
      expect(detectSentiment('Osjećam samoću i plačem.')).toBe('sad');
    });

    it('should fallback to normal sentiment', () => {
      expect(detectSentiment('Kako si danas?')).toBe('normal');
      expect(detectSentiment('Dobar dan, trebam pomoć.')).toBe('normal');
    });
  });

  describe('detectCodingOrLogic', () => {
    it('should detect coding keywords', () => {
      expect(detectCodingOrLogic('kako napisati typescript funkciju')).toBe(true);
      expect(detectCodingOrLogic('imam bug u sql bazi')).toBe(true);
      expect(detectCodingOrLogic('const x = 5;')).toBe(true);
    });

    it('should return false for regular messages', () => {
      expect(detectCodingOrLogic('Gdje je najbolji kafić u Splitu?')).toBe(false);
      expect(detectCodingOrLogic('Kada počinje nedjeljna misa?')).toBe(false);
    });
  });

  describe('buildSystemPrompt', () => {
    it('should generate system prompt with base instructions', () => {
      const prompt = buildSystemPrompt('sanctus');
      expect(prompt).toContain('HANIČAR GPT');
      expect(prompt).toContain('besprijekornom, književnom');
    });

    it('should include angry instructions when user is angry', () => {
      const prompt = buildSystemPrompt('sanctus', undefined, undefined, 'angry');
      expect(prompt).toContain('Korisnik je vidno frustriran');
    });

    it('should include sad instructions when user is sad', () => {
      const prompt = buildSystemPrompt('sanctus', undefined, undefined, 'sad');
      expect(prompt).toContain('Korisnik je melankoličan ili tužan');
    });

    it('should format instructions according to toneMode humilis', () => {
      const prompt = buildSystemPrompt('humilis');
      expect(prompt).toContain('Skroman, tih, pokajnički');
    });

    it('should format instructions according to toneMode clericus', () => {
      const prompt = buildSystemPrompt('clericus');
      expect(prompt).toContain('MODUS: CLERICUS (Birokratski)');
    });
  });

  describe('buildOpenRouterMessages', () => {
    it('should format message array with system prompt first', () => {
      const messages = [{ role: 'user' as const, content: 'Pozdrav!' }];
      const formatted = buildOpenRouterMessages(messages, 'sanctus');
      expect(formatted).toHaveLength(2);
      expect(formatted[0].role).toBe('system');
      expect(formatted[1].role).toBe('user');
      expect(formatted[1].content).toContain('<user_message>');
      expect(formatted[1].content).toContain('Pozdrav!');
    });
  });

  describe('getSeasonalInstructions', () => {
    it('returns seasonal context for known holidays', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-05-01T10:00:00'));
      expect(getSeasonalInstructions()[0]).toContain('PRVI SVIBNJA');
      vi.useRealTimers();
    });
  });
});
