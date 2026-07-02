# Operativni vodič — Haničar GPT

## Redis metrike

Ako je Upstash Redis aktivan, dnevni brojači se spremaju pod ključevima:

| Ključ | Značenje |
|-------|----------|
| `hanicar:metrics:YYYY-MM-DD:requests` | Ukupno API zahtjeva |
| `hanicar:metrics:YYYY-MM-DD:cacheHits` | Cache pogodaka |
| `hanicar:metrics:YYYY-MM-DD:tokens` | Potrošeni OpenRouter tokeni |
| `hanicar:metrics:YYYY-MM-DD:errors429` | Rate limit / budget greške |
| `hanicar:metrics:YYYY-MM-DD:errors502` | Provider / circuit breaker greške |

## Token budget

Env var `DAILY_TOKEN_BUDGET_PER_IP` (default: 50000) ograničava dnevne tokene po IP-u.
Ključ: `hanicar:tokens:{ip}:{YYYY-MM-DD}`

Postavi na `0` za isključivanje.

## Circuit breaker

Nakon 5 uzastopnih retryable grešaka OpenRoutera u 2 minute, circuit se otvara na 60 sekundi.
Redis ključ: `hanicar:circuit:openrouter`

## Health check

```bash
curl https://your-domain/api/health
```

Očekivani odgovor:

```json
{
  "ok": true,
  "redis": true,
  "openrouterKeyConfigured": true,
  "sentryConfigured": true,
  "requireRedis": true,
  "version": "2.0.0"
}
```

Svi signali su boolean vrijednosti izvedene iz environment varijabli — endpoint nikad ne
vraća stvarne API ključeve, Redis tokene ili Sentry DSN.

## Timeout hijerarhija

Kako bi handler uvijek vratio jasnu grešku umjesto da "visi", timeouti su slojeviti:

| Sloj | Konstanta | Vrijednost |
|------|-----------|------------|
| Sažimanje starijeg konteksta | `SYNC_TIMEOUT_MS` | 15s |
| Streaming odgovor od OpenRoutera | `STREAM_TIMEOUT_MS` | 20s |
| Cijeli `/api/chat` zahtjev | `HANDLER_TIMEOUT_MS` | 25s |

Ako sažimanje (`summarizeConversationIfNeeded`) ne stigne na vrijeme ili vrati grešku, degradira
se tiho (`{ text: '', failed: true }`) — razgovor se šalje bez sažetka starijeg konteksta, umjesto
da zahtjev padne. Backend to signalizira kroz SSE `meta.summaryFailed: true`, a frontend to
prikazuje kao blagi upozoravajući toast, ne kao grešku zahtjeva.

## Structured logovi

Backend logovi su JSON s poljima:

- `requestId`
- `latencyMs`
- `cacheHit`
- `model`
- `promptVersion`

Sadržaj poruka se ne logira.

## Sentry

- Backend: `SENTRY_DSN`
- Frontend: `VITE_SENTRY_DSN`

Oba su opcionalna.

## API pristup (`/api/chat`)

Endpoint `/api/chat` je namijenjen javnoj SPA aplikaciji. Bez `API_SECRET` bilo tko može slati zahtjeve i trošiti OpenRouter kredite — to je **svjesna odluka** za jednostavno korištenje bez prijave.

Zaštita od zloupotrebe oslanja se na:

- rate limit (20 req/min/IP)
- dnevni token budget (`DAILY_TOKEN_BUDGET_PER_IP`)
- CORS (`CORS_ORIGIN`)
- model allowlist i moderaciju sadržaja

### Opcionalni `API_SECRET`

Ako postaviš `API_SECRET` u Vercel env vars, backend odbija zahtjeve bez zaglavlja `X-Api-Secret`. Frontend automatski šalje tajno vrijednost iz `VITE_API_SECRET` (mora biti ista vrijednost).

**Napomena:** U SPA aplikaciji tajna u frontend bundleu nije prava sigurnost — štiti samo od površnog scrapinga, ne od određenog napadača. Za strožu kontrolu koristi Vercel Deployment Protection ili vlastiti auth sloj.

### Produkcijski Redis

U produkciji postavi `REQUIRE_REDIS=true` zajedno s Upstash varijablama. Bez Redisa, rate limit i cache rade samo in-memory po serverless instanci.
