import { motion } from 'framer-motion';

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
      <p className="rubric text-[10px] mb-3">Prvi moralni stroj</p>
      <h1 className="font-incipit text-4xl sm:text-5xl text-ink-strong tracking-wide leading-none mb-5">
        Mir s tobom, sine
      </h1>
      <p className="font-display italic text-lg text-ink-soft leading-relaxed mb-8 max-w-md">
        Reci što te muči, a ja ću ti odgovoriti — uz Božju pomoć i malo satire. Obred izaberi u
        izborniku.
      </p>

      <div className="rule-gold w-40 mb-8 animate-gold-pulse" />

      <div className="w-full flex flex-col gap-2">
        {molbe.map((m, i) => (
          <motion.button
            key={m}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, type: 'spring', stiffness: 120, damping: 18 }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSuggestionSelect(m)}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-vellum/50 border border-transparent hover:border-line transition-colors cursor-pointer"
          >
            <span className="text-gold group-hover:text-oxblood transition-colors shrink-0">❧</span>
            <span className="font-display text-[15px] text-ink leading-snug">{m}</span>
          </motion.button>
        ))}
      </div>

      <p className="mt-8 font-ui text-[11px] uppercase tracking-[0.16em] text-ink-faint">
        <kbd className="px-1.5 py-0.5 rounded border border-line bg-vellum/50 font-ui not-italic">
          ?
        </kbd>{' '}
        za kratice ·{' '}
        <kbd className="px-1.5 py-0.5 rounded border border-line bg-vellum/50 font-ui not-italic">
          Ctrl/⌘ K
        </kbd>{' '}
        za pretragu
      </p>
    </motion.div>
  );
}
