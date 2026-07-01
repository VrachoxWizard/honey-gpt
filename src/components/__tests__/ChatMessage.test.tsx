import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ChatMessage } from '../ChatMessage';
import type { Message } from '../../types';

vi.mock('../../hooks/useToast', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ChatMessage', () => {
  beforeEach(() => {
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the welcome/assistant message content properly', () => {
    const message: Message = {
      id: 'welcome',
      role: 'assistant',
      content: 'Mir s tobom!',
      timestamp: 1625120400000, // mock timestamp
    };

    render(<ChatMessage message={message} isWelcome={true} />);

    expect(screen.getByText('Mir s tobom!')).toBeInTheDocument();
    expect(screen.getByText('† Haničar GPT †')).toBeInTheDocument();
  });

  it('renders a user message with correct layout and label', () => {
    const message: Message = {
      id: '1',
      role: 'user',
      content: 'Pozdrav Haničaru',
      timestamp: 1625120400000,
    };

    render(<ChatMessage message={message} />);

    expect(screen.getByText('Pozdrav Haničaru')).toBeInTheDocument();
    expect(screen.getAllByText('Ti').length).toBeGreaterThan(0);
  });

  it('renders the timestamp if provided', () => {
    const timestamp = new Date('2026-07-01T15:30:00').getTime();
    const message: Message = {
      id: '2',
      role: 'user',
      content: 'Test timestamp',
      timestamp,
    };

    render(<ChatMessage message={message} />);

    // check if formatted time like '15:30' exists in the document
    expect(screen.getByText('15:30')).toBeInTheDocument();
  });

  it('copies the content when the copy button is clicked', async () => {
    const message: Message = {
      id: '3',
      role: 'user',
      content: 'Tekst za kopiranje',
      timestamp: 1625120400000,
    };

    render(<ChatMessage message={message} />);

    const copyButton = screen.getByTitle('Kopiraj');
    expect(copyButton).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(copyButton);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Tekst za kopiranje');
  });
});
