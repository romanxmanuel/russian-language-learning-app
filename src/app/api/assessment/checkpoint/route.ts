import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/http";
import { saveCheckpoint } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  week: z.number().int().min(1).max(8).optional(),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await saveCheckpoint(body.week);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error);
  }
}
