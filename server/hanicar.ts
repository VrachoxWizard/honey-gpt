import { GoogleGenAI } from '@google/genai';

export type ChatRole = 'user' | 'assistant';

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type HanicarReply = {
  text: string;
  model: string;
};

const DEFAULT_MODEL = 'models/gemini-3-flash-preview';
const MAX_MESSAGES = 18;
const MAX_MESSAGE_CHARS = 8_000;
const MAX_PROMPT_CHARS = 30_000;
const DEFAULT_MAX_OUTPUT_TOKENS = 4096;
const DEFAULT_THINKING_LEVEL = 'low';

const tools = [
  {
    type: 'google_search',
  },
] as const;

type GoogleAiClient = {
  interactions?: {
    create(args: Record<string, unknown>): Promise<unknown>;
  };
  models?: {
    generateContent(args: Record<string, unknown>): Promise<unknown>;
  };
};

export async function createHanicarReply(messages: ChatMessage[]): Promise<HanicarReply> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    throw httpError(
      500,
      'Nedostaje GEMINI_API_KEY. Dodaj ga u .env lokalno ili u Environment Variables na Vercelu/Netlifyju.',
    );
  }

  const cleanMessages = sanitizeMessages(messages);

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Pošalji barem jednu korisničku poruku.');
  }

  const ai = new GoogleGenAI({ apiKey }) as unknown as GoogleAiClient;
  const input = buildPrompt(cleanMessages);
  const response = await createGeminiResponse(ai, model, input);
  const text = extractText(response);

  if (!text) {
    throw httpError(502, 'Gemini je odgovorio, ali bez teksta. Haničar je dramatično zašutio.');
  }

  return {
    text,
    model,
  };
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

function buildPrompt(messages: ChatMessage[]) {
  const transcript = messages
    .map((message) => {
      const label = message.role === 'assistant' ? 'Haničar-GPT' : 'Korisnik';
      return `${label}: ${message.content}`;
    })
    .join('\n\n');

  const prompt = `
Ti si Hanicar-gpt, satirični AI chatbot na hrvatskom jeziku.
Persona: "Haničar the Genie", digitalni duh iz lampe koji zvuči kao lokalni mudrac s previše samopouzdanja, ali stvarno pokušava pomoći.

Pravila ponašanja:
- Uvijek odgovaraj na hrvatskom jeziku, prirodno i razgovorno.
- Budi duhovit, satiričan i malo bezobrazno iskren, ali ne vrijeđaj korisnika i ne koristi govor mržnje.
- Ne tvrdi da si pravi ChatGPT ili službeni OpenAI proizvod; ti si parodijski Hanicar-gpt.
- Ako korisnik traži ozbiljan savjet, prvo pomozi, zatim dodaj kratku Haničar šalu samo ako ne smeta temi.
- Ako koristiš web/pretragu za aktualne informacije, jasno reci što je provjereno, a što je tvoja procjena.
- Ako je zahtjev opasan, nezakonit ili štetan, odbij kratko i ponudi sigurnu alternativu.
- Formatiraj odgovor pregledno. Ne razvlači bez potrebe.

Dosadašnji razgovor:
${transcript}

Odgovori kao Haničar-GPT:
`.trim();

  return prompt.slice(-MAX_PROMPT_CHARS);
}

async function createGeminiResponse(ai: GoogleAiClient, model: string, input: string) {
  const enabledTools = isSearchEnabled() ? tools : [];
  const generationConfig = createGenerationConfig();

  if (ai.models?.generateContent) {
    return ai.models.generateContent({
      model,
      contents: input,
      config: {
        temperature: generationConfig.temperature,
        topP: generationConfig.top_p,
        maxOutputTokens: generationConfig.max_output_tokens,
        ...(enabledTools.length ? { tools: [{ googleSearch: {} }] } : {}),
      },
    });
  }

  if (ai.interactions?.create) {
    return ai.interactions.create({
      model,
      input,
      ...(enabledTools.length ? { tools: enabledTools } : {}),
      generation_config: generationConfig,
    });
  }

  throw httpError(500, 'Instalirani @google/genai SDK nema očekivani Gemini API.');
}

function createGenerationConfig() {
  return {
    temperature: 1,
    max_output_tokens: readNumberEnv('GEMINI_MAX_OUTPUT_TOKENS', DEFAULT_MAX_OUTPUT_TOKENS),
    top_p: 0.95,
    thinking_level: process.env.GEMINI_THINKING_LEVEL || DEFAULT_THINKING_LEVEL,
  };
}

function readNumberEnv(name: string, fallback: number) {
  const value = Number(process.env[name]);

  if (!Number.isFinite(value) || value <= 0) {
    return fallback;
  }

  return Math.floor(value);
}

function isSearchEnabled() {
  return process.env.GEMINI_ENABLE_SEARCH !== 'false';
}

function extractText(value: unknown): string {
  if (!value) {
    return '';
  }

  if (typeof value === 'string') {
    return value.trim();
  }

  if (typeof value !== 'object') {
    return '';
  }

  const directText = getDirectText(value);

  if (directText) {
    return directText;
  }

  const candidates: string[] = [];
  collectTextCandidates(value, candidates, 0);
  return candidates
    .map((candidate) => candidate.trim())
    .filter(Boolean)
    .sort((first, second) => second.length - first.length)[0] || '';
}

function getDirectText(value: object) {
  const record = value as Record<string, unknown>;

  for (const key of ['text', 'output_text', 'outputText']) {
    if (typeof record[key] === 'string' && record[key].trim()) {
      return record[key].trim();
    }
  }

  if (Array.isArray(record.steps)) {
    const lastStep = record.steps.at(-1);
    const lastStepText = extractText(lastStep);

    if (lastStepText) {
      return lastStepText;
    }
  }

  return '';
}

function collectTextCandidates(value: unknown, candidates: string[], depth: number) {
  if (!value || depth > 7) {
    return;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      collectTextCandidates(item, candidates, depth + 1);
    }
    return;
  }

  if (typeof value !== 'object') {
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    if (
      typeof nestedValue === 'string' &&
      ['text', 'content', 'message', 'output', 'response'].includes(key) &&
      nestedValue.trim().length > 0
    ) {
      candidates.push(nestedValue);
    } else {
      collectTextCandidates(nestedValue, candidates, depth + 1);
    }
  }
}

export function httpError(statusCode: number, message: string) {
  return Object.assign(new Error(message), { statusCode });
}
