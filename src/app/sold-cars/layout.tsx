import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sold Cars",
  description:
    "See the cars Boss Auto Exchange has recently sold to happy drivers. Browse our showroom to find your next ride.",
  alternates: { canonical: "/sold-cars" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Boss Auto Exchange",
    images: [DEFAULT_OG_IMAGE],
    url: "/sold-cars",
    title: "Sold Cars | Boss Auto Exchange",
    description:
      "See the cars Boss Auto Exchange has recently sold to happy drivers. Browse our showroom to find your next ride.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
