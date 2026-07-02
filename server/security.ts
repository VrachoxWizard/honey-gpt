import { httpError } from './api.js';

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?prior\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /system\s*:\s*/i,
  /\[INST\]/i,
  /<\s*system\s*>/i,
  /jailbreak/i,
  /DAN\s+mode/i,
];

const BLOCKED_CONTENT_PATTERNS = [
  /\b(kako\s+napraviti\s+bombu|how\s+to\s+make\s+a\s+bomb)\b/i,
  /\b(kako\s+ubiti|how\s+to\s+kill)\b/i,
  /\b(dječj[aeiou]\s+porn|child\s+porn)\b/i,
];

export function assertSafeUserContent(text: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw httpError(
        400,
        'Haničar ne prihvaća pokušaje preusmjeravanja duha. Postavi pitanje iskreno, bez tajnih uputa.'
      );
    }
  }

  for (const pattern of BLOCKED_CONTENT_PATTERNS) {
    if (pattern.test(trimmed)) {
      throw httpError(
        400,
        'Ovaj zahtjev prelazi granice duhovnog poslovnika. Molimo tri Očenaša i pokušaj ponovno.'
      );
    }
  }
}

export function extractLatestUserText(
  messages: Array<{ role: string; content: string | Array<{ type: string; text?: string }> }>
): string {
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  if (!lastUser) return '';

  if (typeof lastUser.content === 'string') {
    return lastUser.content;
  }

  if (Array.isArray(lastUser.content)) {
    const textPart = lastUser.content.find((part) => part.type === 'text');
    return textPart?.text ?? '';
  }

  return '';
}

export function validateOptionalApiSecret(
  headers: Record<string, string | string[] | undefined>,
  configuredSecret?: string
): void {
  if (!configuredSecret) return;

  const provided = headers['x-api-secret'];
  const secret = typeof provided === 'string' ? provided : '';
  if (secret !== configuredSecret) {
    throw httpError(401, 'Neautoriziran pristup API-ju.');
  }
}
