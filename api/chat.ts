import { handleChatPayload, toClientError } from '../server/api';

type VercelRequest = {
  method?: string;
  body: unknown;
};

type VercelResponse = {
  status(statusCode: number): VercelResponse;
  json(payload: unknown): void;
  end(): void;
};

export default async function handler(request: VercelRequest, response: VercelResponse) {
  if (request.method === 'OPTIONS') {
    response.status(204).end();
    return;
  }

  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Haničar-GPT prima samo POST zahtjeve.' });
    return;
  }

  try {
    const result = await handleChatPayload(request.body);
    response.status(200).json(result);
  } catch (error) {
    const clientError = toClientError(error);
    response.status(clientError.statusCode).json({ error: clientError.message });
  }
}
