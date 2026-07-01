import { ChangeEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Feather, Square, Paperclip, X, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../hooks/useToast';

interface ChatComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  error: string;
  onSubmit: (content: string, image?: string) => void;
  onAbort: () => void;
}

function compressAndConvertImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDimension = 1024;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        } catch {
          resolve(event.target?.result as string);
        }
      };
      img.onerror = () => reject(new Error('Učitavanje slike nije uspjelo.'));
      img.src = event.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Čitanje datoteke nije uspjelo.'));
    reader.readAsDataURL(file);
  });
}

export function ChatComposer({
  draft,
  setDraft,
  isSending,
  error,
  onSubmit,
  onAbort,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [draft]);

  useEffect(() => {
    if (!isSending) textareaRef.current?.focus();
  }, [isSending]);

  const processImageFile = async (file: File) => {
    try {
      const compressed = await compressAndConvertImage(file);
      setAttachedImage(compressed);
    } catch (err: any) {
      showToast(err?.message || 'Greška prilikom obrade slike.', 'error');
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
    e.target.value = '';
  };

  const handleSubmit = (e?: FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if (isSending) return;
    if (!draft.trim() && !attachedImage) return;
    onSubmit(draft.trim(), attachedImage || undefined);
    setAttachedImage(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSending) setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isSending) return;
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) await processImageFile(file);
  };

  return (
    <div className="px-4 md:px-8 pb-4 md:pb-6 pt-2 bg-gradient-to-t from-parchment via-parchment to-transparent">
      <div className="max-w-[720px] mx-auto relative">
        {/* Stop pero */}
        <AnimatePresence>
          {isSending && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute -top-12 left-1/2 -translate-x-1/2 z-10"
            >
              <button
                onClick={onAbort}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-parchment-2 border border-line shadow-md font-ui text-xs font-semibold text-ink-soft hover:text-ink transition-all cursor-pointer"
              >
                <Square fill="currentColor" size={9} className="text-oxblood" />
                Spusti pero
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="mb-3 p-3 rounded-xl bg-oxblood/10 border border-oxblood/25 text-oxblood text-sm flex items-start gap-2.5 font-display">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col bg-vellum/70 backdrop-blur-sm rounded-2xl border border-line shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_8px_28px_rgba(60,30,10,0.14)] p-2 focus-within:border-gold/50 transition-all duration-200',
            isDragging && 'border-gold/70 ring-2 ring-gold/25'
          )}
        >
          <AnimatePresence>
            {attachedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="relative inline-block w-20 h-20 mb-2 ml-2 select-none shrink-0"
              >
                <img
                  src={attachedImage}
                  alt="Pretpregled privitka"
                  className="w-20 h-20 object-cover rounded-xl border border-line"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-parchment-2 hover:bg-parchment-3 text-ink rounded-full p-1 border border-line cursor-pointer shadow"
                  aria-label="Ukloni sliku"
                >
                  <X size={10} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 w-full">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending}
              aria-label="Priloži sliku"
              className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl text-ink-soft hover:text-ink hover:bg-vellum disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5 ml-0.5 cursor-pointer"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={draft}
              rows={1}
              placeholder="Upiši svoju molbu Haničaru…"
              aria-label="Upiši molbu"
              onChange={(e) => setDraft(e.target.value.slice(0, 8000))}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="flex-1 max-h-[168px] bg-transparent resize-none py-3 px-2 text-ink placeholder:text-ink-faint focus:outline-none text-[16px] leading-relaxed font-display disabled:opacity-50"
            />

            <motion.button
              whileTap={!isSending ? { scale: 0.94 } : {}}
              type="submit"
              disabled={(!draft.trim() && !attachedImage) || isSending}
              aria-label="Zapečati i pošalji"
              className="wax-seal shrink-0 w-12 h-12 flex items-center justify-center rounded-full mb-0.5 mr-0.5 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Feather size={18} />
              )}
            </motion.button>
          </div>

          {draft.length > 0 && (
            <div className="flex justify-end px-3 pb-1 pt-0.5">
              <span
                className={cn(
                  'font-ui text-[10px] font-semibold select-none tabular-nums',
                  draft.length > 7000 ? 'text-oxblood' : 'text-ink-faint'
                )}
              >
                {draft.length}/8000
              </span>
            </div>
          )}
        </form>

        <p className="text-center font-display italic text-[12px] text-ink-faint mt-3 select-none">
          Haničar može pogriješiti. Za teške grijehe provjeri kod župnika.
        </p>
      </div>
    </div>
  );
}
