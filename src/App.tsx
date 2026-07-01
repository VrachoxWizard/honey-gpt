import { Bot, Loader2, Menu, Sun, Moon, ArrowDown } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { useChat, welcomeMessage } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { ChatMessage } from './components/ChatMessage';
import { ChatComposer } from './components/ChatComposer';
import { SuggestionStrip } from './components/SuggestionStrip';
import { exportChatToMarkdown } from './utils/exportChat';
import { ErrorBoundary } from './components/ErrorBoundary';

function AppContent() {
  const { 
    sessions, 
    activeSessionId, 
    messages, 
    activeModel, 
    error, 
    isSending, 
    sendMessage, 
    clearChat, 
    newChat, 
    switchSession, 
    deleteSession, 
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
    setDraft(prompt);
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
            <img src="/hanicar-the-genie.jpeg" alt="" className="w-8 h-8 rounded-full border border-crimson-700/50" />
            <span className="font-bold text-sm tracking-wide text-zinc-100">HANIČAR GPT</span>
          </div>
        </div>
        
        {/* Mobile Theme Toggle */}
        <button 
          onClick={toggleTheme} 
          aria-label="Promijeni temu" 
          className="p-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
        </button>
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
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
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
            <button 
              onClick={toggleTheme} 
              aria-label="Promijeni temu"
              className="p-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-white/5 rounded-full text-xs font-semibold text-zinc-300 shadow-sm">
              <Bot size={14} className="text-crimson-500 animate-pulse" />
              <span>OpenRouter</span>
            </div>
          </div>
        </header>

        {/* Suggestion Strip - Hidden after the first message */}
        {messages.length <= 1 && <SuggestionStrip onSelect={handleSuggestionSelect} />}

        {/* Message List */}
        <div 
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative scrollbar-thin"
        >
          <AnimatePresence initial={false}>
            {messages.map((message) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isWelcome={message.id === 'welcome' && message.content === welcomeMessage.content} 
              />
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
