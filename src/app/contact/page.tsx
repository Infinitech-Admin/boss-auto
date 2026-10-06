// Path: app/contact/page.tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Send,
} from "lucide-react";

import Navbar from "../../components/layout/navbar";
import Footer from "../../components/layout/footer";

// ---------------------------------------------------------------------------
// Business details
// Address is from public dealer listings (Zigwheels). Please double-check it.
// TODO: fill in PHONE, EMAIL and HOURS. Anything left empty is hidden
// automatically instead of showing placeholder text.
// ---------------------------------------------------------------------------
const BUSINESS_NAME = "Auto Prime Car Trading";
const FACEBOOK_URL = "https://www.facebook.com/autoprimecartrading/";
const ADDRESS_LINE_1 =
  "Blk 21 Lot 4 Leo Alejandrino St., BF Resort Village, Brgy. Talon Dos";
const ADDRESS_LINE_2 = "Las Piñas City, Philippines";
const PHONE_DISPLAY = ""; // e.g. "0917 123 4567"
const PHONE_TEL = ""; // e.g. "+639171234567"
const EMAIL = ""; // e.g. "hello@yourdomain.com"
const HOURS: { day: string; time: string }[] = [
  // { day: "Monday - Saturday", time: "9:00 AM - 6:00 PM" },
];

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${BUSINESS_NAME}, ${ADDRESS_LINE_1}, ${ADDRESS_LINE_2}`,
)}`;

const contactOptions = [
  {
    icon: MessageCircle,
    title: "Message us on Facebook",
    value: BUSINESS_NAME,
    href: FACEBOOK_URL,
  },
  {
    icon: MapPin,
    title: "Visit us",
    value: `${ADDRESS_LINE_1}, ${ADDRESS_LINE_2}`,
    href: MAPS_URL,
  },
  ...(PHONE_DISPLAY && PHONE_TEL
    ? [
        {
          icon: Phone,
          title: "Call us",
          value: PHONE_DISPLAY,
          href: `tel:${PHONE_TEL}`,
        },
      ]
    : []),
  ...(EMAIL
    ? [
        {
          icon: Mail,
          title: "Email",
          value: EMAIL,
          href: `mailto:${EMAIL}`,
        },
      ]
    : []),
];

const privacyCopy = {
  title: "Privacy Policy",
  body: [
    `At ${BUSINESS_NAME}, we value your trust and are committed to protecting your personal information. We collect details you provide when contacting us, requesting a valuation, or browsing our inventory.`,
    "This information may be used to respond to enquiries, process vehicle transactions, improve our services, and communicate relevant updates. We do not sell your personal data to third parties for marketing purposes.",
    "We may use secure third-party tools to help operate our website, manage customer interactions, and improve the user experience. These partners are expected to handle your information with appropriate safeguards.",
    "You have the right to request access to, correction of, or deletion of your personal data, subject to legal and operational requirements. If you have any concerns, please contact our team directly.",
  ],
};

type FormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  lookingFor: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData | "privacy", string>>;

const emptyForm: FormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  lookingFor: "",
  message: "",
};

// Laravel snake_case field -> form field
const serverFieldMap: Record<string, keyof FormData> = {
  first_name: "firstName",
  last_name: "lastName",
  email: "email",
  phone: "phone",
  looking_for: "lookingFor",
  message: "message",
};

// Mirrors the Laravel rules. The server is the source of truth; this is just for fast feedback.
const NAME_PATTERN = new RegExp("^[\\p{L}\\p{M}\\s.'’-]+$", "u");
// PH mobile number: exactly 11 digits, starts with 09
const PHONE_PATTERN = /^09\d{9}$/;

const inputClass =
  "w-full rounded-2xl border border-white/10 bg-[#0f0d0a] px-4 py-3 text-white placeholder:text-zinc-500 focus:border-[#D41F2D] focus:outline-none";

