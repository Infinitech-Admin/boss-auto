import { NextRequest, NextResponse } from "next/server";
import {
  applySetCookies,
  isTrustedOrigin,
  laravelFetch,
} from "@/lib/server/laravel";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return NextResponse.json(
      { message: "Invalid request origin." },
      { status: 403 },
    );
  }

  const body = await request.json().catch(() => ({}));
  const incomingCookieHeader = request.headers.get("cookie") ?? "";

  const { status, data, setCookieHeaders } = await laravelFetch(
    "/resend-verification",
    {
      method: "POST",
      body,
      incomingCookieHeader,
    },
  );

  const response = NextResponse.json(data, { status });
  applySetCookies(response, setCookieHeaders);
  return response;
}
