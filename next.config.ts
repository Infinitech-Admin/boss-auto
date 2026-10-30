import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

// Backend na nagse-serve ng /storage images (Laravel).
// Kung naka-set ang NEXT_PUBLIC_API_URL, awtomatikong papayagan
// din ang host na iyon para sa production images.

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const apiPattern = (() => {
  if (!apiUrl) return null;

  try {
    const u = new URL(apiUrl);

    return {
      protocol: u.protocol.replace(":", "") as "http" | "https",
      hostname: u.hostname,
      port: u.port,
      pathname: "/storage/**",
    };
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },

      // Local dev backend
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/storage/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "8000",
        pathname: "/storage/**",
      },

      // Production backend
      ...(apiPattern ? [apiPattern] : []),
    ],
  },
};

const withPWAConfig = withPWA({
  dest: "public",

  // Do not cache frontend navigation responses.
  // This prevents Workbox from interfering with dynamic/admin pages.
  cacheOnFrontEndNav: false,

  // Disable aggressive frontend navigation caching.
  aggressiveFrontEndNavCaching: false,

  // Reload when the device comes back online.
  reloadOnOnline: true,

  // Keep the default caching rules (images, fonts, JS, CSS), and put
  // the custom rules below in front of them.
  extendDefaultRuntimeCaching: true,

  // Disable PWA in development.
  disable: process.env.NODE_ENV === "development",

  workboxOptions: {
    disableDevLogs: true,

    runtimeCaching: [
      // Never cache API responses (logged-in data), same-origin
      // (/api/me, /api/proxy/...) or from the Laravel backend.
      // The first matching rule wins, so this must stay first.
      {
        urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith("/api/"),
        handler: "NetworkOnly",
      },
    ],
  },
});

export default withPWAConfig(nextConfig);
