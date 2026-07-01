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
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSwitchSession={onSwitchSession}
          onDeleteSession={onDeleteSession}
          onRenameSession={onRenameSession}
          onClearAllSessions={onClearAllSessions}
        />

        {/* Status List with Interactive Selects */}
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
