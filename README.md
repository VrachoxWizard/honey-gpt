# Hanicar-gpt

Satiricni AI chatbot na hrvatskom jeziku. Frontend je Vite + React, a odgovor generira OpenRouter preko serverless API rute, tako da se `OPENROUTER_API_KEY` ne izlaze u browseru.

## Lokalno pokretanje

1. Instaliraj pakete:

```bash
npm install
```

2. Kopiraj `.env.example` u `.env` i upisi OpenRouter kljuc:

```bash
OPENROUTER_API_KEY=tvoj_openrouter_kljuc
```

3. Pokreni aplikaciju:

```bash
npm run dev
```

Otvori `http://127.0.0.1:5173`.

## Deploy na Vercel

- Build command: `npm run build`
- Output directory: `dist`
- Detaljan checklist: [`docs/DEPLOY.md`](docs/DEPLOY.md)

### Obavezne environment varijable

```bash
OPENROUTER_API_KEY=sk-or-...
```

### Preporučene environment varijable

```bash
OPENROUTER_MODEL=google/gemini-2.5-flash
OPENROUTER_MAX_TOKENS=2048
OPENROUTER_FALLBACK_MODELS=meta-llama/llama-3.3-70b-instruct
OPENROUTER_SITE_URL=https://honey-gpt.vercel.app
OPENROUTER_APP_NAME=Hanicar-gpt
CORS_ORIGIN=https://honey-gpt.vercel.app
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...
```

Vercel automatski koristi `api/chat.ts` kao serverless rutu na `/api/chat`.

## Model

Zadani model je `google/gemini-2.5-flash`. Promjena ide kroz `OPENROUTER_MODEL`. Fallback modeli se postavljaju zarezom:

```bash
OPENROUTER_FALLBACK_MODELS=meta-llama/llama-3.3-70b-instruct,google/gemini-2.5-pro
```

## Kvalitet i testiranje

```bash
npm run typecheck
npm run lint
npm run format:check
npm test
npm run test:coverage
```

CI workflow pokreće iste provjere na GitHub push/PR.

## Arhitektura

Pogledaj [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).
