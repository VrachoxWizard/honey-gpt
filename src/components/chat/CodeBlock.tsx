import { useClipboard } from '@hooks/useClipboard';
import { ShikiHighlighter } from '../ShikiHighlighter';
import { Check, Copy } from 'lucide-react';
import { memo } from 'react';

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

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children: React.ReactNode;
}

export const CodeBlock = memo(function CodeBlock({ inline, className, children, ...props }: CodeBlockProps) {
  const match = /language-(\w+)/.exec(className || '');
  const codeString = String(children).replace(/\n$/, '');
  
  if (!inline && match) {
    return (
      <div className="rounded-lg overflow-hidden my-4 border border-line not-prose">
        <div className="bg-parchment-3 px-4 py-2 text-xs font-ui font-semibold text-ink-soft uppercase tracking-widest border-b border-line flex justify-between items-center select-none">
          <span>{match[1]}</span>
          <CopyBlockButton text={codeString} />
        </div>
        <ShikiHighlighter code={codeString} language={match[1]} />
      </div>
    );
  }

  return (
    <code
      {...props}
      className={`${className || ''} bg-parchment-3/70 text-oxblood px-1.5 py-0.5 rounded text-[0.9em] font-mono`}
    >
      {children}
    </code>
  );
});
