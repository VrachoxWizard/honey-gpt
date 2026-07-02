# Deploy vodič — Haničar GPT

## Vercel

1. Poveži GitHub repo s Vercel projektom.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Postavi environment varijable:

| Varijabla | Obavezna | Opis |
|-----------|----------|------|
| `OPENROUTER_API_KEY` | Da | OpenRouter ključ (`sk-or-...`) |
| `OPENROUTER_MODEL` | Ne | Default model (fallback: `google/gemini-2.5-flash`) |
| `OPENROUTER_MAX_TOKENS` | Ne | Max tokeni po odgovoru |
| `OPENROUTER_FALLBACK_MODELS` | Ne | Zarezom odvojeni fallback modeli |
| `OPENROUTER_SITE_URL` | Ne | OpenRouter attribution URL |
| `OPENROUTER_APP_NAME` | Ne | OpenRouter app name |
| `CORS_ORIGIN` | Ne | Dozvoljeni origin za `/api/chat` |
| `UPSTASH_REDIS_REST_URL` | **Obavezno u produkciji** | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | **Obavezno u produkciji** | Upstash Redis token |
| `REQUIRE_REDIS` | **Preporučeno (`true`)** | Odbija zahtjeve ako Redis nije konfiguriran |
| `API_SECRET` | Ne | Opcionalna zaštita API-ja (par s `VITE_API_SECRET` na frontendu) |
| `VITE_API_SECRET` | Ne | Ista vrijednost kao `API_SECRET` — frontend šalje `X-Api-Secret` |

## Upstash Redis (obavezno za produkciju)

1. Kreiraj Upstash Redis instancu.
2. Kopiraj REST URL i token u Vercel env vars.
3. Postavi `REQUIRE_REDIS=true` kako bi deploy odbijao zahtjeve bez distribuiranog rate limita.
4. **Obavezno u produkciji:** `REQUIRE_REDIS=true` + Upstash varijable. Bez toga, efektivni rate limit raste s brojem serverless instanci.
5. Bez Redisa, rate limit i cache rade samo in-memory po Vercel instanci.

## CI

GitHub Actions pokreće na push/PR:

- `npm run verify` (typecheck, lint, prettier, test:coverage)
- `npm audit --audit-level=high`
- `npm run check:env-example`
- `npm run build` + `npm run check:bundle`
- Playwright E2E (dev server + preview build)
- CodeQL analiza (`.github/workflows/codeql.yml`)

Pri padu E2E testova, CI uploada Playwright report i trace artefakte.

## Post-deploy smoke test

Nakon svakog deploya na Vercel:

1. **Health check**
   ```bash
   curl -s https://your-domain/api/health
   ```
   Očekivano: `"ok": true`, `"openrouterKeyConfigured": true`, `"redis": true` (u produkciji).

2. **Frontend**
   - Otvori produkcijski URL u browseru.
   - Provjeri da se welcome ekran učita bez JS grešaka u konzoli.

3. **Chat smoke**
   - Pošalji kratku testnu poruku (npr. "Bok Haničare").
   - Provjeri da stigne streaming odgovor (ne 429/503).

4. **Redis / limiti** (ako je `REQUIRE_REDIS=true`)
   - Dva brza zahtjeva ne bi smjela vratiti 503 zbog Redis-a.
   - Rate limit 429 tek nakon 20+ zahtjeva u minuti s istog IP-a.

## Vercel preview deploys

Svaki PR dobiva preview URL na Vercelu. Koristi ga za:

- vizualnu provjeru UI promjena prije mergea
- ručni smoke test (koraci iznad) na preview domeni

Lokalno preview (bez serverless API-ja):

```bash
npm run build
npm run preview
```

Za puni API tok koristi `npm run dev`.

## Rollback

1. U Vercel dashboardu otvori **Deployments**.
2. Pronađi zadnji stabilan deploy i klikni **Promote to Production**.
3. Ponovi post-deploy smoke test.

## Sentry (opcionalno)

1. Kreiraj Sentry projekt (Node + React).
2. Postavi env varijable:
   - Backend: `SENTRY_DSN`
   - Frontend: `VITE_SENTRY_DSN`
3. Nakon deploya, pokreni testnu grešku ili provjeri da Sentry prima evente iz produkcije.

## Troubleshooting

| Problem | Rješenje |
|---------|----------|
| 500 Nedostaje OPENROUTER_API_KEY | Dodaj ključ u Vercel env vars |
| 503 Redis nije konfiguriran | Dodaj Upstash varijable ili isključi `REQUIRE_REDIS` |
| 429 Previše zahtjeva | Rate limit 20/min/IP; provjeri Redis |
| 413 Prevelik zahtjev | Skrati poruku ili ukloni veliku sliku |
| CORS greška | Postavi `CORS_ORIGIN` na produkcijski URL |
| Cache daje isti odgovor | Očekivano za identične single-turn upite |

## Lokalno testiranje produkcijskog builda

```bash
npm run build
npm run preview
```

Napomena: lokalni preview ne uključuje Vercel serverless rutu — koristi `npm run dev` za puni API tok.
