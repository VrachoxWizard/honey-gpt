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
