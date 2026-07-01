import type { Message } from '@shared/types';

export function exportChatToMarkdown(messages: Message[]) {
  let content = '# Razgovor s Haničar GPT-om\n\n';
  content += `*Satirični AI chatbot - Izvezeno: ${new Date().toLocaleString('hr-HR')}*\n\n---\n\n`;

  for (const message of messages) {
    if (message.role === 'assistant') {
      content += `**Haničar GPT:**\n\n${message.content}\n\n---\n\n`;
    } else {
      content += `**Ti:**\n\n${message.content}\n\n---\n\n`;
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
