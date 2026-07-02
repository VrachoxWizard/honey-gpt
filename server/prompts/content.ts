import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fuse from 'fuse.js';
import {
  parseKatekizamFile,
  parseLoreFile,
  type KatekizamEntry,
} from '../../shared/content/schemas.js';

let loreData: Array<{ keywords: string[]; phrases: string[] }> | null = null;
let fuseInstance: Fuse<{ keywords: string[]; phrases: string[] }> | null = null;

export async function getLorePhrases(text: string): Promise<string[]> {
  try {
    if (!loreData) {
      let lorePath = '';
      try {
        if (typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
          lorePath = fileURLToPath(new URL('../../shared/content/lore.json', import.meta.url));
        } else {
          lorePath = path.resolve(process.cwd(), 'shared', 'content', 'lore.json');
        }
      } catch {
        lorePath = path.resolve(process.cwd(), 'shared', 'content', 'lore.json');
      }

      const content = await fs.readFile(lorePath, 'utf-8');
      loreData = parseLoreFile(JSON.parse(content));
    }

    if (!fuseInstance && loreData) {
      fuseInstance = new Fuse(loreData, {
        keys: ['keywords'],
        threshold: 0.4,
      });
    }

    const matchedPhrases: string[] = [];

    if (fuseInstance) {
      const results = fuseInstance.search(text);

      results.forEach((result) => {
        const entry = result.item;
        const shuffled = [...entry.phrases].sort(() => 0.5 - Math.random());
        matchedPhrases.push(...shuffled.slice(0, 2));
      });
    }

    return matchedPhrases.slice(0, 3);
  } catch (e) {
    console.error('Neuspjelo ucitavanje lore.json ili pretrazivanje s Fuse.js', e);
    return [];
  }
}

type KatekizamEntryLocal = KatekizamEntry;

let katekizamData: KatekizamEntryLocal[] | null = null;
let katekizamFuse: Fuse<KatekizamEntryLocal> | null = null;

async function loadKatekizamData(): Promise<KatekizamEntryLocal[]> {
  if (katekizamData) return katekizamData;

  const candidates = [path.resolve(process.cwd(), 'shared', 'content', 'katekizam.json')];

  if (typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
    try {
      candidates.unshift(
        fileURLToPath(new URL('../../shared/content/katekizam.json', import.meta.url))
      );
    } catch {
      // Vitest virtual modules can expose non-file URLs.
    }
  }

  let lastError: unknown;
  for (const candidate of candidates) {
    try {
      const content = await fs.readFile(candidate, 'utf-8');
      katekizamData = parseKatekizamFile(JSON.parse(content));
      return katekizamData;
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError ?? new Error('katekizam.json nije pronađen.');
}

export async function getKatekizamSnippet(
  text: string
): Promise<{ answer: string; satireHint: string } | null> {
  try {
    const data = await loadKatekizamData();
    if (!katekizamFuse) {
      katekizamFuse = new Fuse(data, {
        keys: ['keywords'],
        threshold: 0.35,
      });
    }

    const directMatch = data.find((entry) =>
      entry.keywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))
    );
    if (directMatch) {
      return directMatch;
    }

    const result = katekizamFuse.search(text)[0];
    return result?.item ?? null;
  } catch {
    return null;
  }
}
