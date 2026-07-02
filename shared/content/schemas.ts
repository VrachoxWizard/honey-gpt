import { z } from 'zod';

export const loreEntrySchema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  phrases: z.array(z.string().min(1)).min(1),
});

export const loreFileSchema = z.array(loreEntrySchema).min(1);

export const katekizamEntrySchema = z.object({
  keywords: z.array(z.string().min(1)).min(1),
  answer: z.string().min(1),
  satireHint: z.string().min(1),
});

export const katekizamFileSchema = z.array(katekizamEntrySchema).min(1);

export type LoreEntry = z.infer<typeof loreEntrySchema>;
export type KatekizamEntry = z.infer<typeof katekizamEntrySchema>;

export function parseLoreFile(data: unknown): LoreEntry[] {
  return loreFileSchema.parse(data);
}

export function parseKatekizamFile(data: unknown): KatekizamEntry[] {
  return katekizamFileSchema.parse(data);
}
