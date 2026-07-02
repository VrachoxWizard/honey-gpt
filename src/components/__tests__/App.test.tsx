import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../../App';

vi.mock('../hooks/useChat', () => ({
  useChat: () => ({
    sessions: [
      {
        id: 's1',
        title: 'Novi razgovor',
        messages: [
          {
            id: 'welcome',
            role: 'assistant',
            content: 'Mir s tobom, sine moj! Kako ti mogu pomoći danas?',
            timestamp: Date.now(),
          },
        ],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ],
    activeSessionId: 's1',
    messages: [
      {
        id: 'welcome',
        role: 'assistant',
        content: 'Mir s tobom, sine moj! Kako ti mogu pomoći danas?',
        timestamp: Date.now(),
      },
    ],
    toneMode: 'sanctus',
    setToneMode: vi.fn(),
    error: '',
    isSending: false,
    sendMessage: vi.fn(),
    regenerateLastResponse: vi.fn(),
    editAndResend: vi.fn(),
    newChat: vi.fn(),
    switchSession: vi.fn(),
    deleteSession: vi.fn(),
    renameSession: vi.fn(),
    clearAllSessions: vi.fn(),
    abortGeneration: vi.fn(),
    shareSession: vi.fn(),
    summaryWarning: '',
  }),
}));

describe('App', () => {
  it('renders welcome shell', async () => {
    render(<App />);
    expect(await screen.findByRole('heading', { name: /Mir s tobom, sine/i })).toBeInTheDocument();
  });
});
