import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowDown } from 'lucide-react';

import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { WelcomeScreen } from './components/WelcomeScreen';
import { MessageList } from './components/MessageList';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatComposer } from './components/ChatComposer';
import { ChatHeader } from './components/ChatHeader';
import { exportChatToMarkdown } from './utils/exportChat';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { useToast } from './hooks/useToast';
import { SearchOverlay } from './components/SearchOverlay';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { cn } from './utils/cn';

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
    regenerateLastResponse,
    editAndResend,
    newChat,
    switchSession,
    deleteSession,
    renameSession,
    clearAllSessions,
    abortGeneration,
  } = useChat();

  const [draft, setDraft] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { showToast } = useToast();
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('hanicar_gpt_theme') as 'dark' | 'light') || 'dark';
  });
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Toggle theme
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('hanicar_gpt_theme', theme);
  }, [theme]);

  const activeSessionTitle = useMemo(
    () => sessions.find((s) => s.id === activeSessionId)?.title,
    [sessions, activeSessionId]
  );

  const activeModelName = useMemo(
    () =>
      activeModel
        .replace(/^(google\/|qwen\/|meta-llama\/|deepseek\/|mistralai\/)/, '')
        .split(':')[0],
    [activeModel]
  );

  const lastAssistantMessageId = useMemo(() => {
    return [...messages].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome')?.id;
  }, [messages]);

  const showTypingIndicator = useMemo(() => {
    if (!isSending) return false;
    const lastMsg = messages[messages.length - 1];
    return !lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content;
  }, [messages, isSending]);

  useEffect(() => {
    // Auto-scroll to bottom on new content only when the user is already near the
    // bottom — never yank them down while they're reading earlier messages.
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  }, [messages, isSending, showTypingIndicator]);

  const handleSuggestionSelect = (prompt: string) => {
    sendMessage(prompt);
    setSidebarOpen(false);
  };

  const handleExport = () => {
    exportChatToMarkdown(messages);
    setSidebarOpen(false);
    showToast('Razgovor izvezen u Markdown!', 'success');
  };

  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen((prev) => !prev),
    onNewChat: newChat,
    onExport: handleExport,
    onClose: () => {
      setSearchOpen(false);
      setSidebarOpen(false);
      setShortcutsOpen(false);
    },
    onHelp: () => setShortcutsOpen((prev) => !prev),
  });

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
    setShowScrollButton(distanceFromBottom > 300);
  };

  const scrollToBottom = () => {
    scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <div className="grid h-[100dvh] w-full grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[380px_1fr] bg-zinc-950 overflow-hidden font-sans relative">
      {/* Background grain noise overlay for premium feel */}
      <div className="fixed inset-0 pointer-events-none z-40 opacity-[0.012] bg-[url('data:image/svg+xml;utf8,<svg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22><filter id=%22noise%22><feTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/></filter><rect width=%22100%%22 height=%22100%%22 filter=%22url(%23noise)%22/></svg>')] bg-repeat" />

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
        <ChatHeader
          onMenuClick={() => setSidebarOpen(true)}
          theme={theme}
          onToggleTheme={toggleTheme}
          sessionTitle={messages.length > 1 ? activeSessionTitle : undefined}
          modelName={activeModelName}
        />

        {/* Message List Area */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className={cn(
            'flex-1 overflow-y-auto p-4 md:p-8 space-y-8 relative scrollbar-thin flex flex-col',
            messages.length <= 1 ? 'justify-center' : 'justify-start'
          )}
        >
          {messages.length <= 1 ? (
            <WelcomeScreen onSuggestionSelect={handleSuggestionSelect} />
          ) : (
            <MessageList
              messages={messages}
              lastAssistantMessageId={lastAssistantMessageId}
              onRegenerate={regenerateLastResponse}
              onEdit={editAndResend}
            />
          )}

          {showTypingIndicator && <TypingIndicator />}

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
              className="absolute bottom-28 right-6 md:right-8 z-30 p-3 rounded-full bg-crimson-600 hover:bg-crimson-500 text-white shadow-lg shadow-crimson-900/20 transition-colors cursor-pointer"
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
          onSubmit={sendMessage}
          onAbort={abortGeneration}
        />

        <SearchOverlay
          key={searchOpen ? 'open' : 'closed'}
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          sessions={sessions}
          onSwitchSession={switchSession}
        />

        <KeyboardShortcutsModal
          isOpen={shortcutsOpen}
          onClose={() => setShortcutsOpen(false)}
        />
      </main>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </ErrorBoundary>
  );
}

export default App;
