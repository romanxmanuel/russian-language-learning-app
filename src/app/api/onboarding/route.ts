import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError } from "@/lib/http";
import { getDashboardSnapshot, upsertProfile } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const onboardingSchema = z.object({
  name: z.string().min(1),
  dailyMinutes: z.number().int().min(20).max(90),
  motivation: z.string().min(1),
  timezone: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = onboardingSchema.parse(await request.json());
    const profile = await upsertProfile(body);
    const dashboard = await getDashboardSnapshot();

    return NextResponse.json({ ok: true, profile, dashboard });
  } catch (error) {
    return jsonError(error);
  }
}
