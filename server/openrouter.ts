import ky from 'ky';
import { buildOpenRouterMessages, getLorePhrases } from './prompts.js';
import { CONSTANTS } from './constants.js';
import { parseSSEChunks, type OpenRouterStreamChunk } from './sse-parser.js';
import type { ChatMessage, ToneMode } from './shared-types.js';

export interface OpenRouterResponse {
  id: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
  }>;
  model: string;
}

export function isConfiguredOpenRouterKey(apiKey: string | undefined): boolean {
  return Boolean(apiKey && apiKey.startsWith('sk-or-') && apiKey.length > 20);
}

export function isRetryableOpenRouterError(message: string): boolean {
  return /\b(429|500|502|503|504|rate limit|timeout|temporarily|unavailable|overloaded)\b/i.test(
    message
  );
}

export function isQuotaLikeError(message: string): boolean {
  return /\b(429|quota|rate limit|credits|payment|required)\b/i.test(message);
}

/**
 * Dinamicki odabir modela ovisno o kontekstu.
 * Ako je zadani model neaktivan ili pod opterecenjem, vracamo niz alternativnih modela za fallback.
 */
export function getModelCandidates(requestedModel?: string, userText: string = ''): string[] {
  // 1. Ako je odreden specifičan model (npr. u UI), koristimo njega kao primarni
  if (requestedModel) {
    if (requestedModel.includes('deepseek-r1') || requestedModel.includes('qwen')) {
      return [requestedModel, CONSTANTS.DEFAULT_MODEL, 'meta-llama/llama-3.3-70b-instruct'];
    }
    return [requestedModel, CONSTANTS.DEFAULT_MODEL];
  }

  // 2. Ako prepoznajemo kodiranje, usmjeravamo na modele dobre za kodiranje
  const isCoding = CONSTANTS.CODE_KEYWORDS.some((word) => userText.toLowerCase().includes(word));
  if (isCoding) {
    return [
      'qwen/qwen-2.5-coder-32b-instruct',
      'google/gemini-2.5-pro',
      CONSTANTS.DEFAULT_MODEL,
    ];
  }

  // 3. Zadani redoslijed: brzi model pa fallback na veci model
  return [CONSTANTS.DEFAULT_MODEL, 'meta-llama/llama-3.3-70b-instruct'];
}

export async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  toneMode?: ToneMode,
  summarizedContext?: string,
  newsHeadlines?: string[]
): Promise<OpenRouterResponse> {
  const lorePhrases = await getLorePhrases(messages[messages.length - 1]?.content as string || '');
  const orMessages = buildOpenRouterMessages(messages, toneMode, summarizedContext, newsHeadlines, lorePhrases);

  return ky
    .post(CONSTANTS.OPENROUTER_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://honey-gpt.vercel.app',
        'X-Title': 'Haničar GPT',
      },
      json: {
        model,
        messages: orMessages,
        max_tokens: CONSTANTS.DEFAULT_MAX_TOKENS,
        temperature: CONSTANTS.LLM_TEMPERATURE,
      },
      timeout: CONSTANTS.SYNC_TIMEOUT_MS,
      retry: { limit: 1 },
    })
    .json<OpenRouterResponse>();
}

export async function streamOpenRouter(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  onChunk: (chunk: { token?: string; model?: string }) => void,
  toneMode?: ToneMode,
  summarizedContext?: string,
  newsHeadlines?: string[]
): Promise<string> {
  const lorePhrases = await getLorePhrases(messages[messages.length - 1]?.content as string || '');
  const orMessages = buildOpenRouterMessages(messages, toneMode, summarizedContext, newsHeadlines, lorePhrases);
  
  const response = await ky.post(CONSTANTS.OPENROUTER_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://honey-gpt.vercel.app',
      'X-Title': 'Haničar GPT',
    },
    json: {
      model,
      messages: orMessages,
      max_tokens: CONSTANTS.DEFAULT_MAX_TOKENS,
      temperature: CONSTANTS.LLM_TEMPERATURE,
      stream: true,
    },
    timeout: CONSTANTS.STREAM_TIMEOUT_MS,
    retry: { limit: 0 },
    onDownloadProgress: () => {
      // Ky stream requires this listener to work correctly in Node for some versions
    },
  });

  if (!response.body) {
    throw new Error('Response body is empty');
  }

  let fullResponseText = '';
  let sseBuffer = '';
  let modelEmitted = false;

  const decoder = new TextDecoder();
  for await (const chunk of response.body as AsyncIterable<Uint8Array>) {
    sseBuffer += decoder.decode(chunk, { stream: true });
    
    sseBuffer = parseSSEChunks(sseBuffer, (payload: OpenRouterStreamChunk) => {
      if (payload.error) {
        throw new Error(payload.error);
      }
      if (payload.model && !modelEmitted) {
        onChunk({ model: payload.model });
        modelEmitted = true;
      }
      const token = payload.choices?.[0]?.delta?.content;
      if (token) {
        fullResponseText += token;
        onChunk({ token });
      }
    });
  }

  return fullResponseText;
}

export async function summarizeConversationIfNeeded(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  if (messages.length < CONSTANTS.SUMMARIZATION_THRESHOLD) return '';

  const earlyMessages = messages.slice(0, -CONSTANTS.SUMMARIZED_CONTEXT_MESSAGES).filter(m => m.role === 'user' || m.role === 'assistant');
  if (earlyMessages.length === 0) return '';

  try {
    const payload = await ky.post(CONSTANTS.OPENROUTER_URL, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      json: {
        model: CONSTANTS.DEFAULT_MODEL,
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
        max_tokens: CONSTANTS.SUMMARIZATION_MAX_TOKENS,
        temperature: CONSTANTS.SUMMARIZATION_TEMPERATURE,
      },
      retry: { limit: 2 },
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
