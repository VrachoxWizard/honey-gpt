import { memo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import { RITES, type ToneMode } from '../lib/codex';

interface PersonaSealsProps {
  active: ToneMode;
  onChange: (tone: ToneMode) => void;
  variant?: 'full' | 'bare';
  className?: string;
}

/**
 * The three rites of Haničar rendered as wax seals — the signature control.
 * `full` shows names + latin beneath each seal; `bare` is seals only.
 */
export const PersonaSeals = memo(function PersonaSeals({
  active,
  onChange,
  variant = 'full',
  className,
}: PersonaSealsProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Izaberi obred (stil satire)"
      className={cn('flex flex-wrap items-start justify-center gap-3 sm:gap-4', className)}
    >
      {RITES.map((rite) => {
        const isActive = rite.key === active;
        return (
          <button
            key={rite.key}
            role="radio"
            aria-checked={isActive}
            aria-label={`${rite.name} obred — ${rite.blurb}`}
            title={`${rite.latin} — ${rite.blurb}`}
            onClick={() => onChange(rite.key)}
            className="group flex flex-col items-center gap-1.5 cursor-pointer"
          >
            <motion.span
              whileTap={{ scale: 0.9 }}
              className={cn(
                'relative flex items-center justify-center rounded-full font-incipit select-none transition-all duration-300',
                variant === 'full' ? 'w-12 h-12 text-xl' : 'w-9 h-9 text-base',
                isActive
                  ? 'wax-seal'
                  : 'text-ink-soft border border-line bg-vellum/40 hover:border-gold/60 hover:text-ink'
              )}
            >
              {rite.seal}
              {isActive && (
                <span className="absolute -inset-1 rounded-full border border-gold/50 animate-candle pointer-events-none" />
              )}
            </motion.span>

            {variant === 'full' && (
              <span className="flex flex-col items-center leading-none">
                <span
                  className={cn(
                    'font-ui text-[10px] uppercase tracking-[0.2em] transition-colors',
                    isActive ? 'text-oxblood' : 'text-ink-soft group-hover:text-ink'
                  )}
                >
                  {rite.name}
                </span>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
});
