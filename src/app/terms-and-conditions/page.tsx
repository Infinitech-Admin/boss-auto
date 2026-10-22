// Path: app/terms-and-conditions/page.tsx
import type { Metadata } from "next";

import LegalPage, { type LegalSection } from "@/components/layout/legal-page";

export const metadata: Metadata = {
  title: "Terms & Conditions | AutoTrade",
  description:
    "The terms that apply when you use the AutoTrade website, place orders, or submit sell / trade requests.",
};

const sections: LegalSection[] = [
  {
    title: "Acceptance of Terms",
    paragraphs: [
      "By accessing or using the AutoTrade website, you agree to these Terms & Conditions and our Privacy Policy. If you do not agree, please do not use the website.",
    ],
  },
  {
    title: "Use of the Website",
    paragraphs: [
      "You agree to use the website lawfully and respectfully. You must not:",
    ],
    bullets: [
      "Provide false, misleading, or another person's information.",
      "Attempt to gain unauthorised access to accounts, systems, or data.",
      "Upload malicious code or interfere with the website's operation.",
      "Scrape, copy, or resell our content or listings without permission.",
      "Use the website for fraudulent or unlawful purposes.",
    ],
  },
  {
    title: "Accounts",
    paragraphs: [
      "You are responsible for keeping your login details confidential and for all activity under your account. Tell us immediately if you suspect unauthorised use. We may suspend or close accounts that breach these terms.",
    ],
  },
  {
    title: "Vehicle Listings and Pricing",
    paragraphs: [
      "Listings, photos, prices, mileage, specifications, and availability are provided for general information and may change without notice. We work hard to keep them accurate, but errors can occur. Final price, condition, and availability are confirmed by AutoTrade at the time of sale. We may correct any listing error, including cancelling an affected order.",
    ],
  },
  {
    title: "Orders and Downpayment",
    bullets: [
      "Placing an order requires a downpayment of 20% of the vehicle price, paid through the methods shown at checkout, with a payment screenshot uploaded as proof.",
      "An order is only confirmed after we verify your payment. Until then it remains pending verification.",
      "Vehicle stock is reserved once an order is confirmed. If a vehicle is no longer available, we will contact you about alternatives or a refund of your downpayment.",
      "The remaining balance is settled on pick-up or as agreed in writing with AutoTrade.",
      "Cancellations and refunds are handled case by case in line with the terms communicated at the time of your order and applicable law.",
    ],
  },
  {
    title: "Sell / Trade Requests",
    paragraphs: [
      "Submitting a sell or trade-in request is not a guarantee of an offer. Any offer is subject to inspection, document verification (such as OR/CR), and confirmation of the vehicle's condition and ownership. You confirm that you are the lawful owner or are authorised to sell the vehicle, and that the information you provide is accurate. We may revise or withdraw an offer if the vehicle differs from what was described.",
    ],
  },
  {
    title: "Enquiries and Test Drives",
    paragraphs: [
      "Enquiries and test-drive requests are subject to availability and verification. We may ask for a valid driver's licence and other identification before a test drive.",
    ],
  },
  {
    title: "Intellectual Property",
    paragraphs: [
      "All content on this website, including the AutoTrade name, logo, text, graphics, and photos, belongs to AutoTrade or its licensors and is protected by law. You may view and use it for personal, non-commercial purposes only.",
    ],
  },
  {
    title: "Disclaimers",
    paragraphs: [
      'The website and its content are provided "as is" and "as available". We do not guarantee that the website will be uninterrupted or error free. Nothing in these terms limits any rights you have under Philippine consumer protection laws.',
    ],
  },
  {
    title: "Limitation of Liability",
    paragraphs: [
      "To the fullest extent permitted by law, AutoTrade is not liable for indirect or consequential losses arising from your use of the website or reliance on its content, including information supplied by third parties or other users. Our total liability for any claim relating to an order is limited to the amount you paid for that order.",
    ],
  },
  {
    title: "Third-Party Links",
    paragraphs: [
      "The website may link to third-party sites such as social media pages. We do not control them and are not responsible for their content or privacy practices.",
    ],
  },
  {
    title: "Governing Law",
    paragraphs: [
      "These terms are governed by the laws of the Republic of the Philippines. Any dispute will be brought before the proper courts of the city where AutoTrade's main showroom is located.",
    ],
  },
  {
    title: "Changes to These Terms",
    paragraphs: [
      "We may update these terms from time to time. The latest version will always be on this page with its update date. Continued use of the website after changes means you accept them.",
    ],
  },
  {
    title: "Contact Us",
    paragraphs: [
      "Questions about these terms? Email hello@autotrade.com or reach us through our Contact Us page.",
    ],
  },
];

export default function TermsAndConditionsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms & Conditions"
      updated="September 29, 2026"
      intro="Please read these terms carefully before using the AutoTrade website, placing an order, or submitting a sell / trade request."
      sections={sections}
    />
  );
}
