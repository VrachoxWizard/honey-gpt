export type ToneMode = 'humilis' | 'clericus' | 'sanctus';

export interface Rite {
  key: ToneMode;
  /** The illuminated initial stamped on the seal */
  seal: string;
  /** Short name shown under the seal */
  name: string;
  /** Latin-flavoured subtitle */
  latin: string;
  /** One-line description of the voice */
  blurb: string;
}

/** The three rites of Haničar — the persona dial, the signature interaction. */
export const RITES: Rite[] = [
  {
    key: 'sanctus',
    seal: 'S',
    name: 'Sveti',
    latin: 'Ritus Sanctus',
    blurb: 'Blagoslovljen, propovjednički, pun svetog žara.',
  },
  {
    key: 'clericus',
    seal: 'B',
    name: 'Birokratski',
    latin: 'Ritus Clericus',
    blurb: 'Pečati, formulari i uredski ton s neba.',
  },
  {
    key: 'humilis',
    seal: 'P',
    name: 'Ponizni',
    latin: 'Ritus Humilis',
    blurb: 'Tih, skroman i pokoran, ruku sklopljenih.',
  },
];

export const riteOf = (key: ToneMode): Rite =>
  RITES.find((r) => r.key === key) ?? RITES[0];

export const AVAILABLE_MODELS = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'qwen/qwen-2.5-coder-32b-instruct', name: 'Qwen 2.5 Coder' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'deepseek/deepseek-r1', name: 'DeepSeek R1' },
];

export const modelDisplayName = (id: string): string => {
  const known = AVAILABLE_MODELS.find((m) => m.id === id);
  if (known) return known.name;
  return id
    .replace(/^(google\/|qwen\/|meta-llama\/|deepseek\/|mistralai\/)/, '')
    .split(':')[0];
};
