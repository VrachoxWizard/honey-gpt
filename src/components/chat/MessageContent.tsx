import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemo, memo } from 'react';
import { CodeBlock } from './CodeBlock';
import type { Components } from 'react-markdown';

interface MessageContentProps {
  content: string;
}

export const MessageContent = memo(function MessageContent({ content }: MessageContentProps) {
  const markdownComponents = useMemo(
    () => ({
      code: CodeBlock as Components['code'],
    }),
    []
  );

  return (
    <div className="font-display text-[16px] leading-relaxed text-ink whitespace-pre-wrap">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
});
