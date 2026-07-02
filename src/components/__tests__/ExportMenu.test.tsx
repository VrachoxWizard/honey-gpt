import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode, HTMLAttributes } from 'react';
import { ExportMenu, type ExportMenuAction } from '../sidebar/ExportMenu';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

function buildActions(overrides: Partial<Record<string, () => void>> = {}): ExportMenuAction[] {
  return [
    { id: 'share', label: 'Podijeli link', icon: <span />, onSelect: overrides.share ?? vi.fn() },
    {
      id: 'export-md',
      label: 'Izvezi kao Markdown',
      icon: <span />,
      onSelect: overrides['export-md'] ?? vi.fn(),
    },
    {
      id: 'clear-all',
      label: 'Spali sve zapise',
      icon: <span />,
      onSelect: overrides['clear-all'] ?? vi.fn(),
      variant: 'danger',
    },
  ];
}

describe('ExportMenu', () => {
  it('is closed by default and opens the menu on trigger click', async () => {
    const user = userEvent.setup();
    render(<ExportMenu actions={buildActions()} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Izvezi ili podijeli razgovor/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('calls the matching action and closes the menu on selection', async () => {
    const user = userEvent.setup();
    const onShare = vi.fn();
    render(<ExportMenu actions={buildActions({ share: onShare })} />);

    await user.click(screen.getByRole('button', { name: /Izvezi ili podijeli razgovor/i }));
    const menu = screen.getByRole('menu');
    await user.click(within(menu).getByRole('menuitem', { name: 'Podijeli link' }));

    expect(onShare).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu on Escape', async () => {
    const user = userEvent.setup();
    render(<ExportMenu actions={buildActions()} />);

    await user.click(screen.getByRole('button', { name: /Izvezi ili podijeli razgovor/i }));
    expect(screen.getByRole('menu')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
