import { useState, useMemo, useCallback, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Image, Link2, Trash2, X } from 'lucide-react';
import type { ChatSession } from '@shared/types';
import type { ToneMode } from '../lib/codex';
import { SidebarHeader } from './sidebar/SidebarHeader';
import { ChatSearch } from './sidebar/ChatSearch';
import { ChatList } from './sidebar/ChatList';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  rite: ToneMode;
  onChangeRite: (t: ToneMode) => void;
  theme: 'day' | 'night';
  onToggleTheme: () => void;
  onNewChat: () => void;
  onSearch: () => void;
  onExportChat: () => void;
  onShareChat: () => void;
  onDownloadImage: () => void;
  sessions: ChatSession[];
  activeSessionId?: string;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onClearAllSessions: () => void;
}

export function Sidebar(props: SidebarProps) {
  return (
    <>
      {/* Desktop: persistent codex spine */}
      <aside className="hidden md:flex flex-col w-[272px] shrink-0 bg-parchment-2/60 border-r border-line relative z-30">
        <SidebarBody {...props} />
      </aside>

      {/* Mobile: slide-over */}
      <AnimatePresence>
        {props.isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={props.onClose}
              className="md:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="md:hidden fixed top-0 bottom-0 left-0 z-50 w-[86vw] max-w-[300px] bg-parchment-2 border-r border-gold/25 shadow-[8px_0_40px_rgba(40,20,8,0.3)] flex flex-col"
            >
              <button
                onClick={props.onClose}
                aria-label="Zatvori"
                className="absolute top-3 right-3 z-10 p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-vellum/60 cursor-pointer"
              >
                <X size={18} />
              </button>
              <SidebarBody {...props} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarBody({
  onClose,
  rite,
  onChangeRite,
  onNewChat,
  onSearch,
  onExportChat,
  onShareChat,
  onDownloadImage,
  sessions,
  activeSessionId,
  onSwitchSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [filter, setFilter] = useState('');

  const filteredSessions = useMemo(() => {
    if (!filter) return sessions;
    const lowerFilter = filter.toLowerCase();
    return sessions.filter((s) => s.title.toLowerCase().includes(lowerFilter));
  }, [sessions, filter]);

  const handleEditStart = useCallback((id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  }, []);

  const handleEditSave = useCallback(
    (id: string) => {
      if (editTitle.trim()) onRenameSession(id, editTitle.trim());
      setEditingId(null);
    },
    [editTitle, onRenameSession]
  );

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
  }, []);

  const handleClearAll = useCallback(
    (e: MouseEvent) => {
      e.stopPropagation();
      if (window.confirm('Spaliti sve zapise? Ovo se ne može poništiti.')) {
        onClearAllSessions();
      }
    },
    [onClearAllSessions]
  );

  const handleSelect = useCallback(
    (id: string) => {
      onSwitchSession(id);
      onClose();
    },
    [onSwitchSession, onClose]
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <SidebarHeader
        onNewChat={onNewChat}
        onSearch={onSearch}
        onClose={onClose}
        rite={rite}
        onChangeRite={onChangeRite}
      />

      {/* History */}
      <div className="flex-1 min-h-0 flex flex-col px-2">
        <div className="flex items-center justify-between px-2 mb-2 shrink-0">
          <span className="rubric text-[9px]">Zapisi</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onShareChat}
              title="Podijeli razgovor putem linka"
              aria-label="Podijeli razgovor"
              className="p-1 text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Link2 size={13} />
            </button>
            <button
              onClick={onExportChat}
              title="Prepiši trenutni razgovor u datoteku"
              aria-label="Preuzmi razgovor"
              className="p-1 text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Download size={13} />
            </button>
            <button
              onClick={onDownloadImage}
              title="Preuzmi trenutni razgovor kao sliku"
              aria-label="Preuzmi kao sliku"
              className="p-1 text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Image size={13} />
            </button>
            {sessions.length > 1 && (
              <button
                onClick={handleClearAll}
                title="Spali sve zapise"
                aria-label="Spali sve zapise"
                className="p-1 text-ink-faint hover:text-oxblood transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {sessions.length > 3 && <ChatSearch filter={filter} onFilterChange={setFilter} />}

        <ChatList
          sessions={sessions}
          filteredSessions={filteredSessions}
          activeSessionId={activeSessionId}
          editingId={editingId}
          editTitle={editTitle}
          onSelect={handleSelect}
          onEditStart={handleEditStart}
          onEditChange={setEditTitle}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onDelete={onDeleteSession}
        />
      </div>
    </div>
  );
}
