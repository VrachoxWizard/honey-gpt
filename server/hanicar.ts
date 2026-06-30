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

const DEFAULT_MODEL = 'gemini-1.5-flash';
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
  if (shouldUseLocalLlm()) {
    return createLocalLlmReply(messages);
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;

  if (!apiKey) {
    if (isLocalLlmBlockedOnHostedRuntime()) {
      throw httpError(
        500,
        'Lokalni LLM ne može raditi kroz Vercel/Netlify serverless jer njihov 127.0.0.1 nije tvoj laptop. Za deployed app postavi USE_LOCAL_LLM=false i GEMINI_API_KEY u Vercel Environment Variables, ili koristi lokalno http://127.0.0.1:5173/.',
      );
    }

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

function shouldUseLocalLlm() {
  if (process.env.USE_LOCAL_LLM !== 'true') {
    return false;
  }

  if (!isHostedServerlessRuntime()) {
    return true;
  }

  return process.env.LOCAL_LLM_ALLOW_HOSTED === 'true';
}

function isLocalLlmBlockedOnHostedRuntime() {
  return process.env.USE_LOCAL_LLM === 'true' && isHostedServerlessRuntime() && process.env.LOCAL_LLM_ALLOW_HOSTED !== 'true';
}

function isHostedServerlessRuntime() {
  return Boolean(process.env.VERCEL || process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME);
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

async function createLocalLlmReply(messages: ChatMessage[]): Promise<HanicarReply> {
  const url = process.env.LOCAL_LLM_API_URL || 'http://127.0.0.1:11434/api/generate';
  const model = process.env.LOCAL_LLM_MODEL || 'llama3';

  const cleanMessages = sanitizeMessages(messages);
  const prompt = buildPrompt(cleanMessages);

  const isOllamaGenerate = url.endsWith('/api/generate');
  const isOpenAi = url.includes('/v1/chat/completions') || url.includes('/v1/completions');

  let body: any;
  if (isOllamaGenerate) {
    body = {
      model,
      prompt,
      stream: false
    };
  } else if (isOpenAi) {
    body = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    };
  } else {
    body = {
      model,
      prompt,
      stream: false
    };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Local LLM API error (${res.status}): ${errText}`);
    }

    const data = await res.json() as any;
    let text = '';

    if (data.response) {
      text = data.response.trim();
    } else if (data.choices?.[0]?.message?.content) {
      text = data.choices[0].message.content.trim();
    } else if (data.message?.content) {
      text = data.message.content.trim();
    } else {
      text = JSON.stringify(data);
    }

    return {
      text,
      model: `local:${model}`
    };
  } catch (error: any) {
    throw httpError(502, `Greška pri spajanju na lokalni LLM: ${error.message}. Provjeri radi li Ollama/LM Studio.`);
  }
}
