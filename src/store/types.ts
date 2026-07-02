import type { ToneMode } from '@lib/codex';
import type { ExportedSession } from '@shared/types';

export interface ChatSlice {
  sessions: import('@shared/types').ChatSession[];
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
  exportSession: (id: string) => string | null;
  importSession: (json: string) => string | null;
}

export interface MessageSlice {
  isSending: boolean;
  error: string;
  lastRequestId: string;
  abortGeneration: () => void;
  sendMessage: (content: string, image?: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  editAndResend: (messageId: string, newContent: string) => Promise<void>;
}

export type ChatState = ChatSlice & MessageSlice;
