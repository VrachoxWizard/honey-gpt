import type { ChatMessage, HanicarReply, HanicarOptions } from './shared-types.js';
import { buildOpenRouterMessages } from './prompts.js';
import { parseSSEChunks } from './sse-parser.js';

type OpenRouterChoice = {
  message?: {
    content?: string;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
  error?: {
    code?: number | string;
    message?: string;
  };
  model?: string;
};

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const DEFAULT_MAX_TOKENS = 2048;
const MAX_MESSAGES = 18;
const MAX_MESSAGE_CHARS = 8_000;

export async function createHanicarReply(
  messages: ChatMessage[],
  options?: HanicarOptions
): Promise<HanicarReply> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!isConfiguredOpenRouterKey(apiKey)) {
    throw httpError(
      500,
      'Nedostaje OPENROUTER_API_KEY. Dodaj ga u .env lokalno ili u Vercel Environment Variables.'
    );
  }

  const cleanMessages = sanitizeMessages(messages);

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Posalji barem jednu korisnicku poruku.');
  }

  const models = getModelCandidates(options?.model);
  let lastError = '';

  for (const model of models) {
    try {
      const response = await callOpenRouter(apiKey!, model, cleanMessages, options?.toneMode);
      const text = response.choices?.[0]?.message?.content?.trim();

      if (!text) {
        lastError = `OpenRouter model ${model} nije vratio tekst.`;
        continue;
      }

      return {
        text,
        model: response.model || model,
      };
    } catch (error) {
      lastError = getErrorMessage(error);

      if (!isRetryableOpenRouterError(lastError)) {
        break;
      }
    }
  }

  throw httpError(
    isQuotaLikeError(lastError) ? 429 : 502,
    lastError || 'OpenRouter trenutno nije dostupan.'
  );
}

function sanitizeMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => {
      if (typeof message.content === 'string') {
        return {
          role: message.role,
          content: String(message.content || '')
            .trim()
            .slice(0, MAX_MESSAGE_CHARS),
        };
      }
      return {
        role: message.role,
        content: message.content,
      };
    })
    .filter((message) => {
      if (typeof message.content === 'string') {
        return message.content.length > 0;
      }
      return Array.isArray(message.content) && message.content.length > 0;
    })
    .slice(-MAX_MESSAGES);
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  toneMode?: 'humilis' | 'clericus' | 'sanctus'
) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://honey-gpt.vercel.app',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'Hanicar GPT',
    },
    body: JSON.stringify({
      model,
      messages: buildOpenRouterMessages(messages, toneMode),
      max_tokens: readNumberEnv('OPENROUTER_MAX_TOKENS', DEFAULT_MAX_TOKENS),
      temperature: 0.9,
      stream: false,
    }),
  });

  const payload = (await response.json().catch(() => ({}))) as OpenRouterResponse;

  if (!response.ok) {
    const message = payload.error?.message || `OpenRouter API error (${response.status})`;
    throw new Error(message);
  }

  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  return payload;
}

function getModelCandidates(userModel?: string) {
  const configuredModel = userModel || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbacks = String(
    process.env.OPENROUTER_FALLBACK_MODELS ||
      'meta-llama/llama-3.3-70b-instruct,qwen/qwen-2.5-coder-32b-instruct,google/gemini-2.0-flash-lite-preview-02-05:free'
  )
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean);

  return [...new Set([configuredModel, ...fallbacks])];
}

function isConfiguredOpenRouterKey(apiKey: string | undefined) {
  return Boolean(apiKey && apiKey.startsWith('sk-or-') && apiKey.length > 20);
}

function readNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);

  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

function isRetryableOpenRouterError(message: string) {
  return /\b(429|500|502|503|504|rate limit|timeout|temporarily|unavailable|overloaded)\b/i.test(
    message
  );
}

function isQuotaLikeError(message: string) {
  return /\b(429|quota|rate limit|credits|payment|required)\b/i.test(message);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  return '';
}

export function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}

export async function streamHanicarReply(
  messages: ChatMessage[],
  onChunk: (chunk: { token?: string; model?: string }) => void,
  options?: HanicarOptions
): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!isConfiguredOpenRouterKey(apiKey)) {
    throw httpError(
      500,
      'Nedostaje OPENROUTER_API_KEY. Dodaj ga u .env lokalno ili u Vercel Environment Variables.'
    );
  }

  const cleanMessages = sanitizeMessages(messages);

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Posalji barem jednu korisnicku poruku.');
  }

  const models = getModelCandidates(options?.model);
  let lastError = '';

  for (const model of models) {
    try {
      const response = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://honey-gpt.vercel.app',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'Hanicar GPT',
        },
        body: JSON.stringify({
          model,
          messages: buildOpenRouterMessages(cleanMessages, options?.toneMode),
          max_tokens: readNumberEnv('OPENROUTER_MAX_TOKENS', DEFAULT_MAX_TOKENS),
          temperature: 0.9,
          stream: true,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as any;
        const message = payload.error?.message || `OpenRouter API error (${response.status})`;
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error('Response body is empty');
      }

      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      for await (const chunk of response.body as any) {
        buffer += decoder.decode(chunk, { stream: true });
        buffer = parseSSEChunks(buffer, (data) => {
          const token = data.choices?.[0]?.delta?.content;
          const responseModel = data.model;
          if (token || responseModel) {
            onChunk({ token, model: responseModel });
          }
        });
      }

      return;
    } catch (error) {
      lastError = getErrorMessage(error);

      if (!isRetryableOpenRouterError(lastError)) {
        break;
      }
    }
  }

  throw httpError(
    isQuotaLikeError(lastError) ? 429 : 502,
    lastError || 'OpenRouter trenutno nije dostupan.'
  );
}
