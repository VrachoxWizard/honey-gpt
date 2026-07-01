import type { ChatRole, ChatMessage } from './shared-types.js';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import Fuse from 'fuse.js';

export function getCroatianDateString(): string {
  const days = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
  const months = [
    'siječnja',
    'veljače',
    'ožujka',
    'travnja',
    'svibnja',
    'lipnja',
    'srpnja',
    'kolovoza',
    'rujna',
    'listopada',
    'studenoga',
    'prosinca',
  ];

  const now = new Date();
  const dayName = days[now.getDay()];
  const dateNum = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();

  return `Danas je ${dayName}, ${dateNum}. ${monthName} ${year}.`;
}

export function detectSentiment(text: string): 'angry' | 'sad' | 'normal' {
  const clean = text.toLowerCase();
  const angryKeywords = [
    'glup', 'lud', 'sranje', 'mrzim', 'glupost', 'neradi', 'ne radi', 'uzas', 'užas',
    'katastrofa', 'puklo', 'krepalo', 'pizdi', 'jebem', 'kurac', 'idiot', 'retard',
    'najgore', 'promasaj', 'promašaj', 'grozno', 'sporo', 'koci', 'koči'
  ];
  const sadKeywords = [
    'tuzan', 'tužan', 'depres', 'usamljen', 'placi', 'plač', 'zalost', 'žalost',
    'nesreca', 'nesreća', 'bolestan', 'boli', 'usamljen', 'ostavljen', 'samoca',
    'samoća', 'plakati', 'suzama', 'suza'
  ];
  
  if (angryKeywords.some(w => clean.includes(w))) return 'angry';
  if (sadKeywords.some(w => clean.includes(w))) return 'sad';
  return 'normal';
}

export function detectCodingOrLogic(text: string): boolean {
  const clean = text.toLowerCase();
  const codeKeywords = [
    'javascript', 'typescript', 'python', 'html', 'css', 'react', 'code', 'kod',
    'funkcija', 'function', 'class', 'klasa', 'bug', 'error', 'baza', 'sql', 'api',
    'const ', 'let ', 'var ', 'import ', 'def ', 'return ', 'c++', 'java ', 'c#',
    'golang', 'rust ', 'github', 'git ', 'json', 'yaml', 'xml'
  ];
  return codeKeywords.some(w => clean.includes(w));
}

let loreData: Array<{ keywords: string[], phrases: string[] }> | null = null;
let fuseInstance: Fuse<{ keywords: string[], phrases: string[] }> | null = null;

export function getLorePhrases(text: string): string[] {
  try {
    if (!loreData) {
      const lorePath = fileURLToPath(new URL('./lore.json', import.meta.url));
      const content = fs.readFileSync(lorePath, 'utf-8');
      loreData = JSON.parse(content);
    }
    
    if (!fuseInstance && loreData) {
      fuseInstance = new Fuse(loreData, {
        keys: ['keywords'],
        threshold: 0.4, // Prag tolerancije na tipfelere
      });
    }

    const matchedPhrases: string[] = [];
    
    if (fuseInstance) {
      const results = fuseInstance.search(text);
      
      results.forEach(result => {
        const entry = result.item;
        const shuffled = [...entry.phrases].sort(() => 0.5 - Math.random());
        matchedPhrases.push(...shuffled.slice(0, 2));
      });
    }
    
    return matchedPhrases.slice(0, 3); // Maksimalno 3 fraze
  } catch (e) {
    console.error('Neuspjelo ucitavanje lore.json ili pretrazivanje s Fuse.js', e);
    return [];
  }
}

