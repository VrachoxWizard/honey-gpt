import { httpError, type StreamChunk } from './api.js';
import { fetchCroatianNews } from './news.js';
import { searchWikipedia } from './wikipedia.js';
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
import { getModelCandidates, messageHasVisionContent } from './models.js';
import { summarizeConversationIfNeeded } from './summary.js';
import {
  buildOpenRouterMessages,
  detectCodingOrLogic,
  getKatekizamSnippet,
  getLorePhrases,
  getPromptVersion,
} from './prompts.js';
import { isCircuitOpen, recordProviderFailure, recordProviderSuccess } from './circuit-breaker.js';
import type { ChatMessage, ChatMessagePart, HanicarOptions } from '@shared/types';

interface PreparedRequest {
  apiKey: string;
  cleanMessages: ChatMessage[];
  models: string[];
  cacheKey: string;
  newsHeadlines: string[];
  summarizedContext: string;
  summaryFailed: boolean;
  lorePhrases: string[];
  katekizam: { answer: string; satireHint: string } | null;
  shouldCache: boolean;
  cacheTtlMs: number;
  isCoding: boolean;
  wikiSummary: string | null;
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

  if (await isCircuitOpen()) {
    throw httpError(503, 'OpenRouter je privremeno nedostupan. Molimo pokušajte za minutu.');
  }

  const summaryResult = await summarizeConversationIfNeeded(messages, apiKey!);
  const summarizedContext = summaryResult.text;
  const summaryFailed = summaryResult.failed;
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
  const wikiMatch = userText.match(/(?:tko|što|sto|gdje)\s+(?:je|su)\s+([^?.,!]+)/i);
  const wikiQuery = wikiMatch ? wikiMatch[1].trim() : null;

  const [newsHeadlines, lorePhrases, katekizam, wikiSummary] = await Promise.all([
    wantsNews ? fetchCroatianNews() : Promise.resolve([]),
    getLorePhrases(userText),
    getKatekizamSnippet(userText),
    wikiQuery ? searchWikipedia(wikiQuery) : Promise.resolve(null),
  ]);

  const hasVisionContent = messageHasVisionContent(cleanMessages);
  const models = getModelCandidates(options?.model, userText, hasVisionContent);
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
    summaryFailed,
    lorePhrases,
    katekizam,
    shouldCache,
    cacheTtlMs,
    isCoding,
    wikiSummary,
  };
}

export async function streamHanicarReply(
  messages: ChatMessage[],
  onChunk: (chunk: StreamChunk) => void,
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
    summaryFailed,
    lorePhrases,
    katekizam,
    shouldCache,
    cacheTtlMs,
    isCoding,
    wikiSummary,
  } = prepared;
  const logger = options?.context?.logger;

  if (summaryFailed) {
    onChunk({
      meta: {
        requestId: options?.context?.requestId,
        summaryFailed: true,
        promptVersion: getPromptVersion(),
      },
    });
  }

  if (shouldCache) {
    const cachedReply = await getCachedReply(cacheKey);
    if (cachedReply) {
      options?.context?.onCacheHit?.(true);
      logger?.info('Cache HIT', {
        cacheHit: true,
        requestId: options?.context?.requestId,
      });
      onChunk({
        model: cachedReply.model,
        meta: {
          requestId: options?.context?.requestId,
          cacheHit: true,
          promptVersion: getPromptVersion(),
        },
      });

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

  options?.context?.onCacheHit?.(false);

  let lastError = '';
  const orMessages = buildOpenRouterMessages(
    cleanMessages,
    options?.toneMode,
    summarizedContext,
    newsHeadlines,
    lorePhrases,
    katekizam,
    options?.riskLevel ?? 'safe',
    wikiSummary
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
            onUsage: async (usage) => {
              const totalTokens = usage.total_tokens ?? 0;
              onChunk({
                meta: {
                  requestId: options?.context?.requestId,
                  tokensUsed: totalTokens,
                  promptVersion: getPromptVersion(),
                },
              });
              if (options?.context?.onUsage && totalTokens > 0) {
                await options.context.onUsage({ totalTokens });
              }
            },
          }
        );

        await recordProviderSuccess();
        return {
          text: fullText,
          model,
        };
      } catch (error: unknown) {
        lastError = getErrorMessage(error);

        if (isRetryableOpenRouterError(lastError)) {
          await recordProviderFailure();
        }

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
    onChunk({
      model: reply.model,
      meta: {
        requestId: options?.context?.requestId,
        cacheHit: false,
        promptVersion: getPromptVersion(),
      },
    });
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
