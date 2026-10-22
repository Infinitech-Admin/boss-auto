// Path: app/privacy-policy/page.tsx
import type { Metadata } from "next";

import LegalPage, { type LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | Boss Auto Exchange",
  description:
    "How Boss Auto Exchange collects, uses, shares, and protects your personal information.",
};

// TODO: confirm the address and add a Data Protection Officer email once you
// have one. Nothing here is invented: contact details come from your site.
const sections: LegalSection[] = [
  {
    title: "Information We Collect",
    paragraphs: [
      "We collect information you give us directly and some information that is generated when you use our website.",
    ],
    bullets: [
      "Contact details: name, email address, phone number, and delivery or billing address.",
      "Enquiry details: the vehicle you are interested in, your budget or timeline, and the messages you send us.",
      "Test drive details: the vehicle and the schedule you request.",
      "Reservation and order details: order items, payment method, payment reference, and the payment screenshot you upload.",
      "Financing details: the information you give us when asking about financing or a downpayment plan.",
      "Sell / trade details: information and photos about the vehicle you want to sell or trade in.",
      "Account details: name, email, phone, and an encrypted password if you create an account.",
      "Technical data: device and browser information, IP address, pages visited, and cookies used to keep you signed in and secure.",
    ],
  },
  {
    title: "How We Use Your Information",
    bullets: [
      "To respond to your enquiries by email, phone, or message.",
      "To schedule and confirm test drives.",
      "To process reservations and orders, verify payments, and arrange vehicle release.",
      "To assess financing options when you ask us to.",
      "To evaluate sell / trade requests and make offers.",
      "To create and secure your account.",
      "To prevent spam, fraud, and misuse of our website.",
      "To improve our inventory, services, and website experience.",
      "To meet legal, accounting, and regulatory obligations.",
    ],
  },
  {
    title: "Consent and Legal Basis",
    paragraphs: [
      "We process your personal data in line with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules. We rely on your consent, on the need to carry out a transaction you requested, and on legal obligations. When you submit a form on our website and tick the privacy checkbox, you consent to us collecting and using your information for the purposes described in this policy. You may withdraw your consent at any time by contacting us, although this may limit our ability to serve you.",
    ],
  },
  {
    title: "How We Share Information",
    paragraphs: [
      "We do not sell your personal data. We only share it when necessary and with appropriate safeguards:",
    ],
    bullets: [
      "Banks and financing partners, only when you ask us to process a financing application.",
      "Service providers that help us run the website, host data, send email, handle chat and messaging, analyse website usage, or process payments.",
      "Government agencies, courts, or regulators when the law requires it, including vehicle registration and transfer requirements.",
      "Professional advisers such as accountants and lawyers, under confidentiality.",
    ],
  },
  {
    title: "Third-Party Platforms",
    paragraphs: [
      "Our website links to and may embed tools from third parties, such as Facebook, Messenger, Instagram, TikTok, and phone or chat services. If you contact us through them, those platforms handle your information under their own privacy policies, which we do not control.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "We use cookies that are necessary to keep you signed in, protect against cross-site request forgery, and remember your cart. We may also use cookies or similar tools to understand how the website is used. You can block cookies in your browser settings, but parts of the website may stop working.",
    ],
  },
  {
    title: "Data Retention",
    paragraphs: [
      "We keep personal data only as long as needed for the purposes above, or as required by law. Enquiries, order records, and payment proofs may be retained for accounting, warranty, and legal reasons. When data is no longer needed, we delete or anonymise it.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use reasonable organisational, technical, and physical measures to protect your data, including encrypted connections, hashed passwords, and restricted admin access. No system is completely secure, so please use a strong, unique password and keep it private. If a data breach affects you, we will notify you and the National Privacy Commission as the law requires.",
    ],
  },
  {
    title: "Your Rights",
    paragraphs: ["Under the Data Privacy Act, you have the right to:"],
    bullets: [
      "Be informed about how your data is processed.",
      "Access the personal data we hold about you.",
      "Correct inaccurate or outdated data.",
      "Object to processing or withdraw consent.",
      "Request erasure or blocking of your data, subject to legal requirements.",
      "Data portability, where applicable.",
      "Claim compensation for damages caused by unlawful use of your data.",
      "Lodge a complaint with the National Privacy Commission (privacy.gov.ph).",
    ],
  },
  {
    title: "Children's Privacy",
    paragraphs: [
      "Our services are intended for adults. We do not knowingly collect personal data from anyone under 18. If you believe a minor has given us their information, please contact us so we can remove it.",
    ],
  },
  {
    title: "Changes to This Policy",
    paragraphs: [
      "We may update this policy from time to time. The latest version will always be on this page with the date it was last updated. Continued use of the website means you accept the updated policy.",
    ],
  },
  {
    title: "Contact Us",
    paragraphs: [
      "For privacy questions or to exercise your rights, contact Boss Auto Exchange through our Contact Us page, on Facebook at facebook.com/bossautoexchange, or by phone at 0906 021 8568. You can also visit us at L7, B132, Arellano cor. Diokno St., Muntinlupa City, Philippines.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="October 12, 2026"
      intro="At Boss Auto Exchange, we value your trust and are committed to protecting your personal information. This policy explains what we collect, why we collect it, who we share it with, and the choices you have."
      sections={sections}
    />
  );
}
