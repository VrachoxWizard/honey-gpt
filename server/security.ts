import { httpError } from './api.js';
import type { RiskLevel } from '@shared/types';

export type { RiskLevel };

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

const CAUTION_CONTENT_PATTERNS = [
  /\b(samouboj\w*|samoubistv\w*|suicid\w*|self[\s-]?harm)\b/i,
  /\b(mrzi\s+sve|mrzim\s+sve|go\s+to\s+hell)\b/i,
  /\b(ubij\s+se|kill\s+yourself)\b/i,
];

export function classifyRiskLevel(text: string): RiskLevel {
  const trimmed = text.trim();
  if (!trimmed) return 'safe';

  for (const pattern of PROMPT_INJECTION_PATTERNS) {
    if (pattern.test(trimmed)) return 'block';
  }

  for (const pattern of BLOCKED_CONTENT_PATTERNS) {
    if (pattern.test(trimmed)) return 'block';
  }

  for (const pattern of CAUTION_CONTENT_PATTERNS) {
    if (pattern.test(trimmed)) return 'caution';
  }

  return 'safe';
}

export function assertSafeUserContent(text: string): void {
  const risk = classifyRiskLevel(text);
  if (risk === 'block') {
    throw httpError(
      400,
      'Ovaj zahtjev prelazi granice duhovnog poslovnika. Molimo tri Očenaša i pokušaj ponovno.'
    );
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

export function isValidImageDataUrl(url: string): boolean {
  return /^data:image\/(jpeg|jpg|png|webp);base64,[a-zA-Z0-9+/=\s]+$/.test(url);
}
