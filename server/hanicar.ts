import type { ChatMessage, HanicarReply, HanicarOptions } from './shared-types.js';
import { buildOpenRouterMessages, detectCodingOrLogic } from './prompts.js';
import { parseSSEChunks } from './sse-parser.js';
import { fetchCroatianNews } from './news.js';
import ky from 'ky';

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

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';

  // 1. Automatsko sažimanje povijesti ako je predugačka
  const summarizedContext = await summarizeConversationIfNeeded(messages, apiKey!);

  // 2. Skraćivanje poruka ako imamo sažetak (zadrži samo zadnjih 6 poruka za neposredni kontekst)
  const cleanMessages = sanitizeMessages(messages, summarizedContext ? 6 : MAX_MESSAGES);

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Posalji barem jednu korisnicku poruku.');
  }

  // 3. Dohvaćanje vijesti iz Hrvatske ako korisnik pita za aktualnosti
  const wantsNews = ['vijest', 'novost', 'dogadaj', 'novog', 'sabor', 'izbor', 'desilo', 'dogodilo', 'novine'].some(w => userText.toLowerCase().includes(w));
  const newsHeadlines = wantsNews ? await fetchCroatianNews() : [];

  // 4. Dinamičko usmjeravanje modela
  const models = getModelCandidates(options?.model, userText);
  let lastError = '';

  for (const model of models) {
    try {
      const response = await callOpenRouter(
        apiKey!,
        model,
        cleanMessages,
        options?.toneMode,
        summarizedContext,
        newsHeadlines
      );
      const text = response.choices?.[0]?.message?.content?.trim();

      if (!text) {
        lastError = `OpenRouter model ${model} nije vratio tekst.`;
        continue;
      }

      return {
        text,
        model: response.model || model,
      };
    } catch (error: any) {
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

function sanitizeMessages(messages: ChatMessage[], limit: number = MAX_MESSAGES) {
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
    .slice(-limit);
}

async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  toneMode?: 'humilis' | 'clericus' | 'sanctus',
  summarizedContext?: string,
  newsHeadlines?: string[]
) {
  // Korištenje ky klijenta s automatskim retries i timeout-om
  const payload = await ky.post(OPENROUTER_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://honey-gpt.vercel.app',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'Hanicar GPT',
    },
    json: {
      model,
      messages: buildOpenRouterMessages(messages, toneMode, summarizedContext, newsHeadlines),
      max_tokens: readNumberEnv('OPENROUTER_MAX_TOKENS', DEFAULT_MAX_TOKENS),
      temperature: 0.9,
      stream: false,
    },
    retry: {
      limit: 3,
      methods: ['post'],
      statusCodes: [408, 429, 500, 502, 503, 504],
    },
    timeout: 15000,
  }).json<OpenRouterResponse>().catch((err) => {
    throw new Error(err.message || 'Mrezna greska na OpenRouteru.');
  });

  if (payload.error?.message) {
    throw new Error(payload.error.message);
  }

  return payload;
}

function getModelCandidates(userModel?: string, userText?: string) {
  let configuredModel = userModel || process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  if (userText && (!userModel || userModel === DEFAULT_MODEL)) {
    if (detectCodingOrLogic(userText)) {
      configuredModel = 'qwen/qwen-2.5-coder-32b-instruct';
      console.log('Semantic Routing: preusmjeren tehnicki upit na Qwen Coder.');
    }
  }

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

async function summarizeConversationIfNeeded(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  if (messages.length < 10) return '';

  const earlyMessages = messages.slice(0, -4).filter(m => m.role === 'user' || m.role === 'assistant');
  if (earlyMessages.length === 0) return '';

  try {
    const payload = await ky.post(OPENROUTER_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      json: {
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Ti si pomocnik koji sazima razgovore na hrvatskom jeziku. Sazmi kljucne teme dosadasnjeg razgovora u maksimalno dvije recenice na hrvatskom jeziku. Fokusiraj se na ono sto je korisnik trazio i sto mu je sugovornik odgovorio.'
          },
          ...earlyMessages.map(m => ({
            role: m.role,
            content: typeof m.content === 'string' ? m.content : 'Slika ili nespecificiran sadržaj'
          }))
        ],
        max_tokens: 150,
        temperature: 0.3,
      },
      retry: 2,
      timeout: 8000,
    }).json<OpenRouterResponse>().catch(() => null);

    const text = payload?.choices?.[0]?.message?.content?.trim();
    if (text) {
      return text;
    }
  } catch (e) {
    console.error('Neuspjelo sazimanja povijesti:', e);
  }

  return '';
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

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';

  // 1. Automatsko sažimanje povijesti
  const summarizedContext = await summarizeConversationIfNeeded(messages, apiKey!);

  // 2. Skraćivanje poruka
  const cleanMessages = sanitizeMessages(messages, summarizedContext ? 6 : MAX_MESSAGES);

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Posalji barem jednu korisnicku poruku.');
  }

  // 3. Dohvaćanje vijesti iz Hrvatske
  const wantsNews = ['vijest', 'novost', 'dogadaj', 'novog', 'sabor', 'izbor', 'desilo', 'dogodilo', 'novine'].some(w => userText.toLowerCase().includes(w));
  const newsHeadlines = wantsNews ? await fetchCroatianNews() : [];

  // 4. Dinamičko usmjeravanje modela
  const models = getModelCandidates(options?.model, userText);
  let lastError = '';

  for (const model of models) {
    try {
      // Korištenje ky klijenta za streaming zahtjev
      const response = await ky.post(OPENROUTER_URL, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://honey-gpt.vercel.app',
          'X-Title': process.env.OPENROUTER_APP_NAME || 'Hanicar GPT',
        },
        json: {
          model,
          messages: buildOpenRouterMessages(cleanMessages, options?.toneMode, summarizedContext, newsHeadlines),
          max_tokens: readNumberEnv('OPENROUTER_MAX_TOKENS', DEFAULT_MAX_TOKENS),
          temperature: 0.9,
          stream: true,
        },
        retry: {
          limit: 3,
          methods: ['post'],
          statusCodes: [408, 429, 500, 502, 503, 504],
        },
        timeout: 20000,
      });

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
    } catch (error: any) {
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
