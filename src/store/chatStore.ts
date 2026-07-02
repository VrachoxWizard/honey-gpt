import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import type { ChatState } from './types';
import { createChatSlice } from './chatSlice';
import { createMessageSlice } from './messageSlice';

export * from './types';
export * from './chatSlice';
export * from './messageSlice';

export const useChatStore = create<ChatState>()(
  devtools(
    persist(
      (...a) => ({
        ...createChatSlice(...a),
        ...createMessageSlice(...a),
      }),
      {
        name: 'hanicar-chat-storage',
        version: 1,
        migrate: (persistedState) => persistedState,
        partialize: (state) => ({
          sessions: state.sessions,
          activeSessionId: state.activeSessionId,
          activeModel: state.activeModel,
          toneMode: state.toneMode,
        }),
        // Migration logic for old version 0 has been removed to keep code cleaner
      }
    )
  )
);
