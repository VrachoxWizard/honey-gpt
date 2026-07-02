import { CONSTANTS } from '../constants.js';
import { classifyRiskLevel } from '../security.js';

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

/**
 * Lighter, curated "Haničarev kalendar" notes for days that aren't major
 * religious/national holidays already handled above. Purely additive — a
 * small local lookup, no external calendar dependency.
 */
const HANICAR_CALENDAR_NOTES: Record<string, string> = {
  '1-1':
    'Nova godina — vrijeme za nove odluke koje ćeš, po drevnoj tradiciji, prekršiti do 15. siječnja.',
  '2-14': 'Valentinovo — dan kad i najtvrđa srca traže barem jednu digitalnu čestitku.',
  '3-8': 'Međunarodni dan žena — podsjeti da poštovanje ne traje samo jedan dan u godini.',
  '4-1':
    'Prvi april — dan kad je oprost za nevine šale zagarantiran čak i na nebu, ali provjeri kôd dvaput prije objave.',
  '5-30': 'Dan državnosti — svečani dan kad se i birokracija malo odmara.',
  '6-22': 'Dan antifašističke borbe u Hrvatskoj — dan tihog sjećanja i poštovanja.',
  '8-5': 'Dan pobjede i domovinske zahvalnosti — dan zahvale i mira.',
  '9-13': 'Međunarodni dan programera — blagoslovi svoj kôd i commituj s poštovanjem.',
  '10-1': 'Međunarodni dan kave — dvostruko opravdanje za drugu šalicu.',
  '10-8': 'Dan nezavisnosti Hrvatske — dan koji zaslužuje mirnu misu i malo domovinskog ponosa.',
  '12-31': 'Stara godina — vrijeme za zahvalu na svemu što je bilo, dobrom i lošem.',
};

/** Returns a short note for today's date from the curated Haničar calendar, or null if none. */
export function getHanicarCalendarNote(): string | null {
  const hrTimeString = new Date().toLocaleString('en-US', { timeZone: 'Europe/Zagreb' });
  const now = new Date(hrTimeString);
  const key = `${now.getMonth() + 1}-${now.getDate()}`;
  return HANICAR_CALENDAR_NOTES[key] ?? null;
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
      'Danas je Dan svih svetih. Ton može biti blago komemorativan, ali i dalje satiričan.',
    ];
  }

  const calendarNote = getHanicarCalendarNote();
  if (calendarNote) {
    return ['## HANIČAREV KALENDAR', calendarNote, 'Spomeni ovo tek usputno, ne kao glavnu temu.'];
  }

  return [];
}

export function detectSentiment(text: string): 'angry' | 'sad' | 'normal' {
  const risk = classifyRiskLevel(text);
  if (risk === 'caution' || risk === 'block') return 'normal';

  const clean = text.toLowerCase();

  if (CONSTANTS.ANGRY_KEYWORDS.some((w) => clean.includes(w))) return 'angry';
  if (CONSTANTS.SAD_KEYWORDS.some((w) => clean.includes(w))) return 'sad';
  return 'normal';
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
