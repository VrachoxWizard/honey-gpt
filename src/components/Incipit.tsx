import { PersonaSeals } from './PersonaSeals';
import type { ToneMode } from '../lib/codex';

interface IncipitProps {
  sessionTitle?: string;
  rite: ToneMode;
  onChangeRite: (tone: ToneMode) => void;
}

export function Incipit({ sessionTitle, rite, onChangeRite }: IncipitProps) {
  return (
    <header className="sticky top-0 z-20 bg-parchment/80 backdrop-blur-md border-b border-line">
      <div className="max-w-[820px] mx-auto px-5 md:px-8 py-3 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="rubric text-[9px] mb-1">Trenutni zapis</p>
          <h2 className="font-display text-lg md:text-xl text-ink-strong leading-none truncate max-w-[42ch]">
            {sessionTitle || 'Nova stranica'}
          </h2>
        </div>

        <div className="shrink-0">
          <p className="rubric text-[8px] text-center mb-1.5 hidden sm:block">Obred</p>
          <PersonaSeals active={rite} onChange={onChangeRite} />
        </div>
      </div>
    </header>
  );
}
