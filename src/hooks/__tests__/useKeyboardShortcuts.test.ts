import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useKeyboardShortcuts } from '../useKeyboardShortcuts';

describe('useKeyboardShortcuts', () => {
  const handlers = {
    onSearch: vi.fn(),
    onNewChat: vi.fn(),
    onExport: vi.fn(),
    onClose: vi.fn(),
    onHelp: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('triggers search shortcut on Ctrl+K', () => {
    renderHook(() => useKeyboardShortcuts(handlers));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));

    expect(handlers.onSearch).toHaveBeenCalledTimes(1);
  });

  it('triggers help shortcut on question mark outside inputs', () => {
    renderHook(() => useKeyboardShortcuts(handlers));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: '?', bubbles: true }));

    expect(handlers.onHelp).toHaveBeenCalledTimes(1);
  });

  it('triggers close on Escape', () => {
    renderHook(() => useKeyboardShortcuts(handlers));

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(handlers.onClose).toHaveBeenCalledTimes(1);
  });
});
