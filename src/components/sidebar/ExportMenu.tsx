import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderOutput } from 'lucide-react';
import { cn } from '@utils/cn';

export interface ExportMenuAction {
  id: string;
  label: string;
  icon: ReactNode;
  onSelect: () => void;
  variant?: 'default' | 'danger';
}

interface ExportMenuProps {
  actions: ExportMenuAction[];
  className?: string;
}

/**
 * A single "Izvezi" entry point that replaces a row of small icon buttons.
 * Groups export/share/import/danger actions behind one discoverable trigger,
 * mirroring the panel styling already used by `Dropdown`.
 */
export function ExportMenu({ actions, className }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div className={cn('relative', className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label="Izvezi ili podijeli razgovor"
        title="Izvezi / podijeli razgovor"
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-ink-soft hover:text-gold-bright hover:bg-parchment-3/60 transition-colors cursor-pointer font-ui text-[10px] uppercase tracking-wider"
      >
        <FolderOutput size={13} />
        Izvezi
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="menu"
            aria-label="Radnje nad razgovorom"
            className="absolute right-0 top-full mt-1.5 w-56 bg-parchment-2 border border-gold/30 rounded-xl shadow-xl overflow-hidden z-50 p-1.5"
          >
            {actions.map((action) => (
              <button
                key={action.id}
                type="button"
                role="menuitem"
                onClick={() => {
                  action.onSelect();
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full text-left px-2.5 py-2 rounded-lg transition-colors flex items-center gap-2.5 cursor-pointer text-[13px] font-ui',
                  action.variant === 'danger'
                    ? 'text-oxblood hover:bg-oxblood/10'
                    : 'text-ink-soft hover:bg-vellum/60 hover:text-ink'
                )}
              >
                <span className="shrink-0">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
