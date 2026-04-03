# Russian Language Learning App — Design Spec
**Date:** 2026-04-02
**Status:** Approved

---

## Overview

A Moscow thriller-driven Russian language learning webapp, built as a personal tool and shared with the world. An AI generates each story episode fresh — constrained by a scientifically-designed curriculum engine — so the content is infinite, adaptive, and always at exactly the right difficulty. Built to accelerate Russian acquisition to B1–B2 conversational fluency dramatically faster than conventional methods.

**Target:** B1–B2 conversational fluency (true conversational fluency — watch Russian content, hold real conversations)
**Mechanism:** Story-driven immersion with AI-generated episodes constrained by grammar gates
**Session:** 45 minutes/day, ~270 hours/year → B1 in ~18 months (vs. 3+ years with conventional methods)
**Approach:** Fully AI-generated content within a deliberate curriculum framework (Approach B — Dynamic)

---

## The Science Foundation

The design is grounded in these research-backed principles (Cepeda et al. 2006, Dunlosky et al. 2013, Bjork 1994, Krashen 1982, VanLehn 2011):

1. **Spaced repetition is the backbone** — FSRS algorithm, sentence-level cards, ~85% target recall rate
2. **Production over recognition** — learner produces Russian, doesn't pick from choices
3. **Comprehensible input at i+1** — story always one notch above current level, never overwhelming
4. **Narrative context encodes deeper** — emotional investment (amygdala activation) improves retention 2-3x
5. **Interleaving beats blocked practice** — grammar and vocab mix freely in every review session
6. **Constrained generation prevents chaos** — AI constrained to curriculum-appropriate structures
7. **Pronunciation first** — Cyrillic + phonetics prioritized in Act 1 before vocabulary depth
8. **Grammar sequencing by frequency** — Nom/Acc first (60% of Russian usage), then Prep, Gen, Dat/Inst
9. **Evening study + sleep consolidation** — session timing recommendation built in
10. **85% success rate target** — Vygotsky's ZPD modeled algorithmically; adjust difficulty to maintain zone

---

## The Story World (Fixed Premise)

**Title:** *Незнакомец в Москве* (Stranger in Moscow)

**Protagonist:** Alex Volkov — American-born journalist with Russian heritage. Russian is rusty but present. Sent to Moscow on a routine story. Contact goes missing day one.

**Structure:** 4 acts × ~20 episodes = ~80 total episodes, spanning A0 → B2 fluency

**5 Core NPCs (fixed personalities, never regenerated):**
- **Катя** — Local contact, warm but guarded. Speaks slowly and clearly. (A1 level dialogue)
- **Игорь** — Suspicious neighbor, curt and cryptic. (A2 level dialogue)
- **Наташа** — Helpful café owner, chatty and colloquial. (A2–B1 dialogue)
- **Полковник Дмитрий** — Government official, formal and threatening. (B1–B2 formal register)
- **Аня** — Young hacker ally, uses slang and internet Russian. (B2 informal register)

Each NPC is calibrated to a difficulty register — early episodes use Катя and Наташа, later ones introduce Дмитрий and Аня as grammar gates unlock.

**Curriculum gates by act:**

| Act | Episodes | Grammar Introduced |
|-----|----------|-------------------|
| 1 (A0→A1) | 1–10 | Cyrillic mastery, Nominative, basic present tense, numbers, greetings |
| 1 (A1→A2) | 11–20 | Accusative, past tense, negation, adjective agreement, Катя conversations |
| 2–3 (A2→B1) | 21–60 | All 6 cases, imperfective/perfective intro, motion verbs, Игорь/Наташа dialogues |
| 4 (B1→B2) | 61–80 | Aspect mastery, subjunctive, complex sentences, idioms, Дмитрий/Аня dialogues |

---

## The Five Core Engines

### 1. Learner Model

Persistent profile stored in Neon Postgres. Updated after every session. Fed into every AI generation call.

