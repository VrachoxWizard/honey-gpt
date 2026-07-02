import { describe, it, expect } from 'vitest';
import {
  selectActiveModel,
  selectActiveSession,
  selectActiveSessionId,
  selectError,
  selectIsSending,
  selectMessages,
  selectSessions,
  selectSummaryWarning,
  selectToneMode,
} from './selectors';
import { welcomeMessage } from './chatSlice';
import type { ChatState } from './types';

function createState(overrides: Partial<ChatState> = {}): ChatState {
  return {
    sessions: [],
    activeSessionId: '',
    activeModel: 'google/gemini-2.5-flash',
    toneMode: 'sanctus',
    autoSpeak: false,
    isSending: false,
    error: '',
    lastRequestId: '',
    summaryWarning: '',
    clearChat: () => {},
    newChat: () => {},
    switchSession: () => {},
    deleteSession: () => {},
    renameSession: () => {},
    clearAllSessions: () => {},
    setActiveModel: () => {},
    setToneMode: () => {},
    setAutoSpeak: () => {},
    sendMessage: async () => {},
    regenerateLastResponse: async () => {},
    editAndResend: async () => {},
    abortGeneration: () => {},
    exportSession: () => null,
    importSession: () => null,
    shareSession: () => '',
    ...overrides,
  };
}

describe('selectors', () => {
  it('returns welcome messages when no active session exists', () => {
    const state = createState({ sessions: [], activeSessionId: 'missing' });
    expect(selectMessages(state)).toEqual([welcomeMessage]);
  });

  it('returns active session messages', () => {
    const session = {
      id: 's1',
      title: 'Test',
      messages: [{ id: 'm1', role: 'user' as const, content: 'Bok', timestamp: 1 }],
      createdAt: 1,
      updatedAt: 1,
    };
    const state = createState({ sessions: [session], activeSessionId: 's1' });
    expect(selectMessages(state)).toEqual(session.messages);
  });

  it('selects scalar state fields', () => {
    const state = createState({
      isSending: true,
      error: 'Greška',
      summaryWarning: 'Upozorenje',
      activeModel: 'model-x',
      toneMode: 'humilis',
    });

    expect(selectSessions(state)).toEqual([]);
    expect(selectActiveSessionId(state)).toBe('');
    expect(selectActiveSession(state)).toBeUndefined();
    expect(selectIsSending(state)).toBe(true);
    expect(selectError(state)).toBe('Greška');
    expect(selectSummaryWarning(state)).toBe('Upozorenje');
    expect(selectActiveModel(state)).toBe('model-x');
    expect(selectToneMode(state)).toBe('humilis');
  });
});
