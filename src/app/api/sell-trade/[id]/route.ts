import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.LARAVEL_API_URL ?? "http://localhost:8000";

type Ctx = { params: Promise<{ id: string }> };

async function forward(
  req: NextRequest,
  ctx: Ctx,
  method: "GET" | "PATCH" | "DELETE",
) {
  const token = req.cookies.get("auth_token")?.value;

  if (!token) {
    return NextResponse.json({ message: "Unauthenticated." }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const res = await fetch(
      `${API_URL}/api/sell-trade/${encodeURIComponent(id)}`,
      {
        method,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          ...(method === "PATCH" ? { "Content-Type": "application/json" } : {}),
        },
        body: method === "PATCH" ? JSON.stringify(await req.json()) : undefined,
        cache: "no-store",
      },
    );

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the server." },
      { status: 502 },
    );
  }
}

export const GET = (req: NextRequest, ctx: Ctx) => forward(req, ctx, "GET");
export const PATCH = (req: NextRequest, ctx: Ctx) => forward(req, ctx, "PATCH");
export const DELETE = (req: NextRequest, ctx: Ctx) =>
  forward(req, ctx, "DELETE");
