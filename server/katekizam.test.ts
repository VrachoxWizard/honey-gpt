import { describe, it, expect } from 'vitest';
import { getKatekizamSnippet } from './prompts';

describe('katekizam', () => {
  it('matches religious keywords', async () => {
    const snippet = await getKatekizamSnippet('Kako funkcionira krštenje u crkvi?');
    expect(snippet?.answer).toContain('Krštenje');
    expect(snippet?.satireHint).toBeTruthy();
  });
});
