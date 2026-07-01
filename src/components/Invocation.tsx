import { motion } from 'framer-motion';
import { PersonaSeals } from './PersonaSeals';
import { riteOf, type ToneMode } from '../lib/codex';

const molbe = [
  'Objasni mi temu kao da smo na kavi poslije nedjeljne mise.',
  'Napiši plan za ovaj tjedan uz kršćansku poniznost.',
  'Kako preživjeti siječanj u Hrvatskoj bez kredita?',
  'Pretvori ovu poruku u diplomatski prigovor za Sabor.',
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
      className="max-w-[680px] w-full mx-auto py-6 px-2 text-center"
    >
      {/* Emblem */}
      <div className="flex justify-center mb-5">
        <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-gold/60 shadow-[0_0_0_1px_var(--parchment),0_6px_24px_rgba(60,12,8,0.3)]">
          <img
            src="/hanicar-the-genie.jpeg"
            alt="Sveti Haničar"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
        </div>
      </div>

      {/* Title */}
      <p className="rubric text-[10px] mb-2 flex items-center justify-center gap-2">
        <span className="text-gold">✠</span> Prvi moralni stroj <span className="text-gold">✠</span>
      </p>
      <h1 className="font-incipit text-5xl md:text-6xl text-ink-strong tracking-wide leading-none mb-3">
        HANIČAR
      </h1>
      <p className="font-display italic text-lg text-ink-soft mb-8">
        digitalni duh iz šahovnice
      </p>

      <div className="rule-gold max-w-xs mx-auto mb-8" />

      {/* Blessing with illuminated drop-cap */}
      <div className="dropcap folio-leaf text-left max-w-[520px] mx-auto font-display text-[17px] leading-relaxed text-ink mb-10 pl-2">
        <p>
          Mir s tobom, sine moj. Poslan sam da ti pomognem u ime pravde, hrvatstva i
          zdravog razuma. Izaberi obred, upiši svoju molbu, a ja ću ti odgovoriti — uz
          Božju pomoć i malo satire.
        </p>
      </div>

      {/* The rite dial — centerpiece */}
      <div className="mb-3">
        <p className="rubric text-[9px] mb-3">Izaberi obred</p>
        <PersonaSeals active={rite} onChange={onChangeRite} className="mb-3" />
        <p className="font-display italic text-sm text-ink-soft min-h-[1.5em]">
          {current.latin} — {current.blurb}
        </p>
      </div>

      <div className="rule-gold max-w-xs mx-auto my-8" />

      {/* Molbe */}
      <p className="rubric text-[9px] mb-4">Molbe za početak</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
        {molbe.map((m, i) => (
          <motion.button
            key={m}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -2 }}
            onClick={() => onSuggestionSelect(m)}
            className="group relative flex items-start gap-2.5 p-4 rounded-xl bg-vellum/40 border border-line hover:border-gold/50 transition-colors cursor-pointer"
          >
            <span className="text-gold text-lg leading-none mt-0.5 shrink-0 group-hover:text-oxblood transition-colors">
              ❧
            </span>
            <span className="font-display text-[15px] leading-snug text-ink">{m}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
