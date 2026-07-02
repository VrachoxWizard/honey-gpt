import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useClipboard } from '../useClipboard';

describe('useClipboard', () => {
  it('copies text and toggles copied state', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    const { result } = renderHook(() => useClipboard());

    await act(async () => {
      const success = await result.current.copy('test');
      expect(success).toBe(true);
    });

    expect(writeText).toHaveBeenCalledWith('test');
    expect(result.current.copied).toBe(true);
  });
});
