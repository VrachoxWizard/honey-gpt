import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatList } from '../sidebar/ChatList';

const sessions = [
  {
    id: 's1',
    title: 'Prvi razgovor',
    messages: [],
    createdAt: 1,
    updatedAt: 1,
  },
];

describe('ChatList', () => {
  it('renders empty search state', () => {
    render(
      <ChatList
        sessions={sessions}
        filteredSessions={[]}
        activeSessionId="s1"
        editingId={null}
        editTitle=""
        onSelect={vi.fn()}
        onEditStart={vi.fn()}
        onEditChange={vi.fn()}
        onEditSave={vi.fn()}
        onEditCancel={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    expect(screen.getByText(/Ništa ne odgovara pretrazi/i)).toBeInTheDocument();
  });

  it('selects a session on click', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <ChatList
        sessions={sessions}
        filteredSessions={sessions}
        activeSessionId="s1"
        editingId={null}
        editTitle=""
        onSelect={onSelect}
        onEditStart={vi.fn()}
        onEditChange={vi.fn()}
        onEditSave={vi.fn()}
        onEditCancel={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    await user.click(screen.getByText('Prvi razgovor'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });

  it('groups sessions into Danas / Jučer / Starije headers when history spans multiple days', () => {
    const now = Date.now();
    const oneDayMs = 86_400_000;
    const multiDaySessions = [
      { id: 'today', title: 'Današnji razgovor', messages: [], createdAt: now },
      { id: 'yesterday', title: 'Jučerašnji razgovor', messages: [], createdAt: now - oneDayMs },
      { id: 'old', title: 'Stari razgovor', messages: [], createdAt: now - 10 * oneDayMs },
    ];

    render(
      <ChatList
        sessions={multiDaySessions}
        filteredSessions={multiDaySessions}
        activeSessionId="today"
        editingId={null}
        editTitle=""
        onSelect={vi.fn()}
        onEditStart={vi.fn()}
        onEditChange={vi.fn()}
        onEditSave={vi.fn()}
        onEditCancel={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    expect(screen.getByText('Danas')).toBeInTheDocument();
    expect(screen.getByText('Jučer')).toBeInTheDocument();
    expect(screen.getByText('Starije')).toBeInTheDocument();
  });

  it('does not show date group headers for a single-day history', () => {
    render(
      <ChatList
        sessions={sessions}
        filteredSessions={sessions}
        activeSessionId="s1"
        editingId={null}
        editTitle=""
        onSelect={vi.fn()}
        onEditStart={vi.fn()}
        onEditChange={vi.fn()}
        onEditSave={vi.fn()}
        onEditCancel={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    expect(screen.queryByText('Danas')).not.toBeInTheDocument();
    expect(screen.queryByText('Starije')).not.toBeInTheDocument();
  });
});
