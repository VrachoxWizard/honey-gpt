import Parser from 'rss-parser';
import { CONSTANTS } from './constants.js';

const parser = new Parser({
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
});

const RSS_FEEDS = [
  'https://vijesti.hrt.hr/rss/',
  'https://www.index.hr/rss/najnovije',
  'https://www.jutarnji.hr/rss',
  'https://www.vecernji.hr/rss',
];

const CACHE_DURATION_MS = CONSTANTS.NEWS_CACHE_DURATION_MS;
let cachedNews: string[] | null = null;
let cacheExpiry = 0;

export async function fetchCroatianNews(): Promise<string[]> {
  const now = Date.now();
  if (cachedNews && now < cacheExpiry) {
    console.log('News Cache HIT: Vracam spremljene vijesti iz predmemorije.');
    return cachedNews;
  }

  for (const url of RSS_FEEDS) {
    try {
      const feed = await Promise.race([
        parser.parseURL(url),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('RSS timeout')), CONSTANTS.RSS_TIMEOUT_MS)
        ),
      ]);

      const items = feed.items || [];
      const titles = items
        .slice(0, CONSTANTS.MAX_NEWS_HEADLINES)
        .map((item) => item.title || '')
        .filter((title) => title.trim().length > 0);

      if (titles.length > 0) {
        cachedNews = titles;
        cacheExpiry = now + CACHE_DURATION_MS;
        return titles;
      }
    } catch (error) {
      console.error(`Neuspjelo dohvacanje RSS feeda s ${url}:`, error);
    }
  }

  if (cachedNews) {
    console.warn('Dohvat vijesti nije uspio, vracam istekle vijesti iz predmemorije.');
    return cachedNews;
  }

  return [];
}
