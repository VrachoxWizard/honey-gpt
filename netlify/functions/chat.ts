import { handleChatPayloadStream, toClientError } from '../../server/api.js';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
};

type NetlifyEvent = {
  httpMethod: string;
  body: string | null;
};

type NetlifyResponse = {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
};

export async function handler(event: NetlifyEvent): Promise<NetlifyResponse> {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Haničar-GPT prima samo POST zahtjeve.' }),
    };
  }

  try {
    const payload = event.body ? JSON.parse(event.body) : {};
    let fullText = '';
    let responseModel = 'OpenRouter';

    await handleChatPayloadStream(payload, (chunk) => {
      if (chunk.token) {
        fullText += chunk.token;
      }
      if (chunk.model) {
        responseModel = chunk.model;
      }
    });

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ text: fullText, model: responseModel }),
    };
  } catch (error) {
    const clientError = toClientError(error);

    return {
      statusCode: clientError.statusCode,
      headers,
      body: JSON.stringify({ error: clientError.message }),
    };
  }
}
