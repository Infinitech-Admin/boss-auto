// Path: app/api/contact/[id]/reply/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.LARAVEL_API_URL ?? "http://localhost:8000";

const MAX_BODY_BYTES = 20_000;

// Blocks cross-site requests that ride on the admin's auth cookie (CSRF).
function isSameOrigin(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (!origin) return true;

  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

// Admin: email a reply to the customer
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  if (!isSameOrigin(req)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  // Numeric ids only: stops path tricks like "../" from reaching other API routes.
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  try {
    const raw = await req.text();

    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { message: "Request too large." },
        { status: 413 },
      );
    }

    let parsed: { subject?: unknown; body?: unknown } | null = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 },
      );
    }

    if (typeof parsed?.body !== "string") {
      return NextResponse.json(
        { message: "A reply message is required." },
        { status: 422 },
      );
    }

    const payload: { subject?: string; body: string } = { body: parsed.body };
    if (typeof parsed.subject === "string") {
      payload.subject = parsed.subject;
    }

    const res = await fetch(`${API_URL}/api/contact/${id}/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the server." },
      { status: 502 },
    );
  }
}
