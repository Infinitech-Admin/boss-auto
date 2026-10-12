import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Boss Auto Exchange is a car dealership in Poblacion, Muntinlupa City. We buy, sell and trade cars with clear details and a straightforward path to ownership.",
  alternates: { canonical: "/about" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Boss Auto Exchange",
    images: [DEFAULT_OG_IMAGE],
    url: "/about",
    title: "About Us | Boss Auto Exchange",
    description:
      "Boss Auto Exchange is a car dealership in Poblacion, Muntinlupa City. We buy, sell and trade cars with clear details and a straightforward path to ownership.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
