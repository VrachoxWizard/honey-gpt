import { create } from 'zustand';
import { persist, devtools, createJSONStorage } from 'zustand/middleware';
import type { ChatState } from './types';
import type { ChatSession } from '@shared/types';
import { createChatSlice, createDefaultSession } from './chatSlice';
import { createMessageSlice } from './messageSlice';
import { indexedDBStorage } from './indexedDBStorage';

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
        storage: createJSONStorage(() => indexedDBStorage),
        version: 3,
        migrate: (persistedState, version) => {
          const state = persistedState as PersistedChatState;
          let migrated = state;

          if (version < 2) {
            migrated = {
              ...migrated,
              sessions: (migrated.sessions ?? []).map((session: ChatSession) => {
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { persona: _persona, ...rest } = session as ChatSession & {
                  persona?: unknown;
                };
                return rest;
              }),
            };
          }

          if (!migrated.sessions?.length) {
            const session = createDefaultSession();
            migrated = {
              ...migrated,
              sessions: [session],
              activeSessionId: session.id,
            };
          }

          return migrated;
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
