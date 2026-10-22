// Path: lib/site.ts  (NEW file; if you use src/, put it in src/lib/site.ts)
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bossautoexchange.com"
).replace(/\/$/, "");

export const SITE_NAME = "Boss Auto Exchange";

export const BUSINESS = {
  phone: "+639060218568",
  streetAddress:
    "Block 132 Lot 7 C. Arellano St. cor J. Diokno, Katarungan Village, Poblacion",
  city: "Muntinlupa City",
  region: "Metro Manila",
  postalCode: "1776",
  country: "PH",
  sameAs: [
    "https://www.facebook.com/bossautoexchange",
    "https://www.instagram.com/boss.autoexchange",
    "https://www.tiktok.com/@boss.autoexchange",
  ],
};

export const absoluteUrl = (path = "/") =>
  `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

// Safe JSON for <script type="application/ld+json">
export const jsonLdString = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");

// Default social-share image (1200x630). File lives in public/og-default.jpg.
// Relative URL is resolved against metadataBase in app/layout.tsx.
export const DEFAULT_OG_IMAGE = {
  url: "/og-default.jpg",
  width: 1200,
  height: 630,
  alt: "Boss Auto Exchange - Used Cars for Sale in Muntinlupa",
};
