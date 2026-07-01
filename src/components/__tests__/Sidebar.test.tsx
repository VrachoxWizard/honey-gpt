import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Sidebar } from '../Sidebar';
import type { ChatSession } from '../../types';

describe('Sidebar', () => {
  const mockSessions: ChatSession[] = [
    {
      id: 'session-1',
      title: 'Prvi razgovor',
      createdAt: Date.now(),
      messages: []
    },
    {
      id: 'session-2',
      title: 'Drugi razgovor',
      createdAt: Date.now(),
      messages: []
    }
  ];

  it('renders brand block and session list', () => {
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        onNewChat={vi.fn()}
        onExportChat={vi.fn()}
        sessions={mockSessions}
        activeSessionId="session-1"
      />
    );

    expect(screen.getByText('Haničar GPT')).toBeInTheDocument();
    expect(screen.getByText('Prvi razgovor')).toBeInTheDocument();
    expect(screen.getByText('Drugi razgovor')).toBeInTheDocument();
  });

  it('calls onSwitchSession when clicking a session', () => {
    const onSwitch = vi.fn();
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        onNewChat={vi.fn()}
        onExportChat={vi.fn()}
        sessions={mockSessions}
        activeSessionId="session-1"
        onSwitchSession={onSwitch}
      />
    );

    const secondSessionNode = screen.getByText('Drugi razgovor');
    fireEvent.click(secondSessionNode);
    
    expect(onSwitch).toHaveBeenCalledWith('session-2');
  });

  it('calls onDeleteSession when clicking the delete button', () => {
    const onDelete = vi.fn();
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        onNewChat={vi.fn()}
        onExportChat={vi.fn()}
        sessions={mockSessions}
        activeSessionId="session-1"
        onDeleteSession={onDelete}
      />
    );

    // Get the delete button for the second session
    const deleteButtons = screen.getAllByLabelText('Obriši razgovor');
    // Click the second one
    fireEvent.click(deleteButtons[1]);

    expect(onDelete).toHaveBeenCalledWith('session-2');
  });

  it('calls onNewChat when clicking the New Chat button', () => {
    const onNewChat = vi.fn();
    render(
      <Sidebar
        isOpen={true}
        onClose={vi.fn()}
        onNewChat={onNewChat}
        onExportChat={vi.fn()}
        sessions={mockSessions}
        activeSessionId="session-1"
      />
    );

    const newChatBtn = screen.getByText('Novi razgovor');
    fireEvent.click(newChatBtn);

    expect(onNewChat).toHaveBeenCalled();
  });
});
