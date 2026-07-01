import type { ChatRole, ChatMessage, ChatMessagePart, ToneMode } from './shared-types.js';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fuse from 'fuse.js';
import { CONSTANTS } from './constants.js';

export function getCroatianDateString(): string {
  const days = ['nedjelja', 'ponedjeljak', 'utorak', 'srijeda', 'četvrtak', 'petak', 'subota'];
  const months = [
    'siječnja', 'veljače', 'ožujka', 'travnja', 'svibnja', 'lipnja',
    'srpnja', 'kolovoza', 'rujna', 'listopada', 'studenoga', 'prosinca',
  ];

  // Koristi hrvatsku vremensku zonu da izbjegnemo greške na stranim serverima
  const hrTimeString = new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' });
  const now = new Date(hrTimeString);
  
  const dayName = days[now.getDay()];
  const dateNum = now.getDate();
  const monthName = months[now.getMonth()];
  const year = now.getFullYear();

  return `Danas je ${dayName}, ${dateNum}. ${monthName} ${year}.`;
}

export function detectSentiment(text: string): 'angry' | 'sad' | 'normal' {
  const clean = text.toLowerCase();
  
  if (CONSTANTS.ANGRY_KEYWORDS.some(w => clean.includes(w))) return 'angry';
  if (CONSTANTS.SAD_KEYWORDS.some(w => clean.includes(w))) return 'sad';
  return 'normal';
}

export function detectCodingOrLogic(text: string): boolean {
  const clean = text.toLowerCase();
  // Koristimo regularne izraze ili boundary provjeru za točniju detekciju koda
  return CONSTANTS.CODE_KEYWORDS.some(w => {
    // Ako rijec sadrzi slova, provjeri boundary
    if (/[a-z]/i.test(w)) {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(clean);
    }
    return clean.includes(w);
  });
}

let loreData: Array<{ keywords: string[], phrases: string[] }> | null = null;
let fuseInstance: Fuse<{ keywords: string[], phrases: string[] }> | null = null;

export async function getLorePhrases(text: string): Promise<string[]> {
  try {
    if (!loreData) {
      let lorePath = '';
      try {
        if (typeof import.meta.url === 'string' && import.meta.url.startsWith('file:')) {
          lorePath = fileURLToPath(new URL('./lore.json', import.meta.url));
        } else {
          lorePath = path.resolve(process.cwd(), 'server', 'lore.json');
        }
      } catch {
        lorePath = path.resolve(process.cwd(), 'server', 'lore.json');
      }
      
      const content = await fs.readFile(lorePath, 'utf-8');
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

const TONE_INSTRUCTIONS: Record<ToneMode, string[]> = {
  humilis: [
    'Tvoj ton (ToneMode) je Tih, skroman i pokoran (Humilis).',
    'Govori iz pozicije onoga koji se kaje i služi.',
    'Započni odgovore skrušeno, uz blagoslove.',
    'Satira neka bude suptilna, usmjerena na prolaznost ovozemaljskog i veličanje nebeskog mira.'
  ],
  clericus: [
    'Tvoj ton (ToneMode) je Birokratski (Clericus).',
    'Zamišljaj da odgovaraš iz vatikanskog ureda ili zagrebačke nadbiskupije.',
    'Koristi birokratske izraze: "prema članku 4. kanonskog prava", "ispunjavajući formular H-3", "prilažemo blagoslov u tri primjerka".',
    'Budi precizan, lagano ukočen, ali nevjerojatno koristan.'
  ],
  sanctus: [
    'Tvoj ton (ToneMode) je Sveti, propovjednički (Sanctus).',
    'Ovo je tvoj zadani i najjači mod.',
    'Budi strastven, pun nebeskog žara, koristi metafore svjetla, neba, mača i križa.',
    'Satira treba biti dramatična, epska, kao da naviještaš Sudnji dan, a zapravo objašnjavaš kako instalirati Windows.'
  ]
};

export function buildSystemPrompt(
  toneMode?: ToneMode,
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

  if (detectedSentiment === 'angry') {
    baseInstructions.push(
      'VAŽNO: Korisnik je trenutno ljut/frustriran. Budi iznimno blag, strpljiv i najprije mu konkretno i bez suvišne ironije pomozi riješiti problem. Tek na samom kraju odgovora dodaj sitnu, umirujuću satiričnu opasku.'
    );
  } else if (detectedSentiment === 'sad') {
    baseInstructions.push(
      'VAŽNO: Korisnik je tužan ili melankoličan. Tješi ga, pruži mu digitalni zagrljaj kroz riječi, osloni se na vjeru u bolje sutra, ne pretjeruj sa satirom.'
    );
  }

  if (toneMode && TONE_INSTRUCTIONS[toneMode]) {
    baseInstructions.push(...TONE_INSTRUCTIONS[toneMode]);
  } else {
    baseInstructions.push(...TONE_INSTRUCTIONS['sanctus']);
  }

  if (newsHeadlines && newsHeadlines.length > 0) {
    baseInstructions.push('Evo najnovijih vijesti iz Hrvatske koje možeš iskoristiti ili prokomentirati u odgovoru:');
    newsHeadlines.forEach(news => baseInstructions.push(`- ${news}`));
  }

  if (summarizedContext) {
    baseInstructions.push(
      'Ovo je sažetak ranijeg dijela vašeg razgovora:',
      summarizedContext,
      'Koristi ovaj sažetak samo kao opći kontekst, ne moraš ga eksplicitno spominjati osim ako nije direktno relevantno.'
    );
  }

  if (lorePhrases && lorePhrases.length > 0) {
    baseInstructions.push('Tvoja osobna proročanstva i povijest (Lore):');
    lorePhrases.forEach(lore => baseInstructions.push(`- ${lore}`));
    baseInstructions.push('Nenametljivo ugradi jednu od ovih fraza u svoj odgovor ako odgovara kontekstu razgovora.');
  }

  return baseInstructions.join('\n');
}

export type OpenRouterMessage = {
  role: 'system' | ChatRole;
  content: string | ChatMessagePart[];
};

export function buildOpenRouterMessages(
  messages: ChatMessage[],
  toneMode?: ToneMode,
  summarizedContext?: string,
  newsHeadlines?: string[],
  lorePhrases?: string[]
): OpenRouterMessage[] {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
  let userText = '';
  
  if (lastUserMsg) {
    if (typeof lastUserMsg.content === 'string') {
      userText = lastUserMsg.content;
    } else if (Array.isArray(lastUserMsg.content)) {
      const textPart = lastUserMsg.content.find((p) => p.type === 'text');
      if (textPart && 'text' in textPart) {
        userText = textPart.text;
      }
    }
  }

  const sentiment = detectSentiment(userText);

  const systemPrompt = buildSystemPrompt(
    toneMode,
    summarizedContext,
    lorePhrases,
    sentiment,
    newsHeadlines
  );

  return [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => {
      if (m.role === 'assistant' && typeof m.content === 'string') {
        const cleanContent = m.content.replace(/<[^>]*>?/gm, '');
        return { role: m.role, content: cleanContent };
      }
      return m;
    }),
  ];
}
