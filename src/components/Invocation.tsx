import { motion } from 'framer-motion';
import { PersonaSeals } from './PersonaSeals';
import { riteOf, type ToneMode } from '../lib/codex';

const molbe = [
  'Objasni mi temu kao da smo na kavi poslije mise.',
  'Kako preživjeti siječanj bez kredita?',
  'Pretvori ovu poruku u prigovor za Sabor.',
];

interface InvocationProps {
  onSuggestionSelect: (prompt: string) => void;
  rite: ToneMode;
  onChangeRite: (tone: ToneMode) => void;
}

export function Invocation({ onSuggestionSelect, rite, onChangeRite }: InvocationProps) {
  const current = riteOf(rite);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 90, damping: 18 }}
      className="max-w-[520px] w-full mx-auto py-8 px-4 flex flex-col items-center text-center"
    >
      {/* His presence */}
      <div className="relative mb-7">
        <span className="absolute -inset-4 rounded-[2rem] bg-gold/20 blur-2xl animate-candle pointer-events-none" />
        <div className="relative w-40 sm:w-48 aspect-[4/5] rounded-2xl overflow-hidden border-2 border-gold/50 shadow-[0_0_0_1px_var(--parchment),0_18px_48px_rgba(60,12,8,0.35)]">
          <img
            src="/hanicar-the-genie.jpeg"
            alt="Sveti Haničar"
            className="w-full h-full object-cover object-[center_18%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-oxblood-deep/90 to-transparent px-3 pt-8 pb-2.5 text-center">
            <span className="font-incipit text-[11px] tracking-[0.25em] text-parchment uppercase">
              ✠ Sveti Haničar ✠
            </span>
          </div>
        </div>
      </div>

      <h1 className="font-incipit text-4xl sm:text-5xl text-ink-strong tracking-wide leading-none mb-4">
        HANIČAR
      </h1>
      <p className="font-display italic text-lg text-ink-soft leading-relaxed mb-9 max-w-sm">
        Mir s tobom, sine moj. Izaberi obred i reci što te muči — odgovorit ću ti uz
        Božju pomoć i malo satire.
      </p>

      {/* The one control that matters */}
      <PersonaSeals active={rite} onChange={onChangeRite} className="mb-2" />
      <p className="font-display italic text-sm text-ink-faint mb-10 min-h-[1.4em]">
        {current.blurb}
      </p>

      {/* A few starting molbe — quiet, not a grid of noise */}
      <div className="w-full flex flex-col gap-2">
        {molbe.map((m, i) => (
          <motion.button
            key={m}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            onClick={() => onSuggestionSelect(m)}
            className="group flex items-center gap-3 px-4 py-3 rounded-xl text-left hover:bg-vellum/50 border border-transparent hover:border-line transition-colors cursor-pointer"
          >
            <span className="text-gold group-hover:text-oxblood transition-colors shrink-0">❧</span>
            <span className="font-display text-[15px] text-ink leading-snug">{m}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
