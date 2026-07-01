import {
  Download,
  MessageSquarePlus,
  WandSparkles,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { SessionList } from './SessionList';
import { ModelSelector } from './ModelSelector';
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
  return (
    <motion.aside
      className={cn(
        'fixed md:relative z-50 flex flex-col w-[320px] md:w-full h-full transition-transform duration-300 md:translate-x-0 bg-zinc-950 md:bg-zinc-950/20 border-r border-white/5',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      )}
      aria-label="Bočna traka s opcijama"
    >
      <div className="flex flex-col h-full p-5 relative overflow-hidden">
        <button
          onClick={onClose}
          aria-label="Zatvori bočnu traku"
          className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-white md:hidden"
        >
          <X size={20} />
        </button>

        {/* Brand Block — compact identity strip with the shrine as an avatar */}
        <div className="flex items-center gap-3 mb-5 mt-1 md:mt-0 shrink-0">
          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-crimson-800/40 shadow-md shrink-0">
            <img
              src="/hanicar-the-genie.jpeg"
              alt="Haničar"
              className="w-full h-full object-cover object-center"
            />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-widest text-crimson-500 uppercase mb-0.5">
              Prvi moralni AI
            </p>
            <h1 className="text-lg font-bold text-white tracking-tight leading-none truncate">
              Haničar GPT
            </h1>
          </div>
        </div>

        {/* Primary actions — pinned near the top so starting/exporting is one click */}
        <div className="flex flex-col gap-2.5 mb-4 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewChat}
            aria-label="Započni novi razgovor"
            className="w-full flex items-center justify-center gap-2 bg-zinc-100 hover:bg-white text-zinc-950 py-2.5 px-4 rounded-xl font-bold text-sm shadow-[0_4px_14px_rgba(255,255,255,0.06)] transition-all cursor-pointer"
          >
            <MessageSquarePlus size={18} />
            Novi razgovor
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onExportChat}
            aria-label="Preuzmi trenutni razgovor"
            className="w-full flex items-center justify-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300 py-2 px-4 rounded-xl font-medium text-sm border border-white/5 transition-all cursor-pointer"
          >
            <Download size={16} className="text-zinc-400" />
            Preuzmi razgovor
          </motion.button>
        </div>

        {/* Compact shrine banner — keeps the satirical relic without eating the list.
            Hidden on short viewports so the session list always wins the space. */}
        <div className="relative mb-4 rounded-xl overflow-hidden border border-crimson-900/15 shrink-0 hidden min-[820px]:block group">
          <div className="relative h-[92px] overflow-hidden">
            <img
              src="/hanicar-the-genie.jpeg"
              alt="Sveti Haničar"
              className="w-full h-full object-cover object-[center_28%] group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-zinc-950/95 via-zinc-950/60 to-transparent" />
            <div className="absolute inset-0 p-3 flex flex-col justify-center">
              <span className="text-[9px] font-bold tracking-[0.2em] text-crimson-400 uppercase mb-1">
                † Sveti Haničar †
              </span>
              <p className="text-[11px] text-zinc-200 leading-snug font-medium flex items-center gap-1.5 max-w-[180px]">
                <WandSparkles className="text-crimson-500 shrink-0 animate-pulse" size={13} />
                Duh iz šahovnice, moli za nas!
              </p>
            </div>
          </div>
        </div>

        {/* Sessions List — the primary surface, gets all remaining vertical space */}
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSwitchSession={onSwitchSession}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          onClearAllSessions={onClearAllSessions}
        />

        {/* Compact settings footer */}
        <ModelSelector
          activeModel={activeModel}
          onChangeModel={onChangeModel}
          toneMode={toneMode}
          onChangeToneMode={onChangeToneMode}
        />
      </div>
    </motion.aside>
  );
}
