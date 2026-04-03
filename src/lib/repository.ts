import { desc, eq } from "drizzle-orm";

import { generateDialogueResponse, scorePronunciation } from "@/lib/coach";
import { allChunks, researchAnchors, weekRoadmap } from "@/lib/curriculum";
import { db, ensureDatabase } from "@/lib/db/client";
import {
  checkpointResults,
  dialogueTurns,
  masteryStates,
  missionEvents,
  pronunciationAttempts,
  reviewAttempts,
  userProfiles,
} from "@/lib/db/schema";
import { applyPronunciationBoost, applyReviewGrade, averageMastery, bucketReviewGap, seedMasteryStates } from "@/lib/mastery";
import { buildMissionPlan, buildPreviewProfile, computeCurrentWeek } from "@/lib/mission-engine";
import type {
  CheckpointResult,
  DashboardSnapshot,
  DialogueTurnInput,
  MissionEventInput,
  ProgressSnapshot,
  PronunciationAttemptInput,
  ReviewGradeInput,
  UserProfile,
} from "@/lib/types";
import { MASTERY_DIMENSIONS } from "@/lib/types";
import { average, clamp, toIsoDate } from "@/lib/utils";

export const DEFAULT_USER_ID = "primary-user";

function serializeProfile(row: typeof userProfiles.$inferSelect): UserProfile {
  return {
    id: row.id,
    name: row.name,
    nativeLanguage: row.nativeLanguage,
    targetLanguage: row.targetLanguage,
    dailyMinutes: row.dailyMinutes,
    motivation: row.motivation,
    timezone: row.timezone,
    startedAt: row.startedAt,
    updatedAt: row.updatedAt,
  };
}

async function seedMasteryRows(userId: string) {
  const rows = seedMasteryStates(userId);
  await db.insert(masteryStates).values(rows).onConflictDoNothing();
}

async function getProfile() {
  await ensureDatabase();
  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.id, DEFAULT_USER_ID));
  return profile ? serializeProfile(profile) : null;
}

async function getMasteryRows(userId: string) {
  await ensureDatabase();
  return db.select().from(masteryStates).where(eq(masteryStates.userId, userId));
}

async function getLatestCheckpoint(userId: string): Promise<CheckpointResult | null> {
  await ensureDatabase();
  const [row] = await db
    .select()
    .from(checkpointResults)
    .where(eq(checkpointResults.userId, userId))
    .orderBy(desc(checkpointResults.createdAt))
    .limit(1);

  if (!row) {
    return null;
  }

  return {
    id: row.id,
    week: row.week,
    speakingScore: row.speakingScore,
    listeningScore: row.listeningScore,
    recallScore: row.recallScore,
    confidenceScore: row.confidenceScore,
    overallScore: row.overallScore,
    passed: Boolean(row.passed),
    note: row.note,
    createdAt: row.createdAt,
  };
}

function buildEmptyProgress(weeksUnlocked: number): ProgressSnapshot {
  return {
    dimensions: {
      recall: 0.18,
      listening: 0.18,
      pronunciation: 0.18,
      reading: 0.18,
      speakingAutomaticity: 0.18,
      confidence: 0.18,
    },
    totalMinutes: 0,
    speakingMinutes: 0,
    transcriptRevealRate: 0,
    pronunciationTrend: [],
    retention: {
      day1: null,
      day3: null,
      day7: null,
      day14: null,
    },
    checkpointPassRate: 0,
    missionStreak: 0,
    weeksUnlocked,
    recentWins: [
      "Start onboarding to generate a personalized mission.",
      "The system will track weak spots across six mastery dimensions.",
    ],
  };
}

function computeMissionStreak(dates: string[]) {
  if (dates.length === 0) {
    return 0;
  }

  const uniqueDates = [...new Set(dates)].sort().reverse();
  let streak = 0;
  let cursor = new Date();

  for (const date of uniqueDates) {
    if (date === toIsoDate(cursor)) {
      streak += 1;
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      continue;
    }

    if (streak === 0) {
      cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
      if (date === toIsoDate(cursor)) {
        streak += 1;
        cursor = new Date(cursor.getTime() - 24 * 60 * 60 * 1000);
        continue;
      }
    }

    break;
  }

  return streak;
}

