import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { ChatState } from './types';
import type { ChatSession } from '@shared/types';
import { createChatSlice } from './chatSlice';
import { createMessageSlice } from './messageSlice';

export * from './types';
export * from './chatSlice';
export * from './messageSlice';

type PersistedChatState = Pick<
  ChatState,
  'sessions' | 'activeSessionId' | 'activeModel' | 'toneMode'
>;

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (...a) => ({
        ...createChatSlice(...a),
        ...createMessageSlice(...a),
      }),
      {
        name: 'hanicar-chat-storage',
        version: 2,
        migrate: (persistedState, version) => {
          const state = persistedState as PersistedChatState;
          if (version < 2) {
            return {
              ...state,
              sessions: (state.sessions ?? []).map((session: ChatSession) => {
                const { persona: _persona, ...rest } = session as ChatSession & {
                  persona?: unknown;
                };
                return rest;
              }),
            };
          }
          return state;
        },
        partialize: (state) => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId,
          activeModel: state.activeModel,
          toneMode: state.toneMode,
        }),
      }
    )
  )
);
