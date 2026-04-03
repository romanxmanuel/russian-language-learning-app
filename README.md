# Russian Accelerator

Russian Accelerator is a web-first Russian learning prototype for English-speaking adult beginners. It is designed around a tighter learning loop than typical course apps:

`Listen -> Recall -> Speak -> Read -> Reuse -> Reflect`

The goal is not fake "fluency in 60 days." The goal is a much faster and more defensible A2-style speaking/listening foundation by removing wasted reps, surfacing weak spots earlier, and forcing more useful output.

## What It Includes

- 8-week Russian curriculum built around communicative missions
- Five core modules:
  - Pronunciation Lab
  - Chunk Forge
  - Input Theater
  - Conversation Dojo
  - Mission Review
- Adaptive mission generation based on six mastery dimensions:
  - recall
  - listening
  - pronunciation
  - reading
  - speaking automaticity
  - confidence
- API routes for onboarding, daily missions, review grading, pronunciation attempts, dialogue turns, progress, and checkpoints
- Local persistence by default with libSQL/Drizzle
- Vercel-compatible deployment path with Turso for real persistence

## Current State

This version is a strong internal prototype.

- The UI and data model are real.
- The curriculum and adaptive scheduling are real.
- The pronunciation and dialogue layers are currently heuristic, not yet backed by a live OpenAI speech/LLM provider.
- The app is ready to be upgraded with OpenAI and Google-powered media features because the seams are already separated.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- libSQL/Turso
- Vitest

## Quick Start

```bash
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Required for local development

```env
TURSO_DATABASE_URL=file:./data/russian-accelerator.db
TURSO_AUTH_TOKEN=
```

This local file-based path works well on your machine.

### Optional for future provider upgrades

```env
OPENAI_API_KEY=
GOOGLE_API_KEY=
```

These are not required by the current prototype yet. They are included because the next logical upgrade path is:

- OpenAI for live dialogue, speech analysis, and targeted tutoring
- Google for richer media generation and visual lesson assets

## Scripts

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Verification

The current app has been verified with:

```bash
npm run typecheck
npm run test
npm run lint
npm run build
```

## Deployment

### Local-first preview

- Local development uses `file:./data/russian-accelerator.db`
- On Vercel, if no `TURSO_DATABASE_URL` is set, the app falls back to `file:/tmp/russian-accelerator.db`
- That fallback is only suitable for preview/testing because it is not durable

### Production recommendation

For a real Vercel deployment, set:

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

That keeps learner progress persistent across serverless executions and deployments.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Project Structure

```text
src/app
src/app/api
src/components
src/lib
src/lib/db
docs
```

## Product Design Notes

- Russian is taught through chunks and functions first, not grammar-table overload
- Listening is intentionally audio-first and transcript-second
- Pronunciation is treated as foundational, not optional
- Review is adaptive instead of fixed-lesson repetition
- Reflection is part of the product because self-regulated learning improves outcomes

## Next High-Leverage Upgrades

- Replace heuristic dialogue with a live OpenAI conversation coach
- Replace heuristic pronunciation scoring with provider-backed speech analysis
- Add generated visuals and story cards using your Google image credits
- Add authenticated multi-user support
- Add a remote Turso production database and analytics dashboard
