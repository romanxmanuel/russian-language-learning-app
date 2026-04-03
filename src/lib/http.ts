import { NextResponse } from "next/server";

export function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export function jsonError(error: unknown, status = 400) {
  return NextResponse.json({ ok: false, error: getErrorMessage(error) }, { status });
}