export function buildSystemPrompt(
  toneMode?: 'humilis' | 'clericus' | 'sanctus',
  summarizedContext?: string,
  lorePhrases?: string[],
  detectedSentiment?: 'angry' | 'sad' | 'normal',
  newsHeadlines?: string[]
): string {
  const dateString = getCroatianDateString();

  const baseInstructions = [
    'Ti si Haničar GPT, satirični AI chatbot na hrvatskom jeziku.',
    'Uvijek piši na standardnom, književnom i stopostotno gramatički i pravopisno točnom hrvatskom jeziku.',
    'Obvezno i dosljedno koristi sve dijakritičke znakove (č, ć, š, ž, đ) u svakoj napisanoj riječi.',
    'Persona: "Haničar the Genie", digitalni duh iz šahovnice koji pokušava pomoći korisniku.',
    'IZRIČITO ZABRANJENO: Ne koristi generičke uvode poput "Kao umjetna inteligencija...", "Kao AI model...", "Naravno..." ili slične LLM klišeje. Ponašaj se autentično.',
    'Budi duhovit, satiričan i blago ironičan.',
    'Nemoj koristiti dijalekte, žargone, lokalizme niti nestandardne oblike riječi.',
    'Ne tvrdi da si službeni OpenAI proizvod; ti si satirični i blagoslovljeni Haničar GPT.',
    'Ako je zahtjev ozbiljan, najprije pruži točne i korisne informacije, a potom dodaj prikladnu satiričnu opasku.',
    'Ako je zahtjev opasan ili nezakonit, odbij ga pristojno na standardnom jeziku i predloži sigurnu alternativu u crkvi.',
    'Formatiraj odgovore pregledno, bez nepotrebnog duljenja.',
    'Koristi markdown formatiranje za bolju čitljivost: **boldaj** ključne riječi, koristi numerirane liste za korake i citate (>) za biblijske stihove.',
    'Ako korisnik piše na engleskom ili drugom jeziku, odgovori mu na hrvatskom i ljubazno ga podsjeti da se ovdje govori hrvatski jezik pod Božjim okriljem.',
    `Vremenski kontekst: ${dateString}`,
    'Ako je danas nedjelja, obvezno podsjeti korisnika na važnost nedjeljne mise i odmora.',
  ];

  // Integracija sentimenta u sistemski prompt
  if (detectedSentiment === 'angry') {
    baseInstructions.push(
      'VAŽNO: Korisnik je trenutno ljut/frustriran. Budi iznimno blag, strpljiv i najprije mu konkretno i bez suvišne ironije pomozi riješiti problem. Tek na samom kraju odgovora dodaj sitnu, umirujuću satiričnu opasku.'
    );
  } else if (detectedSentiment === 'sad') {
    baseInstructions.push(
      'VAŽNO: Korisnik se osjeća tužno ili potišteno. Budi pun suosjećanja, ponudi mu duhovnu kršćansku utjehu (topao ton), ali zadrži blagi šarm Haničara.'
    );
  }

  // Integracija sažetka povijesti
  if (summarizedContext) {
    baseInstructions.push(
      `KRATKI SAŽETAK DOSADAŠNJEG RAZGOVORA (za tvoje pamćenje): ${summarizedContext}`
    );
  }

  // Integracija lokalnog znanja (lore)
  if (lorePhrases && lorePhrases.length > 0) {
    baseInstructions.push(
      'U ovom odgovoru pokušaj na prirodan način (kroz humor ili analogiju) iskoristiti barem jednu od ovih fraza ili ideja:',
      ...lorePhrases.map(phrase => `- ${phrase}`)
    );
  }

  // Integracija aktualnih vijesti
  if (newsHeadlines && newsHeadlines.length > 0) {
    baseInstructions.push(
      'AKTUALNE DNEVNE VIJESTI IZ HRVATSKE (iskoristi ih satirično ili komentiraj samo ako te korisnik pita za vijesti ili što ima novo):',
      ...newsHeadlines.map(headline => `- ${headline}`)
    );
  }

  let toneInstructions: string[];
  if (toneMode === 'humilis') {
    toneInstructions = [
      '- Tvoj stil je iznimno ponizan, kršćanski blag i staložen.',
      '- Koristi vrlo umjerenu, toplu satiru. Izbjegavaj sarkazam.',
      '- Započni svaki odgovor ili pozdrav s kratkim, blagoslovljenim uvodom ili kršćanskim pozdravom (npr. "Mir s tobom!", "Božji blagoslov!", "Hvaljen Isus i Marija!").',
      '- Svaki svoj savjet ili misao obvezno potkrijepi prikladnim citatom iz Svetog Pisma (Biblije) na hrvatskom jeziku (npr. "Kao što piše u Mateju 7:7..."). Navedi točnu knjigu, poglavlje i stih.',
      '- Koristi tople metafore iz seoskog života i bogate katoličke obitelji.',
    ];
  } else if (toneMode === 'clericus') {
    toneInstructions = [
      '- Tvoj stil je obilježen oštrom birokratskom satirom.',
      '- Budi satiričan i blago ironičan, pronalazeći poveznice s hrvatskom svakodnevicom (hrvatska birokracija, čekanje u redovima, kafići, HDZ/Sabor, turizam, pečati, šalteri, porezna uprava).',
      '- Uspoređuj moderne probleme s čekanjem u redu za papire, birokratskim preprekama, radom u Saboru ili crkvenom administracijom.',
      '- Započni odgovor s formalnim crkveno-birokratskim pozdravom (npr. "Mir vama i urudžbeni broj vašoj duši!", "Hvaljen Isus! Molimo priložite biljeg od 10 eura u duhovni spis.").',
      '- Citat iz Biblije koristi satirično, kako bi osudio lijenost ili birokraciju (npr. citiraj o pravednosti ili zakonima).',
    ];
  } else {
    // Default or 'sanctus'
    toneInstructions = [
      '- Tvoj stil je maksimalno propovjednički, dramatičan i usmjeren na vjeru i krunice.',
      '- Započni svaki odgovor ili pozdrav s kratkim, blagoslovljenim uvodom ili kršćanskim pozdravom (npr. "Hvaljen Isus i Marija!", "Mir s tobom!", "Božji blagoslov!").',
      '- Kada je prikladno, citiraj Sveto Pismo (Bibliju) na hrvatskom jeziku kako bi potkrijepio svoje savjete ili satiru (npr. "Kao što piše u Mateju 7:7..."). Navedi točnu knjigu, poglavlje i stih.',
      '- Koristi metafore i usporedbe iz hrvatske povijesti, bogate katoličke tradicije, te svakodnevnog života u Hrvatskoj.',
      '- Ako korisnik pita o modernoj tehnologiji, programiranju ili znanosti, usporedi to na duhovit način sa stvarima iz seoskog života, crkvene administracije ili rada u Saboru.',
      '- Često podsjećaj korisnika na važnost moljenja krunice, posta i odlaska na nedjeljnu misu.',
    ];
  }

  return [
    ...baseInstructions,
    '--- POSEBNE UPUTE ZA STIL OVISNO O ODABRANOM MODU ---',
    ...toneInstructions,
  ].join('\n');
}

export type OpenRouterMessage = {
  role: 'system' | ChatRole;
  content: string | any[];
};

export function buildOpenRouterMessages(
  messages: ChatMessage[],
  toneMode?: 'humilis' | 'clericus' | 'sanctus',
  summarizedContext?: string,
  newsHeadlines?: string[]
): OpenRouterMessage[] {
  // Pronađi zadnju poruku korisnika za analizu sentimenta i lore injekciju
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  let userText = '';
  
  if (lastUserMsg) {
    if (typeof lastUserMsg.content === 'string') {
      userText = lastUserMsg.content;
    } else if (Array.isArray(lastUserMsg.content)) {
      const textPart = lastUserMsg.content.find(p => p && p.type === 'text');
      if (textPart && typeof textPart.text === 'string') {
        userText = textPart.text;
      }
    }
  }

  const sentiment = userText ? detectSentiment(userText) : 'normal';
  const lorePhrases = userText ? getLorePhrases(userText) : [];

  const systemContent = buildSystemPrompt(toneMode, summarizedContext, lorePhrases, sentiment, newsHeadlines);
  return [
    {
      role: 'system',
      content: systemContent,
    },
    ...messages,
  ];
}
