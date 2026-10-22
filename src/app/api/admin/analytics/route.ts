// Path: app/api/admin/analytics/route.ts
// Reads website traffic from Google Analytics 4 (Data API) for the admin
// dashboard. Runs on the server only, so the Google key never reaches the
// browser. Only admins may call it (see isAdmin below).

import { NextResponse, type NextRequest } from "next/server";
import { BetaAnalyticsDataClient } from "@google-analytics/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROPERTY_ID = process.env.GA_PROPERTY_ID; // numeric, NOT the G- ID
const CLIENT_EMAIL = process.env.GA_CLIENT_EMAIL;
const PRIVATE_KEY = process.env.GA_PRIVATE_KEY?.replace(/\\n/g, "\n");
// Any admin-only endpoint on your backend that returns 200 for a logged-in
// admin and 401/403 otherwise. We forward the visitor's credentials to it.
const ADMIN_VERIFY_URL = process.env.ADMIN_VERIFY_URL;

let client: BetaAnalyticsDataClient | null = null;
function getClient() {
  if (!client) {
    client = new BetaAnalyticsDataClient({
      credentials: { client_email: CLIENT_EMAIL, private_key: PRIVATE_KEY },
    });
  }
  return client;
}

/** true = admin, false = not admin, null = verification not configured */
async function isAdmin(request: NextRequest): Promise<boolean | null> {
  if (!ADMIN_VERIFY_URL) return null;
  const headers = new Headers({ accept: "application/json" });
  const auth = request.headers.get("authorization");
  const cookie = request.headers.get("cookie");
  if (auth) headers.set("authorization", auth);
  if (cookie) headers.set("cookie", cookie);
  // Sanctum only treats a request as a logged-in browser session when the
  // Referer/Origin is one of your allowed frontend domains.
  headers.set(
    "referer",
    request.headers.get("referer") ?? `${request.nextUrl.origin}/admin`,
  );
  try {
    const res = await fetch(ADMIN_VERIFY_URL, { headers, cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

type Row = {
  dimensionValues?: Array<{ value?: string | null }> | null;
  metricValues?: Array<{ value?: string | null }> | null;
};

const num = (row: Row | undefined, i: number) =>
  Number(row?.metricValues?.[i]?.value ?? 0);
const dim = (row: Row | undefined, i = 0) =>
  row?.dimensionValues?.[i]?.value ?? "";

const change = (cur: number, prev: number) =>
  prev > 0 ? Math.round(((cur - prev) / prev) * 1000) / 10 : null;

function dayLabel(yyyymmdd: string) {
  const y = Number(yyyymmdd.slice(0, 4));
  const m = Number(yyyymmdd.slice(4, 6));
  const d = Number(yyyymmdd.slice(6, 8));
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export async function GET(request: NextRequest) {
  const admin = await isAdmin(request);
  if (admin === null) {
    return NextResponse.json(
      { message: "Analytics is not configured (ADMIN_VERIFY_URL missing)." },
      { status: 503 },
    );
  }
  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }
  if (!PROPERTY_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    return NextResponse.json(
      { message: "Analytics is not configured (Google credentials missing)." },
      { status: 503 },
    );
  }

  const raw = Number(request.nextUrl.searchParams.get("days") ?? 30);
  const days = Number.isFinite(raw)
    ? Math.min(Math.max(Math.round(raw), 1), 365)
    : 30;

  const property = `properties/${PROPERTY_ID}`;
  const range = { startDate: `${days}daysAgo`, endDate: "today" };
  const previous = {
    startDate: `${days * 2}daysAgo`,
    endDate: `${days + 1}daysAgo`,
  };

  try {
    const c = getClient();

    const [totals, daily, pages, sources, devices, realtime] =
      await Promise.all([
        c
          .runReport({
            property,
            dateRanges: [range, previous],
            metrics: [
              { name: "activeUsers" },
              { name: "sessions" },
              { name: "screenPageViews" },
              { name: "averageSessionDuration" },
            ],
          })
          .then(([r]) => r),
        c
          .runReport({
            property,
            dateRanges: [range],
            dimensions: [{ name: "date" }],
            metrics: [{ name: "activeUsers" }, { name: "sessions" }],
            orderBys: [{ dimension: { dimensionName: "date" } }],
          })
          .then(([r]) => r),
        c
          .runReport({
            property,
            dateRanges: [range],
            dimensions: [{ name: "pagePath" }],
            metrics: [{ name: "screenPageViews" }],
            // keep your own admin visits out of the "top pages" list
            dimensionFilter: {
              notExpression: {
                filter: {
                  fieldName: "pagePath",
                  stringFilter: { matchType: "BEGINS_WITH", value: "/admin" },
                },
              },
            },
            orderBys: [
              { metric: { metricName: "screenPageViews" }, desc: true },
            ],
            limit: 8,
          })
          .then(([r]) => r),
        c
          .runReport({
            property,
            dateRanges: [range],
            dimensions: [{ name: "sessionDefaultChannelGroup" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
            limit: 6,
          })
          .then(([r]) => r),
        c
          .runReport({
            property,
            dateRanges: [range],
            dimensions: [{ name: "deviceCategory" }],
            metrics: [{ name: "sessions" }],
            orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
          })
          .then(([r]) => r),
        c
          .runRealtimeReport({
            property,
            metrics: [{ name: "activeUsers" }],
          })
          .then(([r]) => r)
          .catch(() => null),
      ]);

    const cur = totals.rows?.find((r) => dim(r) === "date_range_0");
    const prev = totals.rows?.find((r) => dim(r) === "date_range_1");

    const metric = (i: number) => ({
      value: num(cur, i),
      change: change(num(cur, i), num(prev, i)),
    });

    return NextResponse.json(
      {
        totals: {
          visitors: metric(0),
          sessions: metric(1),
          pageViews: metric(2),
          avgSessionSeconds: metric(3),
        },
        daily: (daily.rows ?? []).map((r) => ({
          date: dayLabel(dim(r)),
          visitors: num(r, 0),
          sessions: num(r, 1),
        })),
        topPages: (pages.rows ?? []).map((r) => ({
          path: dim(r),
          views: num(r, 0),
        })),
        sources: (sources.rows ?? []).map((r) => ({
          name: dim(r),
          sessions: num(r, 0),
        })),
        devices: (devices.rows ?? []).map((r) => ({
          name: dim(r),
          value: num(r, 0),
        })),
        liveUsers: num(realtime?.rows?.[0], 0),
      },
      { headers: { "Cache-Control": "private, max-age=120" } },
    );
  } catch (err) {
    console.error("GA Data API error:", err);
    return NextResponse.json(
      { message: "Couldn’t load analytics from Google right now." },
      { status: 502 },
    );
  }
}
