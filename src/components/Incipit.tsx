import { PersonaSeals } from './PersonaSeals';
import { SaintPortrait } from './SaintPortrait';
import type { ToneMode } from '../lib/codex';

interface IncipitProps {
  rite: ToneMode;
  onChangeRite: (tone: ToneMode) => void;
}

export function Incipit({ rite, onChangeRite }: IncipitProps) {
  return (
    <header className="sticky top-0 z-20 bg-parchment/75 backdrop-blur-md border-b border-line">
      <div className="max-w-[720px] mx-auto px-5 md:px-8 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <SaintPortrait size={40} halo />
          <span className="font-incipit text-base md:text-lg tracking-[0.14em] text-ink-strong uppercase truncate">
            Sveti Haničar
          </span>
        </div>
        <PersonaSeals active={rite} onChange={onChangeRite} variant="bare" />
      </div>
    </header>
  );
}
