import { StateCreator } from 'zustand';
import type { Message, ChatSession } from '@shared/types';
import type { ChatState, ChatSlice } from './types';

export const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Mir s tobom, sine moj! Dobro došao u Haničar GPT, prvi hrvatski satirični AI chatbot. Ja sam Haničar the Genie: digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i malo satire.',
  timestamp: Date.now(),
};

export const DEFAULT_SESSION_TITLE = 'Novi razgovor';

export function createDefaultSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: DEFAULT_SESSION_TITLE,
    messages: [{ ...welcomeMessage, timestamp: Date.now() }],
    createdAt: Date.now(),
  };
}

export const createChatSlice: StateCreator<
  ChatState,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  ChatSlice
> = (set, get) => ({
  sessions: [],
  activeSessionId: '',
  activeModel: 'google/gemini-2.5-flash',
  toneMode: 'sanctus',

  setActiveModel: (model) => set({ activeModel: model }, false, 'setActiveModel'),
  setToneMode: (tone) => set({ toneMode: tone }, false, 'setToneMode'),

  newChat: () => {
    get().abortGeneration();
    const session = createDefaultSession();
    set(
      (state) => ({
        sessions: [session, ...state.sessions],
        activeSessionId: session.id,
        error: '',
      }),
      false,
      'newChat'
    );
  },

  switchSession: (id) => {
    get().abortGeneration();
    set({ activeSessionId: id, error: '' }, false, 'switchSession');
  },

  deleteSession: (id) => {
    get().abortGeneration();
    set(
      (state) => {
        const updatedSessions = state.sessions.filter((s) => s.id !== id);
        let nextActiveId = state.activeSessionId;

        if (updatedSessions.length === 0) {
          const defaultSession = createDefaultSession();
          updatedSessions.push(defaultSession);
          nextActiveId = defaultSession.id;
        } else if (id === state.activeSessionId) {
          nextActiveId = updatedSessions[0].id;
        }

        return {
          sessions: updatedSessions,
          activeSessionId: nextActiveId,
        };
      },
      false,
      'deleteSession'
    );
  },

  renameSession: (id, newTitle) => {
    set(
      (state) => ({
        sessions: state.sessions.map((s) => (s.id === id ? { ...s, title: newTitle } : s)),
      }),
      false,
      'renameSession'
    );
  },

  clearAllSessions: () => {
    get().abortGeneration();
    const session = createDefaultSession();
    set(
      {
        sessions: [session],
        activeSessionId: session.id,
        error: '',
      },
      false,
      'clearAllSessions'
    );
  },

  clearChat: () => {
    get().abortGeneration();
    set(
      (state) => {
        const updatedSessions = state.sessions.map((s) =>
          s.id === state.activeSessionId
            ? {
                ...s,
                title: DEFAULT_SESSION_TITLE,
                messages: [{ ...welcomeMessage, timestamp: Date.now() }],
              }
            : s
        );
        return { sessions: updatedSessions, error: '' };
      },
      false,
      'clearChat'
    );
  },
});
