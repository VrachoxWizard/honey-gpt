import { describe, it, expect, vi, beforeEach } from 'vitest';
import { create, type StateCreator } from 'zustand';
import { createMessageSlice } from './messageSlice';
import type { ChatState } from './types';
import { createChatSlice } from './chatSlice';

vi.mock('@lib/chatApi', () => ({
  sendConversation: vi.fn(),
}));

import { sendConversation } from '@lib/chatApi';

const testStateCreator: StateCreator<ChatState> = (set, get, store) => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...createChatSlice(set as any, get as any, store as any),
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...createMessageSlice(set as any, get as any, store as any),
});

const createTestStore = () => create<ChatState>()(testStateCreator);

describe('messageSlice', () => {
  beforeEach(() => {
    vi.mocked(sendConversation).mockReset();
  });

  it('sets error when chat API fails', async () => {
    vi.mocked(sendConversation).mockRejectedValue(new Error('Pad servera'));

    const store = createTestStore();
    store.getState().newChat();
    await store.getState().sendMessage('Pozdrav');

    expect(store.getState().error).toBe('Pad servera');
    expect(store.getState().isSending).toBe(false);
  });

  it('aborts in-flight generation', async () => {
    vi.mocked(sendConversation).mockImplementation(
      ({ signal }) =>
        new Promise((_, reject) => {
          signal.addEventListener('abort', () => {
            const error = new Error('Aborted');
            error.name = 'AbortError';
            reject(error);
          });
        })
    );

    const store = createTestStore();
    store.getState().newChat();
    const sendPromise = store.getState().sendMessage('Pozdrav');

    await Promise.resolve();
    store.getState().abortGeneration();
    await sendPromise;

    expect(store.getState().isSending).toBe(false);
  });
});
