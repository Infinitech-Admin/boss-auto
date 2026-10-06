// Server Component (no "use client"), so it can read any env var —
// including ones without the NEXT_PUBLIC_ prefix. The value is passed to the
// client component as a plain string and is never bundled into client JS.
import OrdersClient from "./orders-client";

export default function OrdersPage() {
  const imageBaseUrl = process.env.LARAVEL_API_URL || "http://localhost:8000";

  return <OrdersClient imageBaseUrl={imageBaseUrl} />;
}
