import { KeyboardEvent, RefObject, useEffect } from 'react';

interface TextInputProps {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  draft: string;
  setDraft: (value: string) => void;
  isSending: boolean;
  placeholder?: string;
  onKeyDown: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
}

export function TextInput({
  textareaRef,
  draft,
  setDraft,
  isSending,
  placeholder,
  onKeyDown,
}: TextInputProps) {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 168)}px`;
  }, [draft, textareaRef]);

  useEffect(() => {
    if (!isSending) textareaRef.current?.focus();
  }, [isSending, textareaRef]);

  return (
    <textarea
      ref={textareaRef}
      value={draft}
      rows={1}
      placeholder={placeholder ?? 'Upiši svoju molbu Haničaru…'}
      aria-label="Upiši molbu"
      onChange={(e) => setDraft(e.target.value.slice(0, 8000))}
      onKeyDown={onKeyDown}
      disabled={isSending}
      className="flex-1 max-h-[150px] bg-transparent resize-none py-2 px-1.5 text-ink placeholder:text-ink-faint focus:outline-none text-[15px] leading-snug font-display disabled:opacity-50"
    />
  );
}
