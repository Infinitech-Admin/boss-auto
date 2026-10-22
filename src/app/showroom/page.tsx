// Path: app/showroom/page.tsx  (SERVER component, no "use client")
import type { Metadata } from "next";

import { fetchVehicles, type Vehicle } from "@/lib/api";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  absoluteUrl,
  jsonLdString,
} from "@/lib/site";

import ShowroomClient from "./showroom-client";

// Fetch cars on every request (not at build time, when the API is not running)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Used Cars for Sale in Muntinlupa",
  description:
    "Browse our showroom of quality used cars in Muntinlupa City. Filter by body type and budget, view photos and videos, and reserve with a 20% downpayment.",
  alternates: { canonical: "/showroom" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: SITE_NAME,
    images: [DEFAULT_OG_IMAGE],
    url: "/showroom",
    title: `Used Cars for Sale in Muntinlupa | ${SITE_NAME}`,
    description:
      "Browse quality used cars with full specs, photos and videos. Reserve with a 20% downpayment.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Used Cars for Sale in Muntinlupa | Boss Auto Exchange",
    description:
      "Browse our showroom of quality used cars in Muntinlupa City. Filter by body type and budget, view photos and videos, and reserve with a 20% downpayment.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default async function ShowroomPage() {
  // null = server fetch failed, so the client component fetches by itself
  let initialVehicles: Vehicle[] | null = null;
  try {
    const { data } = await fetchVehicles();
    // Showroom shows AVAILABLE cars only (sold/reserved never reach the client)
    initialVehicles = (data ?? []).filter((v) => v.status === "available");
  } catch {
    initialVehicles = null;
  }

  const listed = (initialVehicles ?? []).filter((v) => v.stock > 0);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Used Cars for Sale in Muntinlupa",
    url: absoluteUrl("/showroom"),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: listed.length,
      itemListElement: listed.slice(0, 30).map((v, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: absoluteUrl(`/showroom/car/${v.id}`),
        name: v.name,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }}
      />
      <ShowroomClient initialVehicles={initialVehicles} />
    </>
  );
}
