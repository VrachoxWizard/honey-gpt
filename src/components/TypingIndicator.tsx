import { motion } from 'framer-motion';
import { Feather } from 'lucide-react';
import { SaintPortrait } from './SaintPortrait';

export function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-[720px] mx-auto"
    >
      <div className="flex items-center gap-2.5 mb-2">
        <span className="rubric text-[9px] flex items-center gap-2">
          <SaintPortrait size={24} />
          Haničar
        </span>
        <span className="font-display italic text-[11px] text-ink-faint flex items-center gap-1.5">
          <Feather size={12} className="text-oxblood animate-quill" />
          upisuje uz Božju pomoć…
        </span>
      </div>

      <div className="folio-leaf pl-2 space-y-2.5 max-w-md">
        {['w-11/12', 'w-full', 'w-2/3'].map((w, i) => (
          <div
            key={i}
            className={`h-3.5 ${w} rounded bg-parchment-3/60 relative overflow-hidden`}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gold/15 to-transparent -translate-x-full animate-[shimmer_1.6s_infinite]" />
          </div>
        ))}
      </div>
    </motion.div>
  );
}
