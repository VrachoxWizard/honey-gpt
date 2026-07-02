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
  "version": "2.0.0"
}
```

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
