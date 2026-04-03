import { describe, expect, it } from "vitest";

import { generateDialogueResponse, scorePronunciation } from "./coach";

describe("coach heuristics", () => {
  it("scores a matching Cyrillic attempt above a Latin transliteration", () => {
    const exact = scorePronunciation({
      chunkId: "w1-hello",
      targetText: "Привет",
      attemptText: "Привет",
    });
    const latin = scorePronunciation({
      chunkId: "w1-hello",
      targetText: "Привет",
      attemptText: "Privet",
    });

    expect(exact.overallScore).toBeGreaterThan(latin.overallScore);
    expect(latin.feedback.some((item) => item.includes("Cyrillic"))).toBe(true);
  });

  it("nudges the learner back into Russian when no Cyrillic appears", () => {
    const response = generateDialogueResponse({
      scenarioId: "w1-scenario",
      userTurn: "I do not understand",
    });

    expect(response.coachReply).toContain("Давайте по-русски");
    expect(response.masteryBoostIds).toHaveLength(0);
  });

  it("rewards a turn that contains target chunks", () => {
    const response = generateDialogueResponse({
      scenarioId: "w2-scenario",
      userTurn: "Мне нужен билет. Сколько это стоит?",
    });

    expect(response.masteryBoostIds.length).toBeGreaterThan(0);
    expect(response.feedback[0]).toContain("key chunks");
  });
});
