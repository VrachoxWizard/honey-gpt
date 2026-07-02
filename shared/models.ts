/** Modeli dostupni u UI-ju i na serveru. */
export const ALLOWED_MODELS = [
  'google/gemini-2.5-flash',
  'meta-llama/llama-3.3-70b-instruct',
  'qwen/qwen-2.5-coder-32b-instruct',
  'google/gemini-2.5-pro',
  'deepseek/deepseek-r1',
] as const;

/** Interni fallback modeli koje server smije koristiti pri retry-u. */
export const INTERNAL_FALLBACK_MODELS = [
  'google/gemini-2.5-flash',
  'meta-llama/llama-3.3-70b-instruct',
  'google/gemini-2.5-pro',
  'qwen/qwen-2.5-coder-32b-instruct',
] as const;

export type AllowedModelId = (typeof ALLOWED_MODELS)[number];

export const MODEL_DISPLAY_NAMES: Record<string, string> = {
  'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
  'meta-llama/llama-3.3-70b-instruct': 'Llama 3.3 70B',
  'qwen/qwen-2.5-coder-32b-instruct': 'Qwen 2.5 Coder',
  'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
  'deepseek/deepseek-r1': 'DeepSeek R1',
};

export function isAllowedModel(model: string): boolean {
  return (ALLOWED_MODELS as readonly string[]).includes(model);
}

export function modelDisplayName(id: string): string {
  if (MODEL_DISPLAY_NAMES[id]) return MODEL_DISPLAY_NAMES[id];
  return id.replace(/^(google\/|qwen\/|meta-llama\/|deepseek\/|mistralai\/)/, '').split(':')[0];
}
