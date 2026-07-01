import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useChat, welcomeMessage } from '../useChat';
import { useChatStore } from '../../store/chatStore';
import type { ChatSession } from '@shared/types';

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
    
    // We need to re-import it so the session ID is fresh? Just call it
    const defaultSession = {
      id: 'test-session-1',
      title: 'Novi razgovor',
      createdAt: Date.now(),
      messages: [{ id: 'welcome', role: 'assistant', content: welcomeMessage.content, timestamp: Date.now() }],
    };

    useChatStore.setState({
      sessions: [defaultSession as any],
      activeSessionId: 'test-session-1',
      activeModel: 'google/gemini-2.5-flash',
      toneMode: 'sanctus',
      isSending: false,
      error: ''
    });
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

  it('should rename a session', () => {
    const { result } = renderHook(() => useChat());
    const sessionId = result.current.activeSessionId;

    act(() => {
      result.current.renameSession(sessionId, 'Novi Naslov');
    });

    const session = result.current.sessions.find((s) => s.id === sessionId);
    expect(session?.title).toBe('Novi Naslov');
  });

  it('should clear all sessions and re-initialize with one new session', () => {
    const { result } = renderHook(() => useChat());
    act(() => {
      result.current.newChat();
    });
    expect(result.current.sessions).toHaveLength(2);

    act(() => {
      result.current.clearAllSessions();
    });

    expect(result.current.sessions).toHaveLength(1);
    expect(result.current.sessions[0].title).toBe('Novi razgovor');
  });
});
