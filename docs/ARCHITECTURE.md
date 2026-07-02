# Haničar GPT — arhitektura

## Pregled

Haničar GPT je statički React SPA + jedna Vercel serverless funkcija (`/api/chat`). Backend je stateless: nema baze podataka ni korisničke autentifikacije.

## Tok zahtjeva

1. Browser šalje `POST /api/chat` s poviješću poruka, modelom i `toneMode`.
2. [`api/chat.ts`](../api/chat.ts) provjerava env, rate limit, opcionalni API secret i veličinu payloada.
3. [`server/hanicar.ts`](../server/hanicar.ts) priprema kontekst:
   - sažimanje dugačkih razgovora
   - lore iz [`server/lore.json`](../server/lore.json)
   - RSS vijesti (keyword-gated)
   - model routing
   - cache lookup
4. [`server/openrouter.ts`](../server/openrouter.ts) streama odgovor preko OpenRouter API-ja.
5. Odgovor ide natrag kao SSE (`data: {"token": "..."}`).

## Moduli

| Modul | Uloga |
|-------|-------|
| `server/env.ts` | Centralna env konfiguracija (Zod) |
| `server/api.ts` | Validacija payloada |
| `server/security.ts` | Prompt injection i blocklist |
| `server/models.ts` | Allowlist i fallback modeli |
| `server/cache.ts` | LRU + Redis cache, in-flight dedup |
| `server/limiter.ts` | 20 req/min/IP |
| `server/prompts.ts` | Persona, tonovi, sezonski kontekst |
| `server/logger.ts` | Strukturirani JSON logovi |
| `server/monitoring.ts` | Opcionalni Sentry |

## Cache strategija

- Cache se koristi samo za single-turn upite u `sanctus` tonu.
- Multi-turn cache TTL je kraći (10 min).
- Redis je preporučen u produkciji radi distribuiranog rate limita.

## Lokalni razvoj

`vite.config.ts` ugrađuje isti `/api/chat` middleware kao produkcijski handler, učitava `.env` u `process.env`.
