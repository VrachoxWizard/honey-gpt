import { useState, KeyboardEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, Sun, Moon, Check, Pencil, Trash2, X, Download, Search } from 'lucide-react';
import { cn } from '../utils/cn';
import { PersonaSeals } from './PersonaSeals';
import type { ChatSession } from '../types';
import type { ToneMode } from '../lib/codex';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  rite: ToneMode;
  onChangeRite: (t: ToneMode) => void;
  theme: 'day' | 'night';
  onToggleTheme: () => void;
  onNewChat: () => void;
  onExportChat: () => void;
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
  theme,
  onToggleTheme,
  onNewChat,
  onExportChat,
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

  const filtered = sessions.filter((s) =>
    s.title.toLowerCase().includes(filter.toLowerCase())
  );

  const startRename = (id: string, title: string) => {
    setEditingId(id);
    setEditTitle(title);
  };
  const saveRename = (id: string) => {
    if (editTitle.trim()) onRenameSession(id, editTitle.trim());
    setEditingId(null);
  };
  const onKey = (e: KeyboardEvent, id: string) => {
    if (e.key === 'Enter') saveRename(id);
    else if (e.key === 'Escape') setEditingId(null);
  };
  const clearAll = (e: MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Spaliti sve zapise? Ovo se ne može poništiti.')) onClearAllSessions();
  };
  const pick = (id: string) => {
    onSwitchSession(id);
    onClose();
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Saint — always watching */}
      <div className="p-4 pb-3 shrink-0">
        <div className="relative rounded-2xl overflow-hidden border-2 border-gold/50 shadow-[0_0_0_1px_var(--parchment),0_10px_30px_rgba(60,12,8,0.28)]">
          <span className="absolute -inset-2 bg-gold/15 blur-xl animate-candle pointer-events-none" />
          <img
            src="/hanicar-the-genie.jpeg"
            alt="Sveti Haničar"
            className="relative w-full h-[184px] object-cover object-[center_16%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-oxblood-deep/95 via-oxblood-deep/40 to-transparent px-3 pt-9 pb-2.5 text-center">
            <span className="font-incipit text-[12px] tracking-[0.24em] text-seal uppercase">
              Sveti Haničar
            </span>
          </div>
        </div>
      </div>

      {/* The rite dial — his voice */}
      <div className="px-4 pb-4 shrink-0">
        <PersonaSeals active={rite} onChange={onChangeRite} />
      </div>

      <div className="rule-gold mx-4 mb-3 shrink-0" />

      {/* New */}
      <div className="px-4 mb-3 shrink-0">
        <button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-oxblood text-seal font-ui text-xs font-semibold uppercase tracking-[0.14em] hover:brightness-110 transition-all cursor-pointer shadow-[0_3px_10px_rgba(60,12,8,0.25)]"
        >
          <Feather size={15} /> Novi zapis
        </button>
      </div>

      {/* History */}
      <div className="flex-1 min-h-0 flex flex-col px-2">
        <div className="flex items-center justify-between px-2 mb-2 shrink-0">
          <span className="rubric text-[9px]">Zapisi</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onExportChat}
              title="Prepiši trenutni razgovor u datoteku"
              aria-label="Preuzmi razgovor"
              className="p-1 text-ink-faint hover:text-ink transition-colors cursor-pointer"
            >
              <Download size={13} />
            </button>
            {sessions.length > 1 && (
              <button
                onClick={clearAll}
                title="Spali sve zapise"
                aria-label="Spali sve zapise"
                className="p-1 text-ink-faint hover:text-oxblood transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
              </button>
            )}
          </div>
        </div>

        {sessions.length > 3 && (
          <div className="px-2 mb-2 shrink-0 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" size={12} />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Prolistaj…"
              className="w-full bg-vellum/40 border border-line rounded-lg pl-7 pr-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/50 transition-all"
            />
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-1 pb-2 scrollbar-thin">
          {filtered.length === 0 ? (
            <p className="px-3 py-6 text-center text-[13px] text-ink-faint italic leading-relaxed">
              {sessions.length === 0
                ? 'Umoči pero i zapiši prvu molbu.'
                : 'Ništa ne odgovara pretrazi.'}
            </p>
          ) : (
            <AnimatePresence initial={false}>
              {filtered.map((session) => {
                const isActive = session.id === activeSessionId;
                const isEditing = editingId === session.id;
                return (
                  <motion.div
                    key={session.id}
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -6 }}
                    onClick={() => !isEditing && pick(session.id)}
                    className={cn(
                      'group relative flex items-center gap-2 rounded-lg pl-3 pr-1.5 py-2 mb-0.5 cursor-pointer transition-colors',
                      isActive ? 'bg-vellum/70' : 'hover:bg-vellum/40'
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-oxblood" />
                    )}
                    <div className="flex-1 min-w-0">
                      {isEditing ? (
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveRename(session.id)}
                          onKeyDown={(e) => onKey(e, session.id)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          className="w-full bg-vellum text-sm text-ink px-1.5 py-0.5 rounded border border-gold/40 focus:outline-none"
                        />
                      ) : (
                        <p
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            startRename(session.id, session.title);
                          }}
                          className={cn(
                            'font-display text-[15px] leading-snug truncate',
                            isActive ? 'text-ink-strong' : 'text-ink'
                          )}
                        >
                          {session.title}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-0.5 shrink-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {isEditing ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveRename(session.id);
                          }}
                          aria-label="Spremi naziv"
                          className="p-1 rounded text-ink-soft hover:text-gold-bright"
                        >
                          <Check size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startRename(session.id, session.title);
                          }}
                          aria-label="Preimenuj"
                          className="p-1 rounded text-ink-faint hover:text-ink"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(session.id);
                        }}
                        aria-label="Spali zapis"
                        className="p-1 rounded text-ink-faint hover:text-oxblood"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Footer — light of the codex */}
      <div className="shrink-0 border-t border-line px-3 py-2.5">
        <button
          onClick={onToggleTheme}
          title={
            theme === 'night'
              ? 'Fiat lux — i bi svjetlost'
              : 'Fiat nox — i pade blagoslovljena tama'
          }
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-ink-soft hover:text-ink hover:bg-vellum/40 transition-colors cursor-pointer font-incipit text-[12px] tracking-[0.2em] uppercase"
        >
          {theme === 'night' ? <Sun size={14} /> : <Moon size={14} />}
          {theme === 'night' ? 'Fiat lux' : 'Fiat nox'}
        </button>
      </div>
    </div>
  );
}
