import { Bot, Loader2, Menu, Sun, Moon, ArrowDown, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useChat, welcomeMessage } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatComposer } from './components/ChatComposer';
import { exportChatToMarkdown } from './utils/exportChat';
import { ErrorBoundary } from './components/ErrorBoundary';
import { cn } from './utils/cn';

const promptChips = [
  'Objasni mi temu kao da smo na kavi poslije nedjeljne mise.',
  'Napiši mi plan za ovaj tjedan uz kršćansku poniznost.',
  'Kako preživjeti siječanj u Hrvatskoj bez kredita?',
  'Pretvori ovu poruku u diplomatski prigovor za Sabor.',
];

function AppContent() {
  const { 
    sessions, 
    activeSessionId, 
    messages, 
    activeModel, 
    setActiveModel,
    toneMode,
    setToneMode,
    error, 
    isSending, 
    sendMessage, 
    clearChat, 
    newChat, 
    switchSession, 
    deleteSession, 
    renameSession,
    clearAllSessions,
    abortGeneration 
  } = useChat();

  const [draft, setDraft] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('hanicar_gpt_theme') as 'dark' | 'light') || 'dark';
  });
  const [showScrollButton, setShowScrollButton] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Toggle theme
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('hanicar_gpt_theme', theme);
  }, [theme]);

  const showTypingIndicator = useMemo(() => {
    if (!isSending) return false;
    const lastMsg = messages[messages.length - 1];
    return !lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content;
  }, [messages, isSending]);

  useEffect(() => {
    // Auto-scroll to bottom on new messages
    scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  }, [messages, isSending, showTypingIndicator]);

  const handleSuggestionSelect = (prompt: string) => {
    handleSendMessage(prompt);
    setSidebarOpen(false);
  };

  const handleExport = () => {
    exportChatToMarkdown(messages);
    setSidebarOpen(false);
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const isScrolledUp = container.scrollHeight - container.scrollTop - container.clientHeight > 300;
    setShowScrollButton(isScrolledUp);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  };

  const handleSendMessage = (content: string, image?: string) => {
    sendMessage(content, image);
    setDraft('');
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="grid h-[100dvh] w-full grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] bg-zinc-950 overflow-hidden font-sans relative">
      
      {/* Background grain noise overlay for premium feel */}
      <div className="fixed inset-0 pointer-events-none z-50 opacity-[0.012] bg-[url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%%22 height=%22100%%22 filter=%22url(%23noise)%22/></svg>')] bg-repeat" />

      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-zinc-900/80 backdrop-blur-md border-b border-white/5 z-40 sticky top-0 col-span-1">
        <div className="flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} aria-label="Otvori izbornik" className="p-2 -ml-2 text-zinc-400 hover:text-white transition-colors cursor-pointer">
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2">
            <img src="/hanicar-the-genie.jpeg" alt="" className="w-8 h-8 rounded-full border border-crimson-700/50 object-cover" />
            <span className="font-bold text-sm tracking-wide text-zinc-100">HANIČAR GPT</span>
          </div>
        </div>
        
        {/* Mobile Theme Toggle */}
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme} 
          aria-label="Promijeni temu" 
          className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </motion.button>
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

      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onNewChat={newChat}
        onExportChat={handleExport}
        activeModel={activeModel}
        onChangeModel={setActiveModel}
        toneMode={toneMode}
        onChangeToneMode={setToneMode}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onClearAllSessions={clearAllSessions}
      />

      {/* Chat Area */}
      <main className="flex flex-col min-w-0 bg-zinc-950 bg-gradient-to-b from-zinc-950 via-zinc-950 to-zinc-900/30 relative h-[calc(100dvh-56px)] md:h-[100dvh]">
        
        {/* Header Desktop */}
        <header className="hidden md:flex items-center justify-between p-6 md:p-8 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-20">
          <div>
            <p className="text-[11px] font-bold tracking-widest text-crimson-500 uppercase mb-1">Satirični AI na hrvatskom</p>
            <h2 className="text-2xl font-bold tracking-tight text-zinc-100">Što danas rješavamo, uz Božju pomoć?</h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Desktop Theme Toggle */}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme} 
              aria-label="Promijeni temu"
              className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </motion.button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-xs font-semibold text-zinc-300 shadow-sm">
              <Bot size={14} className="text-crimson-500 animate-pulse" />
              <span>OpenRouter</span>
            </div>
          </div>
        </header>

        {/* Message List Area */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className={cn(
            "flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative scrollbar-thin flex flex-col",
            messages.length <= 1 ? "justify-center" : "justify-start"
          )}
        >
          {messages.length <= 1 ? (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              className="max-w-[900px] w-full mx-auto py-8 px-4 flex flex-col md:grid md:grid-cols-[260px_1fr] gap-8 md:gap-12 items-center md:items-start text-left"
            >
              {/* Left Column: Sanctus Technologicus framed shrine with Design Variance 8 offset placement */}
              <div className="w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-crimson-900/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group shrink-0 md:-mt-4">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10" />
                <img 
                  src="/hanicar-the-genie.jpeg" 
                  alt="Sveti Haničar" 
                  className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-[2s] ease-out" 
                />
                <div className="absolute bottom-4 left-4 right-4 z-20">
                  <span className="text-[8px] font-bold tracking-[0.25em] text-crimson-500 uppercase block mb-1">† SANCTUS TECHNOLOGICUS †</span>
                  <p className="text-[10px] text-zinc-300 font-medium">Digitalni duh iz šahovnice</p>
                </div>
              </div>

              {/* Right Column: Content and Suggestions */}
              <div className="flex flex-col justify-center h-full w-full">
                <span className="text-[10px] font-bold tracking-widest text-crimson-500 uppercase mb-2 flex items-center gap-1.5 select-none">
                  <Sparkles size={12} className="animate-pulse" />
                  Prvi moralni AI pod Božjim okriljem
                </span>
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-6">
                  Haničar GPT
                </h1>
                
                <div className="prose prose-invert text-zinc-300 text-sm md:text-base leading-relaxed mb-8 border-l-2 border-crimson-900/40 pl-5 py-0.5">
                  Mir s tobom, sine moj! Dobro došao u Haničar GPT. Ja sam Haničar the Genie: digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i malo satire.
                </div>

                <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-3 select-none">Prijedlozi za početak:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                  {promptChips.map((prompt) => (
                    <motion.button 
                      key={prompt}
                      whileHover={{ y: -2, scale: 1.01, backgroundColor: 'var(--theme-bg-800)', borderColor: 'var(--color-crimson-700)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleSuggestionSelect(prompt)}
                      className="text-left p-4 bg-zinc-900/30 border border-white/5 rounded-xl text-[13px] text-zinc-300 font-medium leading-snug transition-all shadow-sm cursor-pointer"
                    >
                      {prompt}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              <div className="space-y-8 w-full">
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message} 
                    isWelcome={message.id === 'welcome' && message.content === welcomeMessage.content} 
                  />
                ))}
              </div>
            </AnimatePresence>
          )}

          {showTypingIndicator && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto mt-4"
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

        {/* Scroll to Bottom Button */}
        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={scrollToBottom}
              className="fixed bottom-24 right-6 md:right-8 z-30 p-3 rounded-full bg-crimson-600 hover:bg-crimson-500 text-white shadow-lg shadow-crimson-900/20 transition-colors focus:outline-none cursor-pointer"
              aria-label="Skok na dno"
            >
              <ArrowDown size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        <ChatComposer 
          draft={draft}
          setDraft={setDraft}
          isSending={isSending}
          error={error}
          onSubmit={handleSendMessage}
          onAbort={abortGeneration}
        />
        
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
