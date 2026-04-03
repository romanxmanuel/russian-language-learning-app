import { describe, expect, it } from "vitest";

import { getChunkById } from "./curriculum";
import { seedMasteryStates } from "./mastery";
import { buildMissionPlan, buildPreviewProfile, computeCurrentWeek } from "./mission-engine";

describe("mission engine", () => {
  it("starts a preview learner on week one", () => {
    const profile = buildPreviewProfile();
    const mission = buildMissionPlan(profile, seedMasteryStates(profile.id), new Date(profile.startedAt));

    expect(mission.week).toBe(1);
    expect(mission.flow).toHaveLength(6);
    expect(mission.focusChunks.length).toBeGreaterThan(0);
  });

  it("computes the current week from the learner start date", () => {
    const now = new Date("2026-04-20T12:00:00.000Z");
    const startedAt = new Date("2026-04-01T12:00:00.000Z").toISOString();

    expect(computeCurrentWeek(startedAt, now)).toBe(3);
  });

  it("prioritizes overdue weak chunks", () => {
    const profile = buildPreviewProfile();
    profile.startedAt = new Date("2026-04-01T12:00:00.000Z").toISOString();
    const mastery = seedMasteryStates(profile.id);
    const weakChunk = getChunkById("w2-ticket");

    if (!weakChunk) {
      throw new Error("Missing test chunk");
    }

    const target = mastery.find((row) => row.chunkId === weakChunk.id);
    if (!target) {
      throw new Error("Missing mastery row");
    }

    target.strength = 0.1;
    target.recall = 0.1;
    target.nextReviewAt = new Date("2026-04-14T12:00:00.000Z").toISOString();

    const mission = buildMissionPlan(profile, mastery, new Date("2026-04-20T12:00:00.000Z"));

    expect(mission.dueWeakSpots.some((chunk) => chunk.id === weakChunk.id)).toBe(true);
  });
});
