import { StateCreator } from 'zustand';
import type { Message } from '@shared/types';
import { sendConversation } from '@lib/chatApi';
import { formatChatError } from '@lib/errors';
import type { ChatState, MessageSlice } from './types';
import { DEFAULT_SESSION_TITLE, welcomeMessage } from './chatSlice';

let abortController: AbortController | null = null;

export const createMessageSlice: StateCreator<
  ChatState,
  [['zustand/devtools', never], ['zustand/persist', unknown]],
  [],
  MessageSlice
> = (set, get) => {
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
              firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
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
    set(
      { error: '', isSending: true, lastRequestId: '', summaryWarning: '' },
      false,
      'executeSendStart'
    );

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
        onRequestId: (requestId) => {
          set({ lastRequestId: requestId }, false, 'setLastRequestId');
        },
        onSummaryFailed: () => {
          set(
            { summaryWarning: 'Dugačak razgovor nije u potpunosti sažet, ali odgovor stiže.' },
            false,
            'summaryFailed'
          );
        },
      });
    } catch (requestError: unknown) {
      if (requestError instanceof Error && requestError.name === 'AbortError') {
        // Aborted, this is fine
      } else {
        set(
          {
            error: formatChatError(
              requestError instanceof Error
                ? requestError.message
                : 'Nešto se zapetljalo. Haničar trese lampu, ali ništa.',
              get().lastRequestId || undefined
            ),
          },
          false,
          'executeSendError'
        );
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
    lastRequestId: '',
    summaryWarning: '',

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
