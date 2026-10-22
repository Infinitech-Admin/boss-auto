"use client";

import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Upload,
  X,
  Car,
  CheckCircle2,
  ChevronDown,
  FileCheck2,
  Gauge,
  Handshake,
  KeyRound,
  MapPin,
  RotateCcw,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { submitCareerApplication, type ApiError } from "@/lib/api";

const DEFAULT_SUBMIT_ERROR =
  "We couldn’t submit your application right now. Please try again.";

type Position = "reseller" | "agent";

const POSITIONS: {
  value: Position;
  title: string;
  tag: string;
  icon: typeof Car;
}[] = [
  { value: "reseller", title: "Reseller", tag: "Buy & sell", icon: Car },
  { value: "agent", title: "Agent", tag: "Refer & earn", icon: Handshake },
];

type FormState = {
  name: string;
  email: string;
  phone: string;
  role: Position;
  location: string;
  experience: string;
  message: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  role: "reseller",
  location: "",
  experience: "",
  message: "",
};

const STEPS = [
  {
    icon: FileCheck2,
    title: "Submit your application",
    text: "Fill out the form with your details, the area you cover, and your background. It takes only a few minutes.",
  },
  {
    icon: ShieldCheck,
    title: "We review your profile",
    text: "Our team checks every application personally. We look at your location, experience, and fit with our network.",
  },
  {
    icon: BadgeCheck,
    title: "Get approved",
    text: "Once approved, we send you an email so you can set your password and activate your account.",
  },
  {
    icon: KeyRound,
    title: "Start trading",
    text: "Log in, browse the inventory, and start working with Boss Auto Exchange.",
  },
];

const ROLE_DETAILS: {
  value: Position;
  title: string;
  plate: string;
  summary: string;
  does: string[];
  ideal: string[];
}[] = [
  {
    value: "reseller",
    title: "Reseller",
    plate: "RESELLER",
    summary:
      "You buy vehicles through Boss Auto Exchange and sell them to your own customers and network.",
    does: [
      "Browse available units and buy for resale",
      "Handle your own buyers, pricing, and negotiation",
      "Coordinate pickup and documentation with our team",
    ],
    ideal: [
      "Run a small dealership, car lot, or online selling page",
      "Already have a steady stream of buyers",
      "Comfortable handling transactions end to end",
    ],
  },
  {
    value: "agent",
    title: "Agent",
    plate: "AGENT",
    summary:
      "You connect buyers to Boss Auto Exchange and get rewarded when the deal closes. No inventory to carry.",
    does: [
      "Refer interested buyers to our listings",
      "Help buyers schedule test drives and viewings",
      "Follow up until the deal is completed",
    ],
    ideal: [
      "Well connected in your community or online groups",
      "Good at communicating and building trust",
      "Prefer flexible, commission-based work",
    ],
  },
];

const BENEFITS = [
  {
    icon: Car,
    title: "Quality inventory",
    text: "Work with a growing selection of pre-owned vehicles that are listed and verified by our team.",
  },
  {
    icon: Wallet,
    title: "Earn on your terms",
    text: "Your income grows with the deals you bring in. You decide how much you take on.",
  },
  {
    icon: Gauge,
    title: "Your own dashboard",
    text: "Get a dedicated account once approved, so you can follow listings and your activity in one place.",
  },
  {
    icon: Users,
    title: "A team behind you",
    text: "Questions on a unit, a buyer, or paperwork? Our staff is there to help you close.",
  },
];

const REQUIREMENTS = [
  "At least 18 years old",
  "A working mobile number and email address",
  "Based in the Philippines, with a clear area you cover",
  "Willing to follow our selling and transaction guidelines",
];

