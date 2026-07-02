export function stripThinking(text: string): string {
  if (!text) return '';
  // Remove all closed thinking blocks
  let cleaned = text.replace(/<razmisljanje>[\s\S]*?<\/razmisljanje>/gi, '');
  // Remove open but unclosed thinking block and everything after it
  const openIndex = cleaned.toLowerCase().indexOf('<razmisljanje>');
  if (openIndex !== -1) {
    cleaned = cleaned.substring(0, openIndex);
  }
  // Remove leading newlines that typically follow the closing thinking tag
  if (cleaned.startsWith('\n')) {
    cleaned = cleaned.replace(/^\n+/, '');
  }
  return cleaned;
}
