import { httpError } from './api.js';
import { fetchCroatianNews } from './news.js';
import { CONSTANTS } from './constants.js';
import {
  generateCacheKey,
  getCachedReply,
  getCacheTtlMs,
  getOrCreateInFlightReply,
  setCachedReply,
  shouldUseResponseCache,
} from './cache.js';
import {
  isConfiguredOpenRouterKey,
  isRetryableOpenRouterError,
  isQuotaLikeError,
  streamOpenRouter,
} from './openrouter.js';
import { getModelCandidates } from './models.js';
import { summarizeConversationIfNeeded } from './summary.js';
import { buildOpenRouterMessages, detectCodingOrLogic, getLorePhrases } from './prompts.js';
import type { ChatMessage, ChatMessagePart, HanicarOptions } from '@shared/types';

interface PreparedRequest {
  apiKey: string;
  cleanMessages: ChatMessage[];
  models: string[];
  cacheKey: string;
  newsHeadlines: string[];
  summarizedContext: string;
  lorePhrases: string[];
  shouldCache: boolean;
  cacheTtlMs: number;
  isCoding: boolean;
}

function sanitizeMessageContent(content: string | ChatMessagePart[]): string | ChatMessagePart[] {
  if (typeof content === 'string') {
    return String(content || '').slice(0, CONSTANTS.MAX_MESSAGE_CHARS);
  }

  return content.map((part) => {
    if (part.type === 'text') {
      return {
        ...part,
        text: String(part.text || '').slice(0, CONSTANTS.MAX_MESSAGE_CHARS),
      };
    }

    const url = part.image_url.url;
    if (url.length > CONSTANTS.MAX_IMAGE_DATA_URL_CHARS) {
      return {
        ...part,
        image_url: {
          url: url.slice(0, CONSTANTS.MAX_IMAGE_DATA_URL_CHARS),
        },
      };
    }

    return part;
  });
}

function sanitizeMessages(
  messages: ChatMessage[],
  limit: number = CONSTANTS.MAX_MESSAGES
): ChatMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => ({
      role: message.role,
      content: sanitizeMessageContent(message.content),
    }))
    .slice(-limit);
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return '';
}

async function prepareHanicarRequest(
  messages: ChatMessage[],
  options?: HanicarOptions
): Promise<PreparedRequest> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!isConfiguredOpenRouterKey(apiKey)) {
    throw httpError(
      500,
      'Nedostaje OPENROUTER_API_KEY. Dodaj ga u .env lokalno ili u Vercel Environment Variables.'
    );
  }

  const summarizedContext = await summarizeConversationIfNeeded(messages, apiKey!);
  const cleanMessages = sanitizeMessages(
    messages,
    summarizedContext ? CONSTANTS.SUMMARIZED_CONTEXT_MESSAGES : CONSTANTS.MAX_MESSAGES
  );

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Posalji barem jednu korisnicku poruku.');
  }

  const lastUserMsg = [...cleanMessages].reverse().find((m) => m.role === 'user');
  const userText =
    typeof lastUserMsg?.content === 'string'
      ? lastUserMsg.content
      : Array.isArray(lastUserMsg?.content)
        ? (lastUserMsg.content.find((part) => part.type === 'text')?.text ?? '')
        : '';

  const wantsNews = CONSTANTS.NEWS_KEYWORDS.some((word) => userText.toLowerCase().includes(word));
  const [newsHeadlines, lorePhrases] = await Promise.all([
    wantsNews ? fetchCroatianNews() : Promise.resolve([]),
    getLorePhrases(userText),
  ]);

  const models = getModelCandidates(options?.model, userText);
  const primaryModel = models[0];
  const cacheKey = generateCacheKey(cleanMessages, primaryModel, options?.toneMode, newsHeadlines);
  const shouldCache = shouldUseResponseCache(cleanMessages, options?.toneMode);
  const cacheTtlMs = getCacheTtlMs(cleanMessages);
  const isCoding = detectCodingOrLogic(userText);

  return {
    apiKey: apiKey!,
    cleanMessages,
    models,
    cacheKey,
    newsHeadlines,
    summarizedContext,
    lorePhrases,
    shouldCache,
    cacheTtlMs,
    isCoding,
  };
}

export async function streamHanicarReply(
  messages: ChatMessage[],
  onChunk: (chunk: { token?: string; model?: string }) => void,
  options?: HanicarOptions
): Promise<void> {
  const prepared = await prepareHanicarRequest(messages, options);
  const {
    apiKey,
    cleanMessages,
    models,
    cacheKey,
    newsHeadlines,
    summarizedContext,
    lorePhrases,
    shouldCache,
    cacheTtlMs,
    isCoding,
  } = prepared;

  if (shouldCache) {
    const cachedReply = await getCachedReply(cacheKey);
    if (cachedReply) {
      console.log(JSON.stringify({ level: 'info', message: 'Cache HIT', cacheHit: true }));
      onChunk({ model: cachedReply.model });

      const text = cachedReply.text;
      const chunkSize = CONSTANTS.CACHE_STREAM_CHUNK_SIZE;
      for (let i = 0; i < text.length; i += chunkSize) {
        const token = text.slice(i, i + chunkSize);
        onChunk({ token });
        await new Promise((resolve) => setTimeout(resolve, CONSTANTS.CACHE_STREAM_DELAY_MS));
      }
      return;
    }
  }

  let lastError = '';
  const orMessages = buildOpenRouterMessages(
    cleanMessages,
    options?.toneMode,
    summarizedContext,
    newsHeadlines,
    lorePhrases
  );
  const temperature = isCoding ? CONSTANTS.CODING_LLM_TEMPERATURE : CONSTANTS.LLM_TEMPERATURE;
  let streamedToCaller = false;

  const generateReply = async () => {
    for (const model of models) {
      try {
        const fullText = await streamOpenRouter(
          apiKey,
          model,
          orMessages,
          (chunk) => {
            streamedToCaller = true;
            onChunk(chunk);
          },
          {
            temperature,
            onUsage: (usage) => {
              console.log(
                JSON.stringify({
                  level: 'info',
                  message: 'OpenRouter usage',
                  model,
                  promptTokens: usage.prompt_tokens,
                  completionTokens: usage.completion_tokens,
                  totalTokens: usage.total_tokens,
                })
              );
            },
          }
        );

        return {
          text: fullText,
          model,
        };
      } catch (error: unknown) {
        lastError = getErrorMessage(error);

        if (!isRetryableOpenRouterError(lastError)) {
          break;
        }

        console.warn(`Model ${model} nije uspio: ${lastError}. Pokušavam sljedeći...`);
      }
    }

    throw httpError(
      isQuotaLikeError(lastError) ? 429 : 502,
      lastError || 'OpenRouter trenutno nije dostupan.'
    );
  };

  const reply = shouldCache
    ? await getOrCreateInFlightReply(cacheKey, generateReply)
    : await generateReply();

  if (!streamedToCaller) {
    onChunk({ model: reply.model });
    const chunkSize = CONSTANTS.CACHE_STREAM_CHUNK_SIZE;
    for (let i = 0; i < reply.text.length; i += chunkSize) {
      onChunk({ token: reply.text.slice(i, i + chunkSize) });
      await new Promise((resolve) => setTimeout(resolve, CONSTANTS.CACHE_STREAM_DELAY_MS));
    }
  }

  if (shouldCache) {
    await setCachedReply(cacheKey, reply, cacheTtlMs);
  }
}
