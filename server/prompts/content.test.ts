import { describe, it, expect } from 'vitest';
import { getLorePhrases, getKatekizamSnippet } from './content.js';

describe('getLorePhrases (real lore.json content)', () => {
  it('matches a pre-existing category from a realistic full-sentence query', async () => {
    // Regression guard: Fuse's fuzzy Bitap search cannot find a long pattern
    // (a full sentence) inside a short target (a keyword), so naive
    // `fuse.search(fullSentence)` silently returned zero matches for any
    // realistic user message. This must keep matching via direct substrings.
    const phrases = await getLorePhrases('Trebam pauzu za kavu, jako sam umoran od posla danas.');
    expect(phrases.length).toBeGreaterThan(0);
  });

  it('matches the new "škola/faks" category', async () => {
    const phrases = await getLorePhrases('Imam sutra ispit na fakultetu i jako sam nervozan.');
    expect(phrases.length).toBeGreaterThan(0);
  });

  it('matches the new "birokracija" category', async () => {
    const phrases = await getLorePhrases('Cijeli dan čekam u redu na šalteru za obrazac.');
    expect(phrases.length).toBeGreaterThan(0);
  });

  it('matches the new "obitelj" category', async () => {
    const phrases = await getLorePhrases('Cijela rodbina dolazi na obiteljski ručak nedjeljom.');
    expect(phrases.length).toBeGreaterThan(0);
  });

  it('matches the new "svakodnevni stres" category', async () => {
    const phrases = await getLorePhrases('Jako sam umoran i imam nesanicu zbog stresa.');
    expect(phrases.length).toBeGreaterThan(0);
  });
});

describe('getKatekizamSnippet (real katekizam.json content)', () => {
  it('matches the new "krizma" entry', async () => {
    const snippet = await getKatekizamSnippet('Što je krizma i tko je krizmenik?');
    expect(snippet?.answer).toContain('Krizma');
    expect(snippet?.satireHint).toBeTruthy();
  });

  it('matches the new "korizma" entry without colliding with "krizma"', async () => {
    const snippet = await getKatekizamSnippet('Kada počinje korizma?');
    expect(snippet?.answer).toContain('Korizma');
  });

  it('matches the new "Oče naš / Vjerovanje" entry', async () => {
    const snippet = await getKatekizamSnippet('Kako glasi Vjerovanje?');
    expect(snippet?.answer).toContain('Vjerovanje');
  });
});
