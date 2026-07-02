import { describe, it, expect } from 'vitest';
import { stripThinking } from './textUtils';

describe('stripThinking', () => {
  it('should return empty string for empty input', () => {
    expect(stripThinking('')).toBe('');
  });

  it('should return same string if no thinking tags present', () => {
    expect(stripThinking('Mir s tobom')).toBe('Mir s tobom');
  });

  it('should strip closed thinking blocks and leave subsequent text', () => {
    expect(stripThinking('<razmisljanje>Ovdje je plan</razmisljanje>Mir s tobom')).toBe(
      'Mir s tobom'
    );
  });

  it('should strip case-insensitive closed thinking blocks', () => {
    expect(stripThinking('<RAZMISLJANJE>Ovdje je plan</RAZMISLJANJE>Mir s tobom')).toBe(
      'Mir s tobom'
    );
  });

  it('should strip open unclosed thinking blocks and everything after it', () => {
    expect(stripThinking('Predivno <razmisljanje>Plan u tijeku...')).toBe('Predivno ');
    expect(stripThinking('<razmisljanje>Plan...')).toBe('');
  });

  it('should strip leading newlines that remain after stripping', () => {
    expect(stripThinking('<razmisljanje>Ovdje je plan</razmisljanje>\n\nMir s tobom')).toBe(
      'Mir s tobom'
    );
  });
});
