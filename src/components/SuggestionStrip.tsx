import { motion } from 'framer-motion';

const promptChips = [
  'Objasni mi temu kao da smo na kavi poslije nedjeljne mise.',
  'Napiši mi plan za ovaj tjedan uz kršćansku poniznost.',
  'Kako preživjeti siječanj u Hrvatskoj bez kredita?',
  'Pretvori ovu poruku u diplomatski prigovor za Sabor.',
];

interface SuggestionStripProps {
  onSelect: (prompt: string) => void;
}

export function SuggestionStrip({ onSelect }: SuggestionStripProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 p-4 md:p-6 border-b border-white/5 bg-zinc-900/10 backdrop-blur-sm">
      {promptChips.map((prompt) => (
        <motion.button 
          key={prompt}
          whileHover={{ y: -2, backgroundColor: 'rgba(39, 39, 42, 0.6)' }}
          whileTap={{ scale: 0.98 }}
          onClick={() => onSelect(prompt)}
          className="text-left p-3.5 bg-zinc-900/40 border border-white/5 rounded-xl text-sm text-zinc-300 font-medium leading-snug transition-all shadow-sm hover:border-white/10"
        >
          {prompt}
        </motion.button>
      ))}
    </div>
  );
}
