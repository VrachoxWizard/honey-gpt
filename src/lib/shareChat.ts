import type { Message } from '@shared/types';

export type SharedChatPayload = {
  version: 1;
  title: string;
  messages: Message[];
  exportedAt: number;
};

function toBase64Url(value: string): string {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = padded.length % 4 === 0 ? '' : '='.repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function encodeSharedChat(payload: SharedChatPayload): string {
  return toBase64Url(JSON.stringify(payload));
}

export function decodeSharedChat(encoded: string): SharedChatPayload | null {
  try {
    const parsed = JSON.parse(fromBase64Url(encoded)) as SharedChatPayload;
    if (parsed.version !== 1 || !Array.isArray(parsed.messages)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/** Conservative browser URL limit (varies ~2k–8k; 6000 leaves headroom). */
export const MAX_SHARE_URL_LENGTH = 6000;

export const SHARE_URL_TOO_LONG_MESSAGE =
  'Razgovor je predugačak za dijeljenje putem linka. Skrati povijest ili preuzmi zapis kao datoteku.';

export function buildShareUrl(payload: SharedChatPayload): string | null {
  const url = new URL(window.location.href);
  url.pathname = '/share';
  url.searchParams.set('share', encodeSharedChat(payload));
  const urlString = url.toString();
  if (urlString.length > MAX_SHARE_URL_LENGTH) {
    return null;
  }
  return urlString;
}

export function readSharedChatFromLocation(): SharedChatPayload | null {
  if (typeof window === 'undefined') return null;
  const encoded = new URLSearchParams(window.location.search).get('share');
  if (!encoded) return null;
  return decodeSharedChat(encoded);
}

export function clearShareFromLocation(): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has('share')) return;
  url.searchParams.delete('share');
  if (url.pathname === '/share') {
    url.pathname = '/';
  }
  window.history.replaceState({}, '', url.pathname + url.search + url.hash);
}