```
Learner Model contains:
- Vocabulary state: per-word { seen_count, last_seen, next_review_at,
                               interval_days, difficulty, avg_response_ms, error_log }
- Grammar mastery: per-structure { status: unseen|introduced|practicing|mastered,
                                    error_count, last_practiced_at }
- Story memory: { episode_summaries[], npc_relationship_states{}, current_position }
- Session history: { streak, total_hours, accuracy_trend[], pace_vs_milestone }
- Phonetic profile: { mispronounced_sounds[], shadowing_scores[] }
```

### 2. Curriculum Engine

Defines what grammar structures and vocabulary the AI is **permitted** to use at each stage. Enforced via system prompt constraints injected into every generation call.

- Grammar gates: AI cannot use structures above current stage
- Vocabulary budget: ~5 new words per episode (i+1 principle — not overwhelming)
- Known vocab list injected: AI can freely reuse any word with interval > 7 days
- Error-aware: if learner is struggling with dative case, AI reduces dative exposure temporarily

### 3. Story Engine

AI generates each episode fresh, constrained by Curriculum Engine + Story Memory.

**System prompt includes:**
- Fixed story premise and NPC personality sheets
- Summary of last 5 episodes (compressed, ~500 tokens)
- Current grammar stage and allowed structures
- Known vocabulary list
- Today's target: exactly 5 new words to introduce (provided in prompt)
- NPC relationship states (trust levels, last interactions)
- Today's grammar focus structure (the one the episode should feature prominently)

**Episode output structure (JSON):**
```json
{
  "episode_text": "...",           // The narrative in Russian
  "highlighted_words": [...],      // New words with positions
  "comprehension_questions": [...], // 3 questions in Russian
  "grammar_focus_examples": [...], // 3 examples of today's pattern
  "story_summary_update": "...",   // Compressed summary to store
  "audio_script": "..."            // Clean text for TTS narration
}
```

Model: `anthropic/claude-sonnet-4-6` via AI Gateway

### 4. SRS Engine

Adaptive spaced repetition using FSRS algorithm (open-source JS implementation).

**Card format:** Sentence-level, production direction
- Front: English sentence + context hint ("Episode 3 — Alex arrives at the café")
- Back: Russian sentence with the target word highlighted

**Review mechanics:**
- Target recall rate: 85% (scientifically optimal challenge point)
- Intervals: 1d → 3d → 8d → 21d → 60d → ... (FSRS-calculated per card)
- Incorrect: retry immediately + review in 4 hours
- Fast correct: extend interval
- Slow correct: moderate interval
- Words auto-added to deck when first encountered in story

**Interleaving:** Cards from all vocabulary domains mixed — never grouped by topic or episode.

### 5. Conversation AI

Streaming chat with an NPC from the current episode. AI plays the character with full personality.

**Mechanics:**
- AI steers conversation toward today's grammar focus
- Errors are flagged inline (non-interrupting) — "✱ (дативный падеж)" as a soft signal
- Full error review at end of conversation segment
- NPC responds to intent, not just grammatical form (low anxiety environment)
- Conversation log saved to DB for pattern analysis

Model: `anthropic/claude-sonnet-4-6` via AI Gateway (streaming)

---

## The 45-Minute Session

```
Phase 1 — SRS Review (5 min)
  Vocabulary cards due today
  Production direction: English → Russian
  Response time + accuracy → updates FSRS intervals

Phase 2 — Story Episode (15 min)
  AI generates next plot scene
  Audio narration plays (TTS)
  Unknown words highlighted inline
  Ends with 3 comprehension questions in Russian
  New words auto-added to SRS deck

Phase 3 — Grammar Focus (10 min)
  Key grammatical pattern from today's episode
  5 constrained-production drills
  "Build a sentence using what you just read"
  Immediate correction + retry on error

Phase 4 — AI Conversation (10 min)
  Chat with today's NPC (streamed, real-time)
  AI steers toward today's grammar
  Soft error flagging inline
  Error summary at end

Phase 5 — Pronunciation Shadowing (5 min)
  3–5 sentences from today's episode
  Listen → repeat → listen → repeat loop
  Visual waveform comparison
  AI feedback on palatalization, stress patterns
```

---

## Data Model

