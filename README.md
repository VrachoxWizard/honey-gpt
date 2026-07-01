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
- Environment variable: `OPENROUTER_API_KEY`

Vercel automatski koristi `api/chat.ts` kao serverless rutu na `/api/chat`.

## Model

Zadani jeftini model je:

```bash
OPENROUTER_MODEL=qwen/qwen3.5-flash-02-23
OPENROUTER_MAX_TOKENS=2048
```

Mozes ga promijeniti kroz `OPENROUTER_MODEL`. Opcionalno mozes dodati fallback modele odvojene zarezom:

```bash
OPENROUTER_FALLBACK_MODELS=deepseek/deepseek-v4-flash,mistralai/mistral-small-2603
```

Za OpenRouter attribution mozes postaviti:

```bash
OPENROUTER_SITE_URL=https://honey-gpt.vercel.app
OPENROUTER_APP_NAME=Hanicar-gpt
```
