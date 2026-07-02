export type ChatRole = 'user' | 'assistant' | 'system';

export type ChatMessagePart =
  { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };

export interface ChatMessage {
  role: ChatRole;
  content: string | ChatMessagePart[];
}

export type ClientMessage = {
  id: string;
  role: ChatRole;
  content: string;
  timestamp?: number;
  image?: string;
};

export type Message = ClientMessage;

export type ToneMode = 'humilis' | 'clericus' | 'sanctus';
export type RiskLevel = 'safe' | 'caution' | 'block';

export interface HanicarReply {
  text: string;
  model: string;
}

export interface HanicarStreamContext {
  requestId: string;
  clientIp: string;
  onCacheHit?: (cacheHit: boolean) => void;
  onUsage?: (usage: { totalTokens: number }) => Promise<void>;
  logger?: {
    info: (
      message: string,
      context?: Record<string, string | number | boolean | undefined>
    ) => void;
    warn: (
      message: string,
      context?: Record<string, string | number | boolean | undefined>
    ) => void;
    error: (
      message: string,
      context?: Record<string, string | number | boolean | undefined>
    ) => void;
  };
}

export interface HanicarOptions {
  model?: string;
  toneMode?: ToneMode;
  riskLevel?: RiskLevel;
  context?: HanicarStreamContext;
}

export type ChatSession = {
  id: string;
  title: string;
  messages: ClientMessage[];
  activeModel?: string;
  createdAt: number;
  updatedAt?: number;
};

export type ExportedSession = {
  version: 2;
  exportedAt: number;
  session: ChatSession;
};
