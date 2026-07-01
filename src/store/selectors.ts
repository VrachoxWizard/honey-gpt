import type { ChatState } from './chatStore';
import type { ChatSession, Message } from '@shared/types';
import type { ToneMode } from '@lib/codex';

// Selectors for ChatState

export const selectSessions = (state: ChatState): ChatSession[] => state.sessions;
export const selectActiveSessionId = (state: ChatState): string | null => state.activeSessionId;

export const selectActiveSession = (state: ChatState): ChatSession | undefined => 
  state.sessions.find(s => s.id === state.activeSessionId);

export const selectMessages = (state: ChatState): Message[] => 
  selectActiveSession(state)?.messages || [];

export const selectIsSending = (state: ChatState): boolean => state.isSending;
export const selectError = (state: ChatState): string => state.error;

export const selectActiveModel = (state: ChatState): string => state.activeModel;
export const selectToneMode = (state: ChatState): ToneMode => state.toneMode;
