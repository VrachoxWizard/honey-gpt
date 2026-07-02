import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from './chatStore';

describe('chatSlice export/import', () => {
  beforeEach(() => {
    useChatStore.setState({
      sessions: [],
      activeSessionId: '',
      isSending: false,
      error: '',
      lastRequestId: '',
    });
  });

  it('exports and imports a session as JSON v2', () => {
    useChatStore.getState().newChat();
    const sessionId = useChatStore.getState().activeSessionId;

    useChatStore.setState((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === sessionId
          ? {
              ...session,
              messages: [
                ...session.messages,
                { id: 'm1', role: 'user' as const, content: 'Pozdrav', timestamp: Date.now() },
              ],
            }
          : session
      ),
    }));

    const exported = useChatStore.getState().exportSession(sessionId);
    expect(exported).toContain('"version": 2');

    const importedId = useChatStore.getState().importSession(exported!);
    expect(importedId).toBeTruthy();

    const imported = useChatStore.getState().sessions.find((session) => session.id === importedId);
    expect(imported?.messages.some((message) => message.content === 'Pozdrav')).toBe(true);
  });
});
