import Parser from 'rss-parser';

const parser = new Parser({
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  },
});

const RSS_FEEDS = [
  'https://vijesti.hrt.hr/rss/',
  'https://www.index.hr/rss/najnovije',
];

const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minuta
let cachedNews: string[] | null = null;
let cacheExpiry = 0;

/**
 * Dohvaca najnovije vijesti s hrvatskih portala putem RSS feeda.
 * Vraca top 4 naslova. U slucaju greske vraca prazan niz.
 * Koristi in-memory cache od 5 minuta za smanjenje latencije i opterecenja feedova.
 */
export async function fetchCroatianNews(): Promise<string[]> {
  const now = Date.now();
  if (cachedNews && now < cacheExpiry) {
    console.log('News Cache HIT: Vracam spremljene vijesti iz predmemorije.');
    return cachedNews;
  }

  for (const url of RSS_FEEDS) {
    try {
      // Postavljamo timeout od 4 sekunde kako ne bismo usporili chatbot
      const feed = await Promise.race([
        parser.parseURL(url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('RSS timeout')), 4000))
      ]);
      
      const items = feed.items || [];
      const titles = items
        .slice(0, 4)
        .map(item => item.title || '')
        .filter(title => title.trim().length > 0);

      if (titles.length > 0) {
        cachedNews = titles;
        cacheExpiry = now + CACHE_DURATION_MS;
        return titles;
      }
    } catch (e) {
      console.error(`Neuspjelo dohvacanje RSS feeda s ${url}:`, e);
    }
  }

  // Ako dohvat nije uspio, a imamo stare vijesti u predmemoriji, radije vrati njih nego nista
  if (cachedNews) {
    console.warn('Dohvat vijesti nije uspio, vracam istekle vijesti iz predmemorije.');
    return cachedNews;
  }

  return [];
}
