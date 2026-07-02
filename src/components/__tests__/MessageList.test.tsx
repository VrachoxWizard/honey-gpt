import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReactNode } from 'react';
import { MessageList } from '../MessageList';
import type { Message } from '@shared/types';

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('../ChatMessage', () => ({
  ChatMessage: ({ message }: { message: Message }) => (
    <div data-testid={`message-${message.id}`}>{message.content}</div>
  ),
}));

function createMessages(count: number): Message[] {
  return Array.from({ length: count }, (_, index) => ({
    id: `msg-${index}`,
    role: index % 2 === 0 ? 'user' : 'assistant',
    content: `Poruka ${index}`,
    timestamp: Date.now() + index,
  })) as Message[];
}

describe('MessageList', () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      disconnect() {}
    }
    vi.stubGlobal('ResizeObserver', ResizeObserverMock);
  });

  it('renders all messages when below virtualization threshold', () => {
    const messages = createMessages(5);
    render(
      <MessageList messages={messages} onRegenerate={vi.fn()} onEdit={vi.fn()} />
    );

    expect(screen.getByTestId('message-msg-0')).toBeInTheDocument();
    expect(screen.getByTestId('message-msg-4')).toBeInTheDocument();
  });

  it('virtualizes long conversations with spacer elements', () => {
    const messages = createMessages(35);
    const { container } = render(
      <MessageList messages={messages} onRegenerate={vi.fn()} onEdit={vi.fn()} />
    );

    const spacers = container.querySelectorAll('[aria-hidden]');
    expect(spacers.length).toBeGreaterThan(0);
    expect(screen.queryAllByTestId(/message-msg-/).length).toBeLessThan(35);
  });
});
