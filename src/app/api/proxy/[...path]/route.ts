// app/api/proxy/[...path]/route.ts
//
// Server-side proxy to the Laravel API. The browser only talks to this Next.js
// origin, so there is no cross-origin request and no CORS to configure.
//
//   /api/proxy/login                -> {LARAVEL_API_URL}/api/login
//   /api/proxy/admin/orders         -> {LARAVEL_API_URL}/api/admin/orders
//   /api/proxy/sanctum/csrf-cookie  -> {LARAVEL_API_URL}/sanctum/csrf-cookie
//
// LARAVEL_API_URL is read here on the server only (no NEXT_PUBLIC_ prefix),
// so it never ends up in the client bundle.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LARAVEL_API_URL = (
  process.env.LARAVEL_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

// Request headers we pass on to Laravel.
const FORWARDED_REQUEST_HEADERS = [
  "accept",
  "content-type", // keeps the multipart boundary intact for uploads
  "cookie", // Sanctum session + XSRF-TOKEN cookies
  "x-xsrf-token", // CSRF header echoed by lib/api.ts
  "x-requested-with",
  "origin",
  "referer",
  "user-agent",
];

type RouteContext = { params: Promise<{ path: string[] }> };

async function handler(request: NextRequest, { params }: RouteContext) {
  const { path } = await params;

  // Block path tricks like "../" escaping the /api prefix.
  if (path.some((segment) => segment === ".." || segment === ".")) {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const joined = path.join("/");
  const isSanctum = joined.startsWith("sanctum/");

  // Only the CSRF cookie route is exposed from Sanctum's unprefixed routes.
  if (isSanctum && joined !== "sanctum/csrf-cookie") {
    return NextResponse.json({ message: "Not found." }, { status: 404 });
  }

  const target = `${LARAVEL_API_URL}${isSanctum ? "" : "/api"}/${joined}${request.nextUrl.search}`;

  const headers = new Headers();
  for (const name of FORWARDED_REQUEST_HEADERS) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }

  // Sanctum decides whether a request is a "stateful" SPA request from the
  // Origin/Referer header, so make sure one is always present.
  if (!headers.get("origin")) {
    headers.set("origin", request.nextUrl.origin);
  }

  // Let Laravel see the real visitor IP (for throttling), not our server's.
  const clientIp =
    request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip");
  if (clientIp) headers.set("x-forwarded-for", clientIp);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: hasBody ? await request.arrayBuffer() : undefined,
      redirect: "manual",
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Unable to reach the API. Please try again." },
      { status: 502 },
    );
  }

  const response = new NextResponse(
    upstream.status === 204 || upstream.status === 304 ? null : upstream.body,
    { status: upstream.status },
  );

  const contentType = upstream.headers.get("content-type");
  if (contentType) response.headers.set("content-type", contentType);
  response.headers.set("cache-control", "no-store");

  // Pass Laravel's cookies through. The Domain attribute is dropped so the
  // cookie becomes a normal first-party cookie for this Next.js origin.
  const setCookies =
    (
      upstream.headers as Headers & { getSetCookie?: () => string[] }
    ).getSetCookie?.() ?? [];

  for (const cookie of setCookies) {
    response.headers.append(
      "set-cookie",
      cookie.replace(/;\s*domain=[^;]*/i, ""),
    );
  }

  return response;
}

export {
  handler as GET,
  handler as POST,
  handler as PUT,
  handler as PATCH,
  handler as DELETE,
};
