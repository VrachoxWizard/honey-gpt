import { handleChatPayloadStream, toClientError } from '../server/api.js';
import { checkRateLimit, getClientIp } from '../server/limiter.js';

type VercelRequest = {
  method?: string;
  body: unknown;
  headers?: Record<string, string | string[] | undefined>;
  socket?: { remoteAddress?: string };
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

  const headers = request.headers || {};
  const clientIp = getClientIp(headers, request.socket?.remoteAddress);
  const limiterRes = await checkRateLimit(clientIp);

  response.setHeader('X-RateLimit-Limit', '20');
  response.setHeader('X-RateLimit-Remaining', String(limiterRes.remaining));
  response.setHeader('X-RateLimit-Reset', String(limiterRes.resetTime));

  if (!limiterRes.allowed) {
    response.status(429).json({
      error: 'Previše zahtjeva. Molimo pričekajte trenutak prije novih pitanja za Haničara.',
    });
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
