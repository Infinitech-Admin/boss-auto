// lib/server/laravel.ts

import "server-only";

/**
 * This file only ever runs on the Next.js server (inside Route Handlers).
 * The "server-only" import above makes the build fail loudly if it's ever
 * imported from a client component, so LARAVEL_API_URL and raw session
 * cookies can never end up in a browser bundle.
 *
 * IMPORTANT: every `path` passed to laravelFetch() below must include the
 * "/api" prefix (e.g. "/api/login", "/api/register"), because Laravel
 * auto-prefixes everything declared in routes/api.php with "api/"
 * (confirmed via `php artisan route:list` — the real route is
 * POST api/register, not POST /register).
 */

const LARAVEL_API_URL = process.env.LARAVEL_API_URL || "http://localhost:8000";

// Must be a host that is literally listed in Laravel's
// SANCTUM_STATEFUL_DOMAINS (see backend/ENV_SETTINGS.md). Sanctum uses the
// Referer/Origin header — not the caller's IP — to decide whether a
// request should be treated as cookie-authenticated.
const APP_ORIGIN = process.env.APP_ORIGIN || "http://localhost:3000";

type LaravelResult = {
    status: number;
    data: any;
    setCookieHeaders: string[];
};

function extractCookiePair(setCookieStr: string): {
    name: string;
    value: string;
} {
    const [pair] = setCookieStr.split(";");
    const eq = pair.indexOf("=");
    return { name: pair.slice(0, eq).trim(), value: pair.slice(eq + 1).trim() };
}

function readCookieFromHeader(
    cookieHeader: string,
    name: string
): string | null {
    const match = cookieHeader.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Laravel sets Domain to its own host. A response coming from our Next.js
 * origin can't legally set a cookie for a different Domain — the browser
 * will just drop it — so we strip Domain and let it default to a
 * host-only cookie for whichever origin actually served the response.
 */
export function rewriteSetCookieForBrowser(setCookieStr: string): string {
    return setCookieStr.replace(/;\s*Domain=[^;]+/i, "");
}

/**
 * Calls a Laravel endpoint from the server, forwarding the browser's
 * cookies and, for unsafe methods, priming + attaching CSRF protection.
 *
 * @param incomingCookieHeader The raw `Cookie` header from the browser's
 *   request to our Next.js route handler (i.e. request.headers.get("cookie")).
 */
export async function laravelFetch(
    path: string,
    {
        method = "GET",
        body,
        incomingCookieHeader = "",
    }: { method?: string; body?: unknown; incomingCookieHeader?: string } = {}
): Promise<LaravelResult> {
    const needsCsrf = method !== "GET" && method !== "HEAD";
    let cookieHeader = incomingCookieHeader;
    let xsrfToken = readCookieFromHeader(cookieHeader, "XSRF-TOKEN");
    const collected: string[] = [];

    if (needsCsrf && !xsrfToken) {
        const csrfRes = await fetch(`${LARAVEL_API_URL}/sanctum/csrf-cookie`, {
            headers: { Referer: APP_ORIGIN, Origin: APP_ORIGIN },
            cache: "no-store",
        });

        const setCookies = csrfRes.headers.getSetCookie?.() ?? [];
        for (const sc of setCookies) {
            collected.push(sc);
            const { name, value } = extractCookiePair(sc);
            cookieHeader += (cookieHeader ? "; " : "") + `${name}=${value}`;
            if (name === "XSRF-TOKEN") xsrfToken = decodeURIComponent(value);
        }
    }

    const res = await fetch(`${LARAVEL_API_URL}${path}`, {
        method,
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Referer: APP_ORIGIN,
            Origin: APP_ORIGIN,
            Cookie: cookieHeader,
            ...(xsrfToken ? { "X-XSRF-TOKEN": xsrfToken } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
        cache: "no-store",
    });

    collected.push(...(res.headers.getSetCookie?.() ?? []));

    let data: any = null;
    try {
        data = await res.json();
    } catch {
        data = null;
    }

    return { status: res.status, data, setCookieHeaders: collected };
}

/** Applies every relayed Set-Cookie header (rewritten for our own origin) to a NextResponse. */
export function applySetCookies(
    response: Response,
    setCookieHeaders: string[]
) {
    for (const raw of setCookieHeaders) {
        response.headers.append("Set-Cookie", rewriteSetCookieForBrowser(raw));
    }
}

/**
 * Defense-in-depth CSRF check for our OWN routes: rejects a POST whose
 * Origin header doesn't match our app. SameSite cookies already block most
 * of this, but checking Origin costs nothing and catches misconfiguration.
 */
export function isTrustedOrigin(request: Request): boolean {
    const origin = request.headers.get("origin");
    if (!origin) return true; // same-origin requests often omit Origin
    return origin === APP_ORIGIN;
}