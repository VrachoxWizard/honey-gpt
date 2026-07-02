import type { Message } from '@shared/types';
import { stripThinking } from './textUtils';

export interface ExportMarkdownMeta {
  /** Session title, shown as the document heading when provided. */
  title?: string;
  /** Human-readable model display name. */
  model?: string;
  /** Human-readable rite/tone name. */
  rite?: string;
}

export function exportChatToMarkdown(messages: Message[], meta?: ExportMarkdownMeta) {
  const heading = meta?.title?.trim() || 'Razgovor s Haničar GPT-om';
  let content = `# ${heading}\n\n`;
  content += `*Satirični AI chatbot - Izvezeno: ${new Date().toLocaleString('hr-HR')}*\n\n`;

  const metaLines: string[] = [];
  if (meta?.rite) metaLines.push(`- **Obred:** ${meta.rite}`);
  if (meta?.model) metaLines.push(`- **Model:** ${meta.model}`);
  if (metaLines.length > 0) {
    content += `${metaLines.join('\n')}\n\n`;
  }

  content += '---\n\n';

  for (const message of messages) {
    const time = message.timestamp ? new Date(message.timestamp).toLocaleString('hr-HR') : null;
    const timeLine = time ? `*${time}*\n\n` : '';

    if (message.role === 'assistant') {
      content += `**Haničar GPT:**\n\n${timeLine}${stripThinking(message.content)}\n\n---\n\n`;
    } else {
      content += `**Ti:**\n\n${timeLine}${message.content}\n\n---\n\n`;
    }
  }

  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `hanicar_razgovor_${new Date().getTime()}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // Cleanup
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportChatToPNG(element: HTMLElement): Promise<boolean> {
  try {
    const originalScrollbar = element.style.scrollbarWidth;
    element.style.scrollbarWidth = 'none';

    const { toPng } = await import('html-to-image');
    const dataUrl = await toPng(element, {
      backgroundColor: 'var(--parchment)',
      style: {
        padding: '24px',
        height: 'auto',
        overflow: 'visible',
      },
      filter: (node) => {
        if (node instanceof HTMLElement) {
          const title = node.getAttribute('title') || node.getAttribute('aria-label');
          if (
            title === 'Prepiši' ||
            title === 'Pročitaj naglas' ||
            title === 'Ispravi molbu' ||
            title === 'Zaustavi čitanje' ||
            title === 'Zatraži novi odgovor' ||
            (node.tagName === 'BUTTON' &&
              node.classList.contains('cursor-pointer') &&
              (node.innerText === 'Odustani' || node.innerText === 'Zapečati i pošalji'))
          ) {
            return false;
          }
        }
        return true;
      },
    });

    element.style.scrollbarWidth = originalScrollbar;

    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `hanicar_razgovor_${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (error) {
    console.error('Failed to export chat to image', error);
    return false;
  }
}
