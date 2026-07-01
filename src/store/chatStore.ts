import { create } from 'zustand';
import type { Message, ChatSession } from '../types';
import type { ToneMode } from '../lib/codex';
import { sendConversation } from '../lib/chatApi';
import {
  welcomeMessage,
  createDefaultSession,
  getInitialSessions,
  getInitialActiveSessionId,
  getInitialModel,
  getInitialToneMode,
  syncToLocalStorage,
  DEFAULT_SESSION_TITLE,
} from './chatStorage';

const initialSessions = getInitialSessions();
const initialActiveSessionId = getInitialActiveSessionId(initialSessions);
const initialModel = getInitialModel();
const initialToneMode = getInitialToneMode();

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string;
  isSending: boolean;
  error: string;
  activeModel: string;
  toneMode: ToneMode;
  
  // Actions
  setActiveModel: (model: string) => void;
  setToneMode: (tone: ToneMode) => void;
  newChat: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  clearAllSessions: () => void;
  clearChat: () => void;
  abortGeneration: () => void;
  sendMessage: (content: string, image?: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  editAndResend: (messageId: string, newContent: string) => Promise<void>;
  reloadFromLocalStorage: () => void;
}

let abortController: AbortController | null = null;

export const useChatStore = create<ChatState>((set, get) => {
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

    set({ sessions: updatedSessions });
    syncToLocalStorage({ sessions: updatedSessions });
  };

  const getActiveSession = () => {
    const { sessions, activeSessionId } = get();
    return sessions.find((s) => s.id === activeSessionId) ?? sessions[0];
  };

  const abortGeneration = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      set({ isSending: false });
    }
  };

  const executeSend = async (nextMessages: Message[]) => {
    abortGeneration();
    const newController = new AbortController();
    abortController = newController;

    updateActiveSessionMessages(() => nextMessages);
    set({ error: '', isSending: true });

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
          set({ activeModel: model });
          syncToLocalStorage({ activeModel: model });
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
        });
        updateActiveSessionMessages((currentMessages) =>
          currentMessages.filter((msg) => msg.id !== assistantMessageId)
        );
      }
    } finally {
      if (abortController === newController) {
        set({ isSending: false });
        abortController = null;
      }
    }
  };

  return {
    sessions: initialSessions,
    activeSessionId: initialActiveSessionId,
    isSending: false,
    error: '',
    activeModel: initialModel,
    toneMode: initialToneMode,

    setActiveModel: (model) => {
      set({ activeModel: model });
      syncToLocalStorage({ activeModel: model });
    },

    setToneMode: (tone) => {
      set({ toneMode: tone });
      syncToLocalStorage({ toneMode: tone });
    },

    newChat: () => {
      abortGeneration();
      const session = createDefaultSession();
      set((state) => {
        const updatedSessions = [session, ...state.sessions];
        syncToLocalStorage({
          sessions: updatedSessions,
          activeSessionId: session.id,
        });
        return {
          sessions: updatedSessions,
          activeSessionId: session.id,
          error: '',
        };
      });
    },

    switchSession: (id) => {
      abortGeneration();
      set({ activeSessionId: id, error: '' });
      syncToLocalStorage({ activeSessionId: id });
    },

    deleteSession: (id) => {
      abortGeneration();
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

        syncToLocalStorage({
          sessions: updatedSessions,
          activeSessionId: nextActiveId,
        });
        return {
          sessions: updatedSessions,
          activeSessionId: nextActiveId,
        };
      });
    },

    renameSession: (id, newTitle) => {
      set((state) => {
        const updatedSessions = state.sessions.map((s) =>
          s.id === id ? { ...s, title: newTitle } : s
        );
        syncToLocalStorage({ sessions: updatedSessions });
        return { sessions: updatedSessions };
      });
    },

    clearAllSessions: () => {
      abortGeneration();
      const session = createDefaultSession();
      set({
        sessions: [session],
        activeSessionId: session.id,
        error: '',
      });
      syncToLocalStorage({
        sessions: [session],
        activeSessionId: session.id,
      });
    },

    clearChat: () => {
      abortGeneration();
      updateActiveSessionMessages(() => [{ ...welcomeMessage, timestamp: Date.now() }]);
      set((state) => {
        const updatedSessions = state.sessions.map((s) =>
          s.id === state.activeSessionId ? { ...s, title: DEFAULT_SESSION_TITLE } : s
        );
        syncToLocalStorage({ sessions: updatedSessions });
        return { sessions: updatedSessions, error: '' };
      });
    },

    abortGeneration,

    sendMessage: async (content: string, image?: string) => {
      if (!content.trim() && !image) return;
      const activeSession = getActiveSession();
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
      const { messages } = activeSession;
      
      const index = messages.findIndex((m) => m.id === messageId);
      if (index === -1) return;

      const newMessages = messages.slice(0, index + 1);
      newMessages[index] = { ...newMessages[index], content: newContent };
      
      await executeSend(newMessages);
    },

    reloadFromLocalStorage: () => {
      const sessions = getInitialSessions();
      const activeSessionId = getInitialActiveSessionId(sessions);
      set({
        sessions,
        activeSessionId,
        activeModel: getInitialModel(),
        toneMode: getInitialToneMode(),
      });
    },
  };
});
