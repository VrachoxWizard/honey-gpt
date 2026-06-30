import {
  Bot,
  Flame,
  KeyRound,
  Loader2,
  Menu,
  MessageSquarePlus,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  WandSparkles,
  X,
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
    'Mir s tobom, sine moj! Dobro došao u Haničar-GPT, prvi hrvatski satirični AI chatbot. Ja sam Haničar the Genie: digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i malo satire.',
};

const promptChips = [
  'Objasni mi temu kao da smo na kavi poslije nedjeljne mise.',
  'Napiši mi plan za ovaj tjedan uz kršćansku poniznost.',
  'Kako preživjeti siječanj u Hrvatskoj bez kredita?',
  'Pretvori ovu poruku u diplomatski prigovor za Sabor.',
];

function App() {
  const [messages, setMessages] = useState<Message[]>([welcomeMessage]);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const statusItems = [
    { icon: Sparkles, label: 'Satira', value: 'uključena' },
    { icon: Flame, label: 'Vjera u Boga', value: '100%' },
    { icon: Search, label: 'Model', value: 'OpenRouter' },
    { icon: KeyRound, label: 'API ključ', value: 'hanicarless' },
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
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }

  function usePromptChip(prompt: string) {
    setDraft(prompt);
    setSidebarOpen(false);
    textareaRef.current?.focus();
  }

  return (
    <>
      {/* Mobile top bar — always shows Haničar avatar on small screens */}
      <header className="mobile-bar">
        <button
          className="mobile-menu-btn"
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Otvori izbornik"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand">
          <img src="/hanicar-the-genie.jpeg" alt="" className="mobile-avatar" />
          <span className="mobile-title">Haničar-GPT</span>
        </div>
        <span className="mobile-cross" aria-hidden="true">†</span>
      </header>

      {/* Sidebar overlay backdrop for mobile drawer */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden={!sidebarOpen}
      />

      <main className="app-shell">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} aria-label="Haničar-GPT profil">
          <button
            className="sidebar-close"
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Zatvori izbornik"
          >
            <X size={20} />
          </button>

          <div className="brand-block">
            <div className="brand-mark brand-mark-sahovnica" aria-hidden="true">
              H
            </div>
            <div>
              <p className="eyebrow">† Prvi Hrvatski AI †</p>
              <h1>Haničar-GPT</h1>
            </div>
          </div>

          <div className="genie-frame holy-shrine">
            <div className="holy-header">† Sveti Haničar †</div>
            <div className="holy-image-wrapper">
              <img src="/hanicar-the-genie.jpeg" alt="Sveti Haničar" />
            </div>
            <div className="genie-caption">
              <WandSparkles aria-hidden="true" size={18} />
              <span>Sveti duh iz šahovnice, moli za nas i piši kod!</span>
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
              <h2>Što danas rješavamo, uz Božju pomoć?</h2>
            </div>
            <div className="header-pill">
              <Bot aria-hidden="true" size={16} />
              OpenRouter
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
                    <strong>{message.role === 'assistant' ? '† Haničar-GPT †' : 'Ti'}</strong>
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
                    <strong>† Haničar-GPT †</strong>
                  </div>
                  <span className="typing-line">
                    <Loader2 aria-hidden="true" size={17} />
                    Haničar moli krunicu i piše odgovor...
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
    </>
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
        model: payload.model || 'OpenRouter',
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

  return ['/api/chat'];
}

async function readJson(response: Response): Promise<{
  error?: string;
  model?: string;
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
