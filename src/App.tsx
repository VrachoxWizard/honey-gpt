import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Feather } from 'lucide-react';

import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { SaintPortrait } from './components/SaintPortrait';
import { Invocation } from './components/Invocation';
import { MessageList } from './components/MessageList';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatComposer } from './components/ChatComposer';
import { exportChatToMarkdown } from './utils/exportChat';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { useToast } from './hooks/useToast';
import { KeyboardShortcutsModal } from './components/KeyboardShortcutsModal';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { cn } from './utils/cn';

function AppContent() {
  const {
    sessions,
    activeSessionId,
    messages,
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
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const { showToast } = useToast();

  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    if (typeof localStorage === 'undefined') return 'day';
    const v = localStorage.getItem('hanicar_codex_theme');
    if (v === 'day' || v === 'night') return v;
    return localStorage.getItem('hanicar_gpt_theme') === 'dark' ? 'night' : 'day';
  });

  const [showScrollButton, setShowScrollButton] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  useEffect(() => {
    document.documentElement.classList.toggle('night', theme === 'night');
    localStorage.setItem('hanicar_codex_theme', theme);
  }, [theme]);

  const lastAssistantMessageId = useMemo(() => {
    return [...messages].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome')?.id;
  }, [messages]);

  const showTypingIndicator = useMemo(() => {
    if (!isSending) return false;
    const lastMsg = messages[messages.length - 1];
    return !lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content;
  }, [messages, isSending]);

  useEffect(() => {
    // Instant (not smooth) so streaming tokens don't fight the user's scroll,
    // and only when they're already pinned to the bottom.
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [messages, isSending, showTypingIndicator]);

  const isWelcomeView = messages.length <= 1;

  const handleSuggestionSelect = (prompt: string) => {
    sendMessage(prompt);
    setSidebarOpen(false);
  };

  const handleExport = () => {
    exportChatToMarkdown(messages);
    setSidebarOpen(false);
    showToast('Zapis prepisan u datoteku!', 'success');
  };

  useKeyboardShortcuts({
    onSearch: () => setSidebarOpen((p) => !p),
    onNewChat: newChat,
    onExport: handleExport,
    onClose: () => {
      setSidebarOpen(false);
      setShortcutsOpen(false);
    },
    onHelp: () => setShortcutsOpen((p) => !p),
  });

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 48;
    setShowScrollButton(distanceFromBottom > 260);
  };

  const scrollToBottom = () =>
    scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden relative">
      {/* Parchment fibre grain */}
      <div className="parchment-grain fixed inset-0 pointer-events-none z-[5]" />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        rite={toneMode}
        onChangeRite={setToneMode}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'day' ? 'night' : 'day'))}
        onNewChat={newChat}
        onExportChat={handleExport}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onClearAllSessions={clearAllSessions}
      />

      {/* Right column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        {/* Mobile bar — keeps the saint present + opens the codex */}
        <div className="md:hidden flex items-center justify-between h-14 px-3 bg-parchment-2/80 backdrop-blur-md border-b border-line shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="Otvori bočnu traku"
            className="flex items-center gap-2 cursor-pointer"
          >
            <Menu size={20} className="text-ink-soft" />
            <SaintPortrait size={32} />
            <span className="font-incipit text-sm tracking-[0.14em] text-ink-strong uppercase">
              Haničar
            </span>
          </button>
          <button
            onClick={newChat}
            aria-label="Novi zapis"
            className="p-2 text-ink-soft hover:text-ink cursor-pointer"
          >
            <Feather size={19} />
          </button>
        </div>

        {/* Reading area */}
        <main className="flex-1 flex flex-col min-h-0 relative">
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className={cn(
              'flex-1 min-h-0 overflow-y-auto px-4 md:px-10 pt-6 pb-4 relative scrollbar-thin flex flex-col',
              isWelcomeView ? 'justify-center' : 'justify-start gap-10'
            )}
          >
            {isWelcomeView ? (
              <Invocation onSuggestionSelect={handleSuggestionSelect} />
            ) : (
              <MessageList
                messages={messages}
                lastAssistantMessageId={lastAssistantMessageId}
                onRegenerate={regenerateLastResponse}
                onEdit={editAndResend}
              />
            )}

            {showTypingIndicator && <TypingIndicator />}
            <div ref={scrollRef} className="h-2 shrink-0" />
          </div>

          <AnimatePresence>
            {showScrollButton && !isWelcomeView && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={scrollToBottom}
                className="wax-seal absolute bottom-[104px] left-1/2 -translate-x-1/2 z-20 w-9 h-9 flex items-center justify-center rounded-full cursor-pointer"
                aria-label="Na dno stranice"
              >
                <ChevronDown size={17} />
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
        </main>
      </div>

      <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
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