const FAQS = [
  {
    q: "Is there a fee to apply?",
    a: "No. Applying is free. We only ask for your details so our team can review your application.",
  },
  {
    q: "How long does approval take?",
    a: "We review applications as they come in. You’ll receive an email once a decision has been made, so please use an email address you check regularly.",
  },
  {
    q: "Can I log in right after applying?",
    a: "Not yet. Your account is only activated after our team approves your application. After that, you’ll set your password and can log in.",
  },
  {
    q: "Do I need a company or a business permit?",
    a: "Not to apply. Tell us about your experience in the form, and our team will reach out if anything else is needed.",
  },
  {
    q: "What’s the difference between a reseller and an agent?",
    a: "Resellers buy units and sell them to their own customers. Agents refer buyers to us and don’t handle inventory. Pick the one that fits how you work.",
  },
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#040E21] px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-[#D41F2D]/60 focus:outline-none focus:ring-1 focus:ring-[#D41F2D]/40";

const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400";

function FieldError({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return <p className="mt-1 text-xs text-[#FF5C68]">{messages[0]}</p>;
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

function FilePicker({
  id,
  label,
  hint,
  file,
  onChange,
  errors,
  showPreview = false,
}: {
  id: string;
  label: string;
  hint: string;
  file: File | null;
  onChange: (file: File | null) => void;
  errors?: string[];
  showPreview?: boolean;
}) {
  const [localError, setLocalError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file
    if (!picked) return;

    if (!ALLOWED_IMAGE_TYPES.includes(picked.type)) {
      setLocalError("Please choose a JPG, PNG, or WebP image.");
      return;
    }
    if (picked.size > MAX_FILE_BYTES) {
      setLocalError("That file is too large. The limit is 4 MB.");
      return;
    }
    setLocalError(null);
    onChange(picked);
  }

  const error = localError ?? errors?.[0];

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#040E21] p-3">
          {preview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              className={`h-14 shrink-0 rounded-lg object-cover ${
                showPreview ? "w-14 rounded-full" : "w-20"
              }`}
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-white">{file.name}</p>
            <p className="text-xs text-zinc-500">
              {(file.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={`Remove ${label}`}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:text-[#FF5C68]"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <label
          htmlFor={id}
          className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-white/15 bg-[#040E21] px-4 py-3.5 transition-colors hover:border-[#D41F2D]/50"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
            {showPreview ? <Camera size={18} /> : <Upload size={18} />}
          </span>
          <span className="text-sm text-zinc-400">{hint}</span>
        </label>
      )}

      <input
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleChange}
        className="sr-only"
      />
      {error && <p className="mt-1 text-xs text-[#FF5C68]">{error}</p>}
    </div>
  );
}

export default function CareersPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    setFieldErrors({});

    try {
      await submitCareerApplication({
        ...form,
        photo,
        id_document: idDocument,
      });
      setIsSubmitted(true);
      setForm(INITIAL_FORM);
      setPhoto(null);
      setIdDocument(null);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.status === 422 && apiErr.errors) {
        setFieldErrors(apiErr.errors);
      }
      setSubmitError(apiErr.message || DEFAULT_SUBMIT_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#071A38] text-white">
        {/* ───────────── HERO + FORM ───────────── */}
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#040E21]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(212,31,45,0.2),transparent_55%)]" />
          {/* road stripes */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1.5 bg-[repeating-linear-gradient(90deg,#D41F2D_0_36px,transparent_36px_72px)] opacity-60"
          />

          <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:px-8 lg:py-20">
            {/* LEFT: pitch */}
            <div className="flex flex-col">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                  Careers
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Take the driver’s seat
                <span className="block text-[#FF5C68]">in car trading.</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                Boss Auto Exchange is growing its network of resellers and
                agents across the country. Join us, bring your buyers or your
                customers, and trade with a team you can rely on.
              </p>

              {/* license plate badges */}
              <div className="mt-7 flex flex-wrap gap-3">
                {["RESELLER", "AGENT"].map((plate) => (
                  <span
                    key={plate}
                    className="inline-flex items-center gap-2 rounded-md border-2 border-zinc-300 bg-white px-3 py-1.5 font-mono text-sm font-black tracking-[0.2em] text-[#071A38] shadow-[0_6px_20px_rgba(0,0,0,0.35)]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#D41F2D]" />
                    {plate}
                  </span>
                ))}
                <span className="inline-flex items-center gap-2 rounded-md border border-white/15 px-3 py-1.5 text-sm text-zinc-300">
                  <MapPin size={14} className="text-[#FF5C68]" />
                  Open to applicants nationwide
                </span>
              </div>

              {/* Benefits */}
              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {BENEFITS.map(({ icon: Icon, title, text }) => (
                  <div
                    key={title}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition-colors hover:border-[#D41F2D]/40"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D41F2D]/15 text-[#FF5C68]">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-white">
                      {title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                      {text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT: application form */}
            <div
              id="apply"
              className="scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
            >
              {isSubmitted ? (
                <div className="rounded-[28px] border border-[#D41F2D]/30 bg-[#071A38] px-6 py-14 text-center shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
                    <CheckCircle2 size={30} className="text-[#FF5C68]" />
                  </div>
                  <p className="mt-6 text-2xl font-bold text-white">
                    Application submitted
                  </p>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-zinc-300">
                    Thank you for applying. Our team will review your
                    application and email you once it’s been decided. You can
                    log in after approval.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white transition-all hover:border-[#D41F2D]/50"
                  >
                    <RotateCcw size={16} />
                    Submit another application
                  </button>
                </div>
              ) : (
                <form
                  onSubmit={handleSubmit}
                  className="rounded-[28px] border border-white/10 bg-[#071A38] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        Apply to join
                      </h2>
                      <p className="mt-1.5 text-sm text-zinc-400">
                        Takes about 2 minutes.
                      </p>
                    </div>
                    <span className="hidden rounded-md border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF5C68] sm:block">
                      Free
                    </span>
                  </div>

                  <div className="mt-6 grid gap-5">
                    {/* role selector */}
                    <div>
                      <span className={labelClass}>I want to join as</span>
                      <div className="grid grid-cols-2 gap-3">
                        {POSITIONS.map(({ value, title, tag, icon: Icon }) => {
                          const active = form.role === value;
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => update("role", value)}
                              aria-pressed={active}
                              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all ${
                                active
                                  ? "border-[#D41F2D] bg-[#D41F2D]/15 shadow-[0_0_24px_rgba(212,31,45,0.25)]"
                                  : "border-white/10 bg-[#040E21] hover:border-white/25"
                              }`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                                  active
                                    ? "bg-[#D41F2D] text-white"
                                    : "bg-white/5 text-zinc-400"
                                }`}
                              >
                                <Icon size={18} />
                              </span>
                              <span>
                                <span className="block text-sm font-semibold text-white">
                                  {title}
                                </span>
                                <span className="block text-xs text-zinc-400">
                                  {tag}
                                </span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                      <FieldError messages={fieldErrors.role} />
                    </div>

                    <div>
                      <label htmlFor="name" className={labelClass}>
                        Full name
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        className={inputClass}
                        placeholder="Juan Dela Cruz"
                      />
                      <FieldError messages={fieldErrors.name} />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label htmlFor="email" className={labelClass}>
                          Email
                        </label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => update("email", e.target.value)}
                          className={inputClass}
                          placeholder="you@example.com"
                        />
                        <FieldError messages={fieldErrors.email} />
                      </div>
                      <div>
                        <label htmlFor="phone" className={labelClass}>
                          Phone
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          value={form.phone}
                          onChange={(e) => update("phone", e.target.value)}
                          className={inputClass}
                          placeholder="09XX XXX XXXX"
                        />
                        <FieldError messages={fieldErrors.phone} />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="location" className={labelClass}>
                        Location
                      </label>
                      <input
                        id="location"
                        type="text"
                        required
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        className={inputClass}
                        placeholder="City / province or area you cover"
                      />
                      <FieldError messages={fieldErrors.location} />
                    </div>

                    <div>
                      <label htmlFor="experience" className={labelClass}>
                        Experience
                      </label>
                      <textarea
                        id="experience"
                        rows={3}
                        required
                        value={form.experience}
                        onChange={(e) => update("experience", e.target.value)}
                        className={inputClass}
                        placeholder="Your background in sales, cars, or trading (e.g. 3 years selling used cars)"
                      />
                      <FieldError messages={fieldErrors.experience} />
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <FilePicker
                        id="photo"
                        label="Your photo (optional)"
                        hint="Upload a clear photo of yourself"
                        file={photo}
                        onChange={setPhoto}
                        errors={fieldErrors.photo}
                        showPreview
                      />
                      <FilePicker
                        id="id_document"
                        label="Valid ID (optional)"
                        hint="Government-issued ID, helps us approve faster"
                        file={idDocument}
                        onChange={setIdDocument}
                        errors={fieldErrors.id_document}
                      />
                    </div>
                    <p className="-mt-2 flex items-start gap-2 text-xs leading-5 text-zinc-500">
                      <ShieldCheck
                        size={14}
                        className="mt-0.5 shrink-0 text-[#FF5C68]"
                      />
                      Your photo and ID are used only to verify your application
                      and are visible to our admins only. JPG, PNG or WebP, up
                      to 4 MB each.
                    </p>

                    <div>
                      <label htmlFor="message" className={labelClass}>
                        Anything else? (optional)
                      </label>
                      <textarea
                        id="message"
                        rows={3}
                        value={form.message}
                        onChange={(e) => update("message", e.target.value)}
                        className={inputClass}
                        placeholder="Tell us why you want to join."
                      />
                      <FieldError messages={fieldErrors.message} />
                    </div>

                    {submitError && (
                      <p className="rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-zinc-200">
                        {submitError}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="group inline-flex items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(212,31,45,0.35)] transition-all hover:bg-[#E8404B] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isSubmitting ? "Submitting..." : "Submit application"}
                      {!isSubmitting && (
                        <ArrowRight
                          size={16}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      )}
                    </button>

                    <p className="text-center text-xs leading-5 text-zinc-500">
                      Your account will be activated only after our team
                      approves your application.
                    </p>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ───────────── HOW IT WORKS ───────────── */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                How it works
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
              From application to first deal
            </h2>
          </div>

          <ol className="relative mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {/* dashed road line (desktop) */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-7 hidden border-t-2 border-dashed border-[#D41F2D]/30 lg:block"
            />
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative">
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D41F2D]/40 bg-[#071A38] text-[#FF5C68] shadow-[0_0_30px_rgba(212,31,45,0.2)]">
                  <Icon size={24} />
                  <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-[#D41F2D] text-xs font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-white">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ───────────── ROLES ───────────── */}
        <section className="border-y border-white/10 bg-[#040E21]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="max-w-2xl">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                  Choose your lane
                </span>
              </div>
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Reseller or agent?
              </h2>
              <p className="mt-3 text-zinc-400">
                Two ways to work with us. Pick the one that matches how you
                already do business.
              </p>
            </div>

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              {ROLE_DETAILS.map((role) => (
                <article
                  key={role.value}
                  className="flex flex-col rounded-[26px] border border-white/10 bg-[#071A38] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#D41F2D]/50 hover:shadow-[0_25px_60px_rgba(212,31,45,0.15)] sm:p-8"
                >
                  <span className="inline-flex w-fit items-center gap-2 rounded-md border-2 border-zinc-300 bg-white px-3 py-1 font-mono text-xs font-black tracking-[0.2em] text-[#071A38]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#D41F2D]" />
                    {role.plate}
                  </span>
                  <h3 className="mt-5 text-2xl font-bold text-white">
                    {role.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">
                    {role.summary}
                  </p>

                  <div className="mt-6 grid gap-6 sm:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        What you’ll do
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {role.does.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm leading-6 text-zinc-300"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-1 shrink-0 text-[#FF5C68]"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                        Great fit if you
                      </h4>
                      <ul className="mt-3 space-y-2.5">
                        {role.ideal.map((item) => (
                          <li
                            key={item}
                            className="flex gap-2 text-sm leading-6 text-zinc-300"
                          >
                            <CheckCircle2
                              size={16}
                              className="mt-1 shrink-0 text-[#FF5C68]"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <a
                    href="#apply"
                    onClick={() => update("role", role.value)}
                    className="group mt-8 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#FF5C68]"
                  >
                    Apply as {role.title.toLowerCase()}
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── REQUIREMENTS + FAQ ───────────── */}
        <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16 lg:px-8 lg:py-20">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                Requirements
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">
              What we look for
            </h2>
            <ul className="mt-6 space-y-3">
              {REQUIREMENTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-zinc-300"
                >
                  <BadgeCheck
                    size={18}
                    className="mt-0.5 shrink-0 text-[#FF5C68]"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                FAQ
              </span>
            </div>
            <h2 className="text-3xl font-black tracking-tight">Good to know</h2>
            <div className="mt-6 divide-y divide-white/10 overflow-hidden rounded-2xl border border-white/10">
              {FAQS.map((faq) => (
                <details
                  key={faq.q}
                  className="group bg-[#071A38] open:bg-[#0A2147]"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                    {faq.q}
                    <ChevronDown
                      size={18}
                      className="shrink-0 text-[#FF5C68] transition-transform duration-300 group-open:rotate-180"
                    />
                  </summary>
                  <p className="px-5 pb-5 text-sm leading-6 text-zinc-400">
                    {faq.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────── BOTTOM CTA ───────────── */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[28px] border border-[#D41F2D]/30 bg-[#040E21] px-6 py-12 text-center sm:px-12">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(212,31,45,0.2),transparent_65%)]" />
            <div className="relative">
              <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                Ready to hit the road?
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-zinc-300">
                Send in your application today and let’s grow together.
              </p>
              <a
                href="#apply"
                className="group mt-7 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(212,31,45,0.35)] transition-all hover:bg-[#E8404B]"
              >
                Apply now
                <ArrowRight
                  size={16}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
