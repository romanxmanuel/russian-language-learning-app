import { NextResponse } from "next/server";

import { jsonError } from "@/lib/http";
import { getDashboardSnapshot } from "@/lib/repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dashboard = await getDashboardSnapshot();
    return NextResponse.json({ ok: true, progress: dashboard.progress, dashboard });
  } catch (error) {
    return jsonError(error, 500);
  }
}
