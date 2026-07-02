import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode, HTMLAttributes } from 'react';
import { SearchModal } from '../SearchModal';
import { useChatStore } from '../../store/chatStore';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

describe('SearchModal', () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: [
        {
          id: 'session-1',
          title: 'Porezna uprava',
          createdAt: Date.now(),
          messages: [
            {
              id: 'm1',
              role: 'user',
              content: 'Kako platiti porez?',
              timestamp: Date.now(),
            },
          ],
        },
      ],
    } as Partial<ReturnType<typeof useChatStore.getState>>);
  });

  it('exposes dialog semantics when open', () => {
    render(<SearchModal isOpen onClose={vi.fn()} onSelectSession={vi.fn()} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('textbox')).toBeInTheDocument();
    expect(screen.getByLabelText('Zatvori pretragu')).toBeInTheDocument();
  });

  it('selects a session from search results', () => {
    const onSelectSession = vi.fn();
    const onClose = vi.fn();

    render(<SearchModal isOpen onClose={onClose} onSelectSession={onSelectSession} />);

    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'porez' },
    });

    fireEvent.click(screen.getByText('Porezna uprava'));
    expect(onSelectSession).toHaveBeenCalledWith('session-1');
    expect(onClose).toHaveBeenCalled();
  });
});
