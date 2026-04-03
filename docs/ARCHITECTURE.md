# Architecture

## Core Idea

Russian Accelerator is built as a narrow but complete learning loop rather than a broad content library.

The central unit is the daily mission:

`Listen -> Recall -> Speak -> Read -> Reuse -> Reflect`

## App Layers

### UI

- `src/app/page.tsx`
- `src/components/accelerator-shell.tsx`
- `src/components/speak-button.tsx`

The UI is a single high-signal dashboard with five modules rather than many disconnected lesson screens.

### Curriculum

- `src/lib/curriculum.ts`

This contains:

- the 8-week roadmap
- chunk inventory
- review prompts
- input clips
- dialogue scenarios
- research anchors

### Adaptive Learning Logic

- `src/lib/mastery.ts`
- `src/lib/mission-engine.ts`

These files handle:

- spaced-ish review timing
- mastery updates
- weak-spot prioritization
- current week calculation
- daily mission assembly

### Coaching Heuristics

- `src/lib/coach.ts`

This currently provides:

- heuristic pronunciation scoring
- dialogue recasts
- chunk-match-based coaching feedback

This is the cleanest upgrade seam for OpenAI-backed live coaching later.

### Persistence

- `src/lib/db/schema.ts`
- `src/lib/db/client.ts`
- `src/lib/repository.ts`

Persistence stores:

- learner profile
- mastery states
- review attempts
- pronunciation attempts
- dialogue turns
- checkpoints
- mission events

## API Surface

- `POST /api/onboarding`
- `GET|POST /api/daily-mission`
- `POST /api/review/grade`
- `POST /api/pronunciation/attempt`
- `POST /api/dialogue/turn`
- `GET /api/progress`
- `POST /api/assessment/checkpoint`

## Mastery Dimensions

- recall
- listening
- pronunciation
- reading
- speaking automaticity
- confidence

The app avoids collapsing all progress into one XP metric.

## Deployment Model

- Local: file-backed libSQL
- Vercel preview fallback: `/tmp`
- Real production: Turso/libSQL remote

## Next Provider Integrations

### OpenAI

Best use cases here:

- real conversational tutor
- recasts with better nuance
- speech and pronunciation interpretation
- adaptive mission authoring

### Google

Best use cases here:

- image generation for story scenes
- lesson cards
- visual prompts for listening/input modules
