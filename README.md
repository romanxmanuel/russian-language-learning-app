# Russian Accelerator Web App

## Setup

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Product

Russian Accelerator is a web-first prototype for English-speaking adult beginners who want a fast, evidence-led path into Russian. The app centers every session around:

`Listen -> Recall -> Speak -> Read -> Reuse -> Reflect`

Core modules:

- Pronunciation Lab
- Chunk Forge
- Input Theater
- Conversation Dojo
- Mission Review

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- libSQL/Turso with local-file fallback
- Vitest

## Data

By default the app writes to `file:./data/russian-accelerator.db`.

Set these variables to point at a hosted Turso database instead:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```
