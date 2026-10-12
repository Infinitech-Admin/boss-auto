// Path: app/contact/layout.tsx  (NEW file, next to app/contact/page.tsx)
import type { Metadata } from "next";

import { DEFAULT_OG_IMAGE } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Contact Boss Auto Exchange in Poblacion, Muntinlupa City. Ask about a car, book a test drive or send an enquiry. Call 0906 021 8568 or message us on Facebook.",
  alternates: { canonical: "/contact" },
  openGraph: {
    type: "website",
    locale: "en_PH",
    siteName: "Boss Auto Exchange",
    images: [DEFAULT_OG_IMAGE],
    url: "/contact",
    title: "Contact Us | Boss Auto Exchange",
    description:
      "Contact Boss Auto Exchange in Poblacion, Muntinlupa City. Ask about a car, book a test drive or send an enquiry. Call 0906 021 8568 or message us on Facebook.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Contact Us | Boss Auto Exchange",
    description:
      "Contact Boss Auto Exchange in Poblacion, Muntinlupa City. Ask about a car, book a test drive or send an enquiry. Call 0906 021 8568 or message us on Facebook.",
    images: [DEFAULT_OG_IMAGE.url],
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
