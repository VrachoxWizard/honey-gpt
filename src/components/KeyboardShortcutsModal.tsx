import { useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard } from 'lucide-react';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, dialogRef);

  const shortcuts = [
    { keys: ['Ctrl', 'K'], desc: 'Otvori pretragu razgovora' },
    { keys: ['Ctrl', 'N'], desc: 'Započni novi razgovor' },
    { keys: ['Ctrl', 'Shift', 'S'], desc: 'Izvezi razgovor u Markdown' },
    { keys: ['?'], desc: 'Prikaži kratice tipkovnice' },
    { keys: ['Esc'], desc: 'Zatvori aktivni modal ili izbornik' },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Kratice na tipkovnici"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl p-6 overflow-hidden z-10"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
              <div className="flex items-center gap-2.5">
                <Keyboard className="text-crimson-500" size={20} />
                <h3 className="font-bold text-lg text-zinc-100">Kratice na tipkovnici</h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 text-zinc-500 hover:text-white rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                aria-label="Zatvori modal"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              {shortcuts.map((shortcut, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-350 font-medium">{shortcut.desc}</span>
                  <div className="flex gap-1.5 select-none">
                    {shortcut.keys.map((key, keyIdx) => (
                      <kbd
                        key={keyIdx}
                        className="px-2 py-1 rounded bg-zinc-800 border border-white/5 text-zinc-300 font-mono text-xs font-bold shadow"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center text-[10px] text-zinc-500 font-medium">
              Zabavite se brzim kretanjem kroz aplikaciju uz Božje blagoslove.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
