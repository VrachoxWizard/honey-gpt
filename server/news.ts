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

/**
 * Dohvaca najnovije vijesti s hrvatskih portala putem RSS feeda.
 * Vraca top 4 naslova. U slucaju greske vraca prazan niz.
 */
export async function fetchCroatianNews(): Promise<string[]> {
  for (const url of RSS_FEEDS) {
    try {
      // Postavljamo timeout od 4 sekunde kako ne bismo usporili chatbot
      const feed = await Promise.race([
        parser.parseURL(url),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('RSS timeout')), 4000))
      ]);
      
      const items = feed.items || [];
      return items
        .slice(0, 4)
        .map(item => item.title || '')
        .filter(title => title.trim().length > 0);
    } catch (e) {
      console.error(`Neuspjelo dohvacanje RSS feeda s ${url}:`, e);
    }
  }
  return [];
}
