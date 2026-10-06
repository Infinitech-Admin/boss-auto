// Path: app/privacy-policy/page.tsx
import type { Metadata } from "next";

import LegalPage, { type LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | AutoTrade",
  description:
    "How AutoTrade collects, uses, and protects your personal information.",
};

const sections: LegalSection[] = [
  {
    title: "Information We Collect",
    paragraphs: [
      "We collect information you give us directly and some information that is generated when you use our website.",
    ],
    bullets: [
      "Contact details: name, email address, phone number, and delivery or billing address.",
      "Enquiry details: the vehicle you are interested in and the messages you send us.",
      "Order details: order items, payment method, payment reference, and the payment screenshot you upload.",
      "Sell / trade details: information and photos about the vehicle you want to sell or trade in.",
      "Account details: name, email, phone, and an encrypted password if you create an account.",
      "Technical data: device and browser information, IP address, and cookies used to keep you signed in and secure.",
    ],
  },
  {
    title: "How We Use Your Information",
    bullets: [
      "To respond to your enquiries and reply by email or phone.",
      "To process orders, verify payments, and arrange vehicle pick-up.",
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
      "We process your personal data in line with the Data Privacy Act of 2012 (Republic Act No. 10173) and its implementing rules. When you submit a form on our website and tick the privacy checkbox, you consent to us collecting and using your information for the purposes described in this policy. You may withdraw your consent at any time by contacting us, although this may limit our ability to serve you.",
    ],
  },
  {
    title: "How We Share Information",
    paragraphs: [
      "We do not sell your personal data. We only share it when necessary and with appropriate safeguards:",
    ],
    bullets: [
      "Service providers that help us run the website, host data, send email, or process payments.",
      "Government agencies, courts, or regulators when the law requires it.",
      "Professional advisers such as accountants and lawyers, under confidentiality.",
    ],
  },
  {
    title: "Cookies",
    paragraphs: [
      "We use cookies that are necessary to keep you signed in, protect against cross-site request forgery, and remember your cart. You can block cookies in your browser settings, but parts of the website may stop working.",
    ],
  },
  {
    title: "Data Retention",
    paragraphs: [
      "We keep personal data only as long as needed for the purposes above, or as required by law. Enquiries, order records, and payment proofs may be retained for accounting and legal reasons. When data is no longer needed, we delete or anonymise it.",
    ],
  },
  {
    title: "Security",
    paragraphs: [
      "We use reasonable organisational, technical, and physical measures to protect your data, including encrypted connections, hashed passwords, and restricted admin access. No system is completely secure, so please use a strong, unique password and keep it private.",
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
      "For privacy questions or to exercise your rights, contact us at hello@autotrade.com or through our Contact Us page.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="September 29, 2026"
      intro="At AutoTrade, we value your trust and are committed to protecting your personal information. This policy explains what we collect, why we collect it, and the choices you have."
      sections={sections}
    />
  );
}
