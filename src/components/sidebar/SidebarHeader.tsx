import { Feather } from 'lucide-react';
import { PersonaSeals } from '../PersonaSeals';
import type { ToneMode } from '@lib/codex';

interface SidebarHeaderProps {
  onNewChat: () => void;
  onClose: () => void;
  rite: ToneMode;
  onChangeRite: (t: ToneMode) => void;
}

export function SidebarHeader({ onNewChat, onClose, rite, onChangeRite }: SidebarHeaderProps) {
  return (
    <div className="shrink-0 flex flex-col">
      {/* Saint — always watching */}
      <div className="p-4 pb-3">
        <div className="relative rounded-2xl overflow-hidden border-2 border-gold/50 shadow-[0_0_0_1px_var(--parchment),0_10px_30px_rgba(60,12,8,0.28)]">
          <span className="absolute -inset-2 bg-gold/15 blur-xl animate-candle pointer-events-none" />
          <img
            src="/hanicar-the-genie.jpeg"
            alt="Sveti Haničar"
            className="relative w-full h-[184px] object-cover object-[center_16%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-oxblood-deep/95 via-oxblood-deep/40 to-transparent px-3 pt-9 pb-2.5 text-center">
            <span className="font-incipit text-[12px] tracking-[0.24em] text-seal uppercase">
              Sveti Haničar
            </span>
          </div>
        </div>
      </div>

      {/* The rite dial — his voice */}
      <div className="px-4 pb-4">
        <PersonaSeals active={rite} onChange={onChangeRite} />
      </div>

      <div className="rule-gold mx-4 mb-3" />

      {/* New Chat Button */}
      <div className="px-4 mb-3">
        <button
          onClick={() => {
            onNewChat();
            onClose();
          }}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-oxblood text-seal font-ui text-xs font-semibold uppercase tracking-[0.14em] hover:brightness-110 transition-all cursor-pointer shadow-[0_3px_10px_rgba(60,12,8,0.25)]"
        >
          <Feather size={15} /> Novi zapis
        </button>
      </div>
    </div>
  );
}
