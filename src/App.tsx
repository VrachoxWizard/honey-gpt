import {
  Bot,
  Check,
  Copy,
  Flame,
  KeyRound,
  Loader2,
  Menu,
  MessageSquarePlus,
  RefreshCcw,
  Search,
  Send,
  Sparkles,
  Sun,
  Moon,
  WandSparkles,
  X,
} from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('hanicar_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('hanicar_theme', theme);
  }, [theme]);
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

  const showTypingIndicator = useMemo(() => {
    if (!isSending) return false;
    const lastMsg = messages[messages.length - 1];
    return !lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content;
  }, [messages, isSending]);

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

    const assistantMessageId = crypto.randomUUID();
    const placeholderMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
    };

    setMessages([...nextMessages, placeholderMessage]);

    try {
      const endpoints = getChatEndpoints();
      let lastError: Error | null = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: [
                ...conversation,
                { role: 'user', content },
              ],
            }),
          });

          if (response.status === 404 && endpoints.length > 1) {
            continue;
          }

          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || 'Server nije prihvatio zahtjev.');
          }

          const contentType = response.headers.get('Content-Type') || '';

          if (contentType.includes('text/event-stream')) {
            const reader = response.body?.getReader();
            if (!reader) {
              throw new Error('Streaming body is empty.');
            }

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
                    if (data.error) {
                      throw new Error(data.error);
                    }
                    if (data.token) {
                      assistantText += data.token;
                      setMessages((currentMessages) =>
                        currentMessages.map((msg) =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: assistantText }
                            : msg
                        )
                      );
                    }
                  } catch (e) {
                    if (e instanceof Error && e.message) {
                      throw e;
                    }
                  }
                }
              }
            }
            success = true;
            break;
          } else {
            const payload = await response.json();
            if (!payload.text) {
              throw new Error('Odgovor nema tekst.');
            }
            setMessages((currentMessages) =>
              currentMessages.map((msg) =>
                msg.id === assistantMessageId
                  ? { ...msg, content: payload.text }
                  : msg
              )
            );
            success = true;
            break;
          }
        } catch (requestError) {
          lastError = requestError instanceof Error ? requestError : new Error('Mrežna greška.');
        }
      }

      if (!success) {
        throw lastError || new Error('Chat endpoint nije dostupan.');
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Nešto se zapetljalo. Haničar trese lampu, ali ništa.';

      setError(message);
      setMessages((currentMessages) => currentMessages.filter((msg) => msg.id !== assistantMessageId));
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
            <div className="header-actions">
              <button
                className="theme-toggle-btn"
                type="button"
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                title={theme === 'light' ? 'Prebaci na tamnu temu' : 'Prebaci na svijetlu temu'}
                aria-label="Promijeni temu"
              >
                {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
              </button>
              <div className="header-pill">
                <Bot aria-hidden="true" size={16} />
                OpenRouter
              </div>
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
                  <div className="message-header-row">
                    <div className="message-meta">
                      <strong>{message.role === 'assistant' ? '† Haničar-GPT †' : 'Ti'}</strong>
                    </div>
                    {message.id !== 'welcome' && <CopyButton text={message.content} />}
                  </div>
                  <MessageText content={message.content} />
                </div>
              </article>
            ))}

            {showTypingIndicator ? (
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <button
      className={`copy-btn ${copied ? 'copied' : ''}`}
      onClick={handleCopy}
      title="Kopiraj tekst"
      aria-label="Kopiraj tekst"
      type="button"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}

function MessageText({ content }: { content: string }) {
  return (
    <div className="message-text">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  );
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
