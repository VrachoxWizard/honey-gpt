import { Check, Copy, Pencil, RefreshCcw, Volume2, VolumeX } from 'lucide-react';
import React, { useState } from 'react';
import { cn } from '../utils/cn';
import { useToast } from '../hooks/useToast';
import { useClipboard } from '../hooks/useClipboard';
import { SaintPortrait } from './SaintPortrait';
import type { Message } from '@shared/types';
import { MessageContent } from './chat/MessageContent';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { stripThinking } from '../utils/textUtils';

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
      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-ink-faint hover:text-gold-bright rounded-md hover:bg-parchment-3/60 transition-colors select-none cursor-pointer"
      title="Prepiši"
      aria-label="Prepiši tekst"
    >
      {copied ? <Check size={13} className="text-gold-bright" /> : <Copy size={13} />}
    </button>
  );
}

function SpeechButton({ text }: { text: string }) {
  const { speak, stop, isSpeaking, supported } = useTextToSpeech();

  if (!supported) return null;

  return (
    <button
      onClick={() => (isSpeaking ? stop() : speak(text))}
      className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-ink-faint hover:text-gold-bright rounded-md hover:bg-parchment-3/60 transition-colors select-none cursor-pointer"
      title={isSpeaking ? 'Zaustavi čitanje' : 'Pročitaj naglas'}
      aria-label={isSpeaking ? 'Zaustavi čitanje' : 'Pročitaj naglas'}
    >
      {isSpeaking ? <VolumeX size={13} className="text-oxblood" /> : <Volume2 size={13} />}
    </button>
  );
}

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
    <article
      role="listitem"
      aria-label={isUser ? 'Korisnička poruka' : 'Odgovor Haničara'}
      className="group w-full max-w-[720px] mx-auto animate-ink-in animate-edge-glow"
    >
      <div
        className={cn('flex items-center gap-2.5 mb-2.5', isUser ? 'flex-row-reverse' : 'flex-row')}
      >
        {isUser ? (
          <span className="rubric text-[10px]">Molba</span>
        ) : (
          <span className="rubric text-[10px] flex items-center gap-2">
            <SaintPortrait size={24} />
            Haničar
          </span>
        )}
        {time && <span className="font-display italic text-[12px] text-ink-faint">{time}</span>}

        {!isEditing && (
          <div
            className={cn(
              'action-pill flex items-center gap-0.5 transition-opacity duration-150',
              'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100'
            )}
          >
            {!isWelcome && (
              <CopyButton text={isUser ? message.content : stripThinking(message.content)} />
            )}
            {!isUser && <SpeechButton text={stripThinking(message.content)} />}
            {isUser && (
              <button
                onClick={() => {
                  setIsEditing(true);
                  setEditContent(message.content);
                }}
                className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-ink-faint hover:text-gold-bright rounded-md hover:bg-parchment-3/60 transition-colors cursor-pointer"
                title="Ispravi molbu"
                aria-label="Ispravi molbu"
              >
                <Pencil size={13} />
              </button>
            )}
            {!isUser && isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center text-ink-faint hover:text-gold-bright rounded-md hover:bg-parchment-3/60 transition-colors cursor-pointer"
                title="Zatraži novi odgovor"
                aria-label="Zatraži novi odgovor"
              >
                <RefreshCcw size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            aria-label="Uredi molbu"
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
          <div className="bubble-user max-w-[88%] rounded-2xl rounded-tr-sm px-5 py-3.5">
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-line max-w-[260px]">
                <img
                  src={message.image}
                  alt="Privitak"
                  className="w-full h-auto object-cover max-h-[200px]"
                />
              </div>
            )}
            <div className="font-display text-[16px] leading-[1.7] text-ink whitespace-pre-wrap">
              {message.content}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-start">
          <div className="bubble-assistant folio-leaf max-w-[92%] rounded-2xl rounded-tl-sm px-5 py-3.5 dropcap prose prose-sm md:prose-base prose-codex prose-headings:font-ui prose-headings:font-bold prose-headings:tracking-wider prose-headings:text-ink prose-p:font-display prose-p:text-ink prose-p:leading-[1.7] prose-a:text-gold-bright prose-a:underline hover:prose-a:text-gold prose-strong:font-bold prose-strong:text-ink prose-code:text-gold-bright prose-pre:bg-transparent prose-pre:p-0 prose-pre:m-0">
            <MessageContent content={message.content} />
          </div>
        </div>
      )}
    </article>
  );
});
