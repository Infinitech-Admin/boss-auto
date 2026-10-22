// Path: app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.LARAVEL_API_URL ?? "http://localhost:8000";

const MAX_BODY_BYTES = 10_000;

const ALLOWED_FIELDS = [
  "first_name",
  "last_name",
  "email",
  "phone",
  "looking_for",
  "message",
  "privacy_accepted",
  "website", // honeypot
] as const;

const ALLOWED_QUERY = ["status", "search", "per_page", "page"] as const;

// The real visitor IP, so Laravel can rate-limit per visitor instead of per Next.js server.
function clientIp(req: NextRequest) {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    ""
  );
}

// Public: submit an enquiry
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();

    if (raw.length > MAX_BODY_BYTES) {
      return NextResponse.json(
        { message: "Request too large." },
        { status: 413 },
      );
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 },
      );
    }

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return NextResponse.json(
        { message: "Invalid request." },
        { status: 400 },
      );
    }

    // Forward only known fields with primitive values.
    const payload: Record<string, unknown> = {};
    for (const key of ALLOWED_FIELDS) {
      const value = (parsed as Record<string, unknown>)[key];
      if (
        typeof value === "string" ||
        typeof value === "boolean" ||
        value === null
      ) {
        payload[key] = value;
      }
    }

    const ip = clientIp(req);

    const res = await fetch(`${API_URL}/api/contact`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(ip ? { "X-Forwarded-For": ip } : {}),
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

// Admin: list enquiries
export async function GET(req: NextRequest) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  // Forward only known query params.
  const params = new URLSearchParams();
  for (const key of ALLOWED_QUERY) {
    const value = req.nextUrl.searchParams.get(key);
    if (value) params.set(key, value.slice(0, 100));
  }
  const qs = params.toString();

  try {
    const res = await fetch(`${API_URL}/api/contact${qs ? `?${qs}` : ""}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
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
