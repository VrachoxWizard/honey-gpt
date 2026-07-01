import { useState, useRef, useEffect, useCallback } from 'react';
import type { Message, ChatSession } from '../types';

const SESSIONS_KEY = 'hanicar_gpt_sessions_v2';
const ACTIVE_SESSION_KEY = 'hanicar_gpt_active_session_id_v2';

export const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Mir s tobom, sine moj! Dobro došao u Haničar GPT, prvi hrvatski satirični AI chatbot. Ja sam Haničar the Genie: digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i malo satire.',
  timestamp: Date.now(),
};

function getChatEndpoints() {
  const configuredEndpoint = import.meta.env.VITE_CHAT_ENDPOINT;
  return configuredEndpoint ? [configuredEndpoint] : ['/api/chat'];
}

export function useChat() {
  // Load sessions from localStorage or initialize with a default one
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem(SESSIONS_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Failed to parse chat sessions', e);
      }
    }
    const initialSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'Novi razgovor',
      messages: [welcomeMessage],
      createdAt: Date.now(),
    };
    return [initialSession];
  });

  // Track active session ID
  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    const saved = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (saved && saved !== 'undefined') return saved;
    return sessions[0]?.id || '';
  });

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [activeModel, setActiveModel] = useState<string>(
    () => localStorage.getItem('hanicar_gpt_active_model') || 'google/gemini-2.5-flash'
  );
  const [toneMode, setToneMode] = useState<'humilis' | 'clericus' | 'sanctus'>(
    () => (localStorage.getItem('hanicar_gpt_tone_mode') as any) || 'sanctus'
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  // Save sessions to localStorage
  useEffect(() => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  }, [sessions]);

  // Save activeSessionId to localStorage
  useEffect(() => {
    localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
  }, [activeSessionId]);

  // Save toneMode to localStorage
  useEffect(() => {
    localStorage.setItem('hanicar_gpt_tone_mode', toneMode);
  }, [toneMode]);

  const handleSetActiveModel = useCallback((model: string) => {
    setActiveModel(model);
    localStorage.setItem('hanicar_gpt_active_model', model);
  }, []);

  // Get active session messages
  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [welcomeMessage];

  // Helper to update messages inside the active session
  const updateActiveSessionMessages = useCallback((updater: (curr: Message[]) => Message[]) => {
    setSessions((prevSessions) =>
      prevSessions.map((s) => {
        if (s.id === activeSessionId) {
          const nextMsgs = updater(s.messages);
          let nextTitle = s.title;
          
          // Generate a title based on the first user message if it's still 'Novi razgovor'
          if (s.title === 'Novi razgovor') {
            const firstUserMsg = nextMsgs.find((m) => m.role === 'user');
            if (firstUserMsg) {
              nextTitle =
                firstUserMsg.content.slice(0, 30) +
                (firstUserMsg.content.length > 30 ? '...' : '');
            }
          }
          return { ...s, messages: nextMsgs, title: nextTitle };
        }
        return s;
      })
    );
  }, [activeSessionId]);

  const abortGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsSending(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    updateActiveSessionMessages(() => [
      { ...welcomeMessage, timestamp: Date.now() },
    ]);
    setError('');
    abortGeneration();
  }, [updateActiveSessionMessages, abortGeneration]);

  const newChat = useCallback(() => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'Novi razgovor',
      messages: [{ ...welcomeMessage, timestamp: Date.now() }],
      createdAt: Date.now(),
    };
    setSessions((prev) => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setError('');
    abortGeneration();
  }, [abortGeneration]);

  const switchSession = useCallback((id: string) => {
    setActiveSessionId(id);
    setError('');
    abortGeneration();
  }, [abortGeneration]);

  const deleteSession = useCallback((id: string) => {
    abortGeneration();
    setError('');

    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (next.length === 0) {
        const initial: ChatSession = {
          id: crypto.randomUUID(),
          title: 'Novi razgovor',
          messages: [{ ...welcomeMessage, timestamp: Date.now() }],
          createdAt: Date.now(),
        };
        setActiveSessionId(initial.id);
        return [initial];
      }

      if (activeSessionId === id) {
        setActiveSessionId(next[0].id);
      }
      return next;
    });
  }, [activeSessionId, abortGeneration]);

  const renameSession = useCallback((id: string, newTitle: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  }, []);

  const clearAllSessions = useCallback(() => {
    abortGeneration();
    setError('');
    const initialSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'Novi razgovor',
      messages: [{ ...welcomeMessage, timestamp: Date.now() }],
      createdAt: Date.now(),
    };
    setSessions([initialSession]);
    setActiveSessionId(initialSession.id);
  }, [abortGeneration]);

  const sendMessage = async (content: string, image?: string) => {
    if ((!content.trim() && !image) || isSending) return;

    abortGeneration();
    const newController = new AbortController();
    abortControllerRef.current = newController;

    const userMessage: Message = { 
      id: crypto.randomUUID(), 
      role: 'user', 
      content,
      timestamp: Date.now(),
      image
    };
    const nextMessages = [...messages, userMessage];
    updateActiveSessionMessages(() => nextMessages);
    setError('');
    setIsSending(true);

    const assistantMessageId = crypto.randomUUID();
    updateActiveSessionMessages(() => [
      ...nextMessages,
      { id: assistantMessageId, role: 'assistant', content: '', timestamp: Date.now() },
    ]);

    const conversation = nextMessages
      .filter((m) => m.id !== 'welcome' || m.content !== welcomeMessage.content)
      .map(({ role, content, image }) => {
        if (image) {
          return {
            role,
            content: [
              { type: 'text', text: content },
              { type: 'image_url', image_url: { url: image } }
            ]
          };
        }
        return { role, content };
      });

    try {
      const endpoints = getChatEndpoints();
      let lastError: Error | null = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              messages: conversation,
              model: activeModel,
              toneMode: toneMode
            }),
            signal: newController.signal,
          });

          if (response.status === 404 && endpoints.length > 1) continue;

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Server nije prihvatio zahtjev.');
          }

          const contentType = response.headers.get('Content-Type') || '';

          if (contentType.includes('text/event-stream')) {
            const reader = response.body?.getReader();
            if (!reader) throw new Error('Streaming body is empty.');
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let assistantText = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed) continue;
                if (trimmed.startsWith('data: ')) {
                  const dataStr = trimmed.slice(6);
                  if (dataStr === '[DONE]') continue;
                  try {
                    const data = JSON.parse(dataStr);
                    if (data.error) throw new Error(data.error);
                    if (data.token || data.model) {
                      if (data.token) assistantText += data.token;
                      if (data.model) {
                        handleSetActiveModel(data.model);
                      }
                      updateActiveSessionMessages((currentMessages) =>
                        currentMessages.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: assistantText }
                            : msg
                        )
                      );
                    }
                  } catch (e) {
                    if (e instanceof Error && e.message) throw e;
                  }
                }
              }
            }
            success = true;
            break;
          } else {
            const payload = await response.json();
            if (!payload.text) throw new Error('Odgovor nema tekst.');
            if (payload.model) {
              handleSetActiveModel(payload.model);
            }
            updateActiveSessionMessages((currentMessages) =>
              currentMessages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: payload.text }
                  : msg
              )
            );
            success = true;
            break;
          }
        } catch (requestError: any) {
          if (requestError.name === 'AbortError') {
            success = true; // Not an actual error, just an abort
            break;
          }
          lastError = requestError instanceof Error ? requestError : new Error('Mrežna greška.');
        }
      }

      if (!success && lastError) throw lastError;
      if (!success) throw new Error('Chat endpoint nije dostupan.');
    } catch (requestError: any) {
      if (requestError.name !== 'AbortError') {
        setError(
          requestError instanceof Error
            ? requestError.message
            : 'Nešto se zapetljalo. Haničar trese lampu, ali ništa.'
        );
        updateActiveSessionMessages((currentMessages) =>
          currentMessages.filter((msg) => msg.id !== assistantMessageId)
        );
      }
    } finally {
      if (abortControllerRef.current === newController) {
        setIsSending(false);
        abortControllerRef.current = null;
      }
    }
  };

  return {
    sessions,
    activeSessionId,
    messages,
    activeModel,
    setActiveModel: handleSetActiveModel,
    toneMode,
    setToneMode,
    isSending,
    error,
    sendMessage,
    clearChat,
    newChat,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,
    abortGeneration,
  };
}
