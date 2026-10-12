// Path: app/robots.ts  (NEW file, next to layout.tsx)
import type { MetadataRoute } from "next";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bossautoexchange.com"
).replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep private / low-value pages out of the index
        disallow: [
          "/api/",
          "/cart",
          "/checkout",
          "/account",
          "/login",
          "/register",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
