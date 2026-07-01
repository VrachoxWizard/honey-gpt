import { useState, KeyboardEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MessageSquare, Check, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../utils/cn';
import type { ChatSession } from '../types';

interface SessionListProps {
  sessions: ChatSession[];
  activeSessionId?: string;
  onSwitchSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onClearAllSessions?: () => void;
}

export function SessionList({
  sessions = [],
  activeSessionId,
  onSwitchSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
}: SessionListProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [sessionFilter, setSessionFilter] = useState('');

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(sessionFilter.toLowerCase())
  );

  const startRename = (id: string, currentTitle: string) => {
    setEditingSessionId(id);
    setEditTitle(currentTitle);
  };

  const saveRename = (id: string) => {
    if (editTitle.trim()) {
      onRenameSession?.(id, editTitle.trim());
    }
    setEditingSessionId(null);
  };

  const handleKeyDown = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      saveRename(id);
    } else if (e.key === 'Escape') {
      setEditingSessionId(null);
    }
  };

  const handleClearAll = (e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Jeste li sigurni da želite obrisati sve razgovore pod Božjim okriljem?')) {
      onClearAllSessions?.();
    }
  };

  return (
    <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-2 select-none min-h-[120px] scrollbar-thin flex flex-col">
      {/* Real-time search filter input */}
      <div className="px-2 mb-3 shrink-0 relative">
        <input
          type="text"
          placeholder="Filtriraj povijest..."
          value={sessionFilter}
          onChange={(e) => setSessionFilter(e.target.value)}
          className="w-full bg-zinc-900/40 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-crimson-800/40 focus:bg-zinc-900/60 transition-all font-medium"
        />
        <Search className="absolute left-5 top-2.5 text-zinc-550" size={12} />
      </div>

      <div className="flex items-center justify-between px-2 mb-2 shrink-0">
        <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase">
          Povijest razgovora
        </p>
        {sessions.length > 1 && (
          <button
            onClick={handleClearAll}
            className="text-[9px] font-bold text-zinc-500 hover:text-red-400 transition-colors uppercase cursor-pointer"
            title="Obriši svu povijest"
          >
            Obriši sve
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        <AnimatePresence initial={false}>
          {filteredSessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const isEditing = editingSessionId === session.id;
            return (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={cn(
                  'flex items-center justify-between group rounded-xl p-3 border transition-all duration-200 cursor-pointer',
                  isActive
                    ? 'bg-crimson-950/20 border-crimson-800/30 text-zinc-100'
                    : 'bg-zinc-900/10 border-white/5 hover:border-white/10 hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200'
                )}
                onClick={() => !isEditing && onSwitchSession?.(session.id)}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <MessageSquare
                    size={14}
                    className={cn('shrink-0', isActive ? 'text-crimson-500' : 'text-zinc-500')}
                  />
                  {isEditing ? (
                    <input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => saveRename(session.id)}
                      onKeyDown={(e) => handleKeyDown(e, session.id)}
                      autoFocus
                      className="bg-zinc-800 text-xs text-white px-1.5 py-0.5 rounded border border-crimson-600/30 focus:outline-none w-full"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        startRename(session.id, session.title);
                      }}
                      className="text-xs font-medium truncate leading-none pt-0.5"
                    >
                      {session.title}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveRename(session.id);
                      }}
                      aria-label="Spremi naziv"
                      className="p-1 rounded-md text-zinc-400 hover:text-green-400 hover:bg-white/5 transition-colors"
                    >
                      <Check size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startRename(session.id, session.title);
                      }}
                      aria-label="Preimenuj razgovor"
                      className="p-1 rounded-md text-zinc-600 hover:text-zinc-300 hover:bg-white/5 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                    >
                      <Pencil size={13} />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSession?.(session.id);
                    }}
                    aria-label="Obriši razgovor"
                    className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-white/5 transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
