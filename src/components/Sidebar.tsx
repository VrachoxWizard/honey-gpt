import {
  Download,
  Flame,
  KeyRound,
  MessageSquarePlus,
  Search,
  Sparkles,
  WandSparkles,
  X,
  MessageSquare,
  Trash2,
  Pencil,
  Check,
  ChevronDown,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, KeyboardEvent, MouseEvent } from 'react';
import { cn } from '../utils/cn';
import type { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onExportChat: () => void;
  activeModel: string;
  onChangeModel: (model: string) => void;
  toneMode: 'humilis' | 'clericus' | 'sanctus';
  onChangeToneMode: (tone: 'humilis' | 'clericus' | 'sanctus') => void;
  sessions?: ChatSession[];
  activeSessionId?: string;
  onSwitchSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
  onRenameSession?: (id: string, newTitle: string) => void;
  onClearAllSessions?: () => void;
}

const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
];

export function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onExportChat,
  activeModel,
  onChangeModel,
  toneMode,
  onChangeToneMode,
  sessions = [],
  activeSessionId,
  onSwitchSession,
  onDeleteSession,
  onRenameSession,
  onClearAllSessions,
}: SidebarProps) {
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
    <motion.aside
      className={cn(
        'fixed md:relative z-50 flex flex-col w-[320px] md:w-full h-full transition-transform duration-300 md:translate-x-0 bg-zinc-950 md:bg-zinc-950/20 border-r border-white/5',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      aria-label="Bočna traka s opcijama"
    >
      <div className="flex flex-col h-full p-6 relative overflow-y-auto overflow-x-hidden">
        <button
          onClick={onClose}
          aria-label="Zatvori bočnu traku"
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>

        {/* Brand Block */}
        <div className="flex items-center gap-4 mb-8 mt-2 md:mt-0">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl text-white border-2 border-white shadow-[0_6px_20px_rgba(225,29,72,0.25)] select-none shrink-0"
            style={{
              backgroundColor: '#f4f4f5',
              backgroundImage:
                'linear-gradient(45deg, #be123c 25%, transparent 25%), linear-gradient(-45deg, #be123c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #be123c 75%), linear-gradient(-45deg, transparent 75%, #be123c 75%)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)',
            }}
          >
            H
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-crimson-500 uppercase mb-1">
              † Prvi moralni AI †
            </p>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">
              Haničar GPT
            </h1>
          </div>
        </div>

        {/* Holy Shrine (Haničar Icon Frame) */}
        <div className="relative p-1 rounded-2xl bg-zinc-900/60 border border-crimson-900/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_12px_36px_rgba(0,0,0,0.4)] mb-6 group shrink-0">
          <div className="rounded-xl overflow-hidden bg-zinc-950 border border-white/5 relative">
            <div className="bg-crimson-950/40 px-3 py-2 text-center border-b border-white/5 flex items-center justify-center gap-1.5">
              <span className="text-[9px] font-bold tracking-[0.2em] text-crimson-400 uppercase">
                † SVETI HANIČAR †
              </span>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src="/hanicar-the-genie.jpeg"
                alt="Haničar"
                className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/10 to-transparent" />
            </div>
            <div className="absolute bottom-0 w-full p-4 flex items-center gap-2.5 bg-gradient-to-t from-zinc-950 to-transparent">
              <WandSparkles className="text-crimson-500 shrink-0 animate-pulse" size={15} />
              <p className="text-[11px] text-zinc-300 leading-normal font-medium">
                Sveti duh iz šahovnice, moli za nas!
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mb-6 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            aria-label="Započni novi razgovor"
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-3 px-4 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,255,255,0.06)] transition-all cursor-pointer"
          >
            <MessageSquarePlus size={18} />
            Novi razgovor
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExportChat}
            aria-label="Preuzmi trenutni razgovor"
            className="w-full flex items-center justify-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 py-3 px-4 rounded-xl font-medium text-sm border border-white/5 transition-all cursor-pointer"
          >
            <Download size={16} className="text-zinc-400" />
            Preuzmi razgovor
          </motion.button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-2 select-none min-h-[120px] scrollbar-thin flex flex-col">
          {/* Real-time search filter input */}
          <div className="px-2 mb-3 shrink-0 relative">
            <input
              type="text"
              placeholder="Filtriraj povijest..."
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="w-full bg-zinc-900/40 border border-white/5 rounded-lg pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-650 focus:outline-none focus:border-crimson-800/40 focus:bg-zinc-900/60 transition-all font-medium"
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

        {/* Status List with Interactive Selects */}
        <div className="grid gap-2 mt-auto shrink-0 pt-4 border-t border-white/5">
          {/* Satira / Tone selector */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 relative">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
              <Sparkles size={16} />
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6 relative">
              <label
                htmlFor="tone-select"
                className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block"
              >
                Stil satire
              </label>
              <select
                id="tone-select"
                value={toneMode}
                onChange={(e) => onChangeToneMode(e.target.value as any)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full cursor-pointer appearance-none font-medium mt-0.5 pr-2"
              >
                <option value="sanctus" className="bg-zinc-950 text-zinc-300 text-xs py-1">
                  † Sveti mod
                </option>
                <option value="clericus" className="bg-zinc-950 text-zinc-300 text-xs py-1">
                  † Birokratski mod
                </option>
                <option value="humilis" className="bg-zinc-950 text-zinc-300 text-xs py-1">
                  † Ponizni mod
                </option>
              </select>
              <div className="absolute right-0 bottom-1 pointer-events-none text-zinc-500">
                <ChevronDown size={12} />
              </div>
            </div>
          </div>

          {/* Model selector */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5 relative">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
              <Search size={16} />
            </div>
            <div className="flex flex-col flex-1 min-w-0 pr-6 relative">
              <label
                htmlFor="model-select"
                className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block"
              >
                Aktivni model
              </label>
              <select
                id="model-select"
                value={AVAILABLE_MODELS.some((m) => m.id === activeModel) ? activeModel : ''}
                onChange={(e) => onChangeModel(e.target.value)}
                className="bg-transparent text-xs text-zinc-200 focus:outline-none w-full cursor-pointer appearance-none font-medium mt-0.5 pr-2 truncate"
              >
                {!AVAILABLE_MODELS.some((m) => m.id === activeModel) && activeModel && (
                  <option value={activeModel} className="bg-zinc-950 text-zinc-300 text-xs py-1">
                    {
                      activeModel
                        .replace(/^(google\/|qwen\/|meta-llama\/|deepseek\/|mistralai\/)/, '')
                        .split(':')[0]
                    }
                  </option>
                )}
                {AVAILABLE_MODELS.map((m) => (
                  <option
                    key={m.id}
                    value={m.id}
                    className="bg-zinc-950 text-zinc-300 text-xs py-1"
                  >
                    {m.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-0 bottom-1 pointer-events-none text-zinc-500">
                <ChevronDown size={12} />
              </div>
            </div>
          </div>

          {/* Static Status Items: Vjera, API ključ */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
              <Flame size={16} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                Vjera u Boga
              </span>
              <span className="text-xs font-medium text-zinc-200">100%</span>
            </div>
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5">
            <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400 shrink-0">
              <KeyRound size={16} />
            </div>
            <div className="flex flex-col flex-1">
              <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
                API ključ
              </span>
              <span className="text-xs font-medium text-zinc-200">Aktivan</span>
            </div>
          </div>
        </div>
      </div>
    </motion.aside>
  );
}
