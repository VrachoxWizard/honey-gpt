export async function searchWikipedia(query: string): Promise<string | null> {
  try {
    // 1. Pretraži pojam
    const searchUrl = new URL('https://hr.wikipedia.org/w/api.php');
    searchUrl.searchParams.append('action', 'query');
    searchUrl.searchParams.append('list', 'search');
    searchUrl.searchParams.append('srsearch', query);
    searchUrl.searchParams.append('utf8', '1');
    searchUrl.searchParams.append('format', 'json');
    searchUrl.searchParams.append('origin', '*');

    const searchRes = await fetch(searchUrl.toString(), {
      headers: {
        'User-Agent': 'HanicarGPT/1.0 (https://github.com/VrachoxWizard/honey-gpt)',
      },
    });

    if (!searchRes.ok) return null;

    const searchData = await searchRes.json();
    const searchResults = searchData.query?.search;

    if (!searchResults || searchResults.length === 0) {
      return null;
    }

    const firstResultTitle = searchResults[0].title;

    // 2. Dohvati sažetak za prvi rezultat
    const summaryUrl = `https://hr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(firstResultTitle)}`;
    const summaryRes = await fetch(summaryUrl, {
      headers: {
        'User-Agent': 'HanicarGPT/1.0 (https://github.com/VrachoxWizard/honey-gpt)',
      },
    });

    if (!summaryRes.ok) return null;

    const summaryData = await summaryRes.json();
    return summaryData.extract || null;
  } catch (error) {
    console.error('Greška pri pretraživanju Wikipedije:', error);
    return null;
  }
}
