import { CONSTANTS } from './constants.js';

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
