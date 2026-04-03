import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/http";
import { recordDialogueTurn } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  scenarioId: z.string().min(1),
  userTurn: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const result = await recordDialogueTurn(body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return jsonError(error);
  }
}
