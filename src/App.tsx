import {
  Bot,
  KeyRound,
  Loader2,
  MessageSquarePlus,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
};

type ChatResponse = {
  text: string;
  model: string;
};

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Dobro došao u Hanicar-gpt, prvi hrvatski satirični AI chatbot! Ja sam Haničar the Genie: digitalni duh iz šahovnice, uvijek spreman ponuditi koristan, začinjen i satiričan odgovor na hrvatskom.',
};

const promptChips = [
  'Objasni mi temu kao da sjedimo na kavi.',
  'Napiši mi brutalno iskren plan za ovaj tjedan.',
  'Proguglaj najnovije i sažmi bez filozofiranja.',
  'Pretvori ovu poruku da zvuči pametno, ali ljudski.',
];

function App() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const runtimeMode = shouldUseBrowserLocalLlm() ? 'Local LLM' : 'Gemini';
  const statusItems = [
    { icon: Sparkles, label: 'Satira', value: 'uključena' },
    { icon: Search, label: 'Model', value: runtimeMode },
    { icon: KeyRound, label: 'API ključ', value: runtimeMode === 'Local LLM' ? 'ne treba' : 'serverless' },
  ];

  const conversation = useMemo(
    () =>
      messages
        .filter((message) => message.id !== 'welcome' || message.content !== welcomeMessage.content)
        .map(({ role, content }) => ({ role, content })),
    [messages],
  );

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, isSending]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [draft]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();

    const content = draft.trim();

    if (!content || isSending) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setIsSending(true);

    try {
      const response = await sendChat([
        ...conversation,
        {
          role: 'user',
          content,
        },
      ]);

      setMessages((currentMessages) => [
        ...currentMessages,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: response.text,
        },
      ]);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Nešto se zapetljalo. Haničar trese lampu, ali ništa.';

      setError(message);
      setMessages(nextMessages);
    } finally {
      setIsSending(false);
      textareaRef.current?.focus();
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  function startFreshChat() {
    setMessages([welcomeMessage]);
    setDraft('');
    setError('');
    textareaRef.current?.focus();
  }

  function usePromptChip(prompt: string) {
    setDraft(prompt);
    textareaRef.current?.focus();
  }

  return (
    <main className="app-shell">
      <aside className="sidebar" aria-label="Hanicar-gpt profil">
        <div className="brand-block">
          <div className="brand-mark brand-mark-sahovnica" aria-hidden="true">
            H
          </div>
          <div>
            <p className="eyebrow">Prvi hrvatski chatbot AI</p>
            <h1>Hanicar-gpt</h1>
          </div>
        </div>

        <div className="genie-frame">
          <img src="/hanicar-the-genie.jpeg" alt="Haničar avatar" />
          <div className="genie-caption">
            <WandSparkles aria-hidden="true" size={18} />
            <span>Digitalni duh iz šahovnice s hrvatskim stavom.</span>
          </div>
        </div>

        <button className="new-chat-button" type="button" onClick={startFreshChat}>
          <MessageSquarePlus aria-hidden="true" size={19} />
          Novi razgovor
        </button>

        <div className="status-list" aria-label="Status aplikacije">
          {statusItems.map((item) => (
            <div className="status-row" key={item.label}>
              <span className="status-icon">
                <item.icon aria-hidden="true" size={17} />
              </span>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </aside>

      <section className="chat-panel" aria-label="Chat">
        <header className="chat-header">
          <div>
            <p className="eyebrow">Satirični AI na hrvatskom</p>
            <h2>Što danas rješavamo?</h2>
          </div>
          <div className="header-pill">
            <Bot aria-hidden="true" size={17} />
            {runtimeMode}
          </div>
        </header>

        <div className="suggestion-strip" aria-label="Brzi prijedlozi">
          {promptChips.map((prompt) => (
            <button type="button" key={prompt} onClick={() => usePromptChip(prompt)}>
              {prompt}
            </button>
          ))}
        </div>

        <div className="messages" aria-live="polite">
          {messages.map((message) => (
            <article className={`message ${message.role}`} key={message.id}>
              <div className="message-avatar" aria-hidden="true">
                {message.role === 'assistant' ? (
                  <img src="/hanicar-the-genie.jpeg" alt="" />
                ) : (
                  <span>Ti</span>
                )}
              </div>
              <div className="message-body">
                <div className="message-meta">
                  <strong>{message.role === 'assistant' ? 'Hanicar-gpt' : 'Ti'}</strong>
                </div>
                <MessageText content={message.content} />
              </div>
            </article>
          ))}

          {isSending ? (
            <article className="message assistant">
              <div className="message-avatar" aria-hidden="true">
                <img src="/hanicar-the-genie.jpeg" alt="" />
              </div>
              <div className="message-body typing">
                <div className="message-meta">
                  <strong>Hanicar-gpt</strong>
                </div>
                <span className="typing-line">
                  <Loader2 aria-hidden="true" size={17} />
                  Haničar konzultira lampu...
                </span>
              </div>
            </article>
          ) : null}

          <div ref={scrollRef} />
        </div>

        <form className="composer" onSubmit={handleSubmit}>
          {error ? (
            <div className="error-banner" role="alert">
              <RefreshCcw aria-hidden="true" size={17} />
              {error}
            </div>
          ) : null}

          <div className="composer-row">
            <textarea
              ref={textareaRef}
              value={draft}
              rows={1}
              placeholder="Pitaj Haničara nešto pametno, glupo ili opasno blizu filozofije..."
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
            />
            <button type="submit" disabled={!draft.trim() || isSending} aria-busy={isSending} aria-label="Pošalji poruku">
              {isSending ? (
                <Loader2 className="spin-icon" aria-hidden="true" size={20} />
              ) : (
                <Send aria-hidden="true" size={20} />
              )}
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function MessageText({ content }: { content: string }) {
  return (
    <div className="message-text">
      {content.split('\n').map((line, index) => (
        <p key={`${line}-${index}`}>{line || '\u00a0'}</p>
      ))}
    </div>
  );
}

async function sendChat(messages: Array<{ role: Role; content: string }>): Promise<ChatResponse> {
  if (shouldUseBrowserLocalLlm()) {
    return sendBrowserLocalChat(messages);
  }

  const endpoints = getChatEndpoints();
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      });

      if (response.status === 404 && endpoints.length > 1) {
        continue;
      }

      if (!response.headers.get('Content-Type')?.includes('application/json')) {
        lastError = new Error('Chat endpoint nije vratio JSON.');
        continue;
      }

      const payload = await readJson(response);

      if (!response.ok) {
        throw new Error(payload.error || 'Server nije prihvatio zahtjev.');
      }

      if (!payload.text) {
        throw new Error('Odgovor nema tekst. Haničar je nestao u dimu.');
      }

      return {
        text: payload.text,
        model: payload.model || 'Gemini',
      };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Mrežna greška.');
    }
  }

  throw lastError || new Error('Chat endpoint nije dostupan.');
}

function getChatEndpoints() {
  const configuredEndpoint = import.meta.env.VITE_CHAT_ENDPOINT;

  if (configuredEndpoint) {
    return [configuredEndpoint];
  }

  if (typeof window !== 'undefined' && window.location.hostname.endsWith('vercel.app')) {
    return ['/api/chat'];
  }

  return ['/api/chat', '/.netlify/functions/chat'];
}

function shouldUseBrowserLocalLlm() {
  const configured = import.meta.env.VITE_USE_BROWSER_LOCAL_LLM;

  if (configured === 'true') {
    return true;
  }

  if (configured === 'false') {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  return !['127.0.0.1', 'localhost'].includes(window.location.hostname);
}

async function sendBrowserLocalChat(messages: Array<{ role: Role; content: string }>): Promise<ChatResponse> {
  const endpoint = import.meta.env.VITE_LOCAL_LLM_API_URL || 'http://127.0.0.1:11434/api/generate';
  const model = import.meta.env.VITE_LOCAL_LLM_MODEL || 'llama3';

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: buildBrowserLocalPrompt(messages),
        stream: false,
      }),
    });

    const payload = await readJson(response);

    if (!response.ok) {
      throw new Error(payload.error || `Lokalni LLM je vratio status ${response.status}.`);
    }

    const text = payload.response || payload.text || payload.message?.content || payload.choices?.[0]?.message?.content;

    if (!text) {
      throw new Error('Lokalni LLM nije vratio tekst.');
    }

    return {
      text,
      model: `local:${model}`,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'fetch failed';
    throw new Error(
      `Ne mogu se spojiti na lokalnu Ollamu iz browsera. Provjeri da Ollama radi, da je model ${model} instaliran i da je OLLAMA_ORIGINS postavljen na *. Detalj: ${detail}`,
    );
  }
}

