import { getEnv } from './env.js';
import { detectCodingOrLogic } from './prompts.js';
import { ALLOWED_MODELS, INTERNAL_FALLBACK_MODELS, isAllowedModel } from '../shared/models.js';

function uniqueModels(models: string[]): string[] {
  return [...new Set(models.filter(Boolean))];
}

export function resolveDefaultModel(): string {
  return getEnv().defaultModel;
}

export function resolveFallbackModels(): string[] {
  return getEnv().fallbackModels;
}

/**
 * Dinamicki odabir modela ovisno o kontekstu.
 * Ako je zadani model neaktivan ili pod opterecenjem, vracamo niz alternativnih modela za fallback.
 */
export function getModelCandidates(requestedModel?: string, userText: string = ''): string[] {
  const defaultModel = resolveDefaultModel();
  const envFallbacks = resolveFallbackModels();

  if (requestedModel) {
    if (!isAllowedModel(requestedModel)) {
      return uniqueModels([defaultModel, ...envFallbacks, ...INTERNAL_FALLBACK_MODELS]);
    }

    if (requestedModel.includes('deepseek-r1') || requestedModel.includes('qwen')) {
      return uniqueModels([requestedModel, defaultModel, ...envFallbacks]);
    }

    return uniqueModels([requestedModel, defaultModel, ...envFallbacks]);
  }

  if (detectCodingOrLogic(userText)) {
    return uniqueModels([
      'qwen/qwen-2.5-coder-32b-instruct',
      'google/gemini-2.5-pro',
      defaultModel,
      ...envFallbacks,
    ]);
  }

  return uniqueModels([defaultModel, ...envFallbacks]);
}

export function validateRequestedModel(model?: string): string | undefined {
  if (!model) return undefined;
  if (!isAllowedModel(model)) {
    return undefined;
  }
  return model;
}

export { ALLOWED_MODELS, isAllowedModel };
