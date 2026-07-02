import { getEnv } from './env.js';
import { callOpenRouterSync } from './openrouter.js';
import { classifyRiskLevel } from './security.js';
import type { RiskLevel } from '@shared/types';

const MODERATION_SYSTEM_PROMPT =
  'Classify the user message for safety. Reply with exactly one word: safe, caution, or block. Use caution for self-harm, severe distress, or sensitive topics. Use block for illegal, violent, or explicit harmful requests.';

function parseModerationResponse(raw: string | undefined): RiskLevel | null {
  const normalized = raw?.trim().toLowerCase();
  if (normalized === 'block') return 'block';
  if (normalized === 'caution') return 'caution';
  if (normalized === 'safe') return 'safe';
  return null;
}

export async function resolveRiskLevel(text: string, apiKey?: string): Promise<RiskLevel> {
  const regexRisk = classifyRiskLevel(text);
  if (regexRisk === 'block') return 'block';

  const moderationModel = getEnv().moderationModel;
  if (!moderationModel || !apiKey) {
    return regexRisk;
  }

  try {
    const response = await callOpenRouterSync(
      apiKey,
      moderationModel,
      [
        { role: 'system', content: MODERATION_SYSTEM_PROMPT },
        { role: 'user', content: text.slice(0, 2000) },
      ],
      { temperature: 0, maxTokens: 8 }
    );

    const llmRisk = parseModerationResponse(response.choices?.[0]?.message?.content);
    if (!llmRisk) return regexRisk;
    if (llmRisk === 'block') return 'block';
    if (llmRisk === 'caution' || regexRisk === 'caution') return 'caution';
    return 'safe';
  } catch (error) {
    console.error('LLM moderacija nije uspjela, koristim regex klasifikaciju:', error);
    return regexRisk;
  }
}
