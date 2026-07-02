import { z } from 'zod';
import { streamHanicarReply } from './hanicar.js';
import { validateRequestedModel } from './models.js';
import { assertSafeUserContent, extractLatestUserText } from './security.js';
import { CONSTANTS } from './constants.js';
import type { ChatMessage } from '@shared/types';

export type ClientError = {
  statusCode: number;
  message: string;
};

export function httpError(statusCode: number, message: string): Error & { statusCode: number } {
  const err = new Error(message) as Error & { statusCode: number };
  err.statusCode = statusCode;
  return err;
}

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

const ChatPayloadSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.union([
          z.string().max(100000, 'Tekst poruke prelazi dozvoljenu duljinu (100k znakova).'),
          z.array(MessagePartSchema),
        ]),
      })
    )
    .max(50, 'Maksimalno 50 poruka je dopušteno po zahtjevu.'),
  model: z.string().trim().optional(),
  toneMode: z.enum(['humilis', 'clericus', 'sanctus']).optional(),
});

export function assertPayloadSize(payload: unknown): void {
  const serialized = typeof payload === 'string' ? payload : JSON.stringify(payload ?? {});
  const byteLength = Buffer.byteLength(serialized, 'utf8');

  if (byteLength > CONSTANTS.MAX_REQUEST_BODY_BYTES) {
    throw httpError(
      413,
      'Zahtjev je prevelik. Skrati poruku ili ukloni veliku sliku prije slanja.'
    );
  }
}

export function validateAndParsePayload(payload: unknown) {
  assertPayloadSize(payload);

  const result = ChatPayloadSchema.safeParse(payload);

  if (!result.success) {
    const firstIssue = result.error.issues[0];
    const path = firstIssue.path.join('.');
    const friendlyMessage = `Neispravan format zahtjeva na polju '${path}': ${firstIssue.message}`;
    throw httpError(400, friendlyMessage);
  }

  const validatedModel = validateRequestedModel(result.data.model);
  const latestUserText = extractLatestUserText(result.data.messages);
  assertSafeUserContent(latestUserText);

  return {
    ...result.data,
    model: validatedModel,
  };
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
