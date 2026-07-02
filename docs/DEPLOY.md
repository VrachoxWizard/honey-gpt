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
| `REQUIRE_REDIS` | Preporučeno (`true`) | Odbija zahtjeve ako Redis nije konfiguriran |
| `MODERATION_MODEL` | Preporučeno | Jeftin model za LLM moderaciju prije glavnog odgovora |
| `SENTRY_DSN` | Ne | Error monitoring |
| `API_SECRET` | Ne | Opcionalna zaštita API-ja |

## Upstash Redis (obavezno za produkciju)

1. Kreiraj Upstash Redis instancu.
2. Kopiraj REST URL i token u Vercel env vars.
3. Postavi `REQUIRE_REDIS=true` kako bi deploy odbijao zahtjeve bez distribuiranog rate limita.
4. Bez Redisa, rate limit i cache rade samo in-memory po Vercel instanci.

## CI

GitHub Actions pokreće `typecheck`, `lint`, `prettier --check`, `test` i `test:coverage` na push/PR. E2E koristi `npm run dev` s mockanim `/api/chat`.

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
