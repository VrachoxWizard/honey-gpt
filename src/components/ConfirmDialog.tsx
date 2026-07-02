import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFocusTrap } from '../hooks/useFocusTrap';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Potvrdi',
  cancelLabel = 'Odustani',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, dialogRef);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-[2px]"
            onClick={onCancel}
            aria-hidden
          />
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-message"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            className="fixed left-1/2 top-1/2 z-[121] w-[min(92vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-line bg-parchment-2 p-5 shadow-[0_20px_60px_rgba(40,20,8,0.35)]"
          >
            <h2 id="confirm-dialog-title" className="font-incipit text-lg text-ink-strong mb-2">
              {title}
            </h2>
            <p id="confirm-dialog-message" className="text-sm text-ink-soft leading-relaxed mb-5">
              {message}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 rounded-lg border border-line text-ink-soft hover:text-ink hover:bg-vellum transition-colors cursor-pointer"
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="px-4 py-2 rounded-lg bg-oxblood text-parchment hover:bg-oxblood/90 transition-colors cursor-pointer"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
