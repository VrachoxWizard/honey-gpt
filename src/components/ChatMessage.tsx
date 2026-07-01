import { Check, Copy, Pencil, RefreshCcw } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../utils/cn';
import { useToast } from '../hooks/useToast';
import { useClipboard } from '../hooks/useClipboard';
import { ShikiHighlighter } from './ShikiHighlighter';
import { SaintPortrait } from './SaintPortrait';
import type { Message } from '../types';

function CopyButton({ text }: { text: string }) {
  const { copied, copy } = useClipboard();
  const { showToast } = useToast();
  
  const handleCopy = async () => {
    const success = await copy(text);
    if (success) {
      showToast('Prepisano u međuspremnik!', 'success');
    } else {
      showToast('Prepisivanje nije uspjelo.', 'error');
    }
  };
  
  return (
    <button
      onClick={handleCopy}
      className="p-1 text-ink-faint hover:text-ink rounded-md hover:bg-vellum/60 transition-colors select-none cursor-pointer"
      title="Prepiši"
      aria-label="Prepiši tekst"
    >
      {copied ? <Check size={13} className="text-gold-bright" /> : <Copy size={13} />}
    </button>
  );
}

function CopyBlockButton({ text }: { text: string }) {
  const { copied, copy } = useClipboard();
  return (
    <button
      onClick={() => copy(text)}
      className="text-ink-soft hover:text-ink transition-colors flex items-center gap-1 cursor-pointer select-none font-ui text-[11px]"
    >
      {copied ? <Check size={12} className="text-gold-bright" /> : <Copy size={12} />}
      <span>{copied ? 'Prepisano' : 'Prepiši'}</span>
    </button>
  );
}

const markdownComponents = {
  code({ inline, className, children, ...props }: React.ComponentPropsWithoutRef<'code'> & { inline?: boolean }) {
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    return !inline && match ? (
      <div className="rounded-lg overflow-hidden my-4 border border-line not-prose">
        <div className="bg-parchment-3 px-4 py-2 text-xs font-ui font-semibold text-ink-soft uppercase tracking-widest border-b border-line flex justify-between items-center select-none">
          <span>{match[1]}</span>
          <CopyBlockButton text={codeString} />
        </div>
        <ShikiHighlighter code={codeString} language={match[1]} />
      </div>
    ) : (
      <code
        {...props}
        className={cn(
          className,
          'bg-parchment-3/70 text-oxblood px-1.5 py-0.5 rounded text-[0.9em] font-mono'
        )}
      >
        {children}
      </code>
    );
  },
};

interface ChatMessageProps {
  message: Message;
  isWelcome?: boolean;
  isLastAssistant?: boolean;
  onRegenerate?: () => void;
  onEdit?: (messageId: string, newContent: string) => void;
}

export const ChatMessage = React.memo(function ChatMessage({
  message,
  isWelcome,
  isLastAssistant,
  onRegenerate,
  onEdit,
}: ChatMessageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);
  const isUser = message.role === 'user';

  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('hr-HR', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="group w-full max-w-[720px] mx-auto animate-ink-in">
      {/* Marginalia: author + time + actions */}
      <div
        className={cn(
          'flex items-center gap-2.5 mb-2',
          isUser ? 'flex-row-reverse' : 'flex-row'
        )}
      >
        {isUser ? (
          <span className="rubric text-[9px]">Molba</span>
        ) : (
          <span className="rubric text-[9px] flex items-center gap-2">
            <SaintPortrait size={24} />
            Haničar
          </span>
        )}
        {time && <span className="font-display italic text-[11px] text-ink-faint">{time}</span>}

        {!isEditing && (
          <div
            className={cn(
              'flex items-center gap-0.5 transition-opacity duration-150',
              'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100'
            )}
          >
            {!isWelcome && <CopyButton text={message.content} />}
            {isUser && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditContent(message.content);
                }}
                className="p-1 text-ink-faint hover:text-ink rounded-md hover:bg-vellum/60 transition-colors cursor-pointer"
                title="Ispravi molbu"
                aria-label="Ispravi molbu"
              >
                <Pencil size={13} />
              </button>
            )}
            {!isUser && isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1 text-ink-faint hover:text-ink rounded-md hover:bg-vellum/60 transition-colors cursor-pointer"
                title="Zatraži novi odgovor"
                aria-label="Zatraži novi odgovor"
              >
                <RefreshCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="w-full min-h-[90px] bg-vellum text-ink p-3 rounded-xl border border-gold/40 focus:outline-none focus:border-gold text-[15px] font-display resize-y"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-1.5 rounded-lg border border-line text-ink-soft hover:text-ink text-xs font-ui font-semibold uppercase tracking-wider cursor-pointer"
            >
              Odustani
            </button>
            <button
              type="button"
              onClick={() => {
                if (editContent.trim()) {
                  onEdit?.(message.id, editContent.trim());
                  setIsEditing(false);
                }
              }}
              className="px-3 py-1.5 rounded-lg bg-oxblood text-seal text-xs font-ui font-semibold uppercase tracking-wider hover:brightness-110 cursor-pointer"
            >
              Zapečati i pošalji
            </button>
          </div>
        </div>
      ) : isUser ? (
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-vellum/60 border border-line px-5 py-3.5 shadow-sm">
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-line max-w-[260px]">
                <img
                  src={message.image}
                  alt="Privitak"
                  className="w-full h-auto object-cover max-h-[200px]"
                />
              </div>
            )}
            <div className="font-display text-[16px] leading-relaxed text-ink whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      ) : (
        <div className="folio-leaf pl-2">
          {message.image && (
            <div className="mb-3 rounded-lg overflow-hidden border border-line max-w-[260px]">
              <img
                src={message.image}
                alt="Privitak"
                className="w-full h-auto object-cover max-h-[200px]"
              />
            </div>
          )}
          <div
            className={cn(
              'prose prose-codex max-w-none font-display text-[17px] leading-[1.75] text-ink',
              message.content.length > 40 && 'dropcap'
            )}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
});
