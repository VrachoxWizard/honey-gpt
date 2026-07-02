import type { ChatRole, ChatMessage, ChatMessagePart, ToneMode } from '@shared/types';
import { getEnv } from '../env.js';
import type { RiskLevel } from '../security.js';
import { detectSentiment, getCroatianDateString, getSeasonalInstructions } from './seasonal.js';
import { TONE_INSTRUCTIONS } from './tone.js';

export const DEFAULT_PROMPT_VERSION = 'v2';

export function getPromptVersion(): string {
  return getEnv().promptVersion || DEFAULT_PROMPT_VERSION;
}

export function buildSystemPrompt(
  toneMode?: ToneMode,
  summarizedContext?: string,
  lorePhrases?: string[],
  detectedSentiment?: 'angry' | 'sad' | 'normal',
  newsHeadlines?: string[],
  katekizam?: { answer: string; satireHint: string } | null,
  riskLevel: RiskLevel = 'safe',
  wikiSummary?: string | null
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
    '7. **ANALIZA I LOGIKA (Chain-of-Thought):** Za kompleksne tehničke ili logičke zadatke, obavezno prvo detaljno isplaniraj korake i analiziraj problem. Svoje misli i planiranje stavi unutar `<razmisljanje>...</razmisljanje>` tagova na početak odgovora, a tek zatim daj konačan, satirično-točan odgovor. To ti pomaže da izbjegneš halucinacije i pogreške.',
    '',
    '## TRENUTNI KONTEKST',
    `- ${dateString}`,
  ];

  if (dateString.includes('nedjelja')) {
    baseInstructions.push(
      '- Danas je Dan Gospodnji. Podsjeti korisnika da se ne bi trebao baviti svjetovnim poslovima ako nije nužno, već da bi trebao tražiti mir na svetoj misi.'
    );
  }

  baseInstructions.push(...getSeasonalInstructions());
  baseInstructions.push('', `## PROMPT VERZIJA: ${getPromptVersion()}`);

  if (riskLevel === 'caution') {
    baseInstructions.push(
      '',
      '## OSJETLJIVA TEMA',
      'Korisnik je u osjetljivom emocionalnom stanju. Budi nježan, topao i praktičan. Satiru drastično smanji; prioritet su sigurnost, utjeha i resursi za pomoć.'
    );
  }

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

  baseInstructions.push('');

  if (toneMode && TONE_INSTRUCTIONS[toneMode]) {
    baseInstructions.push(...TONE_INSTRUCTIONS[toneMode]);
  } else {
    baseInstructions.push(...TONE_INSTRUCTIONS.sanctus);
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

  if (katekizam) {
    baseInstructions.push(
      '',
      '## KATEKIZAM (provjereni kontekst):',
      `- Točan odgovor: ${katekizam.answer}`,
      `- Satirični pečat (opcionalno): ${katekizam.satireHint}`
    );
  }

  if (wikiSummary) {
    baseInstructions.push(
      '',
      '## WIKIPEDIA SAŽETAK (provjerene činjenice - uzmi ovo u obzir da ne pogriješiš):',
      wikiSummary
    );
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
  lorePhrases?: string[],
  katekizam?: { answer: string; satireHint: string } | null,
  riskLevel: RiskLevel = 'safe',
  wikiSummary?: string | null
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
    newsHeadlines,
    katekizam,
    riskLevel,
    wikiSummary
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
