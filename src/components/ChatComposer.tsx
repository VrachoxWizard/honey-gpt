import {
  ChangeEvent,
  DragEvent,
  FormEvent,
  KeyboardEvent,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Square,
  Paperclip,
  X,
  AlertTriangle,
  Mic,
  MicOff,
  FileText,
  Loader2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { useToast } from '../hooks/useToast';
import { useChatStore } from '../store/chatStore';
import { TextInput } from './chat/ChatComposer/TextInput';
import { SendButton } from './chat/ChatComposer/SendButton';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { compressAndConvertImage } from './chat/ChatComposer/imageCompression';
import {
  isSupportedAttachment,
  parseDocumentFile,
  type AttachedDocument,
} from './chat/ChatComposer/fileHandling';
import { buildMessageWithDocument } from '../utils/documentAttachment';

interface ChatComposerProps {
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  isOnline?: boolean;
  error: string;
  onSubmit: (content: string, image?: string) => void;
  onAbort: () => void;
}

export function ChatComposer({
  draft,
  setDraft,
  isSending,
  isOnline = true,
  error,
  onSubmit,
  onAbort,
}: ChatComposerProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedDocument, setAttachedDocument] = useState<AttachedDocument | null>(null);
  const [isParsingDocument, setIsParsingDocument] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const { showToast } = useToast();

  const autoSpeak = useChatStore((s) => s.autoSpeak);
  const setAutoSpeak = useChatStore((s) => s.setAutoSpeak);

  const {
    startListening,
    stopListening,
    isListening,
    supported: speechSupported,
    transcript,
  } = useSpeechRecognition({
    onError: (message) => showToast(message, 'error'),
  });

  const draftRef = useRef(draft);
  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    if (transcript) {
      const currentDraft = draftRef.current;
      setDraft(currentDraft ? `${currentDraft} ${transcript}` : transcript);
    }
  }, [transcript, setDraft]);

  const processImageFile = async (file: File) => {
    try {
      const compressed = await compressAndConvertImage(file);
      setAttachedImage(compressed);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Greška prilikom obrade slike.';
      showToast(message, 'error');
    }
  };

  const processAttachmentFile = async (file: File) => {
    const kind = isSupportedAttachment(file);
    if (kind === 'image') {
      await processImageFile(file);
      return;
    }

    if (kind === 'document') {
      try {
        setIsParsingDocument(true);
        setAttachedDocument(await parseDocumentFile(file));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Greška prilikom obrade dokumenta.';
        showToast(message, 'error');
      } finally {
        setIsParsingDocument(false);
      }
      return;
    }

    showToast('Nepodržan format datoteke.', 'error');
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processAttachmentFile(file);
    e.target.value = '';
  };

  const handleSubmit = useCallback(
    (e?: FormEvent<HTMLFormElement>) => {
      e?.preventDefault();
      if (isSending || isParsingDocument || !isOnline) return;
      if (!draft.trim() && !attachedImage && !attachedDocument) return;

      const finalDraft = attachedDocument
        ? buildMessageWithDocument(draft, attachedDocument)
        : draft.trim();

      onSubmit(finalDraft, attachedImage || undefined);
      setDraft('');
      setAttachedImage(null);
      setAttachedDocument(null);
    },
    [
      isSending,
      isParsingDocument,
      isOnline,
      draft,
      attachedImage,
      attachedDocument,
      onSubmit,
      setDraft,
    ]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

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
    if (!file) return;
    await processAttachmentFile(file);
  };

  return (
    <div className="relative px-4 md:px-10 pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-parchment via-parchment/95 to-transparent">
      <div className="shimmer-divider absolute inset-x-0 top-0" />
      <div className="max-w-[720px] mx-auto relative">
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
                aria-label="Prekini generiranje odgovora"
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-parchment-2/90 border border-gold/30 shadow-md font-ui text-xs font-semibold text-ink-soft hover:text-ink transition-all cursor-pointer backdrop-blur-sm"
              >
                <Square fill="currentColor" size={9} className="text-oxblood" />
                Spusti pero
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div
            role="alert"
            className="mb-3 p-3 rounded-xl bg-parchment-2 border border-oxblood/30 border-l-4 border-l-oxblood text-oxblood text-sm flex items-start gap-2.5 font-display"
          >
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
            'composer-tray relative flex flex-col rounded-2xl p-1.5 transition-colors',
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
            {attachedDocument && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 5 }}
                className="relative inline-flex items-center gap-2 mb-2 ml-2 bg-vellum border border-line rounded-xl px-3 py-2 shrink-0 shadow-sm"
              >
                <FileText size={20} className="text-oxblood" />
                <span className="text-sm font-medium text-ink truncate max-w-[150px]">
                  {attachedDocument.name}
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedDocument(null)}
                  className="absolute -top-1.5 -right-1.5 bg-parchment-2 hover:bg-parchment-3 text-ink rounded-full p-1 border border-line cursor-pointer shadow"
                  aria-label="Ukloni dokument"
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
              onChange={handleFileChange}
              accept="image/*,.pdf,.txt"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isParsingDocument || !isOnline}
              aria-label="Priloži datoteku"
              className="relative shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-ink-soft hover:text-gold-bright hover:bg-parchment-3/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5 cursor-pointer"
            >
              {isParsingDocument ? (
                <Loader2 size={17} className="animate-spin text-gold" />
              ) : (
                <Paperclip size={17} />
              )}
            </button>

            {speechSupported && (
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                disabled={isSending || !isOnline}
                aria-label={isListening ? 'Zaustavi snimanje' : 'Govori'}
                className={cn(
                  'shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-parchment-3/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5 cursor-pointer',
                  isListening
                    ? 'text-oxblood animate-pulse bg-oxblood/10'
                    : 'text-ink-soft hover:text-gold-bright'
                )}
              >
                {isListening ? <MicOff size={17} /> : <Mic size={17} />}
              </button>
            )}

            <button
              type="button"
              onClick={() => setAutoSpeak(!autoSpeak)}
              aria-label={autoSpeak ? 'Isključi čitanje naglas' : 'Uključi čitanje naglas'}
              className={cn(
                'shrink-0 w-10 h-10 flex items-center justify-center rounded-lg hover:bg-parchment-3/60 transition-colors mb-0.5 cursor-pointer',
                autoSpeak ? 'text-gold-bright' : 'text-ink-soft hover:text-gold-bright'
              )}
            >
              {autoSpeak ? <Volume2 size={17} /> : <VolumeX size={17} />}
            </button>

            <TextInput
              textareaRef={textareaRef}
              draft={draft}
              setDraft={setDraft}
              isSending={isSending}
              placeholder={isOnline ? undefined : 'Nema veze — pošalji kad se vrati internet…'}
              onKeyDown={handleKeyDown}
            />

            <SendButton
              isDisabled={
                (!draft.trim() && !attachedImage && !attachedDocument) ||
                isSending ||
                isParsingDocument ||
                !isOnline
              }
              isSending={isSending}
            />
          </div>

          {draft.length > 0 && (
            <div className="flex justify-end px-3 pb-1 pt-0.5">
              <span
                className={cn(
                  'text-[10px]',
                  draft.length >= 8000 ? 'text-oxblood' : 'text-ink-faint'
                )}
              >
                {draft.length} / 8000
              </span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
