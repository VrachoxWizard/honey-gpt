import { render, screen, fireEvent, within } from '@testing-library/react';
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

    // Title is now split by <mark> highlighting, so match on the accessible name
    // of the whole result button rather than a single exact text node.
    fireEvent.click(screen.getByRole('button', { name: /Porezna uprava/i }));
    expect(onSelectSession).toHaveBeenCalledWith('session-1');
    expect(onClose).toHaveBeenCalled();
  });

  it('highlights the matched query inside the session title', () => {
    render(<SearchModal isOpen onClose={vi.fn()} onSelectSession={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'porezna' } });

    const resultButton = screen.getByRole('button', { name: /Porezna uprava/i });
    const mark = within(resultButton).getByText('Porezna', { selector: 'mark' });
    expect(mark).toBeInTheDocument();
  });

  it('centres the message snippet around the match instead of always showing the start', () => {
    useChatStore.setState({
      sessions: [
        {
          id: 'session-2',
          title: 'Dugačak zapis',
          createdAt: Date.now(),
          messages: [
            {
              id: 'm1',
              role: 'user',
              content:
                'Ovo je vrlo dugačka poruka koja na samom pocetku nema nista zanimljivo, ali negdje duboko unutra spominje tajnu rijec BLAGOSLOV koju tražimo, a zatim priča nastavlja dalje i dalje sve do kraja.',
              timestamp: Date.now(),
            },
          ],
        },
      ],
    } as Partial<ReturnType<typeof useChatStore.getState>>);

    render(<SearchModal isOpen onClose={vi.fn()} onSelectSession={vi.fn()} />);

    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'blagoslov' } });

    const mark = screen.getByText('BLAGOSLOV', { selector: 'mark' });
    expect(mark).toBeInTheDocument();
    // The snippet should not start with the very first word of the message.
    expect(screen.queryByText(/^"Ovo je vrlo/)).not.toBeInTheDocument();
  });
});
