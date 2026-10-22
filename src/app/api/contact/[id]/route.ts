// Path: app/api/contact/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.LARAVEL_API_URL ?? "http://localhost:8000";

const STATUSES = ["new", "read", "replied", "closed"];

type Context = { params: Promise<{ id: string }> };

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

async function proxy(
  req: NextRequest,
  { params }: Context,
  method: "GET" | "PATCH",
) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  if (method !== "GET" && !isSameOrigin(req)) {
    return NextResponse.json({ message: "Forbidden." }, { status: 403 });
  }

  const { id } = await params;

  // Numeric ids only: stops path tricks like "../" from reaching other API routes.
  if (!/^\d+$/.test(id)) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  let body: string | undefined;

  if (method === "PATCH") {
    const parsed = await req.json().catch(() => null);
    const status = parsed?.status;

    if (typeof status !== "string" || !STATUSES.includes(status)) {
      return NextResponse.json({ message: "Invalid status." }, { status: 422 });
    }

    body = JSON.stringify({ status });
  }

  try {
    const res = await fetch(`${API_URL}/api/contact/${id}`, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body,
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

// Admin: single enquiry with replies
export async function GET(req: NextRequest, ctx: Context) {
  return proxy(req, ctx, "GET");
}

// Admin: update status
export async function PATCH(req: NextRequest, ctx: Context) {
  return proxy(req, ctx, "PATCH");
}
