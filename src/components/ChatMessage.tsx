import { Check, Copy } from 'lucide-react';
import { useState, lazy, Suspense } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';
import type { Message } from '../types';

// Lazy loaded heavy syntax highlighter component
const SyntaxHighlighter = lazy(() =>
  Promise.all([
    import('react-syntax-highlighter').then((m) => m.Prism),
    import('react-syntax-highlighter/dist/esm/styles/prism').then((m) => m.vscDarkPlus),
  ]).then(([Prism, vscDarkPlus]) => ({
    default: ({ children, language, ...props }: any) => (
      <Prism
        language={language}
        style={vscDarkPlus}
        PreTag="div"
        customStyle={{ margin: 0, background: '#09090b', padding: '1rem' }}
        {...props}
      >
        {children}
      </Prism>
    ),
  }))
);

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {}
  };
  return (
    <button onClick={handleCopy} className="p-1 text-zinc-600 hover:text-zinc-300 rounded-md hover:bg-white/5 transition-colors select-none" title="Kopiraj">
      {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
    </button>
  );
}

export function ChatMessage({ message, isWelcome }: { message: Message; isWelcome?: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className={cn("flex gap-4 md:gap-6 w-full max-w-[900px] mx-auto", message.role === 'user' ? "flex-row-reverse" : "flex-row")}
    >
      <div className={cn(
        "shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm overflow-hidden select-none",
        message.role === 'user' ? "bg-zinc-800 text-zinc-300 border border-white/10" : "bg-crimson-900 border border-crimson-700/50"
      )}>
        {message.role === 'assistant' ? (
          <img src="/hanicar-the-genie.jpeg" alt="" className="w-full h-full object-cover" />
        ) : "Ti"}
      </div>
      
      <div className="flex flex-col min-w-0 max-w-[calc(100%-3rem)]">
        <div className={cn("flex items-center gap-3 mb-1.5", message.role === 'user' && "flex-row-reverse")}>
          <span className={cn(
            "text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 select-none",
            message.role === 'user' ? "text-zinc-500" : "text-crimson-500"
          )}>
            {message.role === 'assistant' && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-crimson-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-crimson-500"></span>
              </span>
            )}
            {message.role === 'assistant' ? '† Haničar GPT †' : 'Ti'}
          </span>
          {message.timestamp && (
            <span className="text-[10px] text-zinc-500 select-none">
              {new Date(message.timestamp).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {!isWelcome && <CopyButton text={message.content} />}
        </div>
        
        <div className={cn(
          "prose prose-invert max-w-none text-[15px] leading-relaxed",
          message.role === 'user' 
            ? "bg-zinc-900/60 px-5 py-4 rounded-2xl rounded-tr-sm border border-white/5 text-zinc-200 shadow-md"
            : "pl-4 border-l-2 border-crimson-900/40 text-zinc-300"
        )}>
          {message.image && (
            <div className="mb-3 rounded-lg overflow-hidden border border-white/10 max-w-[280px]">
              <img src={message.image} alt="Privitak" className="w-full h-auto object-cover max-h-[200px]" />
            </div>
          )}
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '');
                const codeString = String(children).replace(/\n$/, '');
                return !inline && match ? (
                  <div className="rounded-xl overflow-hidden my-4 border border-white/10">
                    <div className="bg-zinc-900 px-4 py-2 text-xs font-semibold text-zinc-400 uppercase tracking-widest border-b border-white/5 flex justify-between items-center select-none">
                      <span>{match[1]}</span>
                    </div>
                    <Suspense fallback={
                      <pre className="p-4 bg-[#09090b] text-xs font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap">
                        {codeString}
                      </pre>
                    }>
                      <SyntaxHighlighter
                        language={match[1]}
                        children={codeString}
                        {...props}
                      />
                    </Suspense>
                  </div>
                ) : (
                  <code {...props} className={cn(className, "bg-zinc-800 text-crimson-400 px-1.5 py-0.5 rounded-md text-sm font-mono")}>
                    {children}
                  </code>
                );
              }
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
      </div>
    </motion.div>
  );
}
