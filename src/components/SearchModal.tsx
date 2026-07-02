import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, MessageSquare, Calendar } from 'lucide-react';
import Fuse from 'fuse.js';
import { useChatStore } from '../store/chatStore';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSession: (id: string) => void;
}

export function SearchModal({ isOpen, onClose, onSelectSession }: SearchModalProps) {
  const sessions = useChatStore((s) => s.sessions);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  useFocusTrap(isOpen, dialogRef);

  const fuse = useMemo(() => {
    return new Fuse(sessions, {
      keys: ['title', 'messages.content'],
      threshold: 0.3,
      ignoreLocation: true,
      includeMatches: true,
      useExtendedSearch: true,
    });
  }, [sessions]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return fuse.search(query).slice(0, 10);
  }, [query, fuse]);

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => {
        setQuery('');
        setActiveIndex(0);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const selectResult = useCallback(
    (index: number) => {
      const result = results[index];
      if (!result) return;
      onSelectSession(result.item.id);
      onClose();
    },
    [results, onSelectSession, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (!results.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((current) => Math.min(current + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((current) => Math.max(current - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        selectResult(activeIndex);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, results, activeIndex, selectResult]);

  useEffect(() => {
    if (!listRef.current) return;
    const activeItem = listRef.current.querySelector<HTMLElement>(
      `[data-result-index="${activeIndex}"]`
    );
    activeItem?.scrollIntoView?.({ block: 'nearest' });
  }, [activeIndex, results.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-oxblood-deep/60 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="search-modal-title"
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-[10%] left-1/2 -translate-x-1/2 w-[90%] md:w-full max-w-xl bg-parchment-2 rounded-2xl shadow-2xl z-[101] overflow-hidden border border-gold/30 flex flex-col max-h-[80vh]"
          >
            <h2 id="search-modal-title" className="sr-only">
              Pretraži arhivu razgovora
            </h2>
            <div className="relative p-4 border-b border-line/60 bg-parchment flex items-center">
              <Search size={20} className="text-ink-soft absolute left-6" />
              <input
                type="text"
                autoFocus
                placeholder="Pretraži arhivu (naslove i poruke)..."
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                aria-label="Pretraži arhivu razgovora"
                aria-controls="search-results-list"
                aria-activedescendant={
                  results.length > 0 ? `search-result-${activeIndex}` : undefined
                }
                className="w-full bg-transparent pl-10 pr-10 py-2 outline-none font-ui text-ink text-lg placeholder-ink-faint"
              />
              <button
                onClick={onClose}
                aria-label="Zatvori pretragu"
                className="absolute right-6 p-1 text-ink-soft hover:text-oxblood transition-colors cursor-pointer rounded-full hover:bg-black/5"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-y-auto scrollbar-thin p-2 min-h-[100px]">
              {query.trim() && results.length === 0 ? (
                <div className="text-center py-10 text-ink-soft italic text-sm">
                  Ništa nismo pronašli u arhivu za &quot;{query}&quot;.
                </div>
              ) : !query.trim() ? (
                <div className="text-center py-10 text-ink-soft italic text-sm">
                  Upiši pojam za pretragu starih razgovora...
                </div>
              ) : (
                <ul id="search-results-list" ref={listRef} className="flex flex-col gap-1">
                  {results.map(({ item, matches }, index) => {
                    const messageMatch = matches?.find((m) => m.key === 'messages.content');
                    let snippet = '';
                    if (messageMatch && messageMatch.value) {
                      snippet = messageMatch.value.substring(0, 100);
                      if (messageMatch.value.length > 100) snippet += '...';
                    }

                    return (
                      <li key={item.id}>
                        <button
                          id={`search-result-${index}`}
                          data-result-index={index}
                          aria-selected={index === activeIndex}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => selectResult(index)}
                          className={`w-full text-left p-3 rounded-xl transition-colors flex flex-col gap-1 cursor-pointer group ${
                            index === activeIndex ? 'bg-seal/20' : 'hover:bg-seal/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-ui font-semibold text-ink group-hover:text-oxblood transition-colors line-clamp-1">
                              {item.title}
                            </span>
                            <span className="text-[10px] uppercase font-ui tracking-wider text-ink-faint flex items-center gap-1 shrink-0">
                              <Calendar size={10} />
                              {new Date(item.createdAt).toLocaleDateString('hr-HR')}
                            </span>
                          </div>
                          {snippet ? (
                            <p className="text-xs text-ink-soft line-clamp-2 italic">
                              &quot;{snippet}&quot;
                            </p>
                          ) : (
                            <p className="text-xs text-ink-faint flex items-center gap-1">
                              <MessageSquare size={12} /> {item.messages.length} poruka
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
