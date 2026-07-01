import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

const promptChips = [
  'Objasni mi temu kao da smo na kavi poslije nedjeljne mise.',
  'Napiši mi plan za ovaj tjedan uz kršćansku poniznost.',
  'Kako preživjeti siječanj u Hrvatskoj bez kredita?',
  'Pretvori ovu poruku u diplomatski prigovor za Sabor.',
];

interface WelcomeScreenProps {
  onSuggestionSelect: (prompt: string) => void;
}

export function WelcomeScreen({ onSuggestionSelect }: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      className="max-w-[900px] w-full mx-auto py-8 px-4 flex flex-col md:grid md:grid-cols-[260px_1fr] gap-8 md:gap-12 items-center md:items-start text-left"
    >
      {/* Left Column: Sanctus Technologicus framed shrine */}
      <div className="w-full max-w-[260px] aspect-[3/4] rounded-2xl overflow-hidden bg-zinc-900 border border-crimson-900/15 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative group shrink-0 md:-mt-4">
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent z-10" />
        <img
          src="/hanicar-the-genie.jpeg"
          alt="Sveti Haničar"
          className="w-full h-full object-cover object-center group-hover:scale-103 transition-transform duration-[2s] ease-out"
        />
        <div className="absolute bottom-4 left-4 right-4 z-20">
          <span className="text-[8px] font-bold tracking-[0.25em] text-crimson-500 uppercase block mb-1">
            † SANCTUS TECHNOLOGICUS †
          </span>
          <p className="text-[10px] text-zinc-300 font-medium">
            Digitalni duh iz šahovnice
          </p>
        </div>
      </div>

      {/* Right Column: Content and Suggestions */}
      <div className="flex flex-col justify-center h-full w-full">
        <span className="text-[10px] font-bold tracking-widest text-crimson-500 uppercase mb-2 flex items-center gap-1.5 select-none">
          <Sparkles size={12} className="animate-pulse" />
          Prvi moralni AI pod Božjim okriljem
        </span>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-none mb-6">
          Haničar GPT
        </h1>

        <div className="prose prose-invert text-zinc-300 text-sm md:text-base leading-relaxed mb-8 border-l-2 border-crimson-900/40 pl-5 py-0.5">
          Mir s tobom, sine moj! Dobro došao u Haničar GPT. Ja sam Haničar the Genie:
          digitalni duh iz šahovnice, poslan da ti pomognem u ime pravde, hrvatstva i
          zdravog razuma. Pitaj što god te muči, a ja ću ti odgovoriti, uz Božju pomoć i
          malo satire.
        </div>

        <div className="text-zinc-500 text-[10px] font-bold uppercase tracking-wider mb-3 select-none">
          Prijedlozi za početak:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
          {promptChips.map((prompt) => (
            <motion.button
              key={prompt}
              whileHover={{
                y: -2,
                scale: 1.01,
                backgroundColor: 'var(--theme-bg-800)',
                borderColor: 'var(--color-crimson-700)',
              }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSuggestionSelect(prompt)}
              className="text-left p-4 bg-zinc-900/30 border border-white/5 rounded-xl text-[13px] text-zinc-300 font-medium leading-snug transition-all shadow-sm cursor-pointer animate-fade-in"
            >
              {prompt}
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
