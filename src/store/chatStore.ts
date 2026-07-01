import { create, StateCreator } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { Message, ChatSession } from '@shared/types';
import type { ToneMode } from '@lib/codex';
import { sendConversation } from '@lib/chatApi';

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

export interface ChatSlice {
  sessions: ChatSession[];
  activeSessionId: string;
  activeModel: string;
  toneMode: ToneMode;
  setActiveModel: (model: string) => void;
  setToneMode: (tone: ToneMode) => void;
  newChat: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  clearAllSessions: () => void;
  clearChat: () => void;
}

export interface MessageSlice {
  isSending: boolean;
  error: string;
  abortGeneration: () => void;
  sendMessage: (content: string, image?: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  editAndResend: (messageId: string, newContent: string) => Promise<void>;
}

export type ChatState = ChatSlice & MessageSlice;

let abortController: AbortController | null = null;

const createChatSlice: StateCreator<ChatState, [["zustand/devtools", never], ["zustand/persist", unknown]], [], ChatSlice> = (set, get) => ({
  sessions: [],
  activeSessionId: '',
  activeModel: 'google/gemini-2.5-flash',
  toneMode: 'sanctus',

  setActiveModel: (model) => set({ activeModel: model }, false, 'setActiveModel'),
  setToneMode: (tone) => set({ toneMode: tone }, false, 'setToneMode'),
  
  newChat: () => {
    get().abortGeneration();
    const session = createDefaultSession();
    set((state) => ({
      sessions: [session, ...state.sessions],
      activeSessionId: session.id,
      error: '',
    }), false, 'newChat');
  },

  switchSession: (id) => {
    get().abortGeneration();
    set({ activeSessionId: id, error: '' }, false, 'switchSession');
  },

  deleteSession: (id) => {
    get().abortGeneration();
    set((state) => {
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
    }, false, 'deleteSession');
  },

  renameSession: (id, newTitle) => {
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === id ? { ...s, title: newTitle } : s
      )
    }), false, 'renameSession');
  },

  clearAllSessions: () => {
    get().abortGeneration();
    const session = createDefaultSession();
    set({
      sessions: [session],
      activeSessionId: session.id,
      error: '',
    }, false, 'clearAllSessions');
  },

  clearChat: () => {
    get().abortGeneration();
    set((state) => {
      const updatedSessions = state.sessions.map((s) =>
        s.id === state.activeSessionId ? { ...s, title: DEFAULT_SESSION_TITLE, messages: [{ ...welcomeMessage, timestamp: Date.now() }] } : s
      );
      return { sessions: updatedSessions, error: '' };
    }, false, 'clearChat');
  },
});

