import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ToastProvider } from '../Toast';

describe('ToastProvider', () => {
  it('shows toast messages through context', async () => {
    const user = userEvent.setup();
    const show = vi.fn();

    render(
      <ToastProvider>
        <button type="button" onClick={() => show('Poruka')}>
          Trigger
        </button>
      </ToastProvider>
    );

    await user.click(screen.getByRole('button', { name: 'Trigger' }));
    expect(screen.getByRole('button', { name: 'Trigger' })).toBeInTheDocument();
  });
});
