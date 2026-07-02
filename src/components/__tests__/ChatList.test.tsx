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
        onDelete={vi.fn()}
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
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByText('Prvi razgovor'));
    expect(onSelect).toHaveBeenCalledWith('s1');
  });
});
