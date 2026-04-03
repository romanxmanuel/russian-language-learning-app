import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/http";
import { getCurrentMission, getDashboardSnapshot, recordMissionEvent } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const eventSchema = z.object({
  eventType: z.enum([
    "session-start",
    "listen-pass",
    "reveal-transcript",
    "review-complete",
    "dialogue-turn",
    "pronunciation-attempt",
    "reflection-complete",
    "checkpoint",
  ]),
  minutesSpent: z.number().int().min(0).max(240).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function GET() {
  try {
    const [mission, dashboard] = await Promise.all([
      getCurrentMission(),
      getDashboardSnapshot(),
    ]);

    return NextResponse.json({ ok: true, mission, dashboard });
  } catch (error) {
    return jsonError(error, 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = eventSchema.parse(await request.json());
    const dashboard = await recordMissionEvent(body);

    return NextResponse.json({ ok: true, mission: dashboard.mission, dashboard });
  } catch (error) {
    return jsonError(error);
  }
}
