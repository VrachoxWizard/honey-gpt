import { Search } from 'lucide-react';

interface ChatSearchProps {
  filter: string;
  onFilterChange: (val: string) => void;
}

export function ChatSearch({ filter, onFilterChange }: ChatSearchProps) {
  return (
    <div className="px-2 mb-2 shrink-0 relative">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-faint" size={12} />
      <input
        value={filter}
        onChange={(e) => onFilterChange(e.target.value)}
        placeholder="Prolistaj…"
        aria-label="Filtriraj zapise po naslovu"
        className="w-full bg-vellum/40 border border-line rounded-lg pl-7 pr-2 py-1.5 text-xs text-ink placeholder:text-ink-faint focus:outline-none focus:border-gold/50 transition-all"
      />
    </div>
  );
}
