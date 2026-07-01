import { motion } from 'framer-motion';
import { Feather, Library, Search, Sun, Moon, Keyboard } from 'lucide-react';
import { cn } from '../utils/cn';

interface SpineRailProps {
  theme: 'day' | 'night';
  onToggleTheme: () => void;
  onNewChat: () => void;
  onToggleKazalo: () => void;
  kazaloOpen: boolean;
  onSearch: () => void;
  onHelp: () => void;
}

function RailButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'relative flex items-center justify-center w-11 h-11 rounded-xl transition-colors cursor-pointer',
        active
          ? 'text-oxblood bg-vellum/60 border border-gold/40'
          : 'text-ink-soft hover:text-ink hover:bg-vellum/40 border border-transparent'
      )}
    >
      {children}
      {active && (
        <span className="absolute -left-[7px] top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-oxblood" />
      )}
    </motion.button>
  );
}

const Emblem = () => (
  <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-gold/50 shadow-[0_0_0_1px_var(--parchment),0_2px_8px_rgba(60,12,8,0.25)]">
    <img
      src="/hanicar-the-genie.jpeg"
      alt="Sveti Haničar"
      className="w-full h-full object-cover"
    />
    <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
  </div>
);

export function SpineRail({
  theme,
  onToggleTheme,
  onNewChat,
  onToggleKazalo,
  kazaloOpen,
  onSearch,
  onHelp,
}: SpineRailProps) {
  return (
    <>
      {/* Desktop: vertical spine */}
      <aside className="hidden md:flex flex-col items-center gap-2 w-[76px] py-5 bg-parchment-2/60 border-r border-line relative z-30">
        <Emblem />
        <div className="rule-gold w-8 my-2.5" />

        <RailButton label="Novi zapis — započni razgovor" onClick={onNewChat}>
          <Feather size={19} />
        </RailButton>
        <RailButton label="Kazalo — povijest razgovora" active={kazaloOpen} onClick={onToggleKazalo}>
          <Library size={19} />
        </RailButton>
        <RailButton label="Traži po zapisima (Ctrl K)" onClick={onSearch}>
          <Search size={19} />
        </RailButton>

        <div className="flex-1" />

        <RailButton
          label={theme === 'night' ? 'Upali dan (svjetlo)' : 'Zapali svijeću (tama)'}
          onClick={onToggleTheme}
        >
          {theme === 'night' ? <Sun size={18} /> : <Moon size={18} />}
        </RailButton>
        <RailButton label="Kratice tipkovnice (?)" onClick={onHelp}>
          <Keyboard size={18} />
        </RailButton>
      </aside>

      {/* Mobile: top bar */}
      <header className="md:hidden flex items-center justify-between px-3 h-14 bg-parchment-2/80 backdrop-blur-md border-b border-line sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleKazalo}
            aria-label="Kazalo — povijest razgovora"
            className="p-2 -ml-1 text-ink-soft hover:text-ink cursor-pointer"
          >
            <Library size={20} />
          </button>
          <div className="flex items-center gap-2">
            <Emblem />
            <span className="font-incipit text-sm tracking-[0.15em] text-ink-strong uppercase">
              Haničar
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onSearch}
            aria-label="Traži"
            className="p-2 text-ink-soft hover:text-ink cursor-pointer"
          >
            <Search size={19} />
          </button>
          <button
            onClick={onNewChat}
            aria-label="Novi zapis"
            className="p-2 text-ink-soft hover:text-ink cursor-pointer"
          >
            <Feather size={19} />
          </button>
          <button
            onClick={onToggleTheme}
            aria-label="Promijeni obasjanje"
            className="p-2 text-ink-soft hover:text-ink cursor-pointer"
          >
            {theme === 'night' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>
    </>
  );
}
