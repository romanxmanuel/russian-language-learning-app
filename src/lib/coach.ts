import { getChunkById, getScenarioById } from "@/lib/curriculum";
import type {
  DialogueResponse,
  DialogueTurnInput,
  PronunciationAttemptInput,
  PronunciationFeedback,
} from "@/lib/types";
import { clamp } from "@/lib/utils";

function normalizeRussian(input: string) {
  return input
    .toLowerCase()
    .replace(/[.,!?;:()[\]"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshtein(left: string, right: string) {
  const matrix = Array.from({ length: left.length + 1 }, () =>
    Array.from<number>({ length: right.length + 1 }).fill(0),
  );

  for (let row = 0; row <= left.length; row += 1) {
    matrix[row][0] = row;
  }

  for (let column = 0; column <= right.length; column += 1) {
    matrix[0][column] = column;
  }

  for (let row = 1; row <= left.length; row += 1) {
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      matrix[row][column] = Math.min(
        matrix[row - 1][column] + 1,
        matrix[row][column - 1] + 1,
        matrix[row - 1][column - 1] + cost,
      );
    }
  }

  return matrix[left.length][right.length];
}

export function scorePronunciation(input: PronunciationAttemptInput): PronunciationFeedback {
  const target = normalizeRussian(input.targetText);
  const attempt = normalizeRussian(input.attemptText);
  const hasLatin = /[a-z]/i.test(input.attemptText);
  const distance = levenshtein(target, attempt);
  const similarity = target.length === 0 ? 0 : clamp(1 - distance / Math.max(target.length, attempt.length || 1));
  const softTarget = /[ьёюяие]/.test(target);
  const segmentalScore = clamp(similarity - (hasLatin ? 0.18 : 0), 0, 1);
  const softnessScore = clamp(
    softTarget && !/[ьёюяие]/.test(attempt) ? segmentalScore - 0.15 : segmentalScore,
    0,
    1,
  );
  const stressScore = clamp(target.includes("о") ? segmentalScore - 0.05 : segmentalScore, 0, 1);
  const rhythmScore = clamp(segmentalScore + (attempt.includes(" ") ? 0.04 : 0), 0, 1);
  const overallScore = clamp(
    segmentalScore * 0.4 + softnessScore * 0.2 + stressScore * 0.2 + rhythmScore * 0.2,
  );

  const feedback: string[] = [];

  if (hasLatin) {
    feedback.push("Produce the attempt in Cyrillic when possible so sound and symbol stay directly linked.");
  }

  if (softTarget && !/[ьёюяие]/.test(attempt)) {
    feedback.push("Keep the consonant soft where Russian expects it; do not replace softness with a separate English vowel.");
  }

  if (target.includes("о")) {
    feedback.push("Watch unstressed о. Russian often reduces it toward a shorter vowel.");
  }

  if (distance > 0) {
    feedback.push("Shadow the target twice at full rhythm, then say it once from memory.");
  }

  if (feedback.length === 0) {
    feedback.push("Shape is strong. Repeat it once faster and keep the stress steady.");
  }

  return {
    id: crypto.randomUUID(),
    chunkId: input.chunkId,
    targetText: input.targetText,
    attemptText: input.attemptText,
    overallScore,
    segmentalScore,
    stressScore,
    softnessScore,
    rhythmScore,
    celebrate:
      overallScore >= 0.8
        ? "Good intelligibility. The phrase is holding together under pressure."
        : "The skeleton is there. Clean up the target sound and run another attempt.",
    feedback,
    nextDrill: hasLatin
      ? "Type or say the chunk in Cyrillic once, then shadow it."
      : "Replay the phrase and exaggerate the stressed syllable on the next pass.",
    createdAt: new Date().toISOString(),
  };
}

export function generateDialogueResponse(input: DialogueTurnInput): DialogueResponse {
  const scenario = getScenarioById(input.scenarioId);

  if (!scenario) {
    throw new Error(`Unknown scenario: ${input.scenarioId}`);
  }

  const normalizedTurn = normalizeRussian(input.userTurn);
  const chunkMatches = scenario.targetChunkIds.filter((chunkId) => {
    const chunk = getChunkById(chunkId);
    return chunk?.keywords.some((keyword) => normalizedTurn.includes(keyword));
  });

  const hasCyrillic = /[а-яё]/i.test(input.userTurn);
  const firstTarget = getChunkById(scenario.targetChunkIds[0]);
  const secondTarget = getChunkById(scenario.targetChunkIds[1]);

  if (!hasCyrillic) {
    return {
      scenarioId: scenario.id,
      coachReply: `Давайте по-русски: ${firstTarget?.russian ?? scenario.supportPrompt}`,
      coachTranslation: "Try that again in Russian using one clean chunk.",
      recast: firstTarget?.russian ?? scenario.supportPrompt,
      feedback: [
        "Stay in Russian even if the answer is short.",
        "One clean chunk is better than a long English explanation.",
      ],
      nextPrompt: scenario.supportPrompt,
      masteryBoostIds: [],
    };
  }

  if (chunkMatches.length === 0) {
    return {
      scenarioId: scenario.id,
      coachReply: `Нормально. Попробуйте так: ${firstTarget?.russian ?? scenario.supportPrompt}`,
      coachTranslation: "Good start. Try the target chunk more directly.",
      recast: firstTarget?.russian ?? scenario.supportPrompt,
      feedback: [
        "Use the week’s target chunk more directly.",
        "Shorter and cleaner will sound more natural right now.",
      ],
      nextPrompt: scenario.supportPrompt,
      masteryBoostIds: [],
    };
  }

  if (chunkMatches.length < Math.min(2, scenario.targetChunkIds.length)) {
    const recast =
      secondTarget && !chunkMatches.includes(secondTarget.id)
        ? `${input.userTurn.trim()} ${secondTarget.russian}`
        : input.userTurn.trim();

    return {
      scenarioId: scenario.id,
      coachReply: "Хорошо. Добавьте ещё один кусок.",
      coachTranslation: "Good. Add one more chunk.",
      recast,
      feedback: [
        "You landed one useful chunk.",
        "Add the second target chunk so the exchange keeps moving.",
      ],
      nextPrompt: scenario.stretchPrompt,
      masteryBoostIds: chunkMatches,
    };
  }

  return {
    scenarioId: scenario.id,
    coachReply: "Отлично. Это уже звучит как реальный обмен.",
    coachTranslation: "Excellent. That already sounds like a real exchange.",
    recast: input.userTurn.trim(),
    feedback: [
      "The key chunks are present.",
      "Push one more turn and keep the same calm rhythm.",
    ],
    nextPrompt: scenario.stretchPrompt,
    masteryBoostIds: chunkMatches,
  };
}
