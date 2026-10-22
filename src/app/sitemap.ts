// Path: app/sitemap.ts  (NEW file, next to layout.tsx)
import type { MetadataRoute } from "next";

import { fetchVehicles } from "@/lib/api";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600; // rebuild hourly

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/showroom`, changeFrequency: "daily", priority: 0.9 },
    {
      url: `${SITE_URL}/sell-trade`,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    { url: `${SITE_URL}/contact`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/sold-cars`, changeFrequency: "weekly", priority: 0.4 },
  ];

  let carPages: MetadataRoute.Sitemap = [];
  try {
    const { data } = await fetchVehicles();
    carPages = (data ?? [])
      .filter((v) => v.status !== "sold") // sold cars are noindexed
      .map((v) => ({
        url: `${SITE_URL}/showroom/car/${v.id}`,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
  } catch {
    // If the API is down, still serve the static pages.
  }

  return [...staticPages, ...carPages];
}
