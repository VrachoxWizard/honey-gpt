import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import type { ReactNode, HTMLAttributes } from 'react';
import { Sidebar } from '../Sidebar';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
    aside: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
      <aside {...props}>{children}</aside>
    ),
    span: ({ children, ...props }: HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
    button: ({ children, ...props }: HTMLAttributes<HTMLButtonElement>) => (
      <button type="button" {...props}>
        {children}
      </button>
    ),
  },
}));

const baseSessions = [
  { id: 's1', title: 'Prvi razgovor', messages: [], createdAt: Date.now() },
  { id: 's2', title: 'Drugi razgovor', messages: [], createdAt: Date.now() },
];

function renderSidebar(overrides: Partial<Record<string, unknown>> = {}) {
  const handlers = {
    onClose: vi.fn(),
    onChangeRite: vi.fn(),
    onToggleTheme: vi.fn(),
    onNewChat: vi.fn(),
    onSearch: vi.fn(),
    onExportChat: vi.fn(),
    onExportSessionJson: vi.fn(),
    onImportSession: vi.fn(),
    onShareChat: vi.fn(),
    onDownloadImage: vi.fn(),
    onChangeModel: vi.fn(),
    onSwitchSession: vi.fn(),
    onDeleteSession: vi.fn(),
    onRenameSession: vi.fn(),
    onClearAllSessions: vi.fn(),
    ...overrides,
  };

  render(
    <Sidebar
      isOpen={false}
      rite="sanctus"
      theme="day"
      activeModel="google/gemini-2.5-flash"
      sessions={baseSessions}
      activeSessionId="s1"
      {...handlers}
    />
  );

  return handlers;
}

describe('Sidebar', () => {
  it('consolidates share/export/import actions behind the "Izvezi" menu', async () => {
    const user = userEvent.setup();
    const handlers = renderSidebar();

    await user.click(screen.getByRole('button', { name: /Izvezi ili podijeli razgovor/i }));
    const menu = screen.getByRole('menu', { name: 'Radnje nad razgovorom' });

    await user.click(within(menu).getByRole('menuitem', { name: 'Podijeli link' }));
    expect(handlers.onShareChat).toHaveBeenCalledTimes(1);
  });

  it('routes the danger "Spali sve zapise" action through the confirm dialog', async () => {
    const user = userEvent.setup();
    const handlers = renderSidebar();

    await user.click(screen.getByRole('button', { name: /Izvezi ili podijeli razgovor/i }));
    const menu = screen.getByRole('menu', { name: 'Radnje nad razgovorom' });
    await user.click(within(menu).getByRole('menuitem', { name: 'Spali sve zapise' }));

    // Confirm dialog should appear instead of calling the handler immediately.
    expect(handlers.onClearAllSessions).not.toHaveBeenCalled();
    expect(screen.getByText('Spaliti sve zapise?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Spali sve' }));
    expect(handlers.onClearAllSessions).toHaveBeenCalledTimes(1);
  });
});
