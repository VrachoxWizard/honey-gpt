export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string | ChatMessagePart[];
}

export type ChatMessagePart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface HanicarReply {
  text: string;
  model: string;
}

export type ToneMode = 'humilis' | 'clericus' | 'sanctus';

export interface HanicarOptions {
  model?: string;
  toneMode?: ToneMode;
}
