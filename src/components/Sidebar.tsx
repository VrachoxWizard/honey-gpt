import { Download, Flame, KeyRound, MessageSquarePlus, Search, Sparkles, WandSparkles, X, MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../utils/cn';
import type { ChatSession } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNewChat: () => void;
  onExportChat: () => void;
  activeModel?: string;
  sessions?: ChatSession[];
  activeSessionId?: string;
  onSwitchSession?: (id: string) => void;
  onDeleteSession?: (id: string) => void;
}

export function Sidebar({
  isOpen,
  onClose,
  onNewChat,
  onExportChat,
  activeModel,
  sessions = [],
  activeSessionId,
  onSwitchSession,
  onDeleteSession,
}: SidebarProps) {
  const cleanModel = (activeModel || 'Gemini 2.5 Flash')
    .replace(/^(google\/|qwen\/|meta-llama\/|deepseek\/|mistralai\/)/, '')
    .split(':')[0];

  const statusItems = [
    { icon: Sparkles, label: 'Satira', value: 'Uključena' },
    { icon: Flame, label: 'Vjera u Boga', value: '100%' },
    { icon: Search, label: 'Model', value: cleanModel },
    { icon: KeyRound, label: 'API ključ', value: 'Aktivan' },
  ];

  return (
    <motion.aside
      className={cn(
        "fixed md:relative z-50 flex flex-col w-[320px] md:w-full h-full transition-transform duration-300 md:translate-x-0 bg-zinc-950 md:bg-zinc-950/20 border-r border-white/5",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}
      aria-label="Bočna traka s opcijama"
    >
      <div className="flex flex-col h-full p-6 relative overflow-y-auto overflow-x-hidden">
        
        <button onClick={onClose} aria-label="Zatvori bočnu traku" className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white md:hidden">
          <X size={20} />
        </button>

        {/* Brand Block */}
        <div className="flex items-center gap-4 mb-8 mt-2 md:mt-0">
          <div 
            className="w-14 h-14 rounded-xl flex items-center justify-center font-black text-2xl text-white border-2 border-white shadow-[0_6px_20px_rgba(225,29,72,0.25)] select-none shrink-0"
            style={{
              backgroundColor: '#f4f4f5',
              backgroundImage: 'linear-gradient(45deg, #be123c 25%, transparent 25%), linear-gradient(-45deg, #be123c 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #be123c 75%), linear-gradient(-45deg, transparent 75%, #be123c 75%)',
              backgroundSize: '12px 12px',
              backgroundPosition: '0 0, 0 6px, 6px -6px, -6px 0',
              textShadow: '0 2px 4px rgba(0,0,0,0.6)'
            }}
          >
            H
          </div>
          <div>
            <p className="text-[10px] font-bold tracking-widest text-crimson-500 uppercase mb-1">† Prvi moralni AI †</p>
            <h1 className="text-xl font-bold text-white tracking-tight leading-none">Haničar GPT</h1>
          </div>
        </div>

        {/* Holy Shrine (Haničar Icon Frame) */}
        <div className="relative p-1 rounded-2xl bg-zinc-900/60 border border-crimson-900/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_12px_36px_rgba(0,0,0,0.4)] mb-6 group shrink-0">
          <div className="rounded-xl overflow-hidden bg-zinc-950 border border-white/5 relative">
            <div className="bg-crimson-950/40 px-3 py-2 text-center border-b border-white/5 flex items-center justify-center gap-1.5">
              <span className="text-[9px] font-bold tracking-[0.2em] text-crimson-400 uppercase">† SVETI HANIČAR †</span>
            </div>
            <div className="relative aspect-[4/5] overflow-hidden">
              <img src="/hanicar-the-genie.jpeg" alt="Haničar" className="w-full h-full object-cover object-center group-hover:scale-102 transition-transform duration-700 ease-out" />
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
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            aria-label="Započni novi razgovor"
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-3 px-4 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,255,255,0.06)] transition-all cursor-pointer"
          >
            <MessageSquarePlus size={18} />
            Novi razgovor
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
            onClick={onExportChat}
            aria-label="Preuzmi trenutni razgovor"
            className="w-full flex items-center justify-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 py-3 px-4 rounded-xl font-medium text-sm border border-white/5 transition-all cursor-pointer"
          >
            <Download size={16} className="text-zinc-400" />
            Preuzmi razgovor
          </motion.button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto mb-6 pr-1 space-y-2 select-none min-h-[120px] scrollbar-thin">
          <p className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase px-2 mb-2">Povijest razgovora</p>
          <AnimatePresence initial={false}>
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "flex items-center justify-between group rounded-xl p-3 border transition-all duration-200 cursor-pointer",
                    isActive
                      ? "bg-crimson-950/20 border-crimson-800/30 text-zinc-100"
                      : "bg-zinc-900/10 border-white/5 hover:border-white/10 hover:bg-zinc-900/30 text-zinc-400 hover:text-zinc-200"
                  )}
                  onClick={() => onSwitchSession?.(session.id)}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <MessageSquare size={14} className={cn("shrink-0", isActive ? "text-crimson-500" : "text-zinc-500")} />
                    <span className="text-xs font-medium truncate leading-none pt-0.5">
                      {session.title}
                    </span>
                  </div>
                  
                  {/* Delete button (only show on hover in desktop, always visible in mobile) */}
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
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Status List */}
        <div className="grid gap-2 mt-auto shrink-0 pt-4 border-t border-white/5">
          {statusItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-900/30 border border-white/5">
              <div className="w-8 h-8 rounded-md bg-zinc-900 flex items-center justify-center text-zinc-400">
                <item.icon size={16} />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{item.label}</span>
                <span className="text-xs font-medium text-zinc-200">{item.value}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </motion.aside>
  );
}
