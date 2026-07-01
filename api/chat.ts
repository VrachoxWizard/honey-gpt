import { handleChatPayloadStream, toClientError } from '../server/api.js';

type VercelRequest = {
  method?: string;
  body: unknown;
};

type VercelResponse = {
  status(statusCode: number): VercelResponse;
  json(payload: unknown): void;
  end(): void;
  setHeader(name: string, value: string): void;
  write(chunk: string): void;
  writeHead(statusCode: number, headers: Record<string, string>): void;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Haničar-GPT prima samo POST zahtjeve.' });
    return;
  }

  try {
    response.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    await handleChatPayloadStream(request.body, (chunk) => {
      response.write(`data: ${JSON.stringify(chunk)}\n\n`);
    });

    response.write('data: [DONE]\n\n');
    response.end();
  } catch (error) {
    const clientError = toClientError(error);
    try {
      response.write(`data: ${JSON.stringify({ error: clientError.message })}\n\n`);
      response.end();
    } catch {
      response.status(clientError.statusCode).json({ error: clientError.message });
    }
  }
}