export default function Contact() {
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [privacyError, setPrivacyError] = useState("");
  const [activeModal, setActiveModal] = useState<"privacy" | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleFieldChange = (field: keyof FormData, value: string) => {
    // Phone: digits only, max 11
    const nextValue =
      field === "phone" ? value.replace(/\D/g, "").slice(0, 11) : value;

    setFormData((current) => ({ ...current, [field]: nextValue }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validateForm = () => {
    const nextErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      nextErrors.firstName = "First name is required.";
    } else if (!NAME_PATTERN.test(formData.firstName.trim())) {
      nextErrors.firstName = "First name contains invalid characters.";
    }

    if (!formData.lastName.trim()) {
      nextErrors.lastName = "Last name is required.";
    } else if (!NAME_PATTERN.test(formData.lastName.trim())) {
      nextErrors.lastName = "Last name contains invalid characters.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Phone number is required.";
    } else if (!PHONE_PATTERN.test(formData.phone.trim())) {
      nextErrors.phone = "Enter an 11-digit mobile number starting with 09.";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Please include a brief message.";
    } else if (formData.message.trim().length < 10) {
      nextErrors.message =
        "Please include a brief message (at least 10 characters).";
    }

    if (!acceptedPrivacy) {
      nextErrors.privacy =
        "Please agree to the privacy policy before submitting your enquiry.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);

    if (!validateForm()) {
      return;
    }

    setPrivacyError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          looking_for: formData.lookingFor.trim() || null,
          message: formData.message.trim(),
          privacy_accepted: acceptedPrivacy,
          website: honeypot,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setFormData(emptyForm);
        setHoneypot("");
        setAcceptedPrivacy(false);
        setErrors({});
        setStatus({
          type: "success",
          message: data.message ?? "Thank you! Your enquiry has been received.",
        });
        return;
      }

      if (res.status === 422 && data.errors) {
        const serverErrors: FormErrors = {};
        Object.entries(data.errors as Record<string, string[]>).forEach(
          ([key, messages]) => {
            if (key === "privacy_accepted") {
              serverErrors.privacy = messages[0];
              return;
            }

            const field = serverFieldMap[key];
            if (field) {
              serverErrors[field] = messages[0];
            }
          },
        );
        setErrors(serverErrors);
        setStatus({
          type: "error",
          message: "Please fix the highlighted fields and try again.",
        });
        return;
      }

      setStatus({
        type: "error",
        message:
          res.status === 429
            ? "Too many attempts. Please wait a minute and try again."
            : (data.message ?? "Something went wrong. Please try again."),
      });
    } catch {
      setStatus({
        type: "error",
        message: "Unable to send your enquiry. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#0B0714] text-white">
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#080b0f]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,29,46,0.18),transparent_50%)]" />

          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                  Contact us
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Let’s find your
                <span className="block text-[#D41F2D]">next ideal drive.</span>
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                Tell us what you’re looking for, and our team will guide you
                toward a vehicle that fits your life, your budget, and your
                driving style. Buying, selling, or trading in, we’re happy to
                help.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="space-y-5">
              {contactOptions.map(({ icon: Icon, title, value, href }) => (
                <a
                  key={title}
                  href={href}
                  target={href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    href.startsWith("http") ? "noopener noreferrer" : undefined
                  }
                  className="group flex items-start gap-4 rounded-[24px] border border-white/10 bg-[#120f0d] p-5 transition-all duration-300 hover:border-[#D41F2D]/50 hover:bg-[#15120f]"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#D41F2D]">
                    <Icon size={20} />
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                      {title}
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white transition-colors group-hover:text-[#E8404B]">
                      {value}
                    </p>
                  </div>
                </a>
              ))}

              <div className="rounded-[24px] border border-white/10 bg-[#120f0d] p-5">
                <div className="mb-4 flex items-center gap-3 text-[#D41F2D]">
                  <Clock3 size={18} />
                  <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                    Opening hours
                  </p>
                </div>

                {HOURS.length > 0 ? (
                  <div className="space-y-3">
                    {HOURS.map((item) => (
                      <div
                        key={item.day}
                        className="flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-sm text-zinc-300 first:border-t-0 first:pt-0"
                      >
                        <span>{item.day}</span>
                        <span className="font-medium text-white">
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm leading-6 text-zinc-300">
                    Message us on Facebook to confirm our hours before you
                    visit.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[30px] border border-[#D41F2D]/20 bg-[#120f0d] p-5 shadow-[0_25px_80px_rgba(0,0,0,0.35)] sm:p-7">
              <div className="mb-6 flex items-center gap-3 text-[#D41F2D]">
                <Send size={18} />
                <span className="text-xs font-semibold uppercase tracking-[0.28em]">
                  Enquire now
                </span>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-1 text-sm text-zinc-300">
                      First name
                      <span className="text-[#f7b5a8]" aria-label="required">
                        *
                      </span>
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={(event) =>
                        handleFieldChange("firstName", event.target.value)
                      }
                      maxLength={100}
                      autoComplete="given-name"
                      placeholder="John"
                      aria-invalid={Boolean(errors.firstName)}
                      className={inputClass}
                    />
                    {errors.firstName ? (
                      <span className="mt-2 block text-sm text-[#f7b5a8]">
                        {errors.firstName}
                      </span>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-1 text-sm text-zinc-300">
                      Last name
                      <span className="text-[#f7b5a8]" aria-label="required">
                        *
                      </span>
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={(event) =>
                        handleFieldChange("lastName", event.target.value)
                      }
                      maxLength={100}
                      autoComplete="family-name"
                      placeholder="Smith"
                      aria-invalid={Boolean(errors.lastName)}
                      className={inputClass}
                    />
                    {errors.lastName ? (
                      <span className="mt-2 block text-sm text-[#f7b5a8]">
                        {errors.lastName}
                      </span>
                    ) : null}
                  </label>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 flex items-center gap-1 text-sm text-zinc-300">
                      Email
                      <span className="text-[#f7b5a8]" aria-label="required">
                        *
                      </span>
                    </span>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(event) =>
                        handleFieldChange("email", event.target.value)
                      }
                      maxLength={255}
                      autoComplete="email"
                      placeholder="john@email.com"
                      aria-invalid={Boolean(errors.email)}
                      className={inputClass}
                    />
                    {errors.email ? (
                      <span className="mt-2 block text-sm text-[#f7b5a8]">
                        {errors.email}
                      </span>
                    ) : null}
                  </label>

                  <label className="block">
                    <span className="mb-2 flex items-center gap-1 text-sm text-zinc-300">
                      Phone
                      <span className="text-[#f7b5a8]" aria-label="required">
                        *
                      </span>
                    </span>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(event) =>
                        handleFieldChange("phone", event.target.value)
                      }
                      maxLength={11}
                      minLength={11}
                      pattern="09[0-9]{9}"
                      autoComplete="tel"
                      inputMode="numeric"
                      placeholder="09123456789"
                      title="11-digit mobile number starting with 09"
                      aria-invalid={Boolean(errors.phone)}
                      className={inputClass}
                    />
                    {errors.phone ? (
                      <span className="mt-2 block text-sm text-[#f7b5a8]">
                        {errors.phone}
                      </span>
                    ) : null}
                  </label>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm text-zinc-300">
                    Looking for
                  </span>
                  <input
                    type="text"
                    value={formData.lookingFor}
                    onChange={(event) =>
                      handleFieldChange("lookingFor", event.target.value)
                    }
                    maxLength={255}
                    placeholder="SUV, sedan, MPV, pickup..."
                    className={inputClass}
                  />
                  {errors.lookingFor ? (
                    <span className="mt-2 block text-sm text-[#f7b5a8]">
                      {errors.lookingFor}
                    </span>
                  ) : null}
                </label>

                <label className="block">
                  <span className="mb-2 flex items-center gap-1 text-sm text-zinc-300">
                    Message
                    <span className="text-[#f7b5a8]" aria-label="required">
                      *
                    </span>
                  </span>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(event) =>
                      handleFieldChange("message", event.target.value)
                    }
                    maxLength={5000}
                    placeholder="Tell us about your ideal vehicle, budget, and timeline..."
                    aria-invalid={Boolean(errors.message)}
                    className={`${inputClass} resize-none`}
                  />
                  {errors.message ? (
                    <span className="mt-2 block text-sm text-[#f7b5a8]">
                      {errors.message}
                    </span>
                  ) : null}
                </label>

                {/* Honeypot: hidden from people, bots tend to fill it in. */}
                <div
                  aria-hidden="true"
                  className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
                >
                  <label>
                    Website
                    <input
                      type="text"
                      name="website"
                      tabIndex={-1}
                      autoComplete="off"
                      value={honeypot}
                      onChange={(event) => setHoneypot(event.target.value)}
                    />
                  </label>
                </div>

                <label className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    required
                    checked={acceptedPrivacy}
                    onChange={(event) => {
                      setAcceptedPrivacy(event.target.checked);
                      if (event.target.checked) {
                        setPrivacyError("");
                        setErrors((current) => ({ ...current, privacy: "" }));
                      }
                    }}
                    className="h-4 w-4 rounded border-white/20 bg-[#0f0d0a] text-[#D41F2D] focus:ring-[#D41F2D]"
                  />
                  <span>
                    I agree to the{" "}
                    <button
                      type="button"
                      onClick={() => setActiveModal("privacy")}
                      className="font-medium text-[#D41F2D] transition-colors hover:text-[#E8404B]"
                    >
                      Privacy Policy
                    </button>{" "}
                    and consent to being contacted about my vehicle enquiry.
                  </span>
                </label>

                {errors.privacy || privacyError ? (
                  <p className="text-sm text-[#f7b5a8]">
                    {errors.privacy || privacyError}
                  </p>
                ) : null}

                {status ? (
                  <p
                    role="status"
                    className={`rounded-2xl border px-4 py-3 text-sm ${
                      status.type === "success"
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-[#f7b5a8]/30 bg-[#f7b5a8]/10 text-[#f7b5a8]"
                    }`}
                  >
                    {status.message}
                  </p>
                ) : null}

                <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-zinc-400">
                    We’ll get back to you as soon as we can.
                  </p>

                  <button
                    type="submit"
                    disabled={!acceptedPrivacy || submitting}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B] disabled:cursor-not-allowed disabled:bg-[#D41F2D]/25 disabled:text-zinc-400"
                  >
                    {submitting ? "Sending..." : "Send inquiry"}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-t border-[#D41F2D]/30 bg-[#061B3D] py-14 text-center">
          {/* Background glow */}
          <div className="absolute left-1/2 top-1/2 h-[450px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#0B5BA8]/25 blur-[130px]" />

          <div className="relative mx-auto max-w-4xl px-5 sm:px-6">
            <div className="mb-5 flex items-center justify-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                Visit our showroom
              </span>
              <span className="h-px w-10 bg-[#D41F2D]" />
            </div>

            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
              Book your{" "}
              <span className="block text-[#D41F2D]">Next Journey</span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-zinc-400 sm:text-base">
              Explore our inventory, compare models side by side, and speak with
              an expert about the right fit for your next move.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/showroom"
                className="inline-flex items-center justify-center rounded-full bg-[#D41F2D] px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B] hover:shadow-[0_0_30px_rgba(225,29,46,0.25)]"
              >
                Visit Showroom
              </Link>

              <Link
                href="/sell-trade"
                className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-[#D41F2D]/50 hover:bg-white/10"
              >
                Sell / Trade Car
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {activeModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#061B3D]/70 p-4 backdrop-blur-sm">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-[28px] border border-[#D41F2D]/20 bg-[#120f0d] shadow-[0_30px_90px_rgba(0,0,0,0.5)]">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
              <h3 className="text-xl font-bold text-white">
                {privacyCopy.title}
              </h3>
              <button
                type="button"
                aria-label="Close privacy policy"
                onClick={() => setActiveModal(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-all hover:border-[#D41F2D] hover:text-[#E8404B]"
              >
                ×
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-5 py-5 text-sm leading-7 text-zinc-300 sm:px-6">
              {privacyCopy.body.map((paragraph) => (
                <p key={paragraph} className="mb-4">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
