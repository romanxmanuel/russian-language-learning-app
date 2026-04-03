import "server-only";

import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "@/lib/db/schema";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const databaseUrl = process.env.TURSO_DATABASE_URL?.trim() || "file:./data/russian-accelerator.db";

export const rawClient = createClient({
  url: databaseUrl,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
});

export const db = drizzle(rawClient, { schema });

let initializationPromise: Promise<void> | null = null;

export async function ensureDatabase() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const statements = [
        `CREATE TABLE IF NOT EXISTS user_profiles (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          native_language TEXT NOT NULL,
          target_language TEXT NOT NULL,
          daily_minutes INTEGER NOT NULL,
          motivation TEXT NOT NULL,
          timezone TEXT NOT NULL,
          started_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS mastery_states (
          user_id TEXT NOT NULL,
          chunk_id TEXT NOT NULL,
          recall REAL NOT NULL,
          listening REAL NOT NULL,
          pronunciation REAL NOT NULL,
          reading REAL NOT NULL,
          speaking_automaticity REAL NOT NULL,
          confidence REAL NOT NULL,
          strength REAL NOT NULL,
          next_review_at TEXT NOT NULL,
          last_reviewed_at TEXT,
          seen_count INTEGER NOT NULL,
          introduced_week INTEGER NOT NULL,
          PRIMARY KEY (user_id, chunk_id)
        )`,
        `CREATE TABLE IF NOT EXISTS review_attempts (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          chunk_id TEXT NOT NULL,
          grade TEXT NOT NULL,
          accuracy REAL NOT NULL,
          confidence REAL NOT NULL,
          interval_bucket INTEGER NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS pronunciation_attempts (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          chunk_id TEXT,
          target_text TEXT NOT NULL,
          attempt_text TEXT NOT NULL,
          overall_score REAL NOT NULL,
          segmental_score REAL NOT NULL,
          stress_score REAL NOT NULL,
          softness_score REAL NOT NULL,
          rhythm_score REAL NOT NULL,
          feedback_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS dialogue_turns (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          scenario_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          translation TEXT,
          feedback_json TEXT,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS checkpoint_results (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          week INTEGER NOT NULL,
          speaking_score REAL NOT NULL,
          listening_score REAL NOT NULL,
          recall_score REAL NOT NULL,
          confidence_score REAL NOT NULL,
          overall_score REAL NOT NULL,
          passed INTEGER NOT NULL,
          note TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        `CREATE TABLE IF NOT EXISTS mission_events (
          id TEXT PRIMARY KEY NOT NULL,
          user_id TEXT NOT NULL,
          mission_date TEXT NOT NULL,
          event_type TEXT NOT NULL,
          minutes_spent INTEGER NOT NULL,
          payload_json TEXT NOT NULL,
          created_at TEXT NOT NULL
        )`,
        "CREATE INDEX IF NOT EXISTS mastery_states_next_review_idx ON mastery_states(next_review_at)",
        "CREATE INDEX IF NOT EXISTS review_attempts_user_idx ON review_attempts(user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS pronunciation_attempts_user_idx ON pronunciation_attempts(user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS dialogue_turns_scenario_idx ON dialogue_turns(user_id, scenario_id, created_at)",
        "CREATE INDEX IF NOT EXISTS checkpoint_results_user_idx ON checkpoint_results(user_id, created_at)",
        "CREATE INDEX IF NOT EXISTS mission_events_user_idx ON mission_events(user_id, created_at)",
      ];

      for (const statement of statements) {
        await rawClient.execute(statement);
      }
    })();
  }

  await initializationPromise;
}
