import { createHanicarReply, httpError, type ChatMessage } from './hanicar';

export type ClientError = {
  statusCode: number;
  message: string;
};

export async function handleChatPayload(payload: unknown) {
  const messages = parseMessages(payload);
  return createHanicarReply(messages);
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

    if (typeof content !== 'string') {
      throw httpError(400, 'Poruka mora imati tekstualni content.');
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
  if (/Nedostaje GEMINI_API_KEY/i.test(message)) {
    return message;
  }

  if (/api[_ -]?key|GEMINI_API_KEY|token|secret/i.test(message)) {
    return 'Problem s Gemini API ključem ili postavkama deploya.';
  }

  return message || 'Server nije uspio dobiti odgovor.';
}
