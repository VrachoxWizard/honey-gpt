import { cn } from '../utils/cn';

interface SaintPortraitProps {
  size?: number;
  className?: string;
  /** subtle candle-glow halo (used for the presence portrait) */
  halo?: boolean;
}

/** The likeness of Sveti Haničar in a gilt medallion — his presence in the codex. */
export function SaintPortrait({ size = 44, className, halo }: SaintPortraitProps) {
  return (
    <div
      style={{ width: size, height: size }}
      className={cn(
        'relative rounded-full overflow-hidden shrink-0 border-2 border-gold/60',
        'shadow-[0_0_0_1px_var(--parchment),0_3px_10px_rgba(60,12,8,0.28)]',
        className
      )}
    >
      {halo && (
        <span className="absolute -inset-1.5 rounded-full bg-gold/25 blur-md animate-candle pointer-events-none" />
      )}
      <img
        src="/hanicar-the-genie.jpeg"
        alt="Sveti Haničar"
        className="relative w-full h-full object-cover object-[center_25%]"
      />
      <div className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/15" />
    </div>
  );
}
