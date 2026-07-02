import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTextToSpeech } from '../useTextToSpeech';

describe('useTextToSpeech', () => {
  const speak = vi.fn();
  const cancel = vi.fn();

  beforeEach(() => {
    speak.mockReset();
    cancel.mockReset();

    class MockSpeechSynthesisUtterance {
      text: string;
      lang = 'hr-HR';
      voice: SpeechSynthesisVoice | undefined;
      onend: (() => void) | null = null;
      onerror: ((event: { error: string }) => void) | null = null;

      constructor(text: string) {
        this.text = text;
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      writable: true,
      value: MockSpeechSynthesisUtterance,
    });

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      writable: true,
      value: {
        speak,
        cancel,
        getVoices: () => [{ lang: 'hr-HR', name: 'Croatian' }],
      },
    });
  });

  it('speaks cleaned markdown text', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.speak('**Bold** tekst');
    });

    expect(speak).toHaveBeenCalledTimes(1);
    const utterance = speak.mock.calls[0][0] as SpeechSynthesisUtterance;
    expect(utterance.text).toBe('Bold tekst');
    expect(utterance.lang).toBe('hr-HR');
  });

  it('cancels active speech on stop', () => {
    const { result } = renderHook(() => useTextToSpeech());

    act(() => {
      result.current.stop();
    });

    expect(cancel).toHaveBeenCalled();
    expect(result.current.isSpeaking).toBe(false);
  });
});
