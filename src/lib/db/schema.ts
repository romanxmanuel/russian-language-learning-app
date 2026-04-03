import { index, integer, primaryKey, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const userProfiles = sqliteTable("user_profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  nativeLanguage: text("native_language").notNull(),
  targetLanguage: text("target_language").notNull(),
  dailyMinutes: integer("daily_minutes").notNull(),
  motivation: text("motivation").notNull(),
  timezone: text("timezone").notNull(),
  startedAt: text("started_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const masteryStates = sqliteTable(
  "mastery_states",
  {
    userId: text("user_id").notNull(),
    chunkId: text("chunk_id").notNull(),
    recall: real("recall").notNull(),
    listening: real("listening").notNull(),
    pronunciation: real("pronunciation").notNull(),
    reading: real("reading").notNull(),
    speakingAutomaticity: real("speaking_automaticity").notNull(),
    confidence: real("confidence").notNull(),
    strength: real("strength").notNull(),
    nextReviewAt: text("next_review_at").notNull(),
    lastReviewedAt: text("last_reviewed_at"),
    seenCount: integer("seen_count").notNull(),
    introducedWeek: integer("introduced_week").notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.chunkId] }),
    nextReviewIdx: index("mastery_states_next_review_idx").on(table.nextReviewAt),
  }),
);

export const reviewAttempts = sqliteTable(
  "review_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    chunkId: text("chunk_id").notNull(),
    grade: text("grade").notNull(),
    accuracy: real("accuracy").notNull(),
    confidence: real("confidence").notNull(),
    intervalBucket: integer("interval_bucket").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    userIdx: index("review_attempts_user_idx").on(table.userId, table.createdAt),
  }),
);

export const pronunciationAttempts = sqliteTable(
  "pronunciation_attempts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    chunkId: text("chunk_id"),
    targetText: text("target_text").notNull(),
    attemptText: text("attempt_text").notNull(),
    overallScore: real("overall_score").notNull(),
    segmentalScore: real("segmental_score").notNull(),
    stressScore: real("stress_score").notNull(),
    softnessScore: real("softness_score").notNull(),
    rhythmScore: real("rhythm_score").notNull(),
    feedbackJson: text("feedback_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    userIdx: index("pronunciation_attempts_user_idx").on(table.userId, table.createdAt),
  }),
);

export const dialogueTurns = sqliteTable(
  "dialogue_turns",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    scenarioId: text("scenario_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    translation: text("translation"),
    feedbackJson: text("feedback_json"),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    scenarioIdx: index("dialogue_turns_scenario_idx").on(table.userId, table.scenarioId, table.createdAt),
  }),
);

export const checkpointResults = sqliteTable(
  "checkpoint_results",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    week: integer("week").notNull(),
    speakingScore: real("speaking_score").notNull(),
    listeningScore: real("listening_score").notNull(),
    recallScore: real("recall_score").notNull(),
    confidenceScore: real("confidence_score").notNull(),
    overallScore: real("overall_score").notNull(),
    passed: integer("passed").notNull(),
    note: text("note").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    userIdx: index("checkpoint_results_user_idx").on(table.userId, table.createdAt),
  }),
);

export const missionEvents = sqliteTable(
  "mission_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    missionDate: text("mission_date").notNull(),
    eventType: text("event_type").notNull(),
    minutesSpent: integer("minutes_spent").notNull(),
    payloadJson: text("payload_json").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => ({
    userIdx: index("mission_events_user_idx").on(table.userId, table.createdAt),
  }),
);
