import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check } from 'lucide-react';
import { cn } from '../utils/cn';

export interface DropdownOption<T> {
  id: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}

interface DropdownProps<T> {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  trigger: React.ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

export function Dropdown<T extends string | number>({
  value,
  options,
  onChange,
  trigger,
  align = 'left',
  className,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id: T) => {
    onChange(id);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <div onClick={() => setIsOpen(!isOpen)}>{trigger}</div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={cn(
              'absolute top-full mt-2 w-64 bg-parchment-1/90 backdrop-blur-xl border border-gold/30 rounded-xl shadow-xl overflow-hidden z-50 p-1.5',
              align === 'right' ? 'right-0' : 'left-0'
            )}
            role="listbox"
          >
            {options.map((option) => (
              <button
                key={option.id}
                role="option"
                aria-selected={value === option.id}
                onClick={() => handleSelect(option.id)}
                className={cn(
                  'w-full text-left px-3 py-2.5 rounded-lg transition-all duration-200 flex items-center gap-3 cursor-pointer select-none group',
                  value === option.id
                    ? 'bg-ink/5 shadow-inner'
                    : 'hover:bg-ink/5'
                )}
              >
                {option.icon && (
                  <div
                    className={cn(
                      'shrink-0',
                      value === option.id ? 'text-gold-bright' : 'text-ink-faint group-hover:text-ink-soft'
                    )}
                  >
                    {option.icon}
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      'font-medium text-[13px] tracking-wide',
                      value === option.id ? 'text-ink' : 'text-ink-soft group-hover:text-ink'
                    )}
                  >
                    {option.label}
                  </div>
                  {option.description && (
                    <div className="text-[11px] text-ink-faint leading-tight mt-0.5 truncate">
                      {option.description}
                    </div>
                  )}
                </div>

                {value === option.id && (
                  <Check size={14} className="text-gold-bright shrink-0 ml-2" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
