export type Role = 'user' | 'assistant';

export type Message = {
  id: string;
  role: Role;
  content: string;
  timestamp?: number;
  image?: string; // base64 slika
};

export type ChatSession = {
  id: string;
  title: string;
  messages: Message[];
  activeModel?: string;
  createdAt: number;
};
