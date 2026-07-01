import { Check, Copy, Pencil, RefreshCcw } from 'lucide-react';
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '../utils/cn';
import { useToast } from '../hooks/useToast';
import { ShikiHighlighter } from './ShikiHighlighter';
import type { Message } from '../types';

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast('Tekst kopiran u međuspremnik!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast('Kopiranje nije uspjelo.', 'error');
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md hover:bg-white/5 transition-colors select-none cursor-pointer"
      title="Kopiraj"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

function CopyBlockButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };
  return (
    <button
      onClick={handleCopy}
      className="text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1 cursor-pointer select-none font-sans"
    >
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
      <span>{copied ? 'Kopirano' : 'Kopiraj'}</span>
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

  return (
    <div
      className={cn(
        'group flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto animate-message-enter',
        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      <div
        className={cn(
          'shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden select-none',
          message.role === 'user'
            ? 'bg-zinc-800 text-zinc-300 border border-white/10'
            : 'bg-crimson-900 border border-crimson-700/50'
        )}
      >
        {message.role === 'assistant' ? (
          <img src="/hanicar-the-genie.jpeg" alt="" className="w-full h-full object-cover" />
        ) : (
          'Ti'
        )}
      </div>

      <div className="flex flex-col min-w-0 max-w-[calc(100%-3rem)]">
        <div
          className={cn(
            'flex items-center gap-3 mb-1.5',
            message.role === 'user' && 'flex-row-reverse'
          )}
        >
          <span
            className={cn(
              'text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 select-none',
              message.role === 'user' ? 'text-zinc-500' : 'text-crimson-500'
            )}
          >
            {message.role === 'assistant' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-crimson-500"></span>
              </span>
            )}
            {message.role === 'assistant' ? 'Haničar GPT' : 'Ti'}
          </span>
          {message.timestamp && (
            <span className="text-[10px] text-zinc-500 select-none">
              {new Date(message.timestamp).toLocaleTimeString('hr-HR', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          )}

          {/* Action bar — revealed on hover (always visible on touch) */}
          {!isEditing && (
            <div
              className={cn(
                'flex items-center gap-1 transition-opacity duration-150',
                'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100'
              )}
            >
              {!isWelcome && <CopyButton text={message.content} />}

              {message.role === 'user' && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setEditContent(message.content);
                  }}
                  className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md hover:bg-white/5 transition-colors select-none cursor-pointer"
                  title="Uredi poruku"
                  aria-label="Uredi poruku"
                >
                  <Pencil size={12} />
                </button>
              )}

              {message.role === 'assistant' && isLastAssistant && onRegenerate && (
                <button
                  onClick={onRegenerate}
                  className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md hover:bg-white/5 transition-colors select-none cursor-pointer"
                  title="Regeneriraj odgovor"
                  aria-label="Regeneriraj odgovor"
                >
                  <RefreshCcw size={12} />
                </button>
              )}
            </div>
          )}
        </div>

        <div
          className={cn(
            'prose prose-invert max-w-none text-[15px] leading-relaxed',
            message.role === 'user'
              ? 'bg-zinc-900/60 px-5 py-4 rounded-2xl rounded-tr-sm border border-white/5 text-zinc-200 shadow-md'
              : 'pl-4 border-l-2 border-crimson-900/40 text-zinc-300'
          )}
        >
          {message.image && (
            <div className="mb-3 rounded-lg overflow-hidden border border-white/10 max-w-[280px]">
              <img
                src={message.image}
                alt="Privitak"
                className="w-full h-auto object-cover max-h-[200px]"
              />
            </div>
          )}

          {isEditing ? (
            <div className="w-full flex flex-col gap-2 mt-1">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full min-h-[80px] bg-zinc-950 text-zinc-100 p-2.5 rounded-xl border border-crimson-900/20 focus:outline-none focus:ring-1 focus:ring-crimson-600 text-sm resize-y"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold cursor-pointer"
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
                  className="px-2.5 py-1.5 rounded-lg bg-crimson-600 hover:bg-crimson-500 text-white text-xs font-semibold cursor-pointer"
                >
                  Spremi i pošalji
                </button>
              </div>
            </div>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ _node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeString = String(children).replace(/\n$/, '');
                  return !inline && match ? (
                    <div className="rounded-xl overflow-hidden my-4 border border-white/10">
                      <div className="bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest border-b border-white/5 flex justify-between items-center select-none">
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
                        'bg-zinc-800 text-crimson-400 px-1.5 py-0.5 rounded-md text-sm font-mono'
                      )}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
});
