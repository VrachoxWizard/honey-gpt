import { httpError } from './api.js';
import { fetchCroatianNews } from './news.js';
import { CONSTANTS } from './constants.js';
import { generateCacheKey, getCachedReply, setCachedReply } from './cache.js';
import {
  isConfiguredOpenRouterKey,
  isRetryableOpenRouterError,
  isQuotaLikeError,
  streamOpenRouter,
} from './openrouter.js';
import { getModelCandidates } from './models.js';
import { summarizeConversationIfNeeded } from './summary.js';
import { buildOpenRouterMessages, getLorePhrases } from './prompts.js';
import type { ChatMessage, HanicarOptions } from '@shared/types';

interface PreparedRequest {
  apiKey: string;
  cleanMessages: ChatMessage[];
  models: string[];
  cacheKey: string;
  newsHeadlines: string[];
  summarizedContext: string;
  lorePhrases: string[];
}

function sanitizeMessages(messages: ChatMessage[], limit: number = CONSTANTS.MAX_MESSAGES): ChatMessage[] {
  return messages
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .map((message) => {
      if (typeof message.content === 'string') {
        return {
          role: message.role,
          content: String(message.content || '').slice(0, CONSTANTS.MAX_MESSAGE_CHARS),
        };
      }
      return message;
    })
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

  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  const userText = typeof lastUserMsg?.content === 'string' ? lastUserMsg.content : '';

  // 1. Automatsko sažimanje povijesti
  const summarizedContext = await summarizeConversationIfNeeded(messages, apiKey!);

  // 2. Skraćivanje poruka
  const cleanMessages = sanitizeMessages(
    messages, 
    summarizedContext ? CONSTANTS.SUMMARIZED_CONTEXT_MESSAGES : CONSTANTS.MAX_MESSAGES
  );

  if (!cleanMessages.some((message) => message.role === 'user')) {
    throw httpError(400, 'Posalji barem jednu korisnicku poruku.');
  }

  // 3. Dohvaćanje vijesti iz Hrvatske
  const wantsNews = CONSTANTS.NEWS_KEYWORDS.some(w => userText.toLowerCase().includes(w));
  const newsHeadlines = wantsNews ? await fetchCroatianNews() : [];

  // 4. Dinamičko usmjeravanje modela
  const models = getModelCandidates(options?.model, userText);

  // 5. Zazivanje Hanicar lore-a
  const lorePhrases = await getLorePhrases(userText);

  // 6. Cache kljuc
  const primaryModel = models[0];
  const cacheKey = generateCacheKey(cleanMessages, primaryModel, options?.toneMode, newsHeadlines);

  return {
    apiKey: apiKey!,
    cleanMessages,
    models,
    cacheKey,
    newsHeadlines,
    summarizedContext,
    lorePhrases,
  };
}

export async function streamHanicarReply(
  messages: ChatMessage[],
  onChunk: (chunk: { token?: string; model?: string }) => void,
  options?: HanicarOptions
): Promise<void> {
  const {
    apiKey,
    cleanMessages,
    models,
    cacheKey,
    newsHeadlines,
    summarizedContext,
    lorePhrases,
  } = await prepareHanicarRequest(messages, options);
  
  const cachedReply = await getCachedReply(cacheKey);

  if (cachedReply) {
    console.log('Cache HIT (Stream): Simuliram streaming iz spremljenog cachea.');
    onChunk({ model: cachedReply.model });
    
    // Simulacija glatkog streaminga
    const text = cachedReply.text;
    const chunkSize = CONSTANTS.CACHE_STREAM_CHUNK_SIZE;
    for (let i = 0; i < text.length; i += chunkSize) {
      const token = text.slice(i, i + chunkSize);
      onChunk({ token });
      await new Promise((resolve) => setTimeout(resolve, CONSTANTS.CACHE_STREAM_DELAY_MS));
    }
    return;
  }

  let lastError = '';
  
  const orMessages = buildOpenRouterMessages(
    cleanMessages, 
    options?.toneMode, 
    summarizedContext, 
    newsHeadlines, 
    lorePhrases
  );

  for (const model of models) {
    try {
      const fullText = await streamOpenRouter(
        apiKey,
        model,
        orMessages,
        onChunk
      );

      // Spremanje u cache nakon sto stream zavrsi uspjesno
      const reply = {
        text: fullText,
        model: model,
      };
      await setCachedReply(cacheKey, reply);
      return;
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
}
