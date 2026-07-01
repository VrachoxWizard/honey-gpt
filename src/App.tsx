import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

import { useChat } from './hooks/useChat';
import { SpineRail } from './components/SpineRail';
import { Kazalo } from './components/Kazalo';
import { Incipit } from './components/Incipit';
import { Invocation } from './components/Invocation';
import { MessageList } from './components/MessageList';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatComposer } from './components/ChatComposer';
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
  const [kazaloOpen, setKazaloOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  const activeSessionTitle = useMemo(
    () => sessions.find((s) => s.id === activeSessionId)?.title,
    [sessions, activeSessionId]
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
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    }
  }, [messages, isSending, showTypingIndicator]);

  const isWelcomeView = messages.length <= 1;

  const handleSuggestionSelect = (prompt: string) => {
    sendMessage(prompt);
    setKazaloOpen(false);
  };

  const handleExport = () => {
    exportChatToMarkdown(messages);
    setKazaloOpen(false);
    showToast('Zapis prepisan u datoteku!', 'success');
  };

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen((p) => !p),
    onNewChat: newChat,
    onExport: handleExport,
    onClose: () => {
      setSearchOpen(false);
      setKazaloOpen(false);
      setShortcutsOpen(false);
    },
    onHelp: () => setShortcutsOpen((p) => !p),
  });

  const handleScroll = () => {
    const container = containerRef.current;
    if (!container) return;
    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    isNearBottomRef.current = distanceFromBottom < 120;
    setShowScrollButton(distanceFromBottom > 300);
  };

  const scrollToBottom = () =>
    scrollRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden relative">
      {/* Parchment fibre grain */}
      <div className="parchment-grain fixed inset-0 pointer-events-none z-[5]" />

      <SpineRail
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'day' ? 'night' : 'day'))}
        onNewChat={() => {
          newChat();
          setKazaloOpen(false);
        }}
        onToggleKazalo={() => setKazaloOpen((o) => !o)}
        kazaloOpen={kazaloOpen}
        onSearch={() => setSearchOpen(true)}
        onHelp={() => setShortcutsOpen(true)}
      />

      <Kazalo
        isOpen={kazaloOpen}
        onClose={() => setKazaloOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSwitchSession={switchSession}
        onDeleteSession={deleteSession}
        onRenameSession={renameSession}
        onClearAllSessions={clearAllSessions}
        onNewChat={newChat}
        onExportChat={handleExport}
        activeModel={activeModel}
        onChangeModel={setActiveModel}
      />

      {/* Reading area */}
      <main className="flex-1 flex flex-col min-w-0 relative h-[calc(100dvh-56px)] md:h-[100dvh]">
        <Incipit
          sessionTitle={isWelcomeView ? undefined : activeSessionTitle}
          rite={toneMode}
          onChangeRite={setToneMode}
        />

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className={cn(
            'flex-1 overflow-y-auto px-4 md:px-8 py-8 relative scrollbar-thin flex flex-col',
            isWelcomeView ? 'justify-center' : 'justify-start gap-10'
          )}
        >
          {isWelcomeView ? (
            <Invocation
              onSuggestionSelect={handleSuggestionSelect}
              rite={toneMode}
              onChangeRite={setToneMode}
            />
          ) : (
            <MessageList
              messages={messages}
              lastAssistantMessageId={lastAssistantMessageId}
              onRegenerate={regenerateLastResponse}
              onEdit={editAndResend}
            />
          )}

          {showTypingIndicator && <TypingIndicator />}
          <div ref={scrollRef} className="h-2" />
        </div>

        <AnimatePresence>
          {showScrollButton && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={scrollToBottom}
              className="wax-seal absolute bottom-32 right-6 md:right-10 z-20 w-11 h-11 flex items-center justify-center rounded-full cursor-pointer"
              aria-label="Na dno stranice"
            >
              <ChevronDown size={20} />
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
