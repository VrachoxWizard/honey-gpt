import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ChatListItem } from '../sidebar/ChatListItem';

const session = {
  id: 's1',
  title: 'Test razgovor',
  messages: [],
  createdAt: 1,
  updatedAt: 1,
};

describe('ChatListItem', () => {
  it('enters edit mode and saves title', async () => {
    const user = userEvent.setup();
    const onEditSave = vi.fn();

    render(
      <ChatListItem
        session={session}
        isActive
        isEditing
        editTitle="Novi naslov"
        onSelect={vi.fn()}
        onEditStart={vi.fn()}
        onEditChange={vi.fn()}
        onEditSave={onEditSave}
        onEditCancel={vi.fn()}
        onDelete={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Spremi naslov/i }));
    expect(onEditSave).toHaveBeenCalledWith('s1');
  });
});
