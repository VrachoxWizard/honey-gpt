import type { ToneMode } from '@lib/codex';

export interface ChatSlice {
  sessions: import('@shared/types').ChatSession[];
  activeSessionId: string;
  activeModel: string;
  toneMode: ToneMode;
  autoSpeak: boolean;
  setActiveModel: (model: string) => void;
  setToneMode: (tone: ToneMode) => void;
  setAutoSpeak: (val: boolean) => void;
  newChat: () => void;
  switchSession: (id: string) => void;
  deleteSession: (id: string) => void;
  renameSession: (id: string, newTitle: string) => void;
  clearAllSessions: () => void;
  clearChat: () => void;
  exportSession: (id: string) => string | null;
  importSession: (json: string) => string | null;
  shareSession: (id: string) => string | null;
}

export interface MessageSlice {
  isSending: boolean;
  error: string;
  lastRequestId: string;
  summaryWarning: string;
  abortGeneration: () => void;
  sendMessage: (content: string, image?: string) => Promise<void>;
  regenerateLastResponse: () => Promise<void>;
  editAndResend: (messageId: string, newContent: string) => Promise<void>;
}

export type ChatState = ChatSlice & MessageSlice;
