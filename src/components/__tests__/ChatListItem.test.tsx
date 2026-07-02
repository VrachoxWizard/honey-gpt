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
        onDeleteRequest={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /Spremi naslov/i }));
    expect(onEditSave).toHaveBeenCalledWith('s1');
  });

  it('keeps rename/delete actions visible on touch (mobile) for inactive sessions', () => {
    render(
      <ChatListItem
        session={session}
        isActive={false}
        isEditing={false}
        editTitle=""
        onSelect={vi.fn()}
        onEditStart={vi.fn()}
        onEditChange={vi.fn()}
        onEditSave={vi.fn()}
        onEditCancel={vi.fn()}
        onDeleteRequest={vi.fn()}
      />
    );

    const renameButton = screen.getByRole('button', { name: /Preimenuj/i });
    const deleteButton = screen.getByRole('button', { name: /Spali zapis/i });

    // Visible by default (touch/mobile); only hidden-until-hover on desktop (md:).
    expect(renameButton.className).toContain('opacity-100');
    expect(renameButton.className).toContain('md:opacity-0');
    expect(deleteButton.className).toContain('opacity-100');
    expect(deleteButton.className).toContain('md:opacity-0');
  });
});
