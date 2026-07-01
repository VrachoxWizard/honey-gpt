import React, { useState, useEffect, useRef, useMemo } from 'react';
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

  const searchResults = useMemo(() => {
    if (!query.trim()) return [];

    const lowerQuery = query.toLowerCase();
    const matches: { session: ChatSession; snippet?: string }[] = [];

    for (const session of sessions) {
      const titleMatch = session.title.toLowerCase().includes(lowerQuery);

      let msgMatchSnippet = '';
      for (const msg of session.messages) {
        if (msg.content.toLowerCase().includes(lowerQuery)) {
          const index = msg.content.toLowerCase().indexOf(lowerQuery);
          const start = Math.max(0, index - 30);
          const end = Math.min(msg.content.length, index + lowerQuery.length + 45);
          let snippet = msg.content.slice(start, end);
          if (start > 0) snippet = '...' + snippet;
          if (end < msg.content.length) snippet = snippet + '...';
          msgMatchSnippet = snippet;
          break; // Return first matching message snippet
        }
      }

      if (titleMatch || msgMatchSnippet) {
        matches.push({
          session,
          snippet: msgMatchSnippet || undefined,
        });
      }
    }

    return matches;
  }, [sessions, query]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] px-4">
          {/* Background overlay with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-lg rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl overflow-hidden flex flex-col max-h-[60vh] z-10"
          >
            {/* Search Input Bar */}
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5">
              <Search className="text-zinc-500 shrink-0" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pretraži naslove i poruke..."
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

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin select-none">
              {!query.trim() ? (
                <div className="py-8 text-center text-xs text-zinc-500 font-medium">
                  Unesite tekst za pretragu...
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map(({ session, snippet }) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      onSwitchSession(session.id);
                      onClose();
                    }}
                    className="w-full text-left flex flex-col gap-1 px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3 text-xs font-semibold">
                      <MessageSquare size={14} className="text-zinc-500 shrink-0" />
                      <span className="truncate flex-1">{session.title}</span>
                      <span className="text-[10px] text-zinc-500 font-medium shrink-0">
                        {new Date(session.createdAt).toLocaleDateString('hr-HR')}
                      </span>
                    </div>
                    {snippet && (
                      <p className="text-[11px] text-zinc-500 pl-7 font-normal italic truncate">
                        {snippet}
                      </p>
                    )}
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-zinc-500 font-medium">
                  Nema pronađenih rezultata za "{query}"
                </div>
              )}
            </div>

            {/* Instructions */}
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
