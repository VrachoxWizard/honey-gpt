import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeyboardShortcutsModal } from '../KeyboardShortcutsModal';

describe('KeyboardShortcutsModal', () => {
  it('renders dialog when open and closes on button click', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<KeyboardShortcutsModal isOpen onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Zatvori modal/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