export async function getProgressSnapshot(profile: UserProfile): Promise<ProgressSnapshot> {
  await ensureDatabase();
  const masteryRows = await getMasteryRows(profile.id);
  const reviewRows = await db.select().from(reviewAttempts).where(eq(reviewAttempts.userId, profile.id));
  const pronunciationRows = await db
    .select()
    .from(pronunciationAttempts)
    .where(eq(pronunciationAttempts.userId, profile.id))
    .orderBy(desc(pronunciationAttempts.createdAt));
  const eventRows = await db.select().from(missionEvents).where(eq(missionEvents.userId, profile.id));
  const checkpointRows = await db.select().from(checkpointResults).where(eq(checkpointResults.userId, profile.id));

  const dimensions = Object.fromEntries(
    MASTERY_DIMENSIONS.map((dimension) => [
      dimension,
      masteryRows.length === 0 ? 0.18 : average(masteryRows.map((row) => row[dimension])),
    ]),
  ) as ProgressSnapshot["dimensions"];

  const totalMinutes = eventRows.reduce((total, row) => total + row.minutesSpent, 0);
  const speakingMinutes = eventRows
    .filter((row) => row.eventType === "dialogue-turn" || row.eventType === "pronunciation-attempt")
    .reduce((total, row) => total + row.minutesSpent, 0);

  const revealCount = eventRows.filter((row) => row.eventType === "reveal-transcript").length;
  const listenCount = eventRows.filter((row) => row.eventType === "listen-pass").length;

  const pronunciationTrend = pronunciationRows
    .slice(0, 5)
    .map((row) => row.overallScore)
    .reverse();

  const bucketAverage = (bucket: number) => {
    const rows = reviewRows.filter((row) => row.intervalBucket === bucket);
    return rows.length === 0 ? null : average(rows.map((row) => row.accuracy));
  };

  const strongestChunks = masteryRows
    .slice()
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 3)
    .map((row) => allChunks.find((chunk) => chunk.id === row.chunkId)?.translation)
    .filter((value): value is string => Boolean(value));

  return {
    dimensions,
    totalMinutes,
    speakingMinutes,
    transcriptRevealRate: listenCount === 0 ? 0 : revealCount / listenCount,
    pronunciationTrend,
    retention: {
      day1: bucketAverage(1),
      day3: bucketAverage(3),
      day7: bucketAverage(7),
      day14: bucketAverage(14),
    },
    checkpointPassRate:
      checkpointRows.length === 0
        ? 0
        : checkpointRows.filter((row) => Boolean(row.passed)).length / checkpointRows.length,
    missionStreak: computeMissionStreak(eventRows.map((row) => row.missionDate)),
    weeksUnlocked: computeCurrentWeek(profile.startedAt),
    recentWins:
      strongestChunks.length > 0
        ? strongestChunks.map((chunk) => `Strongest live chunk: ${chunk}`)
        : ["Complete your first mission to surface real strengths."],
  };
}

export async function upsertProfile(input: {
  name: string;
  dailyMinutes: number;
  motivation: string;
  timezone: string;
}) {
  await ensureDatabase();
  const now = new Date().toISOString();
  const existing = await getProfile();
  const profile: UserProfile = {
    id: DEFAULT_USER_ID,
    name: input.name.trim() || "Learner",
    nativeLanguage: "English",
    targetLanguage: "Russian",
    dailyMinutes: Math.max(20, Math.min(90, input.dailyMinutes)),
    motivation: input.motivation.trim() || "Speak confidently in Russian.",
    timezone: input.timezone || "America/New_York",
    startedAt: existing?.startedAt ?? now,
    updatedAt: now,
  };

  await db
    .insert(userProfiles)
    .values({
      id: profile.id,
      name: profile.name,
      nativeLanguage: profile.nativeLanguage,
      targetLanguage: profile.targetLanguage,
      dailyMinutes: profile.dailyMinutes,
      motivation: profile.motivation,
      timezone: profile.timezone,
      startedAt: profile.startedAt,
      updatedAt: profile.updatedAt,
    })
    .onConflictDoUpdate({
      target: userProfiles.id,
      set: {
        name: profile.name,
        dailyMinutes: profile.dailyMinutes,
        motivation: profile.motivation,
        timezone: profile.timezone,
        updatedAt: profile.updatedAt,
      },
    });

  await seedMasteryRows(profile.id);
  return profile;
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const profile = await getProfile();

  if (!profile) {
    const previewProfile = buildPreviewProfile();
    const previewMastery = seedMasteryStates(previewProfile.id);

    return {
      profile: null,
      mission: buildMissionPlan(previewProfile, previewMastery),
      progress: buildEmptyProgress(1),
      roadmap: weekRoadmap,
      researchAnchors,
      isPreview: true,
      lastCheckpoint: null,
    };
  }

  const masteryRows = await getMasteryRows(profile.id);

  return {
    profile,
    mission: buildMissionPlan(profile, masteryRows),
    progress: await getProgressSnapshot(profile),
    roadmap: weekRoadmap,
    researchAnchors,
    isPreview: false,
    lastCheckpoint: await getLatestCheckpoint(profile.id),
  };
}

