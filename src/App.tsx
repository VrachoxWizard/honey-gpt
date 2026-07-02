import { useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Feather } from 'lucide-react';

import { useChat } from './hooks/useChat';
import { Sidebar } from './components/Sidebar';
import { SaintPortrait } from './components/SaintPortrait';
import { Invocation } from './components/Invocation';
import { TypingIndicator } from './components/TypingIndicator';
import { ChatComposer } from './components/ChatComposer';
import { exportChatToMarkdown, exportChatToPNG } from './utils/exportChat';

const MessageList = lazy(() =>
  import('./components/MessageList').then((m) => ({ default: m.MessageList }))
);
const KeyboardShortcutsModal = lazy(() =>
  import('./components/KeyboardShortcutsModal').then((m) => ({ default: m.KeyboardShortcutsModal }))
);
const SearchModal = lazy(() =>
  import('./components/SearchModal').then((m) => ({ default: m.SearchModal }))
);
import {
  clearShareFromLocation,
  readSharedChatFromLocation,
  type SharedChatPayload,
} from './lib/shareChat';
import { useChatStore } from './store/chatStore';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider } from './components/Toast';
import { useToast } from './hooks/useToast';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useTextToSpeech } from './hooks/useTextToSpeech';
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
    shareSession,
    summaryWarning,
  } = useChat();

  const [sharedView, setSharedView] = useState<SharedChatPayload | null>(() =>
    readSharedChatFromLocation()
  );
  const displayMessages = sharedView?.messages ?? messages;
  const [draft, setDraft] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
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

  useEffect(() => {
    if (!summaryWarning) return;
    showToast(summaryWarning, 'info');
    useChatStore.setState({ summaryWarning: '' });
  }, [summaryWarning, showToast]);

  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (sessions.length === 0 && !sharedView && !hasInitializedRef.current) {
      hasInitializedRef.current = true;
      newChat();
    }
  }, [sessions.length, sharedView, newChat]);

  const lastAssistantMessageId = useMemo(() => {
    return [...displayMessages].reverse().find((m) => m.role === 'assistant' && m.id !== 'welcome')
      ?.id;
  }, [displayMessages]);

  const showTypingIndicator = useMemo(() => {
    if (sharedView || !isSending) return false;
    const lastMsg = messages[messages.length - 1];
    return !lastMsg || lastMsg.role !== 'assistant' || !lastMsg.content;
  }, [messages, isSending, sharedView]);

  const { speak } = useTextToSpeech();
  const autoSpeak = useChatStore((s) => s.autoSpeak);
  const previousIsSending = useRef(isSending);

  useEffect(() => {
    if (previousIsSending.current && !isSending && autoSpeak && !sharedView) {
      const lastMsg = displayMessages[displayMessages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.content) {
        speak(lastMsg.content);
      }
    }
    previousIsSending.current = isSending;
  }, [isSending, autoSpeak, displayMessages, sharedView, speak]);

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollRef.current?.scrollIntoView({ block: 'end' });
    }
  }, [displayMessages, isSending, showTypingIndicator]);

  const isWelcomeView = !sharedView && displayMessages.length <= 1;

  const handleSuggestionSelect = (prompt: string) => {
    sendMessage(prompt);
    setSidebarOpen(false);
  };

  const handleExport = () => {
    exportChatToMarkdown(displayMessages);
    setSidebarOpen(false);
    showToast('Zapis prepisan u datoteku!', 'success');
  };

  const handleDownloadImage = async () => {
    const element = containerRef.current;
    if (!element) {
      showToast('Nemoguće dohvatiti prozor razgovora.', 'error');
      return;
    }

    showToast('Pripremam sliku zapisa...', 'info');
    const success = await exportChatToPNG(element);
    if (success) {
      showToast('Zapis uspješno spremljen kao slika!', 'success');
    } else {
      showToast('Greška prilikom izvoza slike.', 'error');
    }
    setSidebarOpen(false);
  };

  const handleShare = async () => {
    const url = shareSession(activeSessionId);
    if (!url) {
      showToast('Nema aktivnog razgovora za dijeljenje.', 'error');
      return;
    }

    try {
      await navigator.clipboard.writeText(url);
      showToast('Link za dijeljenje kopiran u međuspremnik!', 'success');
    } catch {
      window.prompt('Kopiraj link za dijeljenje:', url);
    }
    setSidebarOpen(false);
  };

  const handleExitSharedView = () => {
    setSharedView(null);
    clearShareFromLocation();
  };

  useKeyboardShortcuts({
    onSearch: () => setSearchOpen((p) => !p),
    onNewChat: newChat,
    onExport: handleExport,
    onClose: () => {
      setSidebarOpen(false);
      setShortcutsOpen(false);
      setSearchOpen(false);
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
        onSearch={() => setSearchOpen(true)}
        onExportChat={handleExport}
        onShareChat={handleShare}
        onDownloadImage={handleDownloadImage}
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
          {sharedView && (
            <div className="shrink-0 px-4 py-2 bg-seal/20 border-b border-line text-center text-sm text-ink-soft">
              Samo za čitanje: dijeljeni razgovor «{sharedView.title}».
              <button
                type="button"
                onClick={handleExitSharedView}
                className="ml-2 underline cursor-pointer hover:text-ink"
              >
                Zatvori
              </button>
            </div>
          )}
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
              <ErrorBoundary>
                <Suspense
                  fallback={
                    <div className="flex-1 flex items-center justify-center text-ink-soft font-incipit">
                      Otvaram zapise...
                    </div>
                  }
                >
                  <MessageList
                    messages={displayMessages}
                    lastAssistantMessageId={lastAssistantMessageId}
                    onRegenerate={sharedView ? () => {} : regenerateLastResponse}
                    onEdit={sharedView ? () => {} : editAndResend}
                    scrollContainerRef={containerRef}
                  />
                </Suspense>
              </ErrorBoundary>
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

          {!sharedView && (
            <ChatComposer
              draft={draft}
              setDraft={setDraft}
              isSending={isSending}
              error={error}
              onSubmit={sendMessage}
              onAbort={abortGeneration}
            />
          )}
        </main>
      </div>

      <Suspense fallback={null}>
        <KeyboardShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
        <SearchModal
          isOpen={searchOpen}
          onClose={() => setSearchOpen(false)}
          onSelectSession={switchSession}
        />
      </Suspense>
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
