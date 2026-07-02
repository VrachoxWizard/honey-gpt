import { useEffect, useState } from 'react';
import { codeToHtml } from 'shiki';

interface ShikiHighlighterProps {
  code: string;
  language: string;
}

export function ShikiHighlighter({ code, language }: ShikiHighlighterProps) {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    let active = true;
    async function highlight() {
      try {
        const out = await codeToHtml(code, {
          lang: language || 'text',
          theme: 'vsc-dark-plus',
        });
        if (active) {
          setHtml(out);
        }
      } catch {
        // Fallback to text
        try {
          const out = await codeToHtml(code, {
            lang: 'text',
            theme: 'vsc-dark-plus',
          });
          if (active) setHtml(out);
        } catch {
          if (active) {
            const escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            setHtml(`<pre class="p-4 overflow-x-auto"><code>${escaped}</code></pre>`);
          }
        }
      }
    }
    highlight();
    return () => {
      active = false;
    };
  }, [code, language]);

  if (!html) {
    return (
      <pre className="p-4 bg-[#09090b] text-xs font-mono text-zinc-500 overflow-x-auto whitespace-pre-wrap">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      dangerouslySetInnerHTML={{ __html: html }}
      className="shiki-container text-sm overflow-x-auto [&>pre]:!bg-[#09090b] [&>pre]:!p-4 [&>pre]:!m-0 [&>pre]:scrollbar-thin"
    />
  );
}
