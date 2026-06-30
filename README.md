# Hanicar-gpt

Satirični AI chatbot na hrvatskom jeziku. Frontend je Vite + React, a odgovor generira Google Gemini preko serverless funkcije, tako da se `GEMINI_API_KEY` ne izlaže u browseru.

## Lokalno pokretanje

1. Instaliraj pakete:

```bash
npm install
```

2. Kopiraj `.env.example` u `.env` i upiši Google Gemini ključ:

```bash
GEMINI_API_KEY=tvoj_kljuc
```

3. Pokreni aplikaciju:

```bash
npm run dev
```

Otvori `http://127.0.0.1:5173`.

## Deploy na Vercel

- Build command: `npm run build`
- Output directory: `dist`
- Environment variable: `GEMINI_API_KEY`

Vercel automatski koristi `api/chat.ts` kao serverless rutu na `/api/chat`.

## Deploy na Netlify

- Build command: `npm run build`
- Publish directory: `dist`
- Functions directory: `netlify/functions`
- Environment variable: `GEMINI_API_KEY`

Netlify koristi `netlify/functions/chat.ts`, a frontend se automatski prebacuje na `/.netlify/functions/chat` ako `/api/chat` nije dostupan.

## Model

Zadani model je `models/gemini-3-flash-preview`. Možeš ga promijeniti kroz environment varijablu `GEMINI_MODEL`.

Za free tier su zadane štedljivije postavke:

```bash
GEMINI_MAX_OUTPUT_TOKENS=2048
GEMINI_THINKING_LEVEL=low
GEMINI_ENABLE_SEARCH=false
```

Ako želiš odgovore s web pretragom, postavi `GEMINI_ENABLE_SEARCH=true`, ali to može lakše pogoditi free-tier limite.

Ako dobiješ `429 You do not have enough quota`, free tier kvota za taj Google projekt je potrošena ili privremeno ograničena. Pričekaj reset kvote, smanji `GEMINI_MAX_OUTPUT_TOKENS`, ostavi `GEMINI_ENABLE_SEARCH=false`, ili koristi drugi Google AI Studio projekt s dostupnom kvotom.

## Lokalni LLM

Za potpuno lokalno korištenje s Ollamom:

```bash
USE_LOCAL_LLM=true
LOCAL_LLM_API_URL=http://127.0.0.1:11434/api/generate
LOCAL_LLM_MODEL=llama3
```

Ovo radi kad aplikaciju pokrećeš lokalno s `npm run dev`. Na Vercelu/Netlifyju `127.0.0.1` označava serverless okruženje, ne tvoje računalo, pa deployed app treba koristiti Gemini env varijable.
