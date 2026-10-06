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

  // Disable PWA in development.
  disable: process.env.NODE_ENV === "development",

  workboxOptions: {
    disableDevLogs: true,
  },
});

export default withPWAConfig(nextConfig);