function buildBrowserLocalPrompt(messages: Array<{ role: Role; content: string }>) {
  const transcript = messages
    .map((message) => `${message.role === 'assistant' ? 'Hanicar-gpt' : 'Korisnik'}: ${message.content}`)
    .join('\n\n');

  return `
Ti si Hanicar-gpt, satiricni AI chatbot na hrvatskom jeziku.
Persona: "Hanicar the Genie", digitalni duh iz lampe koji stvarno pokusava pomoci, ali ima lokalni humor i malo previse samopouzdanja.

Pravila:
- Uvijek odgovaraj na hrvatskom jeziku.
- Budi koristan prvo, satirican drugo.
- Ne tvrdi da si sluzbeni OpenAI proizvod.
- Ako je tema ozbiljna, budi miran i jasan.
- Ako je zahtjev opasan ili stetan, odbij i ponudi sigurnu alternativu.

Dosadasnji razgovor:
${transcript}

Odgovori kao Hanicar-gpt:
`.trim();
}

async function readJson(response: Response): Promise<{
  choices?: Array<{ message?: { content?: string } }>;
  error?: string;
  message?: { content?: string };
  model?: string;
  response?: string;
  text?: string;
}> {
  const text = await response.text();

  try {
    return text ? JSON.parse(text) : {};
  } catch {
    if (!response.ok) {
      return { error: 'Server je vratio neočekivan odgovor.' };
    }

    return { text };
  }
}

export default App;
