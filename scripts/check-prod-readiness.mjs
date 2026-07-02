import { readFile } from 'node:fs/promises';

/**
 * Non-blocking, secret-free production readiness check.
 *
 * This script never reads real secrets (only `.env.example` and docs), and it
 * never fails the local dev workflow — it only prints a checklist so a human
 * can confirm the Vercel project is configured correctly before/after a
 * production deploy. See docs/DEPLOY.md "Production Readiness Checklist".
 */

const REQUIRED_ENV_HINTS = ['OPENROUTER_API_KEY', 'REQUIRE_REDIS', 'UPSTASH_REDIS_REST_URL'];
const RECOMMENDED_ENV_HINTS = [
  'UPSTASH_REDIS_REST_TOKEN',
  'CORS_ORIGIN',
  'API_SECRET',
  'SENTRY_DSN',
  'DAILY_TOKEN_BUDGET_PER_IP',
];

function printSection(title) {
  console.log(`\n${title}`);
  console.log('-'.repeat(title.length));
}

async function main() {
  const envExample = await readFile('.env.example', 'utf8');

  const missingRequired = REQUIRED_ENV_HINTS.filter((hint) => !envExample.includes(hint));
  const missingRecommended = RECOMMENDED_ENV_HINTS.filter((hint) => !envExample.includes(hint));

  printSection('Production Readiness Checklist (Haničar GPT)');
  console.log('Ovo je informativna provjera — ne čita stvarne tajne, samo .env.example.');

  printSection('Obavezno u produkciji');
  console.log('[ ] OPENROUTER_API_KEY postavljen u Vercel env vars (pravi sk-or-... ključ).');
  console.log('[ ] UPSTASH_REDIS_REST_URL i UPSTASH_REDIS_REST_TOKEN postavljeni.');
  console.log('[ ] REQUIRE_REDIS=true u produkcijskom environmentu.');
  console.log('[ ] CORS_ORIGIN postavljen na produkcijsku domenu.');

  printSection('Preporučeno');
  console.log('[ ] API_SECRET (+ VITE_API_SECRET) ako želiš dodatnu zaštitu /api/chat.');
  console.log('[ ] SENTRY_DSN (+ VITE_SENTRY_DSN) za monitoring grešaka.');
  console.log('[ ] DAILY_TOKEN_BUDGET_PER_IP prilagođen očekivanom prometu.');

  printSection('Post-deploy provjera');
  console.log('[ ] GET /api/health vraća "ok": true, "redis": true, "requireRedis": true.');
  console.log('[ ] Ručni chat smoke test (vidi docs/DEPLOY.md).');

  if (missingRequired.length > 0) {
    console.error(`\n✖ Nedostaju OBAVEZNI hintovi u .env.example: ${missingRequired.join(', ')}`);
    process.exitCode = 1;
    return;
  }

  if (missingRecommended.length > 0) {
    console.warn(
      `\n⚠ Nedostaju PREPORUČENI hintovi u .env.example: ${missingRecommended.join(', ')}`
    );
  } else {
    console.log('\n✓ .env.example sadrži sve obavezne i preporučene hintove.');
  }
}

await main();
