import { z } from 'zod';
import { streamHanicarReply } from './hanicar.js';
import type { ChatMessage } from './shared-types.js';

export type ClientError = {
  statusCode: number;
  message: string;
};

export function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

// Zod definicija sheme za dijelove poruke (tekst ili slika)
const MessagePartSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('text'),
    text: z.string(),
  }),
  z.object({
    type: z.literal('image_url'),
    image_url: z.object({
      url: z.string(),
    }),
  }),
]);

// Zod definicija sheme za cijeli API zahtjev
const ChatPayloadSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.union([z.string(), z.array(MessagePartSchema)]),
    })
  ),
  model: z.string().trim().optional(),
  toneMode: z.enum(['humilis', 'clericus', 'sanctus']).optional(),
});

/**
 * Validira payload koristenjem Zod sheme i vraca ociscene podatke.
 * Ako validacija ne uspije, baca standardnu HTTP 400 gresku.
 */
export function validateAndParsePayload(payload: unknown) {
  const result = ChatPayloadSchema.safeParse(payload);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue.path.join('.');
    const friendlyMessage = `Neispravan format zahtjeva na polju '${path}': ${firstIssue.message}`;
    throw httpError(400, friendlyMessage);
  }

  return result.data;
}



export async function handleChatPayloadStream(
  payload: unknown,
  onChunk: (chunk: { token?: string; model?: string }) => void
) {
  const { messages, model, toneMode } = validateAndParsePayload(payload);
  return streamHanicarReply(messages as ChatMessage[], onChunk, { model, toneMode });
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
    message: 'Neocekivana greska. Hanicar je ispustio lampu.',
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
    return 'Problem s API kljucem ili postavakama deploya.';
  }

  return message || 'Server nije uspio dobiti odgovor.';
}
