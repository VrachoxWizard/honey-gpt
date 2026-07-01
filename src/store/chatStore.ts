import { create } from 'zustand';
import type { Message, ChatSession } from '../types';
import { parseSSEChunks } from '../../server/sse-parser';

export const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Mir s tobom, sine moj! Dobro došao u Haničar GPT, prvi hrvatski satirični AI chatbot. Ja sam Haničar the Genie: digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i malo satire.',
  timestamp: Date.now(),
};

function getChatEndpoints() {
  const configuredEndpoint = import.meta.env.VITE_CHAT_ENDPOINT;
  return configuredEndpoint ? [configuredEndpoint] : ['/api/chat'];
}

const getInitialSessions = (): ChatSession[] => {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') {
    return [
      {
        id: crypto.randomUUID(),
        title: 'Novi razgovor',
        messages: [welcomeMessage],
        createdAt: Date.now(),
      },
    ];
  }
  const saved = localStorage.getItem('hanicar_gpt_sessions_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Failed to parse chat sessions', e);
    }
  }
  const initialSession: ChatSession = {
    id: crypto.randomUUID(),
    title: 'Novi razgovor',
    messages: [welcomeMessage],
    createdAt: Date.now(),
  };
  return [initialSession];
};

const initialSessions = getInitialSessions();
const initialActiveSessionId = (() => {
  if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return initialSessions[0]?.id || '';
  const saved = localStorage.getItem('hanicar_gpt_active_session_id_v2');
  if (saved && saved !== 'undefined') return saved;
  return initialSessions[0]?.id || '';
})();

const initialModel = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' ? localStorage.getItem('hanicar_gpt_active_model') || 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash';
const initialToneMode = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' ? (localStorage.getItem('hanicar_gpt_tone_mode') as any) || 'sanctus' : 'sanctus';

export interface ChatState {
  sessions: ChatSession[];
  activeSessionId: string;
  isSending: boolean;
  error: string;
  activeModel: string;
  toneMode: 'humilis' | 'clericus' | 'sanctus';
  
