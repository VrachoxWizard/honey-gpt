import type { Message, ChatSession } from '@shared/types';
import type { ToneMode } from '@lib/codex';

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
