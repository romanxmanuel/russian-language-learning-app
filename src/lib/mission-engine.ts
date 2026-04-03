import { curriculum, getChunkById, getWeekProgram } from "@/lib/curriculum";
import { averageMastery, getMasteryOrDefault } from "@/lib/mastery";
import type {
  LexicalChunk,
  MasteryDimension,
  MasteryState,
  MissionPlan,
  MissionStep,
  UserProfile,
} from "@/lib/types";
import { MASTERY_DIMENSIONS } from "@/lib/types";
import { average, clamp, uniqueById } from "@/lib/utils";

export function computeCurrentWeek(startedAt: string, now = new Date()) {
  const start = new Date(startedAt);
  const diff = Math.max(0, now.getTime() - start.getTime());
  const day = Math.floor(diff / (24 * 60 * 60 * 1000));
  return Math.min(8, Math.max(1, Math.floor(day / 7) + 1));
}

export function buildPreviewProfile(): UserProfile {
  const now = new Date().toISOString();
  return {
    id: "preview-user",
    name: "Preview learner",
    nativeLanguage: "English",
    targetLanguage: "Russian",
    dailyMinutes: 45,
    motivation: "Speak confidently in real-world Russian situations.",
    timezone: "America/New_York",
    startedAt: now,
    updatedAt: now,
  };
}

function missionFlow(dailyMinutes: number): MissionStep[] {
  const scale = clamp(dailyMinutes / 45, 0.75, 1.6);
  const durations = [7, 6, 9, 7, 10, 6].map((minutes) =>
    Math.max(4, Math.round(minutes * scale)),
  );

  return [
    {
      id: "listen",
      title: "Listen",
      description: "Attempt the clip with no transcript first.",
      durationMinutes: durations[0],
    },
    {
      id: "recall",
      title: "Recall",
      description: "Retrieve the priority chunks from English prompts.",
      durationMinutes: durations[1],
    },
    {
      id: "speak",
      title: "Speak",
      description: "Shadow the pronunciation targets, then say them from memory.",
      durationMinutes: durations[2],
    },
    {
      id: "read",
      title: "Read",
      description: "Reveal captions selectively and notice targeted glosses.",
      durationMinutes: durations[3],
    },
    {
      id: "reuse",
      title: "Reuse",
      description: "Run the Conversation Dojo and reuse the week’s chunks.",
      durationMinutes: durations[4],
    },
    {
      id: "reflect",
      title: "Reflect",
      description: "Write the friction point and choose a short next drill.",
      durationMinutes: durations[5],
    },
  ];
}

function chunkPriority(chunk: LexicalChunk, state: MasteryState, now: Date) {
  const due = new Date(state.nextReviewAt).getTime() <= now.getTime() ? 0.35 : 0;
  const fresh = state.seenCount === 0 ? 0.25 : 0;
  const difficulty = chunk.difficulty * 0.03;
  return 1 - state.strength + due + fresh + difficulty;
}

function weakestDimensionMessage(dimension: MasteryDimension) {
  switch (dimension) {
    case "recall":
      return "Recall is the softest edge. Keep retrieval hard and short instead of rereading.";
    case "listening":
      return "Listening is lagging. Stay disciplined about transcript withholding.";
    case "pronunciation":
      return "Pronunciation needs the most pressure. Shadow first, then produce from memory.";
    case "reading":
      return "Reading is behind the other channels. Spend one extra pass on chunk recognition.";
    case "speakingAutomaticity":
      return "Speaking is still analytical. Reuse the same chunks until they come out whole.";
    case "confidence":
      return "Confidence is the limiting factor. Keep answers shorter and cleaner.";
  }
}

export function buildMissionPlan(
  profile: UserProfile,
  masteryRows: MasteryState[],
  now = new Date(),
): MissionPlan {
  const week = computeCurrentWeek(profile.startedAt, now);
  const weekProgram = getWeekProgram(week);
  const masteryMap = new Map(masteryRows.map((row) => [row.chunkId, row]));
  const introducedChunks = curriculum
    .filter((program) => program.week <= week)
    .flatMap((program) => program.chunks);

  const dueWeak = introducedChunks
    .map((chunk) => ({ chunk, state: getMasteryOrDefault(masteryMap, chunk.id, profile.id) }))
    .filter(({ state }) => new Date(state.nextReviewAt).getTime() <= now.getTime())
    .sort((left, right) => left.state.strength - right.state.strength)
    .map(({ chunk }) => chunk);

  const currentWeekCandidates = weekProgram.chunks
    .map((chunk) => ({ chunk, state: getMasteryOrDefault(masteryMap, chunk.id, profile.id) }))
    .sort(
      (left, right) =>
        chunkPriority(right.chunk, right.state, now) - chunkPriority(left.chunk, left.state, now),
    )
    .map(({ chunk }) => chunk);

  const focusChunks = uniqueById([
    ...currentWeekCandidates.slice(0, 3),
    ...dueWeak.slice(0, 3),
  ]).slice(0, 6);

  const pronunciationFocus = [...focusChunks]
    .sort((left, right) => {
      const leftState = getMasteryOrDefault(masteryMap, left.id, profile.id);
      const rightState = getMasteryOrDefault(masteryMap, right.id, profile.id);
      return leftState.pronunciation - rightState.pronunciation;
    })
    .slice(0, 3);

  const dimensionAverages = Object.fromEntries(
    MASTERY_DIMENSIONS.map((dimension) => {
      const values = focusChunks.map(
        (chunk) => getMasteryOrDefault(masteryMap, chunk.id, profile.id)[dimension],
      );
      return [dimension, average(values)];
    }),
  ) as Record<MasteryDimension, number>;

  const weakestDimension = [...MASTERY_DIMENSIONS].sort(
    (left, right) => dimensionAverages[left] - dimensionAverages[right],
  )[0];

  const readinessScore = average(
    focusChunks.map((chunk) => averageMastery(getMasteryOrDefault(masteryMap, chunk.id, profile.id))),
  );

  return {
    date: now.toISOString(),
    week,
    theme: weekProgram.theme,
    missionName: weekProgram.missionName,
    objective: weekProgram.objective,
    grammarFrame: weekProgram.grammarFrame,
    flow: missionFlow(profile.dailyMinutes),
    focusChunks,
    pronunciationFocus,
    reviewQueue: weekProgram.reviewItems,
    dueWeakSpots: dueWeak.slice(0, 4),
    scenario: weekProgram.scenario,
    inputClip: weekProgram.inputClip,
    experiments: weekProgram.experiments,
    reflectionPrompt: weekProgram.reflectionPrompt,
    readinessScore,
    coachNote: weakestDimensionMessage(weakestDimension),
  };
}

export function findChunksByIds(chunkIds: string[]) {
  return chunkIds
    .map((chunkId) => getChunkById(chunkId))
    .filter((chunk): chunk is LexicalChunk => Boolean(chunk));
}
