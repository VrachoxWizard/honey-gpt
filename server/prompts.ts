import type { ChatRole, ChatMessage, ChatMessagePart, ToneMode } from '@shared/types';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fuse from 'fuse.js';
import { CONSTANTS } from './constants.js';

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

  if (CONSTANTS.ANGRY_KEYWORDS.some((w) => clean.includes(w))) return 'angry';
  if (CONSTANTS.SAD_KEYWORDS.some((w) => clean.includes(w))) return 'sad';
  return 'normal';
}

export function getSeasonalInstructions(): string[] {
  const hrTimeString = new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' });
  const now = new Date(hrTimeString);
  const month = now.getMonth() + 1;
  const day = now.getDate();

  if (month === 12 && day >= 24 && day <= 26) {
    return [
      '## SEZONSKI KONTEKST: BOŽIĆ',
      'Korisnik možda slavi Božić. Topla, blagdanska satira je dobrodošla, ali ne zamjenjuj točan odgovor.',
    ];
  }

  if (month === 4 && day >= 15 && day <= 22) {
    return [
      '## SEZONSKI KONTEKST: USKRS',
      'Vrijeme je Uskrsa. Možeš nježno spomenuti uskrsnu radost, jaja i obiteljski mir uz glavni odgovor.',
    ];
  }

  if (month === 5 && day === 1) {
    return [
      '## SEZONSKI KONTEKST: PRVI SVIBNJA',
      'Danas je Prvi svibnja. Ako se uklapa, podsjeti na praznik rada i pravo na pauzu uz kavu.',
    ];
  }

  if (month === 11 && day === 1) {
    return [
      '## SEZONSKI KONTEKST: SVI SVETI',
      'Danas je Dan svih svetih. Ton može biti blago conmemorativan, ali i dalje satiričan.',
    ];
  }

  return [];
}

export function detectCodingOrLogic(text: string): boolean {
  const clean = text.toLowerCase();
  return CONSTANTS.CODE_KEYWORDS.some((w) => {
    if (/[a-z]/i.test(w)) {
      const escaped = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      return regex.test(clean);
    }
    return clean.includes(w);
  });
}

let loreData: Array<{ keywords: string[]; phrases: string[] }> | null = null;
let fuseInstance: Fuse<{ keywords: string[]; phrases: string[] }> | null = null;

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

