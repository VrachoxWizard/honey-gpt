import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChat, welcomeMessage } from '../useChat';
import type { ChatSession } from '../../types';

describe('useChat', () => {
  let store: Record<string, string> = {};

  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      clear: () => {
        store = {};
      },
    });
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with welcome message if localStorage is empty', () => {
    const { result } = renderHook(() => useChat());
    expect(result.current.messages[0].id).toBe(welcomeMessage.id);
    expect(result.current.messages[0].role).toBe(welcomeMessage.role);
    expect(result.current.messages[0].content).toBe(welcomeMessage.content);
  });

  it('should load sessions from localStorage if available', () => {
    const mockSessionId = 'test-session-1';
    const mockSessions: ChatSession[] = [
      {
        id: mockSessionId,
        title: 'Moj test razgovor',
        createdAt: Date.now(),
        messages: [
          { id: 'welcome', role: 'assistant', content: 'Test welcome', timestamp: 123 },
          { id: '1', role: 'user', content: 'Pozdrav', timestamp: 124 }
        ]
      }
    ];
    localStorage.setItem('hanicar_gpt_sessions_v2', JSON.stringify(mockSessions));
    localStorage.setItem('hanicar_gpt_active_session_id_v2', mockSessionId);

    const { result } = renderHook(() => useChat());
    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.activeSessionId).toBe(mockSessionId);
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[1].content).toBe('Pozdrav');
  });

  it('should create a new session on newChat()', () => {
    const { result } = renderHook(() => useChat());
    const initialId = result.current.activeSessionId;

    act(() => {
      result.current.newChat();
    });

    expect(result.current.sessions).toHaveLength(2);
    expect(result.current.activeSessionId).not.toBe(initialId);
  });

  it('should switch sessions', () => {
    const { result } = renderHook(() => useChat());
    
    act(() => {
      result.current.newChat();
    });
    
    const secondSessionId = result.current.activeSessionId;
    
    act(() => {
      result.current.newChat();
    });
    
    const thirdSessionId = result.current.activeSessionId;
    expect(result.current.sessions).toHaveLength(3);

    act(() => {
      result.current.switchSession(secondSessionId);
    });

    expect(result.current.activeSessionId).toBe(secondSessionId);
  });

  it('should delete a session and fallback to another session', () => {
    const { result } = renderHook(() => useChat());
    const firstSessionId = result.current.activeSessionId;

    act(() => {
      result.current.newChat();
    });
    const secondSessionId = result.current.activeSessionId;

    expect(result.current.sessions).toHaveLength(2);

    act(() => {
      result.current.deleteSession(secondSessionId);
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.activeSessionId).toBe(firstSessionId);
  });
});
