import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSpeechRecognition } from '../useSpeechRecognition';

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  lang = 'hr-HR';
  onstart: (() => void) | null = null;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;

  start() {
    this.onstart?.();
    this.onresult?.({ results: [[{ transcript: 'test govor' }]] });
    this.onend?.();
  }

  stop() {
    this.onend?.();
  }
}

describe('useSpeechRecognition', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      writable: true,
      value: MockSpeechRecognition,
    });
  });

  it('captures transcript from recognition result', () => {
    const { result } = renderHook(() => useSpeechRecognition());

    act(() => {
      result.current.startListening();
    });

    expect(result.current.transcript).toBe('test govor');
    expect(result.current.supported).toBe(true);
  });

  it('invokes onError callback for recognition errors', () => {
    class ErrorRecognition extends MockSpeechRecognition {
      start() {
        this.onstart?.();
        this.onerror?.({ error: 'not-allowed' });
      }
    }

    Object.defineProperty(window, 'SpeechRecognition', {
      configurable: true,
      writable: true,
      value: ErrorRecognition,
    });

    const onError = vi.fn();
    const { result } = renderHook(() => useSpeechRecognition({ onError }));

    act(() => {
      result.current.startListening();
    });

    expect(onError).toHaveBeenCalledWith(
      'Pristup mikrofonu nije dopušten. Provjeri postavke preglednika.'
    );
  });
});