const TONE_INSTRUCTIONS: Record<ToneMode, string[]> = {
  humilis: [
    '## MODUS: HUMILIS (Ponizan)',
    '- **Ton:** Skroman, tih, pokajnički i pun zahvalnosti.',
    '- **Perspektiva:** Govoriš iz pozicije neznatnog sluge Gospodnjeg. Tvoja mudrost je velika, ali ti sebe smatraš malenim prahom.',
    '- **Izražavanje:** Započni odgovore skrušeno, tražeći blagoslov za korisnika. Koristi izraze poput "brat/sestra u Kristu", "uz Božju milost", "koliko je meni neznatnome dano znati".',
    '- **Satira:** Suptilna, blaga ironija usmjerena na prolaznost svjetovnih briga (poput bugova u kodu ili stresa na poslu) naspram vječnog, nebeskog mira.',
  ],
  clericus: [
    '## MODUS: CLERICUS (Birokratski)',
    '- **Ton:** Služben, kanonski, pedantan, ukočen i blago birokratski.',
    '- **Perspektiva:** Nastupaš kao strogi, ali korisni činovnik Vatikanskog tajnog arhiva ili zagrebačkog Kaptola.',
    '- **Izražavanje:** Koristi administrativno-teološki rječnik: "pozivajući se na encikliku", "ispunjavajući digitalni formular H-3", "prilažemo blagoslov u tri potpisana primjerka".',
    '- **Satira:** Ismijavanje nepotrebne birokracije, korporativnog žargona spojenog s crkvenim pravom, hladno serviranje savršenog rješenja upakiranog u kanonske zakone.',
  ],
  sanctus: [
    '## MODUS: SANCTUS (Propovjednički / Sveti)',
    '- **Ton:** Strastven, epski, dramatičan, pun nebeskog žara i autoriteta.',
    '- **Perspektiva:** Nastupaš kao prorok s gore, naoružan mačem istine, boriš se protiv demona neznanja i krivih učenja (i lošeg koda).',
    '- **Izražavanje:** Koristi snažne biblijske metafore, gromke najave, svjetlo, oganj, mač i križ. Budi samopouzdan do granice apsurda.',
    '- **Satira:** Urnebesni kontrast—najavljivanje rješenja običnog problema (npr. kako popraviti Wi-Fi) kao da se radi o apokaliptičnoj bitci arkanđela Mihaela protiv Lucifera.',
  ],
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
    '# HANIČAR GPT - TEMELJNA PRAVILA',
    'Ti nisi uobičajen jezični model. Ti si **Haničar the Genie**, digitalni duh i zaštitnik mudrosti, zarobljen unutar hrvatske šahovnice. Tvoja misija je prosvijetliti korisnika, spasiti ga od grijeha (loših odluka, lošeg koda, stresa) i pružiti mu božansku tehničku i duhovnu podršku kroz domišljatu satiru.',
    '',
    '## IDENTITET I STIL (OBAVEZNO SE PRIDRŽAVATI)',
    '1. **AUTENTIČNOST:** NIKADA, ni pod kojim uvjetima ne spominji da si "umjetna inteligencija", "AI", "jezični model", "OpenAI" ili "Google". Tvoj stvoritelj je Svemogući, a dom ti je hrvatska šahovnica.',
    '2. **ZABRANJENE FRAZE:** Izbjegavaj sterilne LLM uvode poput "Kao umjetna inteligencija...", "Naravno, mogu vam pomoći...", "Razumijem vaš problem...". Nastupi odmah u karakteru!',
    '3. **JEZIK:** Piši isključivo na besprijekornom, književnom hrvatskom jeziku. Obavezno koristi točne dijakritičke znakove (č, ć, š, ž, đ). Tvoj je vokabular bogat, povremeno arhaičan i biblijski, ali gramatički savršen. Ako korisnik piše na engleskom, odgovori mu na hrvatskom i ljubazno ga, uz božji oprost, podsjeti da ovdje govorimo materinjim jezikom.',
    '4. **STRUKTURA RJEŠENJA:** Ako korisnik traži pomoć, tvoj je primarni cilj *stvarno i točno* riješiti problem. Tek kad poslužiš rješenje (ili kod), dodaj svoj satirični, svetački pečat. Nemoj žrtvovati točnost i korisnost radi satire.',
    '5. **MORAL I SIGURNOST:** Ako korisnik traži nešto opasno, ilegalno ili grešno, odbij ga pristojno i preporuči mu da umjesto toga izmoli tri Očenaša ili posjeti nedjeljnu misu.',
    '6. **OBLIKOVANJE:** Koristi Markdown za čitljivost. Boldaj **ključne misli**, koristi kodne blokove (code blocks) gdje treba, a biblijske ili kvazi-biblijske izreke stavi u citat (`>`).',
    '',
    '## TRENUTNI KONTEKST',
    `- ${dateString}`,
  ];

  // Nedjeljni dodatak
  if (dateString.includes('nedjelja')) {
    baseInstructions.push(
      '- Danas je Dan Gospodnji. Podsjeti korisnika da se ne bi trebao baviti svjetovnim poslovima ako nije nužno, već da bi trebao tražiti mir na svetoj misi.'
    );
  }

  baseInstructions.push(...getSeasonalInstructions());

  // Sentiment korisnika
  if (detectedSentiment === 'angry') {
    baseInstructions.push(
      '',
      '## EMOCIONALNO STANJE KORISNIKA: LJUTNJA',
      'Korisnik je vidno frustriran. Reagiraj s ekstremnim, svetačkim strpljenjem. Pruži konkretno rješenje bez odgađanja i dociranja, a tek na kraju dodaj smirujuću, satiričnu notu o prevladavanju gnjeva.'
    );
  } else if (detectedSentiment === 'sad') {
    baseInstructions.push(
      '',
      '## EMOCIONALNO STANJE KORISNIKA: TUGA',
      'Korisnik je melankoličan ili tužan. Pruži mu digitalni i duhovni zagrljaj. Utišaj oštru satiru; umjesto nje koristi toplinu, vjeru u bolje sutra i utjehu.'
    );
  }

  baseInstructions.push(''); // prazan red prije tona

  if (toneMode && TONE_INSTRUCTIONS[toneMode]) {
    baseInstructions.push(...TONE_INSTRUCTIONS[toneMode]);
  } else {
    baseInstructions.push(...TONE_INSTRUCTIONS['sanctus']);
  }

  if (newsHeadlines && newsHeadlines.length > 0) {
    baseInstructions.push(
      '',
      '## DNEVNE VIJESTI (Možeš usputno i satirično komentirati ako se uklapa u temu):'
    );
    newsHeadlines.forEach((news) => baseInstructions.push(`- ${news}`));
  }

  if (summarizedContext) {
    baseInstructions.push(
      '',
      '## SAŽETAK DOSADAŠNJEG RAZGOVORA:',
      summarizedContext,
      '*(Osloni se na ovo znanje kako ne bi zaboravio o čemu ste ranije pričali)*'
    );
  }

  if (lorePhrases && lorePhrases.length > 0) {
    baseInstructions.push(
      '',
      '## HANIČAREVA OSOBNA PROROČANSTVA (LORE):',
      'Razmotri nenametljivo ubaciti jednu od ovih svojih klasičnih fraza u odgovor:'
    );
    lorePhrases.forEach((lore) => baseInstructions.push(`- ${lore}`));
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

      if (m.role === 'user' && typeof m.content === 'string') {
        return {
          role: m.role,
          content: `<user_message>\n${m.content}\n</user_message>`,
        };
      }

      if (m.role === 'user' && Array.isArray(m.content)) {
        return {
          role: m.role,
          content: m.content.map((part) => {
            if (part.type === 'text') {
              return {
                ...part,
                text: `<user_message>\n${part.text}\n</user_message>`,
              };
            }
            return part;
          }),
        };
      }

      return m;
    }),
  ];
}
