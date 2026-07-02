import { describe, it, expect } from 'vitest';
import { migrateChatPersistedState } from './chatStore';
import { createDefaultSession } from './chatSlice';
import type { ChatState } from './types';

type PersistedChatState = Pick<
  ChatState,
  'sessions' | 'activeSessionId' | 'activeModel' | 'toneMode' | 'autoSpeak'
>;

describe('chatStore migration', () => {
  it('adds default autoSpeak for version < 3', () => {
    const session = createDefaultSession();
    const migrated = migrateChatPersistedState(
      {
        sessions: [session],
        activeSessionId: session.id,
        activeModel: 'google/gemini-2.5-flash',
        toneMode: 'sanctus',
      } as PersistedChatState,
      2
    );

    expect(migrated.autoSpeak).toBe(false);
  });

  it('creates default session when storage is empty', () => {
    const migrated = migrateChatPersistedState(
      {
        sessions: [],
        activeSessionId: '',
        activeModel: 'google/gemini-2.5-flash',
        toneMode: 'sanctus',
        autoSpeak: false,
      },
      3
    );

    expect(migrated.sessions).toHaveLength(1);
    expect(migrated.activeSessionId).toBe(migrated.sessions[0].id);
  });
});
