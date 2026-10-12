// Path: app/layout.tsx
import type { Metadata, Viewport } from "next";

import { Geist, Geist_Mono } from "next/font/google";
import { GoogleAnalytics } from "@next/third-parties/google";
import { Analytics } from "@vercel/analytics/next";

import "./globals.css";

import { AuthProvider } from "@/context/auth-context";
import { CartProvider } from "@/context/cart-context";
import ChatWidget from "@/components/chat-widget";
import FloatingSocial from "@/components/floating-social";
import AnimatedSplash from "@/components/animated-splash";
import { DEFAULT_OG_IMAGE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Set NEXT_PUBLIC_SITE_URL in .env (e.g. https://www.bossautoexchange.com)
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bossautoexchange.com"
).replace(/\/$/, "");

const SITE_NAME = "Boss Auto Exchange";
const SITE_DESCRIPTION =
  "Browse quality used and pre-owned cars for sale at Boss Auto Exchange. View detailed specs, photos and videos, then inquire about your next vehicle.";

// Google Analytics 4 Measurement ID (e.g. G-WRRW2R7YEQ).
// Set NEXT_PUBLIC_GA_ID in .env.local AND in your Vercel environment variables.
// If it's not set, analytics simply doesn't load.
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  // REQUIRED: makes canonical, OG and Twitter URLs absolute
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Boss Auto Exchange | Used Cars for Sale in Muntinlupa",
    template: "%s | Boss Auto Exchange",
  },

  // Keep between 140-160 chars so Google doesn't truncate
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: "Next.js",
  category: "automotive",

  keywords: [
    "Boss Auto Exchange",
    "cars for sale",
    "used cars",
    "pre-owned cars",
    "car dealership",
    "car trading",
    "vehicles for sale",
    "premium cars",
    "used cars Muntinlupa",
    "car dealer Muntinlupa",
    "used cars Philippines",
    "sell my car",
    "trade in car",
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  // Canonical for the homepage. Child pages should set their own
  // alternates.canonical in their own metadata / generateMetadata.
  alternates: {
    canonical: "/",
  },

  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },

  // Stop iOS from auto-linking numbers (VINs, prices) as phone numbers
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },

  manifest: "/manifest.json",

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: SITE_NAME,
  },

  openGraph: {
    type: "website",
    locale: "en_PH",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "Boss Auto Exchange | Used Cars for Sale in Muntinlupa",
    description:
      "Explore quality vehicles with detailed specifications, photos, videos, and easy inquiry options.",
    images: [DEFAULT_OG_IMAGE],
  },

  twitter: {
    card: "summary_large_image",
    title: "Boss Auto Exchange | Used Cars for Sale in Muntinlupa",
    description:
      "Quality used cars for sale in Muntinlupa City. View specs, photos and videos, book a test drive, or sell and trade in your car.",
    // site: "@yourhandle",
    // creator: "@yourhandle",
    images: [DEFAULT_OG_IMAGE.url],
  },

  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192" }],
  },

  // Paste the token values only, from Search Console / Bing Webmaster
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
  //   other: { "msvalidate.01": "YOUR_BING_TOKEN" },
  // },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // maximumScale: 1 removed: it blocks pinch-zoom, fails accessibility
  // audits, and Google can factor that into mobile usability.
  themeColor: "#D41F2D",
  colorScheme: "dark",
};

// Structured data: tells Google this is a car dealer + a searchable site.
// Fill in the TODO fields with real business details.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "AutoDealer",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/icons/icon-512x512.png`,
      image: `${SITE_URL}/icons/icon-512x512.png`,
      description: SITE_DESCRIPTION,
      telephone: "+639060218568",
      address: {
        "@type": "PostalAddress",
        streetAddress:
          "Block 132 Lot 7 C. Arellano St. cor J. Diokno, Katarungan Village, Poblacion",
        addressLocality: "Muntinlupa City",
        addressRegion: "Metro Manila",
        postalCode: "1776",
        addressCountry: "PH",
      },
      areaServed: "Metro Manila, Philippines",
      // Opening hours intentionally omitted until you have real ones.
      sameAs: [
        "https://www.facebook.com/bossautoexchange",
        "https://www.instagram.com/boss.autoexchange",
        "https://www.tiktok.com/@boss.autoexchange",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: SITE_DESCRIPTION,
      publisher: { "@id": `${SITE_URL}/#organization` },
      inLanguage: "en-PH",
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#040E21] text-white">
        <script
          type="application/ld+json"
          // Escape "<" so the JSON can never break out of the script tag
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <AuthProvider>
          <CartProvider>
            {children}
            <AnimatedSplash />
            <FloatingSocial />
            <ChatWidget />
          </CartProvider>
        </AuthProvider>
        {/* Vercel Analytics: records page views on Vercel deployments */}
        <Analytics />
      </body>
      {/* Google Analytics 4: only loads when NEXT_PUBLIC_GA_ID is set */}
      {GA_ID && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}
