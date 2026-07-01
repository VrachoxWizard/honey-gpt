import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare } from 'lucide-react';
import type { ChatSession } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  onSwitchSession: (id: string) => void;
}

export function SearchOverlay({ isOpen, onClose, sessions, onSwitchSession }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const filteredSessions = sessions.filter((session) =>
    session.title.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          {/* Pozadina s blur efektom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modalni prozor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[60vh] z-10"
          >
            {/* Traka za unos pretrage */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
              <Search className="text-zinc-500 shrink-0" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pretraži naslove razgovora..."
                className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
              />
              <button
                onClick={onClose}
                className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer shrink-0"
                aria-label="Zatvori pretragu"
              >
                <X size={16} />
              </button>
            </div>

            {/* Popis rezultata */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin select-none">
              {filteredSessions.length > 0 ? (
                filteredSessions.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSwitchSession(session.id);
                      onClose();
                    }}
                    className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
                  >
                    <MessageSquare size={14} className="text-zinc-500 shrink-0" />
                    <span className="truncate flex-1">{session.title}</span>
                    <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                      {new Date(session.createdAt).toLocaleDateString('hr-HR')}
                    </span>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500 font-medium">
                  Nema pronađenih razgovora za "{query}"
                </div>
              )}
            </div>

            {/* Upute na dnu */}
            <div className="px-4 py-2 border-t border-white/5 bg-zinc-950/40 text-[10px] text-zinc-500 font-medium flex justify-between select-none">
              <span>Klikni za odabir razgovora</span>
              <span>ESC za zatvaranje</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
