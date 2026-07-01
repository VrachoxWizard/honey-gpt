import { useState, KeyboardEvent, MouseEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Feather, Download, Search, Check, Pencil, Trash2, X, BookOpen } from 'lucide-react';
import { cn } from '../utils/cn';
import { AVAILABLE_MODELS, modelDisplayName } from '../lib/codex';
import type { ChatSession } from '../types';

interface KazaloProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId?: string;
  onSwitchSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
  onRenameSession: (id: string, title: string) => void;
  onClearAllSessions: () => void;
  onNewChat: () => void;
  onExportChat: () => void;
  activeModel: string;
  onChangeModel: (model: string) => void;
}

const romanish = (n: number) => {
  // folio numbering — small caps roman for flavour, falls back to arabic
  const map: [number, string][] = [
    [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'],
    [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'],
    [5, 'V'], [4, 'IV'], [1, 'I'],
  ];
  let out = '';
  for (const [v, s] of map) {
    while (n >= v) {
      out += s;
      n -= v;
    }
  }
  return out || 'I';
};

export function Kazalo({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSwitchSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
  onNewChat,
  onExportChat,
  activeModel,
  onChangeModel,
}: KazaloProps) {
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
    if (window.confirm('Spaliti sve zapise iz kazala? Ovo se ne može poništiti.')) {
      onClearAllSessions();
    }
  };

  const pick = (id: string) => {
    onSwitchSession(id);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          />

          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            role="dialog"
            aria-label="Kazalo — povijest razgovora"
            className="fixed top-0 bottom-0 left-0 md:left-[76px] z-50 w-[86vw] max-w-[340px] bg-parchment-2 border-r border-gold/25 shadow-[8px_0_40px_rgba(40,20,8,0.28)] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <BookOpen className="text-gold" size={18} />
                <div>
                  <h2 className="font-incipit text-lg text-ink-strong tracking-wide leading-none">
                    Kazalo
                  </h2>
                  <p className="rubric text-[9px] mt-1">
                    {sessions.length} {sessions.length === 1 ? 'zapis' : 'zapisa'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                aria-label="Zatvori kazalo"
                className="p-1.5 text-ink-soft hover:text-ink rounded-md hover:bg-vellum/50 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rule-gold mx-5 mb-3 shrink-0" />

            {/* Actions */}
            <div className="px-4 flex gap-2 mb-3 shrink-0">
              <button
                onClick={() => {
                  onNewChat();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-oxblood text-parchment font-ui text-xs font-semibold uppercase tracking-wider hover:brightness-110 transition-all cursor-pointer shadow-sm"
              >
                <Feather size={14} /> Novi zapis
              </button>
              <button
                onClick={onExportChat}
                title="Prepiši trenutni razgovor u datoteku"
                aria-label="Preuzmi razgovor"
                className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-line text-ink-soft hover:text-ink hover:border-gold/50 transition-all cursor-pointer"
              >
                <Download size={15} />
              </button>
            </div>

            {/* Filter */}
            <div className="px-4 mb-2 shrink-0 relative">
              <Search className="absolute left-7 top-1/2 -translate-y-1/2 text-ink-faint" size={13} />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Prolistaj kazalo…"
                className="w-full bg-vellum/40 border border-line rounded-lg pl-8 pr-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/50 transition-all"
              />
            </div>

            {/* Entries */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-1 scrollbar-thin">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
                  <Feather className="text-ink-faint" size={26} />
                  <p className="text-sm text-ink-soft italic leading-relaxed">
                    {sessions.length === 0
                      ? 'Kazalo je prazno. Umoči pero i zapiši prvu molbu.'
                      : 'Nijedan zapis ne odgovara pretrazi.'}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {filtered.map((session, i) => {
                    const isActive = session.id === activeSessionId;
                    const isEditing = editingId === session.id;
                    return (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        onClick={() => !isEditing && pick(session.id)}
                        className={cn(
                          'group flex items-center gap-3 rounded-lg px-3 py-2.5 mb-0.5 cursor-pointer transition-colors border',
                          isActive
                            ? 'bg-vellum/70 border-gold/40'
                            : 'border-transparent hover:bg-vellum/40'
                        )}
                      >
                        <span
                          className={cn(
                            'font-incipit text-[11px] w-7 text-right shrink-0 tabular-nums',
                            isActive ? 'text-oxblood' : 'text-ink-faint'
                          )}
                        >
                          {romanish(i + 1)}
                        </span>

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
                                'font-display text-[15px] leading-tight truncate',
                                isActive ? 'text-ink-strong' : 'text-ink'
                              )}
                            >
                              {session.title}
                            </p>
                          )}
                          <p className="text-[10px] text-ink-faint mt-0.5">
                            {new Date(session.createdAt).toLocaleDateString('hr-HR')}
                          </p>
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
                              <Check size={14} />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startRename(session.id, session.title);
                              }}
                              aria-label="Preimenuj zapis"
                              className="p-1 rounded text-ink-faint hover:text-ink"
                            >
                              <Pencil size={13} />
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
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>

            {/* Footer — the scribe's tools */}
            <div className="shrink-0 border-t border-line px-4 py-3 space-y-2.5 bg-parchment-3/30">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="kazalo-model"
                  className="rubric text-[9px] shrink-0"
                >
                  Pisar
                </label>
                <div className="relative flex-1 min-w-0">
                  <select
                    id="kazalo-model"
                    value={AVAILABLE_MODELS.some((m) => m.id === activeModel) ? activeModel : ''}
                    onChange={(e) => onChangeModel(e.target.value)}
                    className="w-full bg-vellum/50 border border-line rounded-lg px-2.5 py-1.5 text-xs text-ink font-medium focus:outline-none focus:border-gold/50 cursor-pointer appearance-none truncate"
                  >
                    {!AVAILABLE_MODELS.some((m) => m.id === activeModel) && activeModel && (
                      <option value={activeModel}>{modelDisplayName(activeModel)}</option>
                    )}
                    {AVAILABLE_MODELS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="font-display italic text-[11px] text-ink-faint">
                  Vjera u Boga: 100% · ključ blagoslovljen
                </p>
                {sessions.length > 1 && (
                  <button
                    onClick={clearAll}
                    className="font-ui text-[9px] uppercase tracking-wider text-ink-faint hover:text-oxblood transition-colors cursor-pointer"
                  >
                    Spali sve
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
