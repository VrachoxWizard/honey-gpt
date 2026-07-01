import {
  createHanicarReply,
  streamHanicarReply,
  httpError,
} from './hanicar.js';
import type { ChatMessage, HanicarOptions } from './shared-types.js';

export type ClientError = {
  statusCode: number;
  message: string;
};

export async function handleChatPayload(payload: unknown) {
  const messages = parseMessages(payload);
  const options = parseOptions(payload);
  return createHanicarReply(messages, options);
}

export async function handleChatPayloadStream(
  payload: unknown,
  onChunk: (chunk: { token?: string; model?: string }) => void
) {
  const messages = parseMessages(payload);
  const options = parseOptions(payload);
  return streamHanicarReply(messages, onChunk, options);
}

export function parseOptions(payload: unknown): HanicarOptions {
  if (!payload || typeof payload !== 'object') return {};
  const { model, toneMode } = payload as { model?: unknown; toneMode?: unknown };

  const options: HanicarOptions = {};
  if (typeof model === 'string' && model.trim()) {
    options.model = model.trim();
  }
  if (
    typeof toneMode === 'string' &&
    (toneMode === 'humilis' || toneMode === 'clericus' || toneMode === 'sanctus')
  ) {
    options.toneMode = toneMode;
  }
  return options;
}

export function parseMessages(payload: unknown): ChatMessage[] {
  if (!payload || typeof payload !== 'object') {
    throw httpError(400, 'Zahtjev mora sadržavati JSON objekt.');
  }

  const messages = (payload as { messages?: unknown }).messages;

  if (!Array.isArray(messages)) {
    throw httpError(400, 'Zahtjev mora sadržavati polje messages.');
  }

  return messages.map((message) => {
    if (!message || typeof message !== 'object') {
      throw httpError(400, 'Svaka poruka mora biti objekt.');
    }

    const role = (message as { role?: unknown }).role;
    const content = (message as { content?: unknown }).content;

    if (role !== 'user' && role !== 'assistant') {
      throw httpError(400, 'Poruka ima neispravnu ulogu.');
    }

    if (typeof content !== 'string' && !Array.isArray(content)) {
      throw httpError(400, 'Poruka mora imati tekstualni content ili polje content dijelova.');
    }

    if (Array.isArray(content)) {
      content.forEach((part) => {
        if (!part || typeof part !== 'object') {
          throw httpError(400, 'Svaki dio contenta mora biti objekt.');
        }
        const type = (part as { type?: unknown }).type;
        if (type !== 'text' && type !== 'image_url') {
          throw httpError(400, 'Neispravan tip dijela contenta.');
        }
        if (type === 'text' && typeof (part as { text?: unknown }).text !== 'string') {
          throw httpError(400, 'Tekstualni dio mora sadržavati string.');
        }
        if (type === 'image_url') {
          const imageUrl = (part as { image_url?: unknown }).image_url;
          if (
            !imageUrl ||
            typeof imageUrl !== 'object' ||
            typeof (imageUrl as { url?: unknown }).url !== 'string'
          ) {
            throw httpError(400, 'Slika mora sadržavati ispravan url.');
          }
        }
      });
    }

    return {
      role,
      content,
    };
  });
}

export function toClientError(error: unknown): ClientError {
  if (error instanceof Error) {
    const statusCode = getStatusCode(error);
    return {
      statusCode,
      message: statusCode >= 500 ? sanitizeServerMessage(error.message) : error.message,
    };
  }

  return {
    statusCode: 500,
    message: 'Neočekivana greška. Haničar je ispustio lampu.',
  };
}

function getStatusCode(error: Error) {
  const statusCode = (error as Error & { statusCode?: unknown }).statusCode;

  if (typeof statusCode === 'number' && statusCode >= 400 && statusCode <= 599) {
    return statusCode;
  }

  return 500;
}

function sanitizeServerMessage(message: string) {
  if (/Nedostaje OPENROUTER_API_KEY/i.test(message)) {
    return message;
  }

  if (/api[_ -]?key|OPENROUTER_API_KEY|token|secret/i.test(message)) {
    return 'Problem s API kljucem ili postavkama deploya.';
  }

  return message || 'Server nije uspio dobiti odgovor.';
}
