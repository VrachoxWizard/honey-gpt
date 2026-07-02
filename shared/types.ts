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
  image?: string; // base64 image
};

export type Message = ClientMessage;

export type Persona = 'hanicar' | 'scholar' | 'jester';
export type ToneMode = 'humilis' | 'clericus' | 'sanctus';

export interface HanicarReply {
  text: string;
  model: string;
}

export interface HanicarOptions {
  model?: string;
  toneMode?: ToneMode;
}

export interface ChatRequest {
  messages: ChatMessage[];
  persona: Persona;
}

export type ChatSession = {
  id: string;
  title: string;
  persona?: Persona;
  messages: ClientMessage[];
  activeModel?: string;
  createdAt: number;
  updatedAt?: number;
};
