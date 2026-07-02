import { CONSTANTS } from './constants.js';
import { resolveDefaultModel } from './models.js';
import { callOpenRouterSync } from './openrouter.js';
import type { ChatMessage } from '@shared/types';

function getMessageText(message: ChatMessage): string {
  if (typeof message.content === 'string') {
    return message.content;
  }

  const textPart = message.content.find((part) => part.type === 'text');
  return textPart?.text ?? '';
}

function getTotalMessageChars(messages: ChatMessage[]): number {
  return messages.reduce((total, message) => total + getMessageText(message).length, 0);
}

export async function summarizeConversationIfNeeded(
  messages: ChatMessage[],
  apiKey: string
): Promise<string> {
  if (messages.length < CONSTANTS.SUMMARIZATION_THRESHOLD) return '';

  const earlyMessages = messages
    .slice(0, -CONSTANTS.SUMMARIZED_CONTEXT_MESSAGES)
    .filter((message) => message.role === 'user' || message.role === 'assistant');

  if (earlyMessages.length === 0) return '';
  if (getTotalMessageChars(earlyMessages) < CONSTANTS.SUMMARIZATION_MIN_TOTAL_CHARS) return '';

  try {
    const payload = await callOpenRouterSync(
      apiKey,
      resolveDefaultModel(),
      [
        {
          role: 'system',
          content:
            'Ti si pomocnik koji sazima razgovore na hrvatskom jeziku. Sazmi kljucne teme dosadasnjeg razgovora u maksimalno dvije recenice na hrvatskom jeziku. Fokusiraj se na ono sto je korisnik trazio i sto mu je sugovornik odgovorio.',
        },
        ...earlyMessages.map((message) => ({
          role: message.role,
          content: getMessageText(message) || 'Slika ili nespecificiran sadrzaj',
        })),
      ],
      {
        temperature: CONSTANTS.SUMMARIZATION_TEMPERATURE,
        maxTokens: CONSTANTS.SUMMARIZATION_MAX_TOKENS,
      }
    ).catch(() => null);

    const text = payload?.choices?.[0]?.message?.content?.trim();
    if (text) {
      return text;
    }
  } catch (error) {
    console.error('Neuspjelo sazimanja povijesti:', error);
  }

  return '';
}