  // Actions
  setActiveModel: (model: string) => void;
  setToneMode: (tone: 'humilis' | 'clericus' | 'sanctus') => void;
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

const syncToLocalStorage = (state: Partial<ChatState>) => {
  if (typeof localStorage === 'undefined' || typeof localStorage.setItem !== 'function') return;
  if (state.sessions !== undefined) {
    localStorage.setItem('hanicar_gpt_sessions_v2', JSON.stringify(state.sessions));
  }
  if (state.activeSessionId !== undefined) {
    localStorage.setItem('hanicar_gpt_active_session_id_v2', state.activeSessionId);
  }
  if (state.activeModel !== undefined) {
    localStorage.setItem('hanicar_gpt_active_model', state.activeModel);
  }
  if (state.toneMode !== undefined) {
    localStorage.setItem('hanicar_gpt_tone_mode', state.toneMode);
  }
};

export const useChatStore = create<ChatState>((set, get) => {
  const updateActiveSessionMessages = (updater: (curr: Message[]) => Message[]) => {
    const { sessions, activeSessionId } = get();
    const updatedSessions = sessions.map((s) => {
      if (s.id === activeSessionId) {
        const nextMsgs = updater(s.messages);
        let nextTitle = s.title;

        if (s.title === 'Novi razgovor') {
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

  const abortGeneration = () => {
    if (abortController) {
      abortController.abort();
      abortController = null;
      set({ isSending: false });
    }
  };

  const sendConversation = async (nextMessages: Message[]) => {
    abortGeneration();
    const newController = new AbortController();
    abortController = newController;

    updateActiveSessionMessages(() => nextMessages);
    set({ error: '', isSending: true });

    const assistantMessageId = crypto.randomUUID();
    updateActiveSessionMessages(() => [
      ...nextMessages,
      { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    const conversation = nextMessages
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
      const endpoints = getChatEndpoints();
      let lastError: Error | null = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          const { activeModel, toneMode } = get();
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: conversation,
              model: activeModel,
              toneMode,
            }),
            signal: newController.signal,
          });

          if (response.status === 404 && endpoints.length > 1) continue;

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Server nije prihvatio zahtjev.');
          }

          const contentType = response.headers.get('Content-Type') || '';

          if (contentType.includes('text/event-stream')) {
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Streaming body is empty.');
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let assistantText = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              buffer = parseSSEChunks(buffer, (data) => {
                if (data.error) throw new Error(data.error);
                if (data.token || data.model) {
                  if (data.token) assistantText += data.token;
                  if (data.model) {
                    set({ activeModel: data.model });
                    syncToLocalStorage({ activeModel: data.model });
                  }
                  updateActiveSessionMessages((currentMessages) =>
                    currentMessages.map((msg) =>
                      msg.id === assistantMessageId ? { ...msg, content: assistantText } : msg
                    )
                  );
                }
              });
            }
            success = true;
            break;
          } else {
            const payload = await response.json();
            if (!payload.text) throw new Error('Odgovor nema tekst.');
            if (payload.model) {
              set({ activeModel: payload.model });
              syncToLocalStorage({ activeModel: payload.model });
            }
            updateActiveSessionMessages((currentMessages) =>
              currentMessages.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: payload.text } : msg
              )
            );
            success = true;
            break;
          }
        } catch (requestError: any) {
          if (requestError.name === 'AbortError') {
            success = true; // Not an error
            break;
          }
          lastError = requestError instanceof Error ? requestError : new Error('Mrežna greška.');
        }
      }

      if (!success && lastError) throw lastError;
      if (!success) throw new Error('Chat endpoint nije dostupan.');
    } catch (requestError: any) {
      if (requestError.name !== 'AbortError') {
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
      const newSession: ChatSession = {
        id: crypto.randomUUID(),
        title: 'Novi razgovor',
        messages: [{ ...welcomeMessage, timestamp: Date.now() }],
        createdAt: Date.now(),
      };
      const updatedSessions = [newSession, ...get().sessions];
      set({ sessions: updatedSessions, activeSessionId: newSession.id, error: '' });
      syncToLocalStorage({ sessions: updatedSessions, activeSessionId: newSession.id });
    },

    switchSession: (id) => {
      abortGeneration();
      set({ activeSessionId: id, error: '' });
      syncToLocalStorage({ activeSessionId: id });
    },

    deleteSession: (id) => {
      abortGeneration();
      const { sessions, activeSessionId } = get();
      const nextSessions = sessions.filter((s) => s.id !== id);

      if (nextSessions.length === 0) {
        const initial: ChatSession = {
          id: crypto.randomUUID(),
          title: 'Novi razgovor',
          messages: [{ ...welcomeMessage, timestamp: Date.now() }],
          createdAt: Date.now(),
        };
        set({ sessions: [initial], activeSessionId: initial.id, error: '' });
        syncToLocalStorage({ sessions: [initial], activeSessionId: initial.id });
        return;
      }

      const nextActiveId = activeSessionId === id ? nextSessions[0].id : activeSessionId;
      set({ sessions: nextSessions, activeSessionId: nextActiveId, error: '' });
      syncToLocalStorage({ sessions: nextSessions, activeSessionId: nextActiveId });
    },

    renameSession: (id, newTitle) => {
      const updatedSessions = get().sessions.map((s) =>
        s.id === id ? { ...s, title: newTitle } : s
      );
      set({ sessions: updatedSessions });
      syncToLocalStorage({ sessions: updatedSessions });
    },

    clearAllSessions: () => {
      abortGeneration();
      const initialSession: ChatSession = {
        id: crypto.randomUUID(),
        title: 'Novi razgovor',
        messages: [{ ...welcomeMessage, timestamp: Date.now() }],
        createdAt: Date.now(),
      };
      set({ sessions: [initialSession], activeSessionId: initialSession.id, error: '' });
      syncToLocalStorage({ sessions: [initialSession], activeSessionId: initialSession.id });
    },

    clearChat: () => {
      abortGeneration();
      set({ error: '' });
      updateActiveSessionMessages(() => [{ ...welcomeMessage, timestamp: Date.now() }]);
    },

    abortGeneration,

    sendMessage: async (content, image) => {
      const { isSending, sessions, activeSessionId } = get();
      if ((!content.trim() && !image) || isSending) return;

      const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
      const currentMessages = activeSession ? activeSession.messages : [welcomeMessage];

      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content,
        timestamp: Date.now(),
        image,
      };

      await sendConversation([...currentMessages, userMessage]);
    },

    regenerateLastResponse: async () => {
      const { isSending, sessions, activeSessionId } = get();
      if (isSending) return;

      const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
      const currentMessages = activeSession ? activeSession.messages : [welcomeMessage];

      const lastUserIndex = [...currentMessages].reverse().findIndex((m) => m.role === 'user');
      if (lastUserIndex === -1) return;

      const realIndex = currentMessages.length - 1 - lastUserIndex;
      const pruned = currentMessages.slice(0, realIndex + 1);
      await sendConversation(pruned);
    },

    editAndResend: async (messageId, newContent) => {
      const { isSending, sessions, activeSessionId } = get();
      if (isSending) return;

      const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
      const currentMessages = activeSession ? activeSession.messages : [welcomeMessage];

      const msgIndex = currentMessages.findIndex((m) => m.id === messageId);
      if (msgIndex === -1) return;

      const updatedUserMessage = {
        ...currentMessages[msgIndex],
        content: newContent,
        timestamp: Date.now(),
      };

      const pruned = [...currentMessages.slice(0, msgIndex), updatedUserMessage];
      await sendConversation(pruned);
    },

    reloadFromLocalStorage: () => {
      const sessions = getInitialSessions();
      const activeSessionId = (() => {
        if (typeof localStorage === 'undefined' || typeof localStorage.getItem !== 'function') return sessions[0]?.id || '';
        const saved = localStorage.getItem('hanicar_gpt_active_session_id_v2');
        if (saved && saved !== 'undefined') return saved;
        return sessions[0]?.id || '';
      })();
      const activeModel = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' ? localStorage.getItem('hanicar_gpt_active_model') || 'google/gemini-2.5-flash' : 'google/gemini-2.5-flash';
      const toneMode = typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function' ? (localStorage.getItem('hanicar_gpt_tone_mode') as any) || 'sanctus' : 'sanctus';

      set({
        sessions,
        activeSessionId,
        activeModel,
        toneMode,
        error: '',
        isSending: false,
      });
    },
  };
});
