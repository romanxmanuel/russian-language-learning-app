# Russian Language Learning App — Phase 1: Core Loop

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working 45-minute daily session loop: AI generates a Moscow thriller episode at the learner's level, new words feed into an FSRS spaced repetition deck, and a grammar drill follows — all saved to Neon Postgres across sessions.

**Architecture:** Next.js 16 App Router with three server-side engines (Story, SRS, Curriculum) exposed as API routes. Client-side session state machine drives the 5-phase UI. Drizzle ORM over Neon Postgres stores the learner model. No auth — localStorage user ID for the personal tool phase.

**Tech Stack:** Next.js 16, Vercel AI SDK v6, Anthropic claude-sonnet-4.6 via AI Gateway (OIDC auth), Neon Postgres, Drizzle ORM, ts-fsrs, Tailwind CSS, shadcn/ui, Vitest

---

## Task 1: CLAUDE.md + Project Scaffold

**Files:**
- Create: `CLAUDE.md`
- Create: `package.json` (via create-next-app)
- Create: `.gitignore`

- [ ] **Step 1: Create the project**

```bash
cd "C:\Users\lily7\Claude Code Projects\Russian Language Learning App"
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --yes
```

Expected output: Next.js project scaffolded with App Router and Tailwind.

- [ ] **Step 2: Write CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# Russian Language Learning App — Project Context

## What This Is
A Moscow thriller-driven Russian language learning webapp. AI generates story episodes constrained by a curriculum engine. Learner progresses A0→B2 through a 45-min daily session: SRS review → story episode → grammar drill → AI conversation → pronunciation.

## Tech Stack
- Next.js 16 (App Router, Server Components default)
- Vercel AI SDK v6 + AI Gateway (anthropic/claude-sonnet-4.6, OIDC auth)
- Neon Postgres + Drizzle ORM
- ts-fsrs (FSRS spaced repetition algorithm)
- Tailwind CSS + shadcn/ui (dark theme)
- Vitest for unit tests

## File Structure
- `app/` — Next.js routes and API handlers
- `lib/db/` — Drizzle schema, connection, queries
- `lib/srs/` — FSRS algorithm wrapper
- `lib/curriculum/` — Grammar gates and vocab budget engine
- `lib/story/` — Story world (NPCs) and episode generator
- `components/session/` — 5-phase session UI components
- `components/dashboard/` — Dashboard cards
- `content/` — Static JSON config (curriculum, NPCs, seed vocab)

## Commands
- `npm run dev` — start dev server (localhost:3000)
- `npm run test` — run Vitest unit tests
- `npm run db:push` — push schema to Neon (dev)
- `npm run db:migrate` — run migrations (prod)
- `npm run db:studio` — open Drizzle Studio

## Key Decisions
- No auth in Phase 1: localStorage user ID (`russo_user_id`)
- AI episodes are fully generated, constrained by curriculum engine system prompt
- SRS cards are sentence-level (not word-level) — production direction only
- FSRS target recall rate: 85% (optimal challenge point per research)
- Story world is fixed (NPCs, premise); plot events are AI-generated per session

## Spec
See `docs/superpowers/specs/2026-04-02-russian-learning-app-design.md`
```

- [ ] **Step 3: Add `.superpowers/` to `.gitignore`**

Open `.gitignore` and append:
```
# Brainstorm mockups
.superpowers/

# Local env
.env.local
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md .gitignore
git commit -m "chore: project scaffold and CLAUDE.md"
```

---

## Task 2: Install Dependencies

**Files:**
- Modify: `package.json`
- Create: `drizzle.config.ts`
- Create: `.env.local` (manually — not committed)

- [ ] **Step 1: Install all packages**

```bash
npm install ai @ai-sdk/react drizzle-orm @neondatabase/serverless ts-fsrs
npm install -D drizzle-kit vitest @vitejs/plugin-react dotenv
npx shadcn@latest init --defaults
```

When shadcn init prompts: choose **dark** style, **zinc** base color.

- [ ] **Step 2: Create `drizzle.config.ts`**

```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
})
```

- [ ] **Step 3: Add scripts to `package.json`**

In the `"scripts"` section, add:
```json
"test": "vitest",
"db:push": "drizzle-kit push",
"db:migrate": "drizzle-kit migrate",
"db:studio": "drizzle-kit studio"
```

- [ ] **Step 4: Create `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 5: Create `.env.local` (manually, never commit)**

```
DATABASE_URL=<your-neon-connection-string>
VERCEL_OIDC_TOKEN=<from-vercel-env-pull-or-leave-empty-for-now>
```

Get DATABASE_URL from Neon dashboard (create a new project called `russian-learning`). Connection string format: `postgresql://user:pass@host/dbname?sslmode=require`

- [ ] **Step 6: Commit**

```bash
git add package.json drizzle.config.ts vitest.config.ts
git commit -m "chore: install dependencies and configure tooling"
```

---

## Task 3: Database Schema

**Files:**
- Create: `lib/db/schema.ts`
- Create: `lib/db/index.ts`

- [ ] **Step 1: Write the schema**

Create `lib/db/schema.ts`:

```typescript
import {
  pgTable, text, integer, timestamp, jsonb,
  serial, varchar, real, boolean, index
} from 'drizzle-orm/pg-core'

// ── Users ────────────────────────────────────────────────────
export const users = pgTable('users', {
  id: text('id').primaryKey(), // localStorage UUID
  createdAt: timestamp('created_at').defaultNow().notNull(),
  settings: jsonb('settings').default({}).notNull(),
})

// ── Learner Model ────────────────────────────────────────────
export const learnerModel = pgTable('learner_model', {
  userId: text('user_id').primaryKey().references(() => users.id),
  grammarStage: integer('grammar_stage').default(0).notNull(), // 0=A0, 1=A1, 2=A2, 3=B1, 4=B2
  totalMinutes: integer('total_minutes').default(0).notNull(),
  streak: integer('streak').default(0).notNull(),
  lastSessionDate: text('last_session_date'), // YYYY-MM-DD
  storyPosition: jsonb('story_position').default({ act: 1, episode: 0, plotBeat: 0 }).notNull(),
  phoneticProfile: jsonb('phonetic_profile').default({ weakSounds: [], scores: [] }).notNull(),
})

// ── Vocabulary ────────────────────────────────────────────────
export const vocabulary = pgTable('vocabulary', {
  id: serial('id').primaryKey(),
  russianWord: varchar('russian_word', { length: 100 }).notNull(),
  englishMeaning: varchar('english_meaning', { length: 200 }).notNull(),
  partOfSpeech: varchar('part_of_speech', { length: 50 }).notNull(),
  grammarNotes: text('grammar_notes'),
  frequencyRank: integer('frequency_rank'),
  curriculumStage: integer('curriculum_stage').notNull(), // which stage introduces this word
  exampleSentenceRu: text('example_sentence_ru'),
  exampleSentenceEn: text('example_sentence_en'),
})

// ── Learner Vocabulary (SRS state per word per user) ─────────
export const learnerVocabulary = pgTable('learner_vocabulary', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  wordId: integer('word_id').references(() => vocabulary.id).notNull(),
  // FSRS fields
  stability: real('stability').default(0).notNull(),
  difficulty: real('difficulty').default(0).notNull(),
  elapsedDays: integer('elapsed_days').default(0).notNull(),
  scheduledDays: integer('scheduled_days').default(0).notNull(),
  reps: integer('reps').default(0).notNull(),
  lapses: integer('lapses').default(0).notNull(),
  state: integer('state').default(0).notNull(), // 0=New,1=Learning,2=Review,3=Relearning
  lastReview: timestamp('last_review'),
  nextReview: timestamp('next_review'),
  // Performance tracking
  seenCount: integer('seen_count').default(0).notNull(),
  avgResponseMs: integer('avg_response_ms'),
  sourceEpisodeId: integer('source_episode_id'),
}, (t) => ({
  userWordIdx: index('learner_vocab_user_word_idx').on(t.userId, t.wordId),
  nextReviewIdx: index('learner_vocab_next_review_idx').on(t.userId, t.nextReview),
}))

// ── Grammar Structures ────────────────────────────────────────
export const grammarStructures = pgTable('grammar_structures', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  stage: integer('stage').notNull(),
  description: text('description').notNull(),
  exampleSentences: jsonb('example_sentences').default([]).notNull(),
})

export const learnerGrammar = pgTable('learner_grammar', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  structureId: integer('structure_id').references(() => grammarStructures.id).notNull(),
  status: varchar('status', { length: 20 }).default('unseen').notNull(), // unseen|introduced|practicing|mastered
  errorCount: integer('error_count').default(0).notNull(),
  lastPracticedAt: timestamp('last_practiced_at'),
})

// ── Episodes ──────────────────────────────────────────────────
export const episodes = pgTable('episodes', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  act: integer('act').notNull(),
  episodeNum: integer('episode_num').notNull(),
  generatedAt: timestamp('generated_at').defaultNow().notNull(),
  // AI output
  episodeText: text('episode_text').notNull(),
  highlightedWords: jsonb('highlighted_words').default([]).notNull(),
  comprehensionQuestions: jsonb('comprehension_questions').default([]).notNull(),
  grammarFocusExamples: jsonb('grammar_focus_examples').default([]).notNull(),
  storySummaryUpdate: text('story_summary_update').notNull(),
  grammarFocusId: integer('grammar_focus_id'),
  targetWordIds: jsonb('target_word_ids').default([]).notNull(),
})

// ── Sessions ──────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  id: serial('id').primaryKey(),
  userId: text('user_id').references(() => users.id).notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  durationSeconds: integer('duration_seconds'),
  srsCardsReviewed: integer('srs_cards_reviewed').default(0).notNull(),
  srsAccuracy: real('srs_accuracy'),
  newWordsCount: integer('new_words_count').default(0).notNull(),
  grammarAccuracy: real('grammar_accuracy'),
  episodeId: integer('episode_id').references(() => episodes.id),
  phasesCompleted: jsonb('phases_completed').default([]).notNull(),
})
```

