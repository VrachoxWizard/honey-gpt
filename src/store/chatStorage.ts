import type { ChatSession, Message } from '../types';
import type { ToneMode } from '../lib/codex';
import type { ChatState } from './chatStore';

export const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Mir s tobom, sine moj! Dobro došao u Haničar GPT, prvi hrvatski satirični AI chatbot. Ja sam Haničar the Genie: digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i malo satire.',
  timestamp: Date.now(),
};

export const DEFAULT_SESSION_TITLE = 'Novi razgovor';

export function isLocalStorageAvailable(): boolean {
  return typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function';
}

export function createDefaultSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: DEFAULT_SESSION_TITLE,
    messages: [{ ...welcomeMessage, timestamp: Date.now() }],
    createdAt: Date.now(),
  };
}

export function getInitialSessions(): ChatSession[] {
  if (!isLocalStorageAvailable()) {
    return [createDefaultSession()];
  }
  const saved = localStorage.getItem('hanicar_gpt_sessions_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {
      console.error('Failed to parse chat sessions', e);
    }
  }
  return [createDefaultSession()];
}

export function getInitialActiveSessionId(sessions: ChatSession[]): string {
  if (!isLocalStorageAvailable()) return sessions[0]?.id || '';
  const saved = localStorage.getItem('hanicar_gpt_active_session_id_v2');
  if (saved && saved !== 'undefined') return saved;
  return sessions[0]?.id || '';
}

export function getInitialModel(): string {
  if (!isLocalStorageAvailable()) return 'google/gemini-2.5-flash';
  return localStorage.getItem('hanicar_gpt_active_model') || 'google/gemini-2.5-flash';
}

export function getInitialToneMode(): ToneMode {
  if (!isLocalStorageAvailable()) return 'sanctus';
  const raw = localStorage.getItem('hanicar_gpt_tone_mode');
  if (raw === 'humilis' || raw === 'clericus' || raw === 'sanctus') {
    return raw as ToneMode;
  }
  return 'sanctus';
}

export function syncToLocalStorage(state: Partial<ChatState>): void {
  if (!isLocalStorageAvailable()) return;
  if (state.sessions !== undefined) {
    localStorage.setItem('hanicar_gpt_sessions_v2', JSON.stringify(state.sessions));
  }
  if (state.activeSessionId !== undefined) {
    localStorage.setItem('hanicar_gpt_active_session_id_v2', state.activeSessionId);
  }
  if (state.activeModel !== undefined) {
    localStorage.setItem('hanicar_gpt_active_model', state.activeModel);
  }
  if (state.toneMode !== undefined) {
    localStorage.setItem('hanicar_gpt_tone_mode', state.toneMode);
  }
}
