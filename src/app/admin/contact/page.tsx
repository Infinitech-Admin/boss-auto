// Path: <your admin folder>/contact/page.tsx (same level as your orders page)
//
// Server Component (no "use client"). The client component talks to the
// /api/contact proxy routes, so no env vars need to be passed down.
import ContactClient from "./contact-client";

export default function ContactPage() {
  return <ContactClient />;
}
