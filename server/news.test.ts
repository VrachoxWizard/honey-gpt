import { describe, it, expect, vi, beforeEach } from 'vitest';

const parseURL = vi.fn();

vi.mock('rss-parser', () => ({
  default: class MockParser {
    parseURL = parseURL;
  },
}));

describe('news', () => {
  beforeEach(async () => {
    vi.resetModules();
    parseURL.mockReset();
  });

  it('returns headlines from first successful feed', async () => {
    parseURL.mockResolvedValueOnce({
      items: [{ title: 'Vijest 1' }, { title: 'Vijest 2' }],
    });

    const { fetchCroatianNews } = await import('./news');
    const headlines = await fetchCroatianNews();
    expect(headlines).toEqual(['Vijest 1', 'Vijest 2']);
  });

  it('falls back to next feed when first fails', async () => {
    parseURL.mockRejectedValueOnce(new Error('fail'));
    parseURL.mockResolvedValueOnce({
      items: [{ title: 'Fallback vijest' }],
    });

    const { fetchCroatianNews } = await import('./news');
    const headlines = await fetchCroatianNews();
    expect(headlines).toEqual(['Fallback vijest']);
  });
});
