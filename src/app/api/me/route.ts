import { NextRequest, NextResponse } from "next/server";
import { laravelFetch } from "@/lib/server/laravel";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const incomingCookieHeader = request.headers.get("cookie") ?? "";

  const { status, data } = await laravelFetch("/api/me", {
    method: "GET",
    incomingCookieHeader,
  });

  // No Set-Cookie relay needed here — a plain GET to Laravel's session
  // guard doesn't rotate the session.
  return NextResponse.json(data, { status });
}