- [ ] **Step 2: Write DB connection**

Create `lib/db/index.ts`:

```typescript
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const sql = neon(process.env.DATABASE_URL!)
export const db = drizzle(sql, { schema })

export type DB = typeof db
```

- [ ] **Step 3: Push schema to Neon**

```bash
npm run db:push
```

Expected: Drizzle connects to Neon and creates all tables. No errors.

- [ ] **Step 4: Commit**

```bash
git add lib/db/
git commit -m "feat: add database schema and Drizzle connection"
```

---

## Task 4: Static Content Files

**Files:**
- Create: `content/curriculum.json`
- Create: `content/npcs.json`
- Create: `content/seed-vocabulary.json`

- [ ] **Step 1: Write curriculum config**

Create `content/curriculum.json`:

```json
{
  "stages": [
    {
      "id": 0,
      "name": "A0 — Absolute Beginner",
      "label": "A0",
      "episodes": [1, 5],
      "allowedStructures": ["cyrillic_reading", "greeting_phrases", "nominative_singular"],
      "newWordsPerEpisode": 3,
      "description": "Cyrillic alphabet, basic greetings, your name and where you're from."
    },
    {
      "id": 1,
      "name": "A1 — Beginner",
      "label": "A1",
      "episodes": [6, 10],
      "allowedStructures": ["nominative_case", "accusative_case_basic", "present_tense_imperfective", "numbers_1_20", "basic_adjectives"],
      "newWordsPerEpisode": 5,
      "description": "Nom/Acc cases. Present tense verbs. Basic adjectives and numbers."
    },
    {
      "id": 2,
      "name": "A2 — Elementary",
      "label": "A2",
      "episodes": [11, 20],
      "allowedStructures": ["past_tense", "negation", "adjective_agreement", "accusative_case_full", "genitive_of_negation"],
      "newWordsPerEpisode": 7,
      "description": "Past tense. Full accusative. Negation. Adjective agreement."
    },
    {
      "id": 3,
      "name": "B1 — Intermediate",
      "label": "B1",
      "episodes": [21, 50],
      "allowedStructures": ["prepositional_case", "dative_case", "instrumental_case", "genitive_case_full", "imperfective_perfective_intro", "motion_verbs_basic"],
      "newWordsPerEpisode": 8,
      "description": "All 6 cases. Aspect introduction. Basic motion verbs."
    },
    {
      "id": 4,
      "name": "B2 — Upper Intermediate",
      "label": "B2",
      "episodes": [51, 80],
      "allowedStructures": ["aspect_mastery", "subjunctive", "complex_sentences", "verbs_of_motion_full", "advanced_word_order", "idioms"],
      "newWordsPerEpisode": 10,
      "description": "Aspect mastery. Subjunctive. Complex clauses. Idioms."
    }
  ]
}
```

- [ ] **Step 2: Write NPC personality sheets**

Create `content/npcs.json`:

```json
{
  "npcs": [
    {
      "id": "katya",
      "name": "Катя",
      "nameEn": "Katya",
      "role": "Local contact, Alex's original point of contact in Moscow",
      "personality": "Warm, careful, speaks slowly and clearly. Uses simple vocabulary. Pauses to make sure you understand. She trusts you but is hiding something.",
      "speechStyle": "Simple sentences, present tense dominant, frequent clarifying questions. Speaks at A1-A2 level.",
      "appearsFromEpisode": 1,
      "difficultyStage": 1,
      "physicalDescription": "Late 30s, dark hair, usually in a grey coat. Always looks over her shoulder.",
      "motivation": "Protect her family. She knows more about the missing contact than she admits.",
      "relationship": "neutral"
    },
    {
      "id": "igor",
      "name": "Игорь",
      "nameEn": "Igor",
      "role": "Suspicious neighbor in Alex's apartment building",
      "personality": "Curt, watchful, gives minimal information. Former military bearing. Uses short declarative sentences.",
      "speechStyle": "Terse. Imperatives and short statements. Past tense stories about vague events. A2 vocabulary with occasional formal military phrasing.",
      "appearsFromEpisode": 3,
      "difficultyStage": 2,
      "physicalDescription": "60s, grey mustache, always in the same brown jacket.",
      "motivation": "Unknown. Watches who enters and leaves the building.",
      "relationship": "suspicious"
    },
    {
      "id": "natasha",
      "name": "Наташа",
      "nameEn": "Natasha",
      "role": "Owner of the café below Alex's apartment",
      "personality": "Chatty, warm, loves to talk about her customers and neighborhood gossip. Safe space to practice.",
      "speechStyle": "Colloquial Russian, informal register, uses diminutives, tells anecdotes. A2-B1 level. Will slow down if asked.",
      "appearsFromEpisode": 2,
      "difficultyStage": 2,
      "physicalDescription": "50s, red hair, flour on her apron. Knows everyone's business.",
      "motivation": "Run her café, meddle in everyone's lives, be the unofficial mayor of the block.",
      "relationship": "friendly"
    },
    {
      "id": "dmitry",
      "name": "Полковник Дмитрий",
      "nameEn": "Colonel Dmitry",
      "role": "Government official, appears when the investigation gets serious",
      "personality": "Controlled, formal, every word chosen precisely. Threatening without ever making direct threats. Speaks in full complex sentences.",
      "speechStyle": "Formal register. Complex subordinate clauses. Perfective verbs, implied consequences. B1-B2 vocabulary. Never contractions.",
      "appearsFromEpisode": 15,
      "difficultyStage": 3,
      "physicalDescription": "55, silver hair, expensive suit. Doesn't blink enough.",
      "motivation": "Control the situation. Keep certain truths buried.",
      "relationship": "antagonist"
    },
    {
      "id": "anya",
      "name": "Аня",
      "nameEn": "Anya",
      "role": "Young hacker who becomes an unexpected ally",
      "personality": "Quick, irreverent, speaks in internet slang and abbreviations. Low patience for slow thinkers.",
      "speechStyle": "Informal, slang-heavy, uses anglicisms (окей, лол, вайб), rapid-fire sentences. B2 informal register.",
      "appearsFromEpisode": 20,
      "difficultyStage": 4,
      "physicalDescription": "Mid-20s, dyed hair, hooded sweatshirt, always typing.",
      "motivation": "She has her own agenda. The truth matters to her, but she'll negotiate the terms.",
      "relationship": "ally"
    }
  ]
}
```

- [ ] **Step 3: Write seed vocabulary (A0-A1 words)**

Create `content/seed-vocabulary.json`:

