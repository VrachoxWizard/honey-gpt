import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Feather, Library, Sun, Moon } from 'lucide-react';
import { cn } from '../utils/cn';
import { SaintPortrait } from './SaintPortrait';

interface SpineRailProps {
  theme: 'day' | 'night';
  onToggleTheme: () => void;
  onNewChat: () => void;
  onToggleKazalo: () => void;
  kazaloOpen: boolean;
}

function RailButton({
  caption,
  title,
  active,
  onClick,
  children,
}: {
  caption: string;
  title: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.94 }}
      onClick={onClick}
      title={title}
      aria-label={title}
      aria-pressed={active}
      className={cn(
        'relative flex flex-col items-center gap-1 w-[70px] py-2 rounded-xl transition-colors cursor-pointer',
        active
          ? 'text-oxblood bg-vellum/70 border border-gold/40'
          : 'text-ink-soft hover:text-ink hover:bg-vellum/40 border border-transparent'
      )}
    >
      {children}
      <span className="font-ui text-[9px] uppercase tracking-[0.12em] leading-none">
        {caption}
      </span>
      {active && (
        <span className="absolute -left-[6px] top-1/2 -translate-y-1/2 h-6 w-[3px] rounded-full bg-oxblood" />
      )}
    </motion.button>
  );
}

export function SpineRail({
  theme,
  onToggleTheme,
  onNewChat,
  onToggleKazalo,
  kazaloOpen,
}: SpineRailProps) {
  return (
    <>
      {/* Desktop: labelled vertical spine */}
      <aside className="hidden md:flex flex-col items-center gap-1.5 w-[94px] py-4 bg-parchment-2/60 border-r border-line relative z-30">
        <div className="flex flex-col items-center gap-1.5 pb-1">
          <SaintPortrait size={52} />
          <span className="font-incipit text-[11px] tracking-[0.18em] text-ink-strong uppercase">
            Haničar
          </span>
        </div>
        <div className="rule-gold w-10 my-1.5" />

        <RailButton caption="Novi" title="Novi zapis — započni razgovor" onClick={onNewChat}>
          <Feather size={20} />
        </RailButton>
        <RailButton
          caption="Kazalo"
          title="Kazalo — povijest razgovora (Ctrl K)"
          active={kazaloOpen}
          onClick={onToggleKazalo}
        >
          <Library size={20} />
        </RailButton>

        <div className="flex-1" />

        <RailButton
          caption={theme === 'night' ? 'Dan' : 'Noć'}
          title={theme === 'night' ? 'Upali dan (svjetlo)' : 'Zapali svijeću (tama)'}
          onClick={onToggleTheme}
        >
          {theme === 'night' ? <Sun size={19} /> : <Moon size={19} />}
        </RailButton>
      </aside>

      {/* Mobile: top bar */}
      <header className="md:hidden flex items-center justify-between px-3 h-14 bg-parchment-2/80 backdrop-blur-md border-b border-line sticky top-0 z-30">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onToggleKazalo}
            aria-label="Kazalo — povijest razgovora"
            className="flex items-center gap-1 p-1.5 -ml-1 text-ink-soft hover:text-ink cursor-pointer"
          >
            <Library size={20} />
            <span className="font-ui text-[10px] uppercase tracking-wider">Kazalo</span>
          </button>
          <div className="flex items-center gap-2">
            <SaintPortrait size={34} />
            <span className="font-incipit text-sm tracking-[0.15em] text-ink-strong uppercase">
              Haničar
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
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
