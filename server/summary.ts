import ky from 'ky';
import { CONSTANTS } from './constants.js';
import type { ChatMessage } from '@shared/types';
import type { OpenRouterResponse } from './openrouter.js';

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