```json
[
  {"russianWord": "я", "englishMeaning": "I", "partOfSpeech": "pronoun", "curriculumStage": 0, "frequencyRank": 1, "exampleSentenceRu": "Я здесь.", "exampleSentenceEn": "I am here."},
  {"russianWord": "ты", "englishMeaning": "you (informal)", "partOfSpeech": "pronoun", "curriculumStage": 0, "frequencyRank": 5, "exampleSentenceRu": "Ты понимаешь?", "exampleSentenceEn": "Do you understand?"},
  {"russianWord": "он", "englishMeaning": "he", "partOfSpeech": "pronoun", "curriculumStage": 0, "frequencyRank": 6, "exampleSentenceRu": "Он здесь.", "exampleSentenceEn": "He is here."},
  {"russianWord": "она", "englishMeaning": "she", "partOfSpeech": "pronoun", "curriculumStage": 0, "frequencyRank": 7, "exampleSentenceRu": "Она говорит по-русски.", "exampleSentenceEn": "She speaks Russian."},
  {"russianWord": "мы", "englishMeaning": "we", "partOfSpeech": "pronoun", "curriculumStage": 0, "frequencyRank": 15, "exampleSentenceRu": "Мы в Москве.", "exampleSentenceEn": "We are in Moscow."},
  {"russianWord": "нет", "englishMeaning": "no / there is no", "partOfSpeech": "particle", "curriculumStage": 0, "frequencyRank": 12, "exampleSentenceRu": "Нет, я не знаю.", "exampleSentenceEn": "No, I don't know."},
  {"russianWord": "да", "englishMeaning": "yes", "partOfSpeech": "particle", "curriculumStage": 0, "frequencyRank": 14, "exampleSentenceRu": "Да, я понимаю.", "exampleSentenceEn": "Yes, I understand."},
  {"russianWord": "здесь", "englishMeaning": "here", "partOfSpeech": "adverb", "curriculumStage": 0, "frequencyRank": 45, "exampleSentenceRu": "Он здесь.", "exampleSentenceEn": "He is here."},
  {"russianWord": "там", "englishMeaning": "there", "partOfSpeech": "adverb", "curriculumStage": 0, "frequencyRank": 60, "exampleSentenceRu": "Катя там.", "exampleSentenceEn": "Katya is there."},
  {"russianWord": "знать", "englishMeaning": "to know", "partOfSpeech": "verb", "curriculumStage": 1, "frequencyRank": 20, "grammarNotes": "imperfective. знаю/знаешь/знает/знаем/знаете/знают", "exampleSentenceRu": "Я не знаю, где она.", "exampleSentenceEn": "I don't know where she is."},
  {"russianWord": "говорить", "englishMeaning": "to speak / to say", "partOfSpeech": "verb", "curriculumStage": 1, "frequencyRank": 22, "grammarNotes": "imperfective. говорю/говоришь/говорит", "exampleSentenceRu": "Ты говоришь по-русски?", "exampleSentenceEn": "Do you speak Russian?"},
  {"russianWord": "понимать", "englishMeaning": "to understand", "partOfSpeech": "verb", "curriculumStage": 1, "frequencyRank": 35, "grammarNotes": "imperfective. понимаю/понимаешь/понимает", "exampleSentenceRu": "Я понимаю тебя.", "exampleSentenceEn": "I understand you."},
  {"russianWord": "идти", "englishMeaning": "to go (on foot, one direction)", "partOfSpeech": "verb", "curriculumStage": 1, "frequencyRank": 40, "grammarNotes": "imperfective unidirectional. иду/идёшь/идёт", "exampleSentenceRu": "Куда ты идёшь?", "exampleSentenceEn": "Where are you going?"},
  {"russianWord": "видеть", "englishMeaning": "to see", "partOfSpeech": "verb", "curriculumStage": 1, "frequencyRank": 50, "grammarNotes": "imperfective. вижу/видишь/видит", "exampleSentenceRu": "Я вижу её.", "exampleSentenceEn": "I see her."},
  {"russianWord": "хотеть", "englishMeaning": "to want", "partOfSpeech": "verb", "curriculumStage": 1, "frequencyRank": 55, "grammarNotes": "imperfective. хочу/хочешь/хочет/хотим/хотите/хотят", "exampleSentenceRu": "Я хочу знать правду.", "exampleSentenceEn": "I want to know the truth."},
  {"russianWord": "Москва", "englishMeaning": "Moscow", "partOfSpeech": "noun", "curriculumStage": 0, "frequencyRank": 200, "grammarNotes": "feminine, 1st declension. Gen: Москвы, Dat: Москве", "exampleSentenceRu": "Я в Москве.", "exampleSentenceEn": "I am in Moscow."},
  {"russianWord": "человек", "englishMeaning": "person / man", "partOfSpeech": "noun", "curriculumStage": 1, "frequencyRank": 10, "grammarNotes": "masculine. Plural: люди (suppletive)", "exampleSentenceRu": "Этот человек знает что-то.", "exampleSentenceEn": "This person knows something."},
  {"russianWord": "день", "englishMeaning": "day", "partOfSpeech": "noun", "curriculumStage": 1, "frequencyRank": 18, "grammarNotes": "masculine. Gen: дня, Prep: дне, Pl: дни", "exampleSentenceRu": "Сегодня первый день.", "exampleSentenceEn": "Today is the first day."},
  {"russianWord": "время", "englishMeaning": "time", "partOfSpeech": "noun", "curriculumStage": 1, "frequencyRank": 8, "grammarNotes": "neuter, irregular. Gen: времени", "exampleSentenceRu": "У меня нет времени.", "exampleSentenceEn": "I don't have time."},
  {"russianWord": "дом", "englishMeaning": "house / home", "partOfSpeech": "noun", "curriculumStage": 1, "frequencyRank": 30, "grammarNotes": "masculine. дома=at home (adverb), в доме=in the house", "exampleSentenceRu": "Он не дома.", "exampleSentenceEn": "He is not home."},
  {"russianWord": "хорошо", "englishMeaning": "good / well / okay", "partOfSpeech": "adverb", "curriculumStage": 0, "frequencyRank": 25, "exampleSentenceRu": "Хорошо, я понимаю.", "exampleSentenceEn": "Okay, I understand."},
  {"russianWord": "сейчас", "englishMeaning": "now / right now", "partOfSpeech": "adverb", "curriculumStage": 0, "frequencyRank": 32, "exampleSentenceRu": "Где она сейчас?", "exampleSentenceEn": "Where is she now?"},
  {"russianWord": "где", "englishMeaning": "where", "partOfSpeech": "adverb", "curriculumStage": 0, "frequencyRank": 38, "exampleSentenceRu": "Где Катя?", "exampleSentenceEn": "Where is Katya?"},
  {"russianWord": "что", "englishMeaning": "what / that (conjunction)", "partOfSpeech": "pronoun/conjunction", "curriculumStage": 0, "frequencyRank": 4, "exampleSentenceRu": "Что это?", "exampleSentenceEn": "What is this?"},
  {"russianWord": "не", "englishMeaning": "not (negation particle)", "partOfSpeech": "particle", "curriculumStage": 0, "frequencyRank": 3, "grammarNotes": "precedes the word it negates", "exampleSentenceRu": "Я не знаю.", "exampleSentenceEn": "I don't know."}
]
```

- [ ] **Step 4: Commit**

```bash
git add content/
git commit -m "feat: add curriculum, NPC, and seed vocabulary content"
```

---

## Task 5: FSRS Engine

**Files:**
- Create: `lib/srs/fsrs.ts`
- Create: `lib/srs/fsrs.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/srs/fsrs.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { scheduleReview, cardIsNew, cardIsDue, ratingFromMs } from './fsrs'

describe('FSRS Engine', () => {
  it('schedules a new card for review today', () => {
    const card = cardIsNew()
    expect(card.state).toBe(0) // New
    expect(card.reps).toBe(0)
    expect(card.nextReview).toBeNull()
  })

  it('schedules next review after correct answer on new card', () => {
    const card = cardIsNew()
    const result = scheduleReview(card, 'good', 0)
    expect(result.reps).toBe(1)
    expect(result.state).toBe(2) // Review
    expect(result.scheduledDays).toBeGreaterThan(0)
    expect(result.nextReview).toBeInstanceOf(Date)
  })

  it('resets card on wrong answer', () => {
    const card = { ...cardIsNew(), reps: 5, stability: 10, state: 2 }
    const result = scheduleReview(card, 'again', 0)
    expect(result.lapses).toBe(1)
    expect(result.scheduledDays).toBeLessThan(2) // Short interval after lapse
  })

  it('detects due card correctly', () => {
    const pastDate = new Date(Date.now() - 1000 * 60 * 60) // 1 hour ago
    const card = { ...cardIsNew(), nextReview: pastDate }
    expect(cardIsDue(card)).toBe(true)
  })

  it('detects not-due card correctly', () => {
    const futureDate = new Date(Date.now() + 1000 * 60 * 60 * 24) // tomorrow
    const card = { ...cardIsNew(), nextReview: futureDate }
    expect(cardIsDue(card)).toBe(false)
  })

  it('maps fast response to easy rating', () => {
    expect(ratingFromMs(800)).toBe('easy')
  })

  it('maps slow response to hard rating', () => {
    expect(ratingFromMs(5000)).toBe('hard')
  })

  it('maps medium response to good rating', () => {
    expect(ratingFromMs(2000)).toBe('good')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test lib/srs/fsrs.test.ts
```

Expected: FAIL — `Cannot find module './fsrs'`

- [ ] **Step 3: Write the FSRS implementation**

Create `lib/srs/fsrs.ts`:

```typescript
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card, type RecordLog } from 'ts-fsrs'

export type SRSRating = 'again' | 'hard' | 'good' | 'easy'

export type SRSCard = {
  stability: number
  difficulty: number
  elapsedDays: number
  scheduledDays: number
  reps: number
  lapses: number
  state: number // 0=New, 1=Learning, 2=Review, 3=Relearning
  lastReview: Date | null
  nextReview: Date | null
}

// Target 85% recall rate — the optimal challenge point per Bjork research
const f = fsrs(generatorParameters({ request_retention: 0.85 }))

const RATING_MAP: Record<SRSRating, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
}

export function cardIsNew(): SRSCard {
  return {
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    lastReview: null,
    nextReview: null,
  }
}

export function cardIsDue(card: SRSCard): boolean {
  if (card.nextReview === null) return true // New cards are always due
  return card.nextReview <= new Date()
}

export function scheduleReview(card: SRSCard, rating: SRSRating, _responseMs: number): SRSCard {
  const tsCard: Card = {
    due: card.nextReview ?? new Date(),
    stability: card.stability,
    difficulty: card.difficulty,
    elapsed_days: card.elapsedDays,
    scheduled_days: card.scheduledDays,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state as Card['state'],
    last_review: card.lastReview ?? undefined,
  }

  const now = new Date()
  const recordLog: RecordLog = f.repeat(tsCard, now)
  const result = recordLog[RATING_MAP[rating]]

  return {
    stability: result.card.stability,
    difficulty: result.card.difficulty,
    elapsedDays: result.card.elapsed_days,
    scheduledDays: result.card.scheduled_days,
    reps: result.card.reps,
    lapses: result.card.lapses,
    state: result.card.state as number,
    lastReview: result.card.last_review ?? null,
    nextReview: result.card.due,
  }
}

/**
 * Map response time in milliseconds to an SRS rating.
 * Research-backed thresholds: fast = easy, slow = hard.
 * <1s = easy, 1-3s = good, 3-5s = hard, wrong = again
 */
export function ratingFromMs(ms: number): SRSRating {
  if (ms < 1200) return 'easy'
  if (ms < 3000) return 'good'
  return 'hard'
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test lib/srs/fsrs.test.ts
```

