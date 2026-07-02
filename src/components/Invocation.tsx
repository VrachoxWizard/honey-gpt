import { motion } from 'framer-motion';
import { SaintPortrait } from './SaintPortrait';

const molbe = [
  'Objasni mi temu kao da smo na kavi poslije mise.',
  'Pomozi mi pronaći bug u ovom kodu.',
  'Kako preživjeti siječanj bez kredita?',
  'Pretvori ovu poruku u prigovor za Sabor.',
  'Napiši kratku satiričnu pjesmu o ponedjeljku.',
];

interface InvocationProps {
  onSuggestionSelect: (prompt: string) => void;
}

export function Invocation({ onSuggestionSelect }: InvocationProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      className="max-w-[540px] w-full mx-auto py-8 px-4 flex flex-col items-center text-center"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.05, type: 'spring', stiffness: 100, damping: 16 }}
        className="candle-glow mb-6"
      >
        <SaintPortrait size={80} halo />
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12 }}
        className="rubric mb-3"
      >
        Prvi moralni stroj
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 80, damping: 16 }}
        className="font-incipit text-[clamp(2.6rem,6vw,4rem)] text-ink-strong tracking-wide leading-none mb-5 text-glow-gold"
      >
        Mir s tobom, sine
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="font-display italic text-lg text-ink-soft leading-relaxed mb-8 max-w-md"
      >
        Reci što te muči, a ja ću ti odgovoriti — uz Božju pomoć i malo satire. Obred izaberi u
        izborniku.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scaleX: 0.5 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.36 }}
        className="rule-gold w-40 mb-8 animate-gold-pulse"
      />

      <div className="w-full flex flex-col gap-2.5">
        {molbe.map((m, i) => (
          <motion.button
            key={m}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 + 0.08 * i, type: 'spring', stiffness: 120, damping: 18 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestionSelect(m)}
            className="votive-card group flex items-center gap-3 px-4 py-3.5 rounded-xl text-left cursor-pointer"
          >
            <span className="text-gold group-hover:text-gold-bright transition-colors shrink-0 text-lg">
              ❧
            </span>
            <span className="font-display text-[15px] text-ink leading-snug">{m}</span>
          </motion.button>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8 font-ui text-[11px] uppercase tracking-[0.16em] text-ink-faint"
      >
        <kbd className="px-1.5 py-0.5 rounded border border-line bg-parchment-3/60 font-ui not-italic">
          ?
        </kbd>{' '}
        za kratice ·{' '}
        <kbd className="px-1.5 py-0.5 rounded border border-line bg-parchment-3/60 font-ui not-italic">
          Ctrl/⌘ K
        </kbd>{' '}
        za pretragu
      </motion.p>
    </motion.div>
  );
}
