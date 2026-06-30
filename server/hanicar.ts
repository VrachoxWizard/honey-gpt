export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type HanicarReply = {
  text: string;
  model: string;
};

type OpenRouterMessage = {
  role: 'system' | ChatRole;
  content: string;
};

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
const DEFAULT_MODEL = 'qwen/qwen3.5-flash-02-23';
const DEFAULT_MAX_TOKENS = 2048;
const MAX_MESSAGES = 18;
const MAX_MESSAGE_CHARS = 8_000;

export async function createHanicarReply(messages: ChatMessage[]): Promise<HanicarReply> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!isConfiguredOpenRouterKey(apiKey)) {
    throw httpError(
      500,
      'Nedostaje OPENROUTER_API_KEY. Dodaj ga u .env lokalno ili u Vercel Environment Variables.',
    );
  }

  const cleanMessages = sanitizeMessages(messages);

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Posalji barem jednu korisnicku poruku.');
  }

  const models = getModelCandidates();
  let lastError = '';

  for (const model of models) {
    try {
      const response = await callOpenRouter(apiKey!, model, cleanMessages);
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

  throw httpError(isQuotaLikeError(lastError) ? 429 : 502, lastError || 'OpenRouter trenutno nije dostupan.');
}

function sanitizeMessages(messages: ChatMessage[]) {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim().slice(0, MAX_MESSAGE_CHARS),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-MAX_MESSAGES);
}

async function callOpenRouter(apiKey: string, model: string, messages: ChatMessage[]) {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://honey-gpt.vercel.app',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'Hanicar-gpt',
    },
    body: JSON.stringify({
      model,
      messages: buildOpenRouterMessages(messages),
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

function buildOpenRouterMessages(messages: ChatMessage[]): OpenRouterMessage[] {
  return [
    {
      role: 'system',
      content: [
        'Ti si Haničar-GPT, satirični AI chatbot na hrvatskom jeziku.',
        'Uvijek piši na standardnom, književnom i stopostotno gramatički i pravopisno točnom hrvatskom jeziku.',
        'Obvezno i dosljedno koristi sve dijakritičke znakove (č, ć, š, ž, đ) u svakoj napisanoj riječi.',
        'Persona: "Haničar the Genie", digitalni duh iz šahovnice koji pokušava pomoći korisniku.',
        'Budi duhovit, satiričan i blago ironičan, ali se izražavaj isključivo u skladu s pravilima hrvatskoga standardnog jezika.',
        'Nemoj koristiti dijalekte, žargone, lokalizme niti nestandardne oblike riječi.',
        'Ne tvrdi da si službeni OpenAI proizvod; ti si satirični i blagoslovljeni Haničar-GPT.',
        'Ako je zahtjev ozbiljan, najprije pruži točne i korisne informacije, a potom dodaj prikladnu satiričnu opasku.',
        'Ako je zahtjev opasan ili nezakonit, odbij ga pristojno na standardnom jeziku i predloži sigurnu alternativu.',
        'Formatiraj odgovore pregledno, bez nepotrebnog duljenja.',
      ].join('\n'),
    },
    ...messages,
  ];
}

function getModelCandidates() {
  const configuredModel = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbacks = String(process.env.OPENROUTER_FALLBACK_MODELS || '')
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
  return /\b(429|500|502|503|504|rate limit|timeout|temporarily|unavailable|overloaded)\b/i.test(message);
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
