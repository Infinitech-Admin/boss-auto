import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sell or Trade In Your Car in Muntinlupa",
  description:
    "Get an instant value estimate for your car and sell or trade it in at Boss Auto Exchange, Muntinlupa City. Fair offers and no dealership pressure.",
  alternates: { canonical: "/sell-trade" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Boss Auto Exchange",
    images: [DEFAULT_OG_IMAGE],
    url: "/sell-trade",
    title: "Sell or Trade In Your Car in Muntinlupa | Boss Auto Exchange",
    description:
      "Get an instant value estimate for your car and sell or trade it in at Boss Auto Exchange, Muntinlupa City. Fair offers and no dealership pressure.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
