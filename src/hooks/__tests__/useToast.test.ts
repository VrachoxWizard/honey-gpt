import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useToast } from '../useToast';
import { ToastProvider } from '../../components/Toast';

describe('useToast', () => {
  it('throws outside provider', () => {
    expect(() => renderHook(() => useToast())).toThrow(/ToastProvider/i);
  });

  it('returns showToast inside provider', () => {
    const { result } = renderHook(() => useToast(), {
      wrapper: ToastProvider,
    });

    expect(typeof result.current.showToast).toBe('function');
  });
});
