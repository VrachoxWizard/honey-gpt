import type { ToneMode } from '@shared/types';
import {
  ALLOWED_MODELS,
  MODEL_DISPLAY_NAMES,
  modelDisplayName as sharedModelDisplayName,
} from '@shared/models';

export type { ToneMode };

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

export const riteOf = (key: ToneMode): Rite => RITES.find((r) => r.key === key) ?? RITES[0];

export const AVAILABLE_MODELS = ALLOWED_MODELS.map((id) => ({
  id,
  name: MODEL_DISPLAY_NAMES[id] ?? id,
}));

export const modelDisplayName = sharedModelDisplayName;