export async function getCurrentMission() {
  const profile = await getProfile();
  if (!profile) {
    const previewProfile = buildPreviewProfile();
    return buildMissionPlan(previewProfile, seedMasteryStates(previewProfile.id));
  }

  return buildMissionPlan(profile, await getMasteryRows(profile.id));
}

export async function recordMissionEvent(input: MissionEventInput) {
  const profile = await getProfile();
  if (!profile) {
    return getDashboardSnapshot();
  }

  const now = new Date();
  await db.insert(missionEvents).values({
    id: crypto.randomUUID(),
    userId: profile.id,
    missionDate: toIsoDate(now),
    eventType: input.eventType,
    minutesSpent: input.minutesSpent ?? 0,
    payloadJson: JSON.stringify(input.payload ?? {}),
    createdAt: now.toISOString(),
  });

  return getDashboardSnapshot();
}

export async function gradeReview(input: ReviewGradeInput) {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("Profile required before grading review.");
  }

  const masteryRows = await getMasteryRows(profile.id);
  const target = masteryRows.find((row) => row.chunkId === input.chunkId);
  if (!target) {
    throw new Error(`Unknown chunk mastery: ${input.chunkId}`);
  }

  const now = new Date();
  const nextState = applyReviewGrade(target, input, now);

  await db
    .insert(masteryStates)
    .values(nextState)
    .onConflictDoUpdate({
      target: [masteryStates.userId, masteryStates.chunkId],
      set: nextState,
    });

  await db.insert(reviewAttempts).values({
    id: crypto.randomUUID(),
    userId: profile.id,
    chunkId: input.chunkId,
    grade: input.outcome,
    accuracy: input.accuracy ?? averageMastery(nextState),
    confidence: input.confidence ?? nextState.confidence,
    intervalBucket: bucketReviewGap(target.lastReviewedAt, now),
    createdAt: now.toISOString(),
  });

  if (input.minutesSpent) {
    await recordMissionEvent({
      eventType: "review-complete",
      minutesSpent: input.minutesSpent,
      payload: { chunkId: input.chunkId, grade: input.outcome },
    });
  }

  return {
    mastery: nextState,
    dashboard: await getDashboardSnapshot(),
  };
}

export async function recordPronunciationAttempt(input: PronunciationAttemptInput) {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("Profile required before pronunciation attempts.");
  }

  const feedback = scorePronunciation(input);

  await db.insert(pronunciationAttempts).values({
    id: feedback.id,
    userId: profile.id,
    chunkId: input.chunkId ?? null,
    targetText: feedback.targetText,
    attemptText: feedback.attemptText,
    overallScore: feedback.overallScore,
    segmentalScore: feedback.segmentalScore,
    stressScore: feedback.stressScore,
    softnessScore: feedback.softnessScore,
    rhythmScore: feedback.rhythmScore,
    feedbackJson: JSON.stringify(feedback.feedback),
    createdAt: feedback.createdAt,
  });

  if (input.chunkId) {
    const masteryRows = await getMasteryRows(profile.id);
    const target = masteryRows.find((row) => row.chunkId === input.chunkId);
    if (target) {
      const nextState = applyPronunciationBoost(target, feedback.overallScore);
      await db
        .insert(masteryStates)
        .values(nextState)
        .onConflictDoUpdate({
          target: [masteryStates.userId, masteryStates.chunkId],
          set: nextState,
        });
    }
  }

  await recordMissionEvent({
    eventType: "pronunciation-attempt",
    minutesSpent: 4,
    payload: { chunkId: input.chunkId ?? null, score: feedback.overallScore },
  });

  return {
    feedback,
    dashboard: await getDashboardSnapshot(),
  };
}

