import { allChunks, getChunkById } from "@/lib/curriculum";
import type {
  LexicalChunk,
  MasteryState,
  ReviewGradeInput,
  ReviewOutcome,
} from "@/lib/types";
import { MASTERY_DIMENSIONS } from "@/lib/types";
import { average, clamp } from "@/lib/utils";

const DEFAULT_SCORE = 0.18;

const outcomeTargets: Record<ReviewOutcome, number> = {
  again: 0.2,
  hard: 0.45,
  good: 0.72,
  easy: 0.88,
};

const outcomeIntervalsHours: Record<ReviewOutcome, number> = {
  again: 8,
  hard: 24,
  good: 72,
  easy: 168,
};

export function averageMastery(
  state: Pick<MasteryState, (typeof MASTERY_DIMENSIONS)[number]>,
) {
  return average(MASTERY_DIMENSIONS.map((dimension) => state[dimension]));
}

export function emptyMasteryForChunk(userId: string, chunk: LexicalChunk): MasteryState {
  const now = new Date();

  return {
    userId,
    chunkId: chunk.id,
    recall: DEFAULT_SCORE,
    listening: DEFAULT_SCORE,
    pronunciation: DEFAULT_SCORE,
    reading: DEFAULT_SCORE,
    speakingAutomaticity: DEFAULT_SCORE,
    confidence: DEFAULT_SCORE,
    strength: DEFAULT_SCORE,
    nextReviewAt: now.toISOString(),
    lastReviewedAt: null,
    seenCount: 0,
    introducedWeek: chunk.week,
  };
}

export function seedMasteryStates(userId: string) {
  return allChunks.map((chunk) => emptyMasteryForChunk(userId, chunk));
}

export function getMasteryOrDefault(
  masteryMap: Map<string, MasteryState>,
  chunkId: string,
  userId = "preview-user",
) {
  const existing = masteryMap.get(chunkId);
  if (existing) {
    return existing;
  }

  const chunk = getChunkById(chunkId);
  if (!chunk) {
    throw new Error(`Unknown chunk: ${chunkId}`);
  }

  return emptyMasteryForChunk(userId, chunk);
}

export function bucketReviewGap(lastReviewedAt: string | null, now = new Date()) {
  if (!lastReviewedAt) {
    return 0;
  }

  const diffMs = now.getTime() - new Date(lastReviewedAt).getTime();
  const diffDays = diffMs / (24 * 60 * 60 * 1000);

  if (diffDays < 2) {
    return 1;
  }

  if (diffDays < 5) {
    return 3;
  }

  if (diffDays < 10) {
    return 7;
  }

  return 14;
}

function blend(current: number, target: number, weight: number) {
  return clamp(current + (target - current) * weight);
}

export function nextReviewAt(
  state: MasteryState,
  outcome: ReviewOutcome,
  now = new Date(),
  accuracy = outcomeTargets[outcome],
) {
  const baseHours = outcomeIntervalsHours[outcome];
  const masteryModifier = outcome === "again" ? 0.75 : 0.8 + state.strength;
  const accuracyModifier = 0.7 + accuracy * 0.5;
  const intervalMs = baseHours * masteryModifier * accuracyModifier * 60 * 60 * 1000;
  return new Date(now.getTime() + intervalMs);
}

export function applyReviewGrade(
  current: MasteryState,
  input: ReviewGradeInput,
  now = new Date(),
) {
  const accuracy = clamp(input.accuracy ?? outcomeTargets[input.outcome]);
  const confidence = clamp(input.confidence ?? current.confidence);

  const nextState: MasteryState = {
    ...current,
    recall: blend(current.recall, accuracy, 0.58),
    listening: blend(current.listening, accuracy * 0.94 + 0.04, 0.24),
    pronunciation: blend(current.pronunciation, accuracy * 0.82 + 0.08, 0.18),
    reading: blend(current.reading, accuracy * 0.97 + 0.02, 0.28),
    speakingAutomaticity: blend(
      current.speakingAutomaticity,
      accuracy * 0.76 + confidence * 0.18,
      0.22,
    ),
    confidence: blend(current.confidence, confidence, 0.34),
    strength: current.strength,
    nextReviewAt: current.nextReviewAt,
    lastReviewedAt: now.toISOString(),
    seenCount: current.seenCount + 1,
    introducedWeek: current.introducedWeek,
  };

  nextState.strength = averageMastery(nextState);
  nextState.nextReviewAt = nextReviewAt(nextState, input.outcome, now, accuracy).toISOString();

  return nextState;
}

export function applyPronunciationBoost(
  current: MasteryState,
  overallScore: number,
  confidenceBump = 0.12,
) {
  const score = clamp(overallScore);
  const nextState: MasteryState = {
    ...current,
    pronunciation: blend(current.pronunciation, score, 0.52),
    listening: blend(current.listening, score * 0.92 + 0.03, 0.16),
    speakingAutomaticity: blend(current.speakingAutomaticity, score * 0.86 + 0.08, 0.2),
    confidence: blend(current.confidence, clamp(current.confidence + confidenceBump), 0.32),
    seenCount: current.seenCount + 1,
    lastReviewedAt: new Date().toISOString(),
    nextReviewAt: current.nextReviewAt,
    strength: current.strength,
    introducedWeek: current.introducedWeek,
    recall: current.recall,
    reading: current.reading,
  };

  nextState.strength = averageMastery(nextState);
  nextState.nextReviewAt = nextReviewAt(nextState, score > 0.75 ? "good" : "hard").toISOString();

  return nextState;
}
