import { ChangeEvent, DragEvent, FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, RefreshCcw, Send, Square, Paperclip, X } from 'lucide-react';
import { cn } from '../utils/cn';

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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        } catch {
          resolve(event.target?.result as string); // Fallback to raw base64 if canvas drawing fails
        }
      };
      img.onerror = () => {
        reject(new Error('Učitavanje slike nije uspjelo.'));
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Čitanje datoteke nije uspjelo.'));
    };
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

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [draft]);

  // Keep focus when sending completes
  useEffect(() => {
    if (!isSending) {
      textareaRef.current?.focus();
    }
  }, [isSending]);

  const processImageFile = async (file: File) => {
    try {
      const compressedBase64 = await compressAndConvertImage(file);
      setAttachedImage(compressedBase64);
    } catch (err: any) {
      alert(err.message || 'Greška prilikom obrade slike.');
    }
  };

  const handleImageChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processImageFile(file);
    e.target.value = ''; // Reset input
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
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
    if (!isSending) {
      setIsDragging(true);
    }
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
    if (file && file.type.startsWith('image/')) {
      await processImageFile(file);
    }
  };

  return (
    <div className="p-4 md:p-6 bg-zinc-950/40 border-t border-white/5 backdrop-blur-md">
      <div className="max-w-[900px] mx-auto relative">
        {/* Floating Stop Button when sending */}
        {isSending && (
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={onAbort}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 border border-white/10 shadow-lg text-xs font-semibold text-zinc-300 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer"
            >
              <Square fill="currentColor" size={10} className="text-crimson-500" />
              Zaustavi
            </motion.button>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-200 text-sm flex items-start gap-3">
            <RefreshCcw size={16} className="mt-0.5 shrink-0" />
            <span className="leading-snug">{error}</span>
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col bg-zinc-900/50 backdrop-blur-md rounded-2xl border border-white/5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03),0_10px_30px_rgba(0,0,0,0.5)] p-2 focus-within:border-zinc-800 focus-within:bg-zinc-900/80 transition-all duration-200',
            isDragging && 'border-crimson-600/50 bg-zinc-900/80 ring-1 ring-crimson-600/20'
          )}
        >
          {/* Image preview thumbnail inside bubble */}
          <AnimatePresence>
            {attachedImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="relative inline-block w-20 h-20 mb-2 ml-2 select-none group shrink-0"
              >
                <img
                  src={attachedImage}
                  alt="Pretpregled privitka"
                  className="w-20 h-20 object-cover rounded-xl border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setAttachedImage(null)}
                  className="absolute -top-1.5 -right-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full p-1 border border-white/10 cursor-pointer shadow-md"
                  aria-label="Ukloni sliku"
                >
                  <X size={10} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-end gap-2 w-full">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            {/* Image Attachment Button */}
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isSending}
              aria-label="Učitaj sliku"
              className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5 ml-0.5 cursor-pointer border border-white/5"
            >
              <Paperclip size={18} />
            </button>

            <textarea
              ref={textareaRef}
              value={draft}
              rows={1}
              placeholder="Pitaj Haničara nešto pametno, glupo ili opasno..."
              aria-label="Unesi poruku za Haničara"
              onChange={(e) => setDraft(e.target.value.slice(0, 8000))}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="flex-1 max-h-[200px] bg-transparent resize-none py-3 pl-4 pr-16 text-zinc-100 placeholder:text-zinc-500 focus:outline-none text-[15px] leading-relaxed disabled:opacity-50"
            />

            {draft.length > 0 && (
              <span className={cn(
                "absolute right-16 bottom-3.5 text-[9px] font-bold font-mono select-none transition-colors pointer-events-none",
                draft.length > 7000 ? "text-crimson-500" : "text-zinc-500"
              )}>
                {draft.length}/8000
              </span>
            )}

            <motion.button
              whileHover={!isSending ? { scale: 1.05 } : {}}
              whileTap={!isSending ? { scale: 0.95 } : {}}
              type="submit"
              disabled={(!draft.trim() && !attachedImage) || isSending}
              aria-label="Pošalji poruku"
              className="shrink-0 w-12 h-12 flex items-center justify-center rounded-xl bg-crimson-600 hover:bg-crimson-500 text-white disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 transition-colors mb-0.5 mr-0.5 shadow-md shadow-crimson-900/20 cursor-pointer"
            >
              {isSending ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <Send size={18} className="ml-0.5" />
              )}
            </motion.button>
          </div>
        </form>
        <p className="text-center text-[10px] text-zinc-600 mt-3 font-medium select-none">
          Haničar GPT može pogriješiti. Provjerite važne informacije kod župnika.
        </p>
      </div>
    </div>
  );
}