const createMessageSlice: StateCreator<ChatState, [["zustand/devtools", never], ["zustand/persist", unknown]], [], MessageSlice> = (set, get) => {
  const updateActiveSessionMessages = (updater: (curr: Message[]) => Message[]) => {
    const { sessions, activeSessionId } = get();
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        const nextMsgs = updater(s.messages);
        let nextTitle = s.title;

        if (s.title === DEFAULT_SESSION_TITLE) {
          const firstUserMsg = nextMsgs.find((m) => m.role === 'user');
          if (firstUserMsg) {
            nextTitle =
              firstUserMsg.content.slice(0, 30) +
              (firstUserMsg.content.length > 30 ? '...' : '');
          }
        }
        return { ...s, messages: nextMsgs, title: nextTitle };
      }
      return s;
    });

    set({ sessions: updatedSessions }, false, 'updateMessages');
  };

  const getActiveSession = () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId) ?? sessions[0];
  };

  const abortGeneration = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      set({ isSending: false }, false, 'abortGeneration');
    }
  };

  const executeSend = async (nextMessages: Message[]) => {
    abortGeneration();
    const newController = new AbortController();
    abortController = newController;

    updateActiveSessionMessages(() => nextMessages);
    set({ error: '', isSending: true }, false, 'executeSendStart');

    const assistantMessageId = crypto.randomUUID();
    updateActiveSessionMessages((msgs) => [
      ...msgs,
      { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    const apiMessages = nextMessages
      .filter((m) => m.id !== 'welcome' || m.content !== welcomeMessage.content)
      .map(({ role, content, image }) => {
        if (image) {
          return {
            role,
            content: [
              { type: 'text', text: content },
              { type: 'image_url', image_url: { url: image } },
            ],
          };
        }
        return { role, content };
      });

    try {
      const { activeModel, toneMode } = get();
      
      await sendConversation({
        messages: apiMessages,
        model: activeModel,
        toneMode,
        signal: newController.signal,
        onToken: (token) => {
          updateActiveSessionMessages((currentMessages) =>
            currentMessages.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, content: msg.content + token } : msg
            )
          );
        },
        onModel: (model) => {
          set({ activeModel: model }, false, 'updateActiveModel');
        },
      });

    } catch (requestError: unknown) {
      if (requestError instanceof Error && requestError.name === 'AbortError') {
        // Aborted, this is fine
      } else {
        set({
          error:
            requestError instanceof Error
              ? requestError.message
              : 'Nešto se zapetljalo. Haničar trese lampu, ali ništa.',
        }, false, 'executeSendError');
        updateActiveSessionMessages((currentMessages) =>
          currentMessages.filter((msg) => msg.id !== assistantMessageId)
        );
      }
    } finally {
      if (abortController === newController) {
        set({ isSending: false }, false, 'executeSendEnd');
        abortController = null;
      }
    }
  };

  return {
    isSending: false,
    error: '',

    abortGeneration,

    sendMessage: async (content: string, image?: string) => {
      if (!content.trim() && !image) return;
      const activeSession = getActiveSession();
      if (!activeSession) return;
      
      const nextMessages: Message[] = [
        ...activeSession.messages,
        {
          id: crypto.randomUUID(),
          role: 'user',
          content,
          image,
          timestamp: Date.now(),
        },
      ];
      await executeSend(nextMessages);
    },

    regenerateLastResponse: async () => {
      const activeSession = getActiveSession();
      if (!activeSession) return;
      const { messages } = activeSession;
      if (messages.length < 2) return;

      const newMessages = [...messages];
      if (newMessages[newMessages.length - 1].role === 'assistant') {
        newMessages.pop();
      }

      await executeSend(newMessages);
    },

    editAndResend: async (messageId: string, newContent: string) => {
      if (!newContent.trim()) return;
      const activeSession = getActiveSession();
      if (!activeSession) return;
      const { messages } = activeSession;
      
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const newMessages = messages.slice(0, index + 1);
      newMessages[index] = { ...newMessages[index], content: newContent };
      
      await executeSend(newMessages);
    },
  };
};

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (...a) => ({
        ...createChatSlice(...a),
        ...createMessageSlice(...a),
      }),
      {
        name: 'hanicar-chat-storage',
        partialize: (state) => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId,
          activeModel: state.activeModel,
          toneMode: state.toneMode,
        }),
        migrate: (persistedState: any, version: number) => {
          if (version === 0) {
            // Attempt to migrate from legacy local storage keys
            try {
              const legacySessionsStr = localStorage.getItem('hanicar_gpt_sessions_v2');
              const legacyActiveIdStr = localStorage.getItem('hanicar_gpt_active_session_id_v2');
              const legacyModelStr = localStorage.getItem('hanicar_gpt_active_model');
              const legacyToneStr = localStorage.getItem('hanicar_gpt_tone_mode');

              if (legacySessionsStr && !persistedState?.sessions) {
                const legacySessions = JSON.parse(legacySessionsStr);
                persistedState = {
                  ...persistedState,
                  sessions: legacySessions,
                  activeSessionId: legacyActiveIdStr || legacySessions[0]?.id,
                  activeModel: legacyModelStr || 'google/gemini-2.5-flash',
                  toneMode: legacyToneStr || 'sanctus'
                };
              }
            } catch (e) {
              console.error('Migration failed', e);
            }
          }
          return persistedState;
        }
      }
    )
  )
);
