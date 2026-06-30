import {
  Bot, Check, Copy, Flame, KeyRound, Loader2, Menu,
  MessageSquarePlus, RefreshCcw, Search, Send, Sparkles,
  WandSparkles, X
} from 'lucide-react';
import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
};

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Mir s tobom, sine moj! Dobro došao u Haničar GPT, prvi hrvatski satirični AI chatbot. Ja sam Haničar the Genie: digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i malo satire.',
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
    { icon: Sparkles, label: 'Satira', value: 'Uključena' },
    { icon: Flame, label: 'Vjera u Boga', value: '100%' },
    { icon: Search, label: 'Model', value: 'Gemini Flash' },
    { icon: KeyRound, label: 'API ključ', value: 'Aktivan' },
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
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [draft]);

  async function handleSubmit(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const content = draft.trim();
    if (!content || isSending) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft('');
    setError('');
    setIsSending(true);

    const assistantMessageId = crypto.randomUUID();
    setMessages([...nextMessages, { id: assistantMessageId, role: 'assistant', content: '' }]);

    try {
      const endpoints = getChatEndpoints();
      let lastError: Error | null = null;
      let success = false;

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: [...conversation, { role: 'user', content }] }),
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
                      setMessages((currentMessages) =>
                        currentMessages.map((msg) =>
                          msg.id === assistantMessageId ? { ...msg, content: assistantText } : msg
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
            setMessages((currentMessages) =>
              currentMessages.map((msg) =>
                msg.id === assistantMessageId ? { ...msg, content: payload.text } : msg
              )
            );
            success = true;
            break;
          }
        } catch (requestError) {
          lastError = requestError instanceof Error ? requestError : new Error('Mrežna greška.');
        }
      }

      if (!success) throw lastError || new Error('Chat endpoint nije dostupan.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Nešto se zapetljalo. Haničar trese lampu, ali ništa.');
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

  return (
    <div className="grid h-[100dvh] w-full grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] bg-zinc-950 overflow-hidden font-sans relative">
      
      {/* Background grain noise overlay for premium feel */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.012] bg-[url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%%22 height=%22100%%22 filter=%22url(%23noise)%22/></svg>')] bg-repeat" />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 z-40 sticky top-0 col-span-1">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/hanicar-the-genie.jpeg" alt="" className="w-8 h-8 rounded-full border border-crimson-700/50" />
            <span className="font-bold text-sm tracking-wide text-zinc-100">HANIČAR GPT</span>
          </div>
        </div>
      </header>

      {/* Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-40 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Liquid Glass / Asymmetric Design */}
      <motion.aside
        className={cn(
          "fixed md:relative z-50 flex flex-col w-[320px] md:w-full h-full transition-transform duration-300 md:translate-x-0 bg-zinc-950 md:bg-zinc-950/20 border-r border-white/5",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full p-6 relative overflow-y-auto overflow-x-hidden">
          
          <button onClick={() => setSidebarOpen(false)} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white md:hidden">
            <X size={20} />
          </button>

          {/* Brand Block */}
          <div className="flex items-center gap-4 mb-10 mt-2 md:mt-0">
            <div 
              className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl text-white border-2 border-white shadow-[0_6px_20px_rgba(225,29,72,0.25)] select-none shrink-0"
              style={{
                backgroundColor: '#f4f4f5',
                backgroundImage: 'linear-gradient(45deg, #be123c 25%, transparent 25%), linear-gradient(-45deg, #be123c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #be123c 75%), linear-gradient(-45deg, transparent 75%, #be123c 75%)',
                backgroundSize: '12px 12px',
                backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
                textShadow: '0 2px 4px rgba(0,0,0,0.6)'
              }}
            >
              H
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-widest text-crimson-500 uppercase mb-1">† Prvi moralni AI †</p>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">Haničar GPT</h1>
            </div>
          </div>

          {/* Holy Shrine (Haničar Icon Frame) */}
          <div className="relative p-1 rounded-2xl bg-zinc-900/60 border border-crimson-900/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_12px_36px_rgba(0,0,0,0.4)] mb-8 group">
            <div className="rounded-xl overflow-hidden bg-zinc-950 border border-white/5 relative">
              <div className="bg-crimson-950/40 px-3 py-2 text-center border-b border-white/5 flex items-center justify-center gap-1.5">
                <span className="text-[9px] font-bold tracking-[0.2em] text-crimson-400 uppercase">† SVETI HANIČAR †</span>
              </div>
              <div className="relative aspect-[4/5] overflow-hidden">
                <img src="/hanicar-the-genie.jpeg" alt="Haničar" className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
              </div>
              <div className="absolute bottom-0 w-full p-4 flex items-center gap-2.5 bg-gradient-to-t from-zinc-950 to-transparent">
                <WandSparkles className="text-crimson-500 shrink-0 animate-pulse" size={15} />
                <p className="text-[11px] text-zinc-300 leading-normal font-medium">
                  Sveti duh iz šahovnice, moli za nas!
                </p>
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={() => { setMessages([welcomeMessage]); setDraft(''); setError(''); setSidebarOpen(false); }}
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-3.5 px-4 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,255,255,0.06)] transition-all mb-auto"
          >
            <MessageSquarePlus size={18} />
            Novi razgovor
          </motion.button>

          {/* Status List */}
          <div className="grid gap-2 mt-8">
            {statusItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5">
                <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400">
                  <item.icon size={16} />
                </div>
                <div className="flex flex-col flex-1">
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{item.label}</span>
                  <span className="text-xs font-medium text-zinc-200">{item.value}</span>
                </div>
              </div>
            ))}
          </div>

        </div>
      </motion.aside>

      {/* Chat Area */}
      <main className="flex flex-col min-w-0 bg-zinc-950 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/30 relative h-[calc(100dvh-56px)] md:h-[100dvh]">
        
        {/* Header Desktop */}
        <header className="hidden md:flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-crimson-500 uppercase mb-1">Satirični AI na hrvatskom</p>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Što danas rješavamo, uz Božju pomoć?</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-xs font-semibold text-zinc-300 shadow-sm">
              <Bot size={14} className="text-crimson-500 animate-pulse" />
              <span>OpenRouter</span>
            </div>
          </div>
        </header>

        {/* Suggestion Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4 md:p-6 border-b border-white/5 bg-zinc-900/10 backdrop-blur-sm">
          {promptChips.map((prompt) => (
            <motion.button 
              key={prompt}
              whileHover={{ y: -2, backgroundColor: 'rgba(39, 39, 42, 0.6)' }}
              whileTap={{ scale: 0.98 }}
              onClick={() => { setDraft(prompt); setSidebarOpen(false); textareaRef.current?.focus(); }}
              className="text-left p-3.5 bg-zinc-900/40 border border-white/5 rounded-xl text-sm text-zinc-300 font-medium leading-snug transition-all shadow-sm hover:border-white/10"
            >
              {prompt}
            </motion.button>
          ))}
        </div>

        {/* Message List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <motion.div 
                key={message.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className={cn("flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto", message.role === 'user' ? "flex-row-reverse" : "flex-row")}
              >
                <div className={cn(
                  "shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden select-none",
                  message.role === 'user' ? "bg-zinc-800 text-zinc-300 border border-white/10" : "bg-crimson-900 border border-crimson-700/50"
                )}>
                  {message.role === 'assistant' ? (
                    <img src="/hanicar-the-genie.jpeg" alt="" className="w-full h-full object-cover" />
                  ) : "Ti"}
                </div>
                
                <div className="flex flex-col min-w-0 max-w-[calc(100%-3rem)]">
                  <div className={cn("flex items-center gap-3 mb-2", message.role === 'user' && "flex-row-reverse")}>
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 select-none",
                      message.role === 'user' ? "text-zinc-500" : "text-crimson-500"
                    )}>
                      {message.role === 'assistant' && (
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-crimson-500"></span>
                        </span>
                      )}
                      {message.role === 'assistant' ? '† Haničar GPT †' : 'Ti'}
                    </span>
                    {message.id !== 'welcome' && <CopyButton text={message.content} />}
                  </div>
                  
                  <div className={cn(
                    "prose prose-invert max-w-none text-[15px] leading-relaxed",
                    message.role === 'user' 
                      ? "bg-zinc-900/60 px-5 py-4 rounded-2xl rounded-tr-sm border border-white/5 text-zinc-200 shadow-md"
                      : "pl-4 border-l-2 border-crimson-900/40 text-zinc-300"
                  )}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {showTypingIndicator && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto"
            >
              <div className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center overflow-hidden bg-crimson-950 border border-crimson-900/50">
                <img src="/hanicar-the-genie.jpeg" alt="" className="w-full h-full object-cover opacity-40" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-crimson-500 mb-2 flex items-center gap-1.5 select-none">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-crimson-500"></span>
                  </span>
                  † Haničar GPT †
                </span>
                <div className="pl-4 border-l-2 border-crimson-900/40 flex items-center gap-3 text-zinc-500 text-sm font-medium">
                  <Loader2 size={14} className="animate-spin text-crimson-500" />
                  <span>Haničar moli krunicu i piše odgovor...</span>
                </div>
              </div>
            </motion.div>
          )}

          <div ref={scrollRef} className="h-4" />
        </div>

        {/* Composer */}
        <div className="p-4 md:p-6 bg-zinc-950/40 border-t border-white/5 backdrop-blur-md">
          <div className="max-w-[900px] mx-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-200 text-sm flex items-start gap-3">
                <RefreshCcw size={16} className="mt-0.5 shrink-0" />
                <span className="leading-snug">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="relative flex items-end gap-2 bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] p-2 focus-within:border-zinc-800 focus-within:bg-zinc-900/80 transition-colors">
              <textarea
                ref={textareaRef}
                value={draft}
                rows={1}
                placeholder="Pitaj Haničara nešto pametno, glupo ili opasno..."
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSending}
                className="flex-1 max-h-[200px] bg-transparent resize-none py-3 px-4 text-zinc-100 placeholder:text-zinc-500 focus:outline-none text-[15px] leading-relaxed"
              />
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                type="submit" disabled={!draft.trim() || isSending}
                className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors mb-0.5 mr-0.5 shadow-md shadow-crimson-900/20"
              >
                {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
              </motion.button>
            </form>
            <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium select-none">Haničar GPT može pogriješiti. Provjerite važne informacije kod župnika.</p>
          </div>
        </div>
      </main>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) { }
  };
  return (
    <button onClick={handleCopy} className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md hover:bg-white/5 transition-colors select-none">
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

function getChatEndpoints() {
  const configuredEndpoint = import.meta.env.VITE_CHAT_ENDPOINT;
  return configuredEndpoint ? [configuredEndpoint] : ['/api/chat'];
}

export default App;