Expected: All 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/srs/
git commit -m "feat: add FSRS spaced repetition engine with tests"
```

---

## Task 6: Curriculum Engine

**Files:**
- Create: `lib/curriculum/engine.ts`
- Create: `lib/curriculum/engine.test.ts`

- [ ] **Step 1: Write the failing test**

Create `lib/curriculum/engine.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import {
  getStageForEpisode,
  getNewWordsPerEpisode,
  buildSystemPromptContext,
  type LearnerContext,
} from './engine'

const mockLearner: LearnerContext = {
  grammarStage: 1,
  episodeNum: 7,
  knownWordIds: [1, 2, 3, 4, 5],
  strugglingStructures: ['accusative_case_basic'],
  storySummary: 'Alex arrived in Moscow. Katya was supposed to meet him but did not appear.',
  npcRelationships: { katya: 'neutral', igor: 'suspicious' },
  targetWordIds: [10, 11, 12, 13, 14],
  grammarFocusStructure: 'accusative_case_basic',
}

describe('Curriculum Engine', () => {
  it('returns correct stage for episode', () => {
    expect(getStageForEpisode(3)).toBe(0)   // A0
    expect(getStageForEpisode(7)).toBe(1)   // A1
    expect(getStageForEpisode(15)).toBe(2)  // A2
    expect(getStageForEpisode(30)).toBe(3)  // B1
    expect(getStageForEpisode(60)).toBe(4)  // B2
  })

  it('returns correct new words per episode for stage', () => {
    expect(getNewWordsPerEpisode(0)).toBe(3)
    expect(getNewWordsPerEpisode(1)).toBe(5)
    expect(getNewWordsPerEpisode(2)).toBe(7)
    expect(getNewWordsPerEpisode(3)).toBe(8)
    expect(getNewWordsPerEpisode(4)).toBe(10)
  })

  it('builds system prompt context as a non-empty string', () => {
    const context = buildSystemPromptContext(mockLearner)
    expect(typeof context).toBe('string')
    expect(context.length).toBeGreaterThan(100)
    expect(context).toContain('accusative_case_basic')
    expect(context).toContain('Moscow')
  })

  it('includes struggling structures in context', () => {
    const context = buildSystemPromptContext(mockLearner)
    expect(context).toContain('accusative_case_basic')
    expect(context).toContain('AVOID overusing')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npm test lib/curriculum/engine.test.ts
```

Expected: FAIL — `Cannot find module './engine'`

- [ ] **Step 3: Write the curriculum engine**

Create `lib/curriculum/engine.ts`:

```typescript
import curriculum from '@/content/curriculum.json'

export type LearnerContext = {
  grammarStage: number
  episodeNum: number
  knownWordIds: number[]
  strugglingStructures: string[]
  storySummary: string
  npcRelationships: Record<string, string>
  targetWordIds: number[]       // IDs of words to introduce this episode
  grammarFocusStructure: string // The one structure to feature prominently
}

/**
 * Returns the curriculum stage number (0 through 4) for a given episode number.
 * Stages are defined by episode ranges in curriculum.json.
 */
export function getStageForEpisode(episodeNum: number): number {
  for (let i = curriculum.stages.length - 1; i >= 0; i--) {
    const stage = curriculum.stages[i]
    if (episodeNum >= stage.episodes[0]) {
      return stage.id
    }
  }
  return 0
}

/**
 * Returns how many new words to introduce per episode at a given stage.
 */
export function getNewWordsPerEpisode(stage: number): number {
  const s = curriculum.stages.find(s => s.id === stage)
  return s?.newWordsPerEpisode ?? 5
}

/**
 * Returns the allowed grammar structures for a given stage (cumulative — includes all prior stages).
 */
export function getAllowedStructures(stage: number): string[] {
  return curriculum.stages
    .filter(s => s.id <= stage)
    .flatMap(s => s.allowedStructures)
}

/**
 * Builds the curriculum constraint block injected into the AI story generation system prompt.
 * This is the core mechanism that prevents AI from using grammar above the learner's level.
 */
export function buildSystemPromptContext(ctx: LearnerContext): string {
  const stage = curriculum.stages.find(s => s.id === ctx.grammarStage)
  const allowed = getAllowedStructures(ctx.grammarStage)

  return `
## CURRICULUM CONSTRAINTS (STRICTLY ENFORCE)

You are generating content for a Russian language learner at stage ${ctx.grammarStage} (${stage?.label ?? 'A1'}).

### Allowed Grammar Structures
You may ONLY use these grammar structures in the Russian dialogue and narration:
${allowed.map(s => `- ${s}`).join('\n')}

Do NOT use any grammar structures from higher stages. This is a hard constraint.

### Vocabulary
- The learner knows ${ctx.knownWordIds.length} words (IDs: ${ctx.knownWordIds.slice(0, 10).join(', ')}...)
- Introduce EXACTLY these new words in the episode (use each at least once): word IDs ${ctx.targetWordIds.join(', ')}
- Reuse known vocabulary freely — repetition reinforces acquisition
- New words per episode: ${getNewWordsPerEpisode(ctx.grammarStage)}

### Grammar Focus
The primary grammar structure to feature PROMINENTLY this episode: **${ctx.grammarFocusStructure}**
Include 2-3 clear, natural examples of this structure in the dialogue.

### Struggling Structures
${ctx.strugglingStructures.length > 0
  ? `The learner is currently struggling with: ${ctx.strugglingStructures.join(', ')}.\nAVOID overusing these — include max 1 example so as not to overwhelm.`
  : 'No struggling structures — use grammar freely within allowed set.'}

### Story Memory
${ctx.storySummary}

### NPC Relationship States
${Object.entries(ctx.npcRelationships).map(([npc, state]) => `- ${npc}: ${state}`).join('\n')}
`.trim()
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test lib/curriculum/engine.test.ts
```

Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/curriculum/
git commit -m "feat: add curriculum engine with grammar gates and system prompt builder"
```

---

## Task 7: Story World + Episode Generator

**Files:**
- Create: `lib/story/world.ts`
- Create: `lib/story/generator.ts`

- [ ] **Step 1: Write `lib/story/world.ts`**

```typescript
import npcsData from '@/content/npcs.json'

export type NPC = {
  id: string
  name: string
  nameEn: string
  role: string
  personality: string
  speechStyle: string
  appearsFromEpisode: number
  difficultyStage: number
  physicalDescription: string
  motivation: string
  relationship: string
}

export const STORY_PREMISE = `
# Незнакомец в Москве (Stranger in Moscow)

## Setup
Alex Volkov is an American journalist of Russian heritage. His Russian is rusty — he understands more than he can produce. He's been sent to Moscow to cover what seems like a routine story about urban development. On the first day, his contact (Катя) was supposed to meet him at the airport. She didn't appear.

## Tone
Slow-burn thriller. Not action-heavy — the tension is in conversations, in what isn't said, in who looks away first. The city itself is a character: Soviet-era apartment blocks, a metro system that runs like clockwork, a café where everyone seems to know everyone.

## Alex's Voice
Alex is observant, cautious, and slightly out of his depth linguistically. He makes grammatical mistakes that characters sometimes gently correct. He's motivated by the truth, not by adventure.

## Core Mystery
Why didn't Катя appear? What is she hiding? And why does the neighbor Игорь watch Alex's door?

## Story Rules
1. Advance the plot in every episode — something always changes, is revealed, or shifts
2. Keep Russian dialogue natural — what a real person would say, not a textbook example
3. Use descriptions to teach vocabulary in context — smell, sound, texture, temperature
4. NPCs have consistent personalities — they don't just exist to teach grammar
5. End each episode on a small hook — something unresolved that makes the learner want to continue
`.trim()

export const npcs: NPC[] = npcsData.npcs as NPC[]

export function getNPCsForEpisode(episodeNum: number): NPC[] {
  return npcs.filter(npc => npc.appearsFromEpisode <= episodeNum)
}

export function getNPCById(id: string): NPC | undefined {
  return npcs.find(npc => npc.id === id)
}

export function buildNPCSheets(episodeNum: number): string {
  const available = getNPCsForEpisode(episodeNum)
  return available.map(npc => `
### ${npc.name} (${npc.nameEn})
Role: ${npc.role}
Personality: ${npc.personality}
Speech style: ${npc.speechStyle}
Physical: ${npc.physicalDescription}
Motivation: ${npc.motivation}
Current relationship with Alex: ${npc.relationship}
`.trim()).join('\n\n')
}
```

- [ ] **Step 2: Write `lib/story/generator.ts`**

```typescript
import { generateText } from 'ai'
import { STORY_PREMISE, buildNPCSheets } from './world'
import { buildSystemPromptContext, type LearnerContext } from '@/lib/curriculum/engine'

export type EpisodeOutput = {
  episodeText: string
  highlightedWords: Array<{ wordId: number; russianWord: string; startIndex: number; endIndex: number }>
  comprehensionQuestions: Array<{ questionRu: string; answerRu: string }>
  grammarFocusExamples: Array<{ sentenceRu: string; sentenceEn: string; explanation: string }>
  storySummaryUpdate: string
  grammarFocusId: number | null
}

export async function generateEpisode(
  learnerCtx: LearnerContext,
  targetWords: Array<{ id: number; russianWord: string; englishMeaning: string }>,
): Promise<EpisodeOutput> {
  const npcSheets = buildNPCSheets(learnerCtx.episodeNum)
  const curriculumContext = buildSystemPromptContext(learnerCtx)

  const systemPrompt = `
You are a Russian language learning content generator. You write immersive story episodes for a Moscow thriller.

${STORY_PREMISE}

## NPCs Available This Episode
${npcSheets}

${curriculumContext}

## Target Words to Introduce
These words MUST appear naturally in the episode (at least once each):
${targetWords.map(w => `- ${w.russianWord} (${w.englishMeaning})`).join('\n')}

## Output Format
Respond with a valid JSON object matching this exact structure:
{
  "episodeText": "<Russian narrative text, 200-350 words, mix of narration and dialogue>",
  "highlightedWords": [
    { "wordId": <number>, "russianWord": "<word>", "startIndex": <number>, "endIndex": <number> }
  ],
  "comprehensionQuestions": [
    { "questionRu": "<question in Russian, simple>", "answerRu": "<answer in Russian>" }
  ],
  "grammarFocusExamples": [
    { "sentenceRu": "<sentence>", "sentenceEn": "<translation>", "explanation": "<brief English explanation>" }
  ],
  "storySummaryUpdate": "<2-3 sentence summary of what happened this episode, in English, to store as story memory>"
}

highlightedWords must list every occurrence of the target words with correct character indices.
comprehensionQuestions: exactly 3 questions, answerable from this episode alone.
grammarFocusExamples: exactly 3 examples of the grammar focus structure.
`.trim()

  const { text } = await generateText({
    model: 'anthropic/claude-sonnet-4.6',
    system: systemPrompt,
    prompt: `Generate episode ${learnerCtx.episodeNum} of the Moscow thriller. The learner is at stage ${learnerCtx.grammarStage}. Make it compelling.`,
    maxTokens: 2000,
  })

  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('AI did not return valid JSON for episode generation')

  const parsed = JSON.parse(jsonMatch[0])

  return {
    episodeText: parsed.episodeText ?? '',
    highlightedWords: parsed.highlightedWords ?? [],
    comprehensionQuestions: parsed.comprehensionQuestions ?? [],
    grammarFocusExamples: parsed.grammarFocusExamples ?? [],
    storySummaryUpdate: parsed.storySummaryUpdate ?? '',
    grammarFocusId: null, // linked in the API route after DB lookup
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/story/
git commit -m "feat: add story world definitions and AI episode generator"
```

---

## Task 8: Database Query Layer

**Files:**
- Create: `lib/db/queries/learner.ts`
- Create: `lib/db/queries/vocabulary.ts`
- Create: `lib/db/queries/episodes.ts`

- [ ] **Step 1: Write `lib/db/queries/learner.ts`**

```typescript
import { db } from '@/lib/db'
import { users, learnerModel } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function getOrCreateUser(userId: string) {
  const existing = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (existing.length > 0) return existing[0]

  const [newUser] = await db.insert(users).values({ id: userId }).returning()

  await db.insert(learnerModel).values({ userId })

  return newUser
}

export async function getLearnerModel(userId: string) {
  const rows = await db.select().from(learnerModel).where(eq(learnerModel.userId, userId)).limit(1)
  return rows[0] ?? null
}

export async function updateLearnerModel(
  userId: string,
  updates: Partial<{
    grammarStage: number
    totalMinutes: number
    streak: number
    lastSessionDate: string
    storyPosition: object
    phoneticProfile: object
  }>,
) {
  await db.update(learnerModel).set(updates).where(eq(learnerModel.userId, userId))
}

export async function updateStreak(userId: string) {
  const model = await getLearnerModel(userId)
  if (!model) return

  const today = new Date().toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const newStreak = model.lastSessionDate === yesterday
    ? model.streak + 1
    : model.lastSessionDate === today
    ? model.streak
    : 1 // streak broken

  await db
    .update(learnerModel)
    .set({ streak: newStreak, lastSessionDate: today })
    .where(eq(learnerModel.userId, userId))

  return newStreak
}
```

- [ ] **Step 2: Write `lib/db/queries/vocabulary.ts`**

```typescript
import { db } from '@/lib/db'
import { vocabulary, learnerVocabulary } from '@/lib/db/schema'
import { eq, and, lte, isNull, or } from 'drizzle-orm'
import { scheduleReview, type SRSRating, type SRSCard } from '@/lib/srs/fsrs'

export async function seedVocabularyIfEmpty() {
  const count = await db.select().from(vocabulary).limit(1)
  if (count.length > 0) return // already seeded

  const seedData = (await import('@/content/seed-vocabulary.json')).default
  await db.insert(vocabulary).values(seedData)
}

export async function getWordsByStage(stage: number, limit = 20) {
  return db.select().from(vocabulary).where(eq(vocabulary.curriculumStage, stage)).limit(limit)
}

export async function getDueCards(userId: string, limit = 20) {
  const now = new Date()
  return db
    .select({
      lv: learnerVocabulary,
      v: vocabulary,
    })
    .from(learnerVocabulary)
    .innerJoin(vocabulary, eq(learnerVocabulary.wordId, vocabulary.id))
    .where(
      and(
        eq(learnerVocabulary.userId, userId),
        or(isNull(learnerVocabulary.nextReview), lte(learnerVocabulary.nextReview, now)),
      ),
    )
    .limit(limit)
}

export async function addWordToLearnerDeck(userId: string, wordId: number, sourceEpisodeId?: number) {
  // Check if already exists
  const existing = await db
    .select()
    .from(learnerVocabulary)
    .where(and(eq(learnerVocabulary.userId, userId), eq(learnerVocabulary.wordId, wordId)))
    .limit(1)

  if (existing.length > 0) return existing[0]

  const [inserted] = await db
    .insert(learnerVocabulary)
    .values({ userId, wordId, sourceEpisodeId })
    .returning()

  return inserted
}

export async function submitReview(
  userId: string,
  wordId: number,
  rating: SRSRating,
  responseMs: number,
) {
  const rows = await db
    .select()
    .from(learnerVocabulary)
    .where(and(eq(learnerVocabulary.userId, userId), eq(learnerVocabulary.wordId, wordId)))
    .limit(1)

  if (rows.length === 0) throw new Error(`Word ${wordId} not in learner deck`)

  const current = rows[0]
  const card: SRSCard = {
    stability: current.stability,
    difficulty: current.difficulty,
    elapsedDays: current.elapsedDays,
    scheduledDays: current.scheduledDays,
    reps: current.reps,
    lapses: current.lapses,
    state: current.state,
    lastReview: current.lastReview,
    nextReview: current.nextReview,
  }

  const updated = scheduleReview(card, rating, responseMs)

  await db
    .update(learnerVocabulary)
    .set({
      ...updated,
      seenCount: current.seenCount + 1,
      avgResponseMs: current.avgResponseMs
        ? Math.round((current.avgResponseMs + responseMs) / 2)
        : responseMs,
    })
    .where(and(eq(learnerVocabulary.userId, userId), eq(learnerVocabulary.wordId, wordId)))

  return updated
}
```

- [ ] **Step 3: Write `lib/db/queries/episodes.ts`**

```typescript
import { db } from '@/lib/db'
import { episodes } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import type { EpisodeOutput } from '@/lib/story/generator'

export async function saveEpisode(
  userId: string,
  act: number,
  episodeNum: number,
  output: EpisodeOutput,
) {
  const [saved] = await db
    .insert(episodes)
    .values({
      userId,
      act,
      episodeNum,
      episodeText: output.episodeText,
      highlightedWords: output.highlightedWords,
      comprehensionQuestions: output.comprehensionQuestions,
      grammarFocusExamples: output.grammarFocusExamples,
      storySummaryUpdate: output.storySummaryUpdate,
      grammarFocusId: output.grammarFocusId,
      targetWordIds: output.highlightedWords.map(w => w.wordId),
    })
    .returning()

  return saved
}

export async function getRecentEpisodeSummaries(userId: string, count = 5): Promise<string> {
  const recent = await db
    .select({ storySummaryUpdate: episodes.storySummaryUpdate, episodeNum: episodes.episodeNum })
    .from(episodes)
    .where(eq(episodes.userId, userId))
    .orderBy(desc(episodes.episodeNum))
    .limit(count)

  if (recent.length === 0) {
    return 'Alex has just arrived in Moscow. This is the very beginning of his investigation.'
  }

  return recent
    .reverse()
    .map(e => `Episode ${e.episodeNum}: ${e.storySummaryUpdate}`)
    .join('\n')
}

export async function getLatestEpisodeNum(userId: string): Promise<number> {
  const rows = await db
    .select({ episodeNum: episodes.episodeNum })
    .from(episodes)
    .where(eq(episodes.userId, userId))
    .orderBy(desc(episodes.episodeNum))
    .limit(1)

  return rows[0]?.episodeNum ?? 0
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/queries/
git commit -m "feat: add database query layer for learner, vocabulary, and episodes"
```

---

## Task 9: API Routes

**Files:**
- Create: `app/api/episode/route.ts`
- Create: `app/api/srs/route.ts`
- Create: `app/api/srs/review/route.ts`

- [ ] **Step 1: Write episode generation API**

Create `app/api/episode/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { generateEpisode } from '@/lib/story/generator'
import { getOrCreateUser, getLearnerModel } from '@/lib/db/queries/learner'
import { getWordsByStage, addWordToLearnerDeck, seedVocabularyIfEmpty } from '@/lib/db/queries/vocabulary'
import { saveEpisode, getRecentEpisodeSummaries, getLatestEpisodeNum } from '@/lib/db/queries/episodes'
import { getStageForEpisode, getNewWordsPerEpisode } from '@/lib/curriculum/engine'
import type { LearnerContext } from '@/lib/curriculum/engine'

export async function POST(req: NextRequest) {
  const { userId } = await req.json()
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  try {
    await seedVocabularyIfEmpty()
    await getOrCreateUser(userId)

    const model = await getLearnerModel(userId)
    const lastEpisode = await getLatestEpisodeNum(userId)
    const episodeNum = lastEpisode + 1
    const stage = getStageForEpisode(episodeNum)
    const storySummary = await getRecentEpisodeSummaries(userId)

    // Pick target words for this episode
    const wordsPerEpisode = getNewWordsPerEpisode(stage)
    const stageWords = await getWordsByStage(stage, wordsPerEpisode * 3)
    const targetWords = stageWords.slice(0, wordsPerEpisode)

    const learnerCtx: LearnerContext = {
      grammarStage: model?.grammarStage ?? stage,
      episodeNum,
      knownWordIds: [], // TODO: pull from learner_vocabulary in future iteration
      strugglingStructures: [],
      storySummary,
      npcRelationships: (model?.storyPosition as any)?.npcRelationships ?? {},
      targetWordIds: targetWords.map(w => w.id),
      grammarFocusStructure: 'nominative_case', // TODO: pull from curriculum engine
    }

    const output = await generateEpisode(learnerCtx, targetWords)

    // Save episode and add new words to learner deck
    const act = Math.ceil(episodeNum / 20)
    const saved = await saveEpisode(userId, act, episodeNum, output)

    await Promise.all(
      targetWords.map(w => addWordToLearnerDeck(userId, w.id, saved.id))
    )

    return NextResponse.json({
      episode: saved,
      targetWords,
      episodeNum,
      stage,
    })
  } catch (err) {
    console.error('[episode generation error]', err)
    return NextResponse.json({ error: 'Episode generation failed' }, { status: 500 })
  }
}
```

- [ ] **Step 2: Write SRS cards API**

Create `app/api/srs/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getDueCards } from '@/lib/db/queries/vocabulary'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const cards = await getDueCards(userId, 20)
  return NextResponse.json({ cards })
}
```

- [ ] **Step 3: Write SRS review submit API**

Create `app/api/srs/review/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { submitReview } from '@/lib/db/queries/vocabulary'
import type { SRSRating } from '@/lib/srs/fsrs'

export async function POST(req: NextRequest) {
  const { userId, wordId, rating, responseMs } = await req.json()

  if (!userId || !wordId || !rating) {
    return NextResponse.json({ error: 'userId, wordId, rating required' }, { status: 400 })
  }

  const updated = await submitReview(userId, wordId, rating as SRSRating, responseMs ?? 0)
  return NextResponse.json({ updated })
}
```

- [ ] **Step 4: Commit**

```bash
git add app/api/
git commit -m "feat: add episode generation and SRS API routes"
```

---

## Task 10: Install shadcn Components + Theme

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Add needed shadcn components**

```bash
npx shadcn@latest add button card progress badge separator
```

- [ ] **Step 2: Update layout for dark theme**

Replace `app/layout.tsx`:

```typescript
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Незнакомец в Москве',
  description: 'Learn Russian through a Moscow thriller',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100 min-h-screen`}>
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx app/globals.css components/ui/
git commit -m "feat: configure dark theme and add shadcn components"
```

---

## Task 11: Session Components

**Files:**
- Create: `components/session/PhaseIndicator.tsx`
- Create: `components/session/SRSReview.tsx`
- Create: `components/session/StoryEpisode.tsx`
- Create: `components/session/GrammarDrill.tsx`
- Create: `components/session/SessionShell.tsx`

- [ ] **Step 1: Write `PhaseIndicator.tsx`**

```typescript
'use client'

const PHASES = [
  { id: 1, label: 'Review', mins: 5, icon: '🔁' },
  { id: 2, label: 'Story', mins: 15, icon: '📖' },
  { id: 3, label: 'Grammar', mins: 10, icon: '✏️' },
  { id: 4, label: 'Speak', mins: 10, icon: '💬' },
  { id: 5, label: 'Pronounce', mins: 5, icon: '🎙️' },
]

type Props = { currentPhase: number }

export function PhaseIndicator({ currentPhase }: Props) {
  return (
    <div className="flex items-center gap-1 w-full">
      {PHASES.map((phase, i) => (
        <div key={phase.id} className="flex items-center flex-1">
          <div className={`flex-1 flex flex-col items-center gap-1 rounded-lg px-2 py-2 transition-all ${
            currentPhase === phase.id
              ? 'bg-zinc-800 ring-1 ring-zinc-600'
              : currentPhase > phase.id
              ? 'opacity-40'
              : 'opacity-25'
          }`}>
            <span className="text-sm">{phase.icon}</span>
            <span className="text-xs font-medium text-zinc-300">{phase.label}</span>
            <span className="text-xs text-zinc-500">{phase.mins}m</span>
          </div>
          {i < PHASES.length - 1 && (
            <div className={`h-px w-2 ${currentPhase > phase.id ? 'bg-zinc-600' : 'bg-zinc-800'}`} />
          )}
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Write `SRSReview.tsx`**

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ratingFromMs, type SRSRating } from '@/lib/srs/fsrs'

type Card = {
  lv: { wordId: number; seenCount: number }
  v: { russianWord: string; englishMeaning: string; exampleSentenceRu: string | null; exampleSentenceEn: string | null; grammarNotes: string | null }
}

type Props = {
  userId: string
  onComplete: (accuracy: number) => void
}

export function SRSReview({ userId, onComplete }: Props) {
  const [cards, setCards] = useState<Card[]>([])
  const [index, setIndex] = useState(0)
  const [revealed, setRevealed] = useState(false)
  const [startMs, setStartMs] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/srs?userId=${userId}`)
      .then(r => r.json())
      .then(d => { setCards(d.cards ?? []); setLoading(false) })
  }, [userId])

  useEffect(() => {
    if (!revealed) setStartMs(Date.now())
  }, [index, revealed])

  const reveal = () => setRevealed(true)

  const submitRating = useCallback(async (rating: SRSRating, wasCorrect: boolean) => {
    const responseMs = Date.now() - startMs
    const card = cards[index]

    await fetch('/api/srs/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, wordId: card.lv.wordId, rating, responseMs }),
    })

    if (wasCorrect) setCorrect(c => c + 1)

    if (index + 1 >= cards.length) {
      onComplete(cards.length > 0 ? (correct + (wasCorrect ? 1 : 0)) / cards.length : 1)
    } else {
      setIndex(i => i + 1)
      setRevealed(false)
    }
  }, [cards, index, userId, startMs, correct, onComplete])

  if (loading) return <div className="text-center text-zinc-400 py-12">Loading your review cards...</div>

  if (cards.length === 0) {
    return (
      <div className="text-center space-y-4 py-12">
        <p className="text-xl text-zinc-300">No cards due for review</p>
        <p className="text-zinc-500 text-sm">Your deck is all caught up. Nice work.</p>
        <Button onClick={() => onComplete(1)} variant="outline">Continue to Story →</Button>
      </div>
    )
  }

  const card = cards[index]

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-sm text-zinc-500 text-center">
        Card {index + 1} of {cards.length} · {Math.round((index / cards.length) * 100)}% done
      </div>

      {/* Prompt side — English sentence */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
        <div className="text-xs text-zinc-500 uppercase tracking-wider">Translate to Russian</div>
        <p className="text-lg text-zinc-200 font-medium">{card.v.exampleSentenceEn ?? card.v.englishMeaning}</p>
        {card.v.grammarNotes && !revealed && (
          <p className="text-xs text-zinc-600 italic">{card.v.grammarNotes}</p>
        )}
      </div>

      {!revealed ? (
        <Button className="w-full" variant="outline" onClick={reveal}>
          Show Russian →
        </Button>
      ) : (
        <>
          {/* Answer side — Russian sentence */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-800 p-6 space-y-2">
            <div className="text-xs text-zinc-400 uppercase tracking-wider">Russian</div>
            <p className="text-2xl text-zinc-100 font-medium">{card.v.exampleSentenceRu ?? card.v.russianWord}</p>
            <p className="text-sm text-zinc-400">({card.v.russianWord} — {card.v.englishMeaning})</p>
          </div>

          {/* Rating buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="border-red-900 text-red-400 hover:bg-red-950"
              onClick={() => submitRating('again', false)}
            >
              ✗ Missed it — review soon
            </Button>
            <Button
              className="bg-emerald-900 text-emerald-100 hover:bg-emerald-800"
              onClick={() => submitRating(ratingFromMs(Date.now() - startMs), true)}
            >
              ✓ Got it
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Write `StoryEpisode.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type HighlightedWord = { wordId: number; russianWord: string; startIndex: number; endIndex: number }
type Question = { questionRu: string; answerRu: string }

type Episode = {
  episodeText: string
  highlightedWords: HighlightedWord[]
  comprehensionQuestions: Question[]
  episodeNum: number
}

type Props = {
  episode: Episode
  onComplete: () => void
}

export function StoryEpisode({ episode, onComplete }: Props) {
  const [selectedWord, setSelectedWord] = useState<HighlightedWord | null>(null)
  const [questionsVisible, setQuestionsVisible] = useState(false)
  const [answers, setAnswers] = useState<string[]>(['', '', ''])
  const [submitted, setSubmitted] = useState(false)

  // Render episode text with highlighted words as clickable spans
  function renderText(text: string, highlights: HighlightedWord[]) {
    if (highlights.length === 0) return <span>{text}</span>

    const sorted = [...highlights].sort((a, b) => a.startIndex - b.startIndex)
    const parts: React.ReactNode[] = []
    let cursor = 0

    sorted.forEach((h, i) => {
      if (h.startIndex > cursor) parts.push(<span key={`text-${i}`}>{text.slice(cursor, h.startIndex)}</span>)
      parts.push(
        <button
          key={`word-${i}`}
          className="underline decoration-dotted decoration-emerald-500 text-emerald-300 hover:text-emerald-100 cursor-pointer"
          onClick={() => setSelectedWord(h)}
        >
          {text.slice(h.startIndex, h.endIndex)}
        </button>
      )
      cursor = h.endIndex
    })

    if (cursor < text.length) parts.push(<span key="text-end">{text.slice(cursor)}</span>)
    return <>{parts}</>
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-sm text-zinc-500">Episode {episode.episodeNum}</div>

      {/* Story text */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="text-zinc-200 leading-relaxed text-lg font-serif">
          {renderText(episode.episodeText, episode.highlightedWords)}
        </p>
      </div>

      {/* Word tooltip */}
      {selectedWord && (
        <div className="rounded-lg border border-emerald-900 bg-zinc-900 p-4 flex items-center justify-between">
          <div>
            <span className="text-emerald-300 font-medium">{selectedWord.russianWord}</span>
            <span className="text-zinc-400 ml-3">— new word this episode</span>
          </div>
          <button className="text-zinc-600 hover:text-zinc-400 text-sm" onClick={() => setSelectedWord(null)}>✕</button>
        </div>
      )}

      {/* Comprehension questions */}
      {!questionsVisible ? (
        <Button className="w-full" variant="outline" onClick={() => setQuestionsVisible(true)}>
          Answer 3 Comprehension Questions →
        </Button>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">Answer in Russian — don't worry about perfection</p>
          {episode.comprehensionQuestions.map((q, i) => (
            <div key={i} className="space-y-2">
              <p className="text-zinc-300 font-medium">{q.questionRu}</p>
              {!submitted ? (
                <input
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
                  placeholder="Ваш ответ..."
                  value={answers[i]}
                  onChange={e => setAnswers(a => { const n = [...a]; n[i] = e.target.value; return n })}
                />
              ) : (
                <div className="space-y-1">
                  <div className="text-zinc-300 bg-zinc-800 px-4 py-2 rounded-lg">{answers[i] || '(no answer)'}</div>
                  <div className="text-emerald-400 text-sm px-1">Model answer: {q.answerRu}</div>
                </div>
              )}
            </div>
          ))}
          {!submitted ? (
            <Button className="w-full" onClick={() => setSubmitted(true)}>Check Answers</Button>
          ) : (
            <Button className="w-full bg-emerald-900 hover:bg-emerald-800" onClick={onComplete}>
              Continue to Grammar Drill →
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Write `GrammarDrill.tsx`**

```typescript
'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Example = { sentenceRu: string; sentenceEn: string; explanation: string }

type Props = {
  grammarFocusExamples: Example[]
  onComplete: (accuracy: number) => void
}

export function GrammarDrill({ grammarFocusExamples, onComplete }: Props) {
  const [index, setIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [correct, setCorrect] = useState(0)

  if (grammarFocusExamples.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-zinc-400">No grammar drills for this episode.</p>
        <Button onClick={() => onComplete(1)}>Continue →</Button>
      </div>
    )
  }

  const current = grammarFocusExamples[index]

  const check = () => setChecked(true)

  const next = (wasCorrect: boolean) => {
    if (wasCorrect) setCorrect(c => c + 1)
    if (index + 1 >= grammarFocusExamples.length) {
      onComplete((correct + (wasCorrect ? 1 : 0)) / grammarFocusExamples.length)
    } else {
      setIndex(i => i + 1)
      setAnswer('')
      setChecked(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <div className="text-sm text-zinc-500 text-center">
        Grammar Drill · {index + 1} / {grammarFocusExamples.length}
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Translate to Russian</p>
        <p className="text-lg text-zinc-200 font-medium">{current.sentenceEn}</p>
        <p className="text-xs text-zinc-600 italic">{current.explanation}</p>
      </div>

      {!checked ? (
        <div className="space-y-3">
          <textarea
            className="w-full rounded-lg bg-zinc-800 border border-zinc-700 px-4 py-3 text-zinc-100 resize-none focus:outline-none focus:ring-1 focus:ring-zinc-500"
            rows={3}
            placeholder="Напишите по-русски..."
            value={answer}
            onChange={e => setAnswer(e.target.value)}
          />
          <Button className="w-full" onClick={check} disabled={!answer.trim()}>Check</Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-zinc-800 border border-zinc-700 p-4 space-y-2">
            <p className="text-xs text-zinc-500">Your answer:</p>
            <p className="text-zinc-200">{answer}</p>
          </div>
          <div className="rounded-lg bg-emerald-950 border border-emerald-900 p-4 space-y-2">
            <p className="text-xs text-emerald-500">Model answer:</p>
            <p className="text-emerald-200 font-medium">{current.sentenceRu}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="border-red-900 text-red-400 hover:bg-red-950" onClick={() => next(false)}>
              ✗ Needs work
            </Button>
            <Button className="bg-emerald-900 hover:bg-emerald-800" onClick={() => next(true)}>
              ✓ Got it
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: Write `SessionShell.tsx`**

```typescript
'use client'
import { useState, useEffect, useCallback } from 'react'
import { PhaseIndicator } from './PhaseIndicator'
import { SRSReview } from './SRSReview'
import { StoryEpisode } from './StoryEpisode'
import { GrammarDrill } from './GrammarDrill'

type Phase = 1 | 2 | 3 | 4 | 5

type SessionState = {
  phase: Phase
  srsAccuracy: number | null
  grammarAccuracy: number | null
  episodeData: any | null
  sessionStarted: number
  loadingEpisode: boolean
}

type Props = { userId: string }

export function SessionShell({ userId }: Props) {
  const [state, setState] = useState<SessionState>({
    phase: 1,
    srsAccuracy: null,
    grammarAccuracy: null,
    episodeData: null,
    sessionStarted: Date.now(),
    loadingEpisode: false,
  })

  const advanceTo = useCallback((phase: Phase) => {
    setState(s => ({ ...s, phase }))
  }, [])

  const handleSRSComplete = useCallback((accuracy: number) => {
    setState(s => ({ ...s, srsAccuracy: accuracy, phase: 2, loadingEpisode: true }))

    // Generate episode for phase 2
    fetch('/api/episode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    })
      .then(r => r.json())
      .then(data => setState(s => ({ ...s, episodeData: data, loadingEpisode: false })))
      .catch(() => setState(s => ({ ...s, loadingEpisode: false })))
  }, [userId])

  const handleEpisodeComplete = useCallback(() => advanceTo(3), [advanceTo])

  const handleGrammarComplete = useCallback((accuracy: number) => {
    setState(s => ({ ...s, grammarAccuracy: accuracy, phase: 4 }))
  }, [])

  const handleConversationComplete = useCallback(() => advanceTo(5), [advanceTo])
  const handlePronunciationComplete = useCallback(() => advanceTo(5), [advanceTo]) // placeholder

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="border-b border-zinc-900 px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <PhaseIndicator currentPhase={state.phase} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-2xl mx-auto">

          {state.phase === 1 && (
            <SRSReview userId={userId} onComplete={handleSRSComplete} />
          )}

          {state.phase === 2 && (
            state.loadingEpisode ? (
              <div className="text-center py-24 space-y-4">
                <div className="text-4xl animate-pulse">📖</div>
                <p className="text-zinc-400">Generating your Moscow episode...</p>
              </div>
            ) : state.episodeData ? (
              <StoryEpisode
                episode={{
                  episodeText: state.episodeData.episode.episodeText,
                  highlightedWords: state.episodeData.episode.highlightedWords ?? [],
                  comprehensionQuestions: state.episodeData.episode.comprehensionQuestions ?? [],
                  episodeNum: state.episodeData.episodeNum,
                }}
                onComplete={handleEpisodeComplete}
              />
            ) : (
              <div className="text-center py-12 text-red-400">Failed to generate episode. Try refreshing.</div>
            )
          )}

          {state.phase === 3 && state.episodeData && (
            <GrammarDrill
              grammarFocusExamples={state.episodeData.episode.grammarFocusExamples ?? []}
              onComplete={handleGrammarComplete}
            />
          )}

          {state.phase === 4 && (
            <div className="text-center py-24 space-y-6">
              <p className="text-xl text-zinc-300">AI Conversation — Phase 2</p>
              <p className="text-zinc-500">Coming in Phase 2 of the build.</p>
              <button
                className="px-6 py-3 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                onClick={() => advanceTo(5)}
              >
                Skip to Pronunciation →
              </button>
            </div>
          )}

          {state.phase === 5 && (
            <div className="text-center py-24 space-y-6">
              <div className="text-5xl">✅</div>
              <p className="text-xl text-zinc-200">Session Complete</p>
              <p className="text-zinc-400">
                {state.srsAccuracy !== null && `SRS accuracy: ${Math.round(state.srsAccuracy * 100)}%`}
              </p>
              <a href="/" className="inline-block px-6 py-3 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700">
                ← Back to Dashboard
              </a>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
git add components/session/
git commit -m "feat: add session phase components (SRS, story, grammar, shell)"
```

---

## Task 12: Dashboard + Pages

**Files:**
- Create: `components/dashboard/StreakCard.tsx`
- Create: `components/dashboard/VocabStats.tsx`
- Create: `components/dashboard/StoryPosition.tsx`
- Modify: `app/page.tsx`
- Create: `app/session/page.tsx`
- Create: `app/api/dashboard/route.ts`

- [ ] **Step 1: Write dashboard API**

Create `app/api/dashboard/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getOrCreateUser, getLearnerModel } from '@/lib/db/queries/learner'
import { getLatestEpisodeNum } from '@/lib/db/queries/episodes'
import { db } from '@/lib/db'
import { learnerVocabulary } from '@/lib/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  await getOrCreateUser(userId)
  const model = await getLearnerModel(userId)
  const episodeNum = await getLatestEpisodeNum(userId)

  const [vocabCount] = await db
    .select({ count: count() })
    .from(learnerVocabulary)
    .where(eq(learnerVocabulary.userId, userId))

  return NextResponse.json({
    streak: model?.streak ?? 0,
    totalMinutes: model?.totalMinutes ?? 0,
    episodeNum,
    wordsLearned: vocabCount?.count ?? 0,
    grammarStage: model?.grammarStage ?? 0,
    stageLabel: ['A0', 'A1', 'A2', 'B1', 'B2'][model?.grammarStage ?? 0],
  })
}
```

- [ ] **Step 2: Write dashboard components**

Create `components/dashboard/StreakCard.tsx`:
```typescript
type Props = { streak: number; totalMinutes: number }
export function StreakCard({ streak, totalMinutes }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-1">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">Streak</p>
      <p className="text-4xl font-bold text-zinc-100">{streak}<span className="text-2xl ml-1">🔥</span></p>
      <p className="text-sm text-zinc-400">{Math.round(totalMinutes / 60)} hours total</p>
    </div>
  )
}
```

Create `components/dashboard/VocabStats.tsx`:
```typescript
type Props = { wordsLearned: number; stageLabel: string }
export function VocabStats({ wordsLearned, stageLabel }: Props) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-1">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">Vocabulary</p>
      <p className="text-4xl font-bold text-zinc-100">{wordsLearned}</p>
      <p className="text-sm text-zinc-400">words in your deck · Level {stageLabel}</p>
    </div>
  )
}
```

Create `components/dashboard/StoryPosition.tsx`:
```typescript
type Props = { episodeNum: number }
export function StoryPosition({ episodeNum }: Props) {
  const progress = Math.round((episodeNum / 80) * 100)
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6 space-y-3">
      <p className="text-xs text-zinc-500 uppercase tracking-wider">Story Progress</p>
      <p className="text-lg font-medium text-zinc-200">
        {episodeNum === 0 ? 'Not started' : `Episode ${episodeNum} of 80`}
      </p>
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div className="h-full bg-emerald-700 rounded-full transition-all" style={{ width: `${progress}%` }} />
      </div>
      <p className="text-xs text-zinc-500">
        {episodeNum === 0 ? 'Begin your investigation' : `${progress}% through the Moscow thriller`}
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Write the dashboard page**

Replace `app/page.tsx`:

```typescript
'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { StreakCard } from '@/components/dashboard/StreakCard'
import { VocabStats } from '@/components/dashboard/VocabStats'
import { StoryPosition } from '@/components/dashboard/StoryPosition'

function getUserId(): string {
  let id = localStorage.getItem('russo_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('russo_user_id', id)
  }
  return id
}

export default function Dashboard() {
  const [data, setData] = useState<any>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    const id = getUserId()
    setUserId(id)
    fetch(`/api/dashboard?userId=${id}`)
      .then(r => r.json())
      .then(setData)
  }, [])

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-zinc-500 animate-pulse">Loading your progress...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-12 max-w-2xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold text-zinc-100">Незнакомец в Москве</h1>
        <p className="text-zinc-500">Stranger in Moscow · Russian through thriller fiction</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <StreakCard streak={data.streak} totalMinutes={data.totalMinutes} />
        <VocabStats wordsLearned={data.wordsLearned} stageLabel={data.stageLabel} />
      </div>

      <StoryPosition episodeNum={data.episodeNum} />

      <Link
        href={`/session?userId=${userId}`}
        className="block w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors border border-zinc-700 p-6 text-center space-y-1"
      >
        <p className="text-lg font-semibold text-zinc-100">
          {data.episodeNum === 0 ? 'Begin Investigation →' : 'Continue Investigation →'}
        </p>
        <p className="text-sm text-zinc-400">45-minute session · Today's episode awaits</p>
      </Link>
    </main>
  )
}
```

- [ ] **Step 4: Write the session page**

Create `app/session/page.tsx`:

```typescript
'use client'
import { useSearchParams } from 'next/navigation'
import { SessionShell } from '@/components/session/SessionShell'
import { Suspense } from 'react'

function SessionContent() {
  const params = useSearchParams()
  const userId = params.get('userId') ?? 'anon'
  return <SessionShell userId={userId} />
}

export default function SessionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-500">Loading session...</div>}>
      <SessionContent />
    </Suspense>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add app/ components/dashboard/
git commit -m "feat: add dashboard page, session page, and dashboard API"
```

---

## Task 13: Environment + First Run

**Files:**
- Modify: `.env.local` (add AI Gateway key)

- [ ] **Step 1: Set up AI Gateway environment**

Use the Vercel AI Gateway with OIDC auth (no API keys needed):

```bash
npm i -g vercel
vercel link
vercel env pull .env.local
```

This provisions `VERCEL_OIDC_TOKEN` automatically. The `@ai-sdk/gateway` package reads it — no provider-specific API keys required. Model strings like `'anthropic/claude-sonnet-4.6'` route through the gateway automatically.

If the token expires locally (~24h), re-run `vercel env pull .env.local`.

- [ ] **Step 2: Run the dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000 with no errors.

- [ ] **Step 3: Verify the full flow manually**

1. Open http://localhost:3000 — dashboard loads, shows 0 streak, 0 words, episode 0
2. Click "Begin Investigation" — session page loads, Phase 1 (SRS) appears
3. SRS phase: "No cards due" shows (expected — deck is empty on first run)
4. Continue → Episode generation request fires to `/api/episode`
5. Wait for AI response — story episode appears in Russian
6. Read the episode, tap highlighted words, answer comprehension questions
7. Continue → Grammar drill with 3 exercises
8. Complete → Session complete screen
9. Return to dashboard — word count increases

- [ ] **Step 4: Seed vocabulary check**

Open Drizzle Studio to verify:
```bash
npm run db:studio
```

Check: `vocabulary` table has ~25 rows (from seed). `learner_vocabulary` has rows after session. `episodes` has 1 row.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat: complete Phase 1 core loop — story + SRS + session flow"
```

---

## Self-Review

### Spec Coverage Check

| Spec Requirement | Task |
|---|---|
| FSRS algorithm at 85% recall rate | Task 5 |
| Sentence-level SRS cards | Task 8 `learner_vocabulary` + Task 11 `SRSReview` |
| Story Engine with curriculum constraints | Tasks 6, 7 |
| Grammar gates by stage | Task 6 `engine.ts` |
| 45-min session (5 phases) | Task 11 `SessionShell` + `PhaseIndicator` |
| Neon Postgres schema | Task 3 |
| Drizzle ORM | Tasks 3, 8 |
| Story premise + 5 NPCs | Task 4 `npcs.json` + Task 7 `world.ts` |
| Dashboard (streak, vocab, story position) | Task 12 |
| localStorage user ID (no auth) | Task 12 `getUserId()` |
| Seed vocabulary | Task 4 `seed-vocabulary.json` + Task 8 `seedVocabularyIfEmpty()` |

Phases 2 (AI Conversation) and 3 (Pronunciation) are explicitly excluded — placeholders in `SessionShell` for phases 4 and 5.

### Placeholder Scan

- Phase 4 (AI conversation) shows "Coming in Phase 2" — this is intentional per scope
- `TODO` comments in `episode/route.ts` for pulling known word IDs and grammar focus — these are non-blocking for Phase 1 and tracked for Phase 2
- `grammarFocusStructure` is hardcoded to `'nominative_case'` — works for first episode, Phase 2 will make it dynamic

### Type Consistency

- `SRSCard` defined in `fsrs.ts`, imported in `vocabulary.ts` — consistent
- `EpisodeOutput` defined in `generator.ts`, imported in `episodes.ts` — consistent
- `LearnerContext` defined in `engine.ts`, imported in `episode/route.ts` and `generator.ts` — consistent
- Component props flow: `SessionShell` → `SRSReview`, `StoryEpisode`, `GrammarDrill` — callback signatures consistent

---

**Plan complete and saved to `docs/superpowers/plans/2026-04-02-phase-1-core-loop.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast and isolated

**2. Inline Execution** — Execute tasks sequentially in this session using executing-plans

**Which approach?**