```sql
-- Users & Learner State
users (id, created_at, settings JSONB)

learner_model (
  user_id, grammar_stage, total_hours, streak,
  story_position JSONB,   -- { act, episode, plot_beat }
  phonetic_profile JSONB  -- { weak_sounds[], scores[] }
)

-- Vocabulary
vocabulary (
  id, russian_word, english_meaning,
  part_of_speech, grammar_notes,
  frequency_rank, curriculum_stage
)

learner_vocabulary (
  user_id, word_id,
  seen_count, next_review_at, interval_days,
  difficulty, avg_response_ms,
  source_episode_id, error_log JSONB
)

-- Grammar
grammar_structures (
  id, name, stage,
  description, example_sentences JSONB
)

learner_grammar (
  user_id, structure_id,
  status,  -- unseen|introduced|practicing|mastered
  error_count, last_practiced_at
)

-- Story & Sessions
episodes (
  id, act, episode_num, plot_beat,
  generated_content JSONB,
  audio_url, grammar_focus,
  target_words JSONB
)

sessions (
  id, user_id, started_at, duration_seconds,
  srs_accuracy, new_words_count,
  grammar_accuracy, conversation_log JSONB
)
```

---

## Tech Stack

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js 16 (App Router) | Server components, streaming, zero-config Vercel |
| AI SDK | Vercel AI SDK v6 | `streamText`, `useChat`, AI Gateway routing |
| Story / Conversation | `anthropic/claude-sonnet-4-6` | Best narrative coherence + Russian accuracy |
| TTS narration | `openai/tts-1` via AI Gateway | Russian episode audio |
| Speech scoring | OpenAI Whisper API | Pronunciation phase transcription + comparison |
| Database | Neon Postgres (Vercel Marketplace) | Serverless, branching, auto-scaling |
| ORM | Drizzle | Lightweight, type-safe, Neon-optimized |
| SRS Algorithm | FSRS (open-source JS) | Modern successor to SM-2, 20% more efficient |
| Styling | Tailwind CSS + shadcn/ui | Dark theme, fast, component library |
| Auth | None initially | Personal tool — localStorage user ID |
| Deployment | Vercel | AI Gateway OIDC auto-provisioned |

---

## Build Phases

### Phase 1 — Core Loop (Build First)
- [ ] Story premise written (NPC profiles, 4-act outline, episode 1 plot beat)
- [ ] Curriculum engine (grammar stages as JSON config)
- [ ] Story Engine: AI episode generation with constrained system prompt
- [ ] SRS Engine: FSRS algorithm, sentence cards, review UI
- [ ] Session Orchestrator: 5-phase session flow
- [ ] Neon DB: schema + Drizzle ORM setup
- [ ] Dashboard: streak, words learned, story position

**Phase 1 success test:** Sit down, run a 45-min session, learn 5 new Russian words in story context, review yesterday's words, story advances. Everything saves across sessions.

### Phase 2 — AI Conversation
- [ ] Streaming NPC chat (Vercel AI SDK `useChat`)
- [ ] Error flagging inline (soft signals during conversation)
- [ ] Error summary at end of conversation phase
- [ ] Conversation log saved + fed back to Learner Model

### Phase 3 — Pronunciation Lab
- [ ] Audio recording in browser (Web Audio API)
- [ ] Whisper transcription + comparison to model sentence
- [ ] Visual waveform display
- [ ] AI feedback on specific Russian phonemes (palatalization, vowel reduction, stress)

---

## What Success Looks Like

- After 30 days: Can read Cyrillic fluently, know ~200 words, understand Катя's dialogue without looking up words
- After 90 days: Can hold a basic conversation, know ~600 words, following the thriller plot independently
- After 6 months: ~1,200 words, can watch Russian YouTube with occasional lookups, true A2→B1 threshold
- After 18 months: B1–B2 — watching Russian films, reading news, holding real conversations

---

## Open Questions (Resolved)

- **Auth:** None for Phase 1 (personal tool, localStorage user ID). Add Clerk in Phase 2 if sharing publicly.
- **Story content:** AI-generated (Approach B), constrained by curriculum engine. Not hand-crafted.
- **Audio:** TTS for Phase 1. Native speaker recordings are a Phase 3+ enhancement.
- **Mobile:** Web-first (Next.js). PWA features (offline SRS) are a Phase 2 enhancement.
