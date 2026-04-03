import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/http";
import { gradeReview } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  chunkId: z.string().min(1),
  outcome: z.enum(["again", "hard", "good", "easy"]),
  accuracy: z.number().min(0).max(1).optional(),
  confidence: z.number().min(0).max(1).optional(),
  minutesSpent: z.number().int().min(0).max(60).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await gradeReview(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error);
  }
}