function boostDialogueState(row: typeof masteryStates.$inferSelect) {
  const nextState = {
    ...row,
    speakingAutomaticity: clamp(row.speakingAutomaticity + 0.08),
    confidence: clamp(row.confidence + 0.05),
    recall: clamp(row.recall + 0.03),
    listening: clamp(row.listening + 0.02),
    strength: row.strength,
  };

  nextState.strength = averageMastery(nextState);
  return nextState;
}

export async function recordDialogueTurn(input: DialogueTurnInput) {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("Profile required before dialogue turns.");
  }

  const response = generateDialogueResponse(input);
  const now = new Date().toISOString();

  await db.insert(dialogueTurns).values([
    {
      id: crypto.randomUUID(),
      userId: profile.id,
      scenarioId: input.scenarioId,
      role: "learner",
      content: input.userTurn,
      translation: null,
      feedbackJson: null,
      createdAt: now,
    },
    {
      id: crypto.randomUUID(),
      userId: profile.id,
      scenarioId: input.scenarioId,
      role: "coach",
      content: response.coachReply,
      translation: response.coachTranslation,
      feedbackJson: JSON.stringify(response.feedback),
      createdAt: now,
    },
  ]);

  if (response.masteryBoostIds.length > 0) {
    const masteryRows = await getMasteryRows(profile.id);

    for (const chunkId of response.masteryBoostIds) {
      const row = masteryRows.find((entry) => entry.chunkId === chunkId);
      if (!row) {
        continue;
      }

      const nextState = boostDialogueState(row);
      await db
        .insert(masteryStates)
        .values(nextState)
        .onConflictDoUpdate({
          target: [masteryStates.userId, masteryStates.chunkId],
          set: nextState,
        });
    }
  }

  await recordMissionEvent({
    eventType: "dialogue-turn",
    minutesSpent: 6,
    payload: { scenarioId: input.scenarioId },
  });

  return {
    response,
    dashboard: await getDashboardSnapshot(),
  };
}

export async function saveCheckpoint(week?: number) {
  const profile = await getProfile();
  if (!profile) {
    throw new Error("Profile required before checkpoints.");
  }

  const masteryRows = await getMasteryRows(profile.id);
  const checkpointWeek = week ?? computeCurrentWeek(profile.startedAt);
  const scopedRows = masteryRows.filter((row) => row.introducedWeek <= checkpointWeek);
  const speakingScore =
    scopedRows.length === 0
      ? 0
      : average(scopedRows.map((row) => average([row.pronunciation, row.speakingAutomaticity])));
  const listeningScore =
    scopedRows.length === 0 ? 0 : average(scopedRows.map((row) => row.listening));
  const recallScore = scopedRows.length === 0 ? 0 : average(scopedRows.map((row) => row.recall));
  const confidenceScore =
    scopedRows.length === 0 ? 0 : average(scopedRows.map((row) => row.confidence));
  const overallScore = average([speakingScore, listeningScore, recallScore, confidenceScore]);
  const passed = overallScore >= 0.58;
  const note = passed
    ? "The foundation is stable enough to push into the next mission band."
    : "Stay with the current week and keep the loop tight until retrieval and speaking stabilize.";
  const createdAt = new Date().toISOString();
  const checkpointId = crypto.randomUUID();

  await db.insert(checkpointResults).values({
    id: checkpointId,
    userId: profile.id,
    week: checkpointWeek,
    speakingScore,
    listeningScore,
    recallScore,
    confidenceScore,
    overallScore,
    passed: passed ? 1 : 0,
    note,
    createdAt,
  });

  await recordMissionEvent({
    eventType: "checkpoint",
    minutesSpent: 5,
    payload: { week: checkpointWeek, passed },
  });

  return {
    result: {
      id: checkpointId,
      week: checkpointWeek,
      speakingScore,
      listeningScore,
      recallScore,
      confidenceScore,
      overallScore,
      passed,
      note,
      createdAt,
    } satisfies CheckpointResult,
    dashboard: await getDashboardSnapshot(),
  };
}
