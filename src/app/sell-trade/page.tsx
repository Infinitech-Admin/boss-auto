"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  Users,
  Gauge,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import Navbar from "../../components/layout/navbar";
import Footer from "../../components/layout/footer";
import CTA from "../../components/home/cta";

const steps = [
  {
    title: "Tell us about your car",
    copy: "Share the make, model, mileage, condition, and your target timeline. We’ll match you with the best buyer or trade-in option.",
  },
  {
    title: "Get a fair offer",
    copy: "Our valuation experts compare current market demand, vehicle condition, and dealer pricing to price your car competitively.",
  },
  {
    title: "Close with confidence",
    copy: "Choose cash, trade-in, or an upgrade path and finalize the deal with transparent paperwork and no hidden surprises.",
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Honest guidance",
    description:
      "We believe the right purchase starts with transparency, clear information, and no pressure. Every recommendation is grounded in your needs, not just the inventory in front of us.",
  },
  {
    icon: BadgeCheck,
    title: "Quality first",
    description:
      "Every car we present is carefully inspected so you can move forward with confidence, whether you're buying your first car or upgrading for the next chapter.",
  },
  {
    icon: Users,
    title: "Client-focused service",
    description:
      "From showroom visits to financing conversations, our team works with patience and precision to make the process feel simple and personal.",
  },
  {
    icon: Sparkles,
    title: "Premium experience",
    description:
      "We combine standout vehicles with thoughtful service, creating a buying experience that feels polished, relaxed, and genuinely professional.",
  },
];

const conditionFactors: Record<string, number> = {
  Excellent: 1,
  Good: 0.82,
  Fair: 0.66,
};

const vehicleTypeFactors: Record<string, number> = {
  Sedan: 1,
  SUV: 1.15,
  Hatchback: 0.88,
  Truck: 1.2,
  Luxury: 1.2,
};

// Placeholder reference prices (PHP) for a brand-new, excellent-condition sedan.
const DEFAULT_BASE_PRICE = 900000;
const brandBasePrices: Record<string, number> = {
  suzuki: 800000,
  nissan: 900000,
  hyundai: 900000,
  kia: 900000,
  mitsubishi: 950000,
  honda: 1050000,
  toyota: 1100000,
  ford: 1100000,
  mazda: 1100000,
  isuzu: 1300000,
  subaru: 1300000,
  audi: 3000000,
  bmw: 3200000,
  lexus: 3200000,
  mercedes: 3400000,
  porsche: 6500000,
};

const getBasePrice = (brand: string) => {
  const normalized = brand.trim().toLowerCase();
  if (!normalized) return DEFAULT_BASE_PRICE;
  const match = Object.keys(brandBasePrices).find((key) =>
    normalized.includes(key),
  );
  return match ? brandBasePrices[match] : DEFAULT_BASE_PRICE;
};

const labelClass =
  "mb-2.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400";

const inputClass =
  "h-13 w-full rounded-2xl border border-white/10 bg-[#071A38] px-4 text-sm text-white placeholder:text-zinc-600 outline-none transition-all duration-300 hover:border-white/20 focus:border-[#D41F2D]/70 focus:bg-[#071A38] focus:ring-4 focus:ring-[#D41F2D]/10";

const selectClass =
  "h-13 w-full appearance-none rounded-2xl border border-white/10 bg-[#071A38] px-4 text-sm text-white outline-none transition-all duration-300 hover:border-white/20 focus:border-[#D41F2D]/70 focus:bg-[#071A38] focus:ring-4 focus:ring-[#D41F2D]/10";

type FormState = {
  brand: string;
  model: string;
  year: string;
  mileage: string;
  type: string;
  condition: string;
  fullName: string;
  phone: string;
  email: string;
};

type SubmitStatus = "idle" | "submitting" | "error" | "success";

const initialForm: FormState = {
  brand: "BMW",
  model: "5 Series",
  year: "2022",
  mileage: "18500",
  type: "Sedan",
  condition: "Excellent",
  fullName: "",
  phone: "",
  email: "",
};

export default function SellTradePage() {
  const [form, setForm] = useState<FormState>(initialForm);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const estimate = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const yearValue = Number(form.year) || currentYear;
    const mileageValue = Number(form.mileage) || 0;
    const basePrice = getBasePrice(form.brand);
    const age = Math.max(currentYear - yearValue, 0);
    const ageFactor = Math.max(0.45, 1 - age * 0.06);
    const mileageFactor = Math.max(0.5, 1 - mileageValue / 220000);
    const typeFactor = vehicleTypeFactors[form.type] ?? 1;
    const conditionFactor = conditionFactors[form.condition] ?? 1;

    return Math.round(
      basePrice * typeFactor * conditionFactor * ageFactor * mileageFactor,
    );
  }, [form.brand, form.year, form.mileage, form.type, form.condition]);

  const rangeLow = Math.round(estimate * 0.9);
  const rangeHigh = Math.round(estimate * 1.12);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    if (status !== "submitting") setStatus("idle");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "submitting") return;

    if (
      !form.brand.trim() ||
      !form.model.trim() ||
      !form.year ||
      form.mileage.trim() === "" ||
      !form.fullName.trim()
    ) {
      setErrorMessage("Please complete all required fields.");
      setStatus("error");
      return;
    }

    if (!form.phone.trim() && !form.email.trim()) {
      setErrorMessage("Please provide a phone number or an email address.");
      setStatus("error");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/sell-trade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.fullName.trim(),
          phone: form.phone.trim() || null,
          email: form.email.trim() || null,
          brand: form.brand.trim(),
          model: form.model.trim(),
          year: Number(form.year),
          mileage: Number(form.mileage),
          type: form.type,
          condition: form.condition,
          estimate,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        const firstError = data?.errors
          ? (Object.values(data.errors)[0] as string[])?.[0]
          : null;
        setErrorMessage(
          firstError ||
            data?.message ||
            "Something went wrong. Please try again.",
        );
        setStatus("error");
        return;
      }

      setStatus("success");
      setForm(initialForm);
    } catch {
      setErrorMessage("Unable to reach the server. Please try again.");
      setStatus("error");
    }
  };

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071A38] text-white">
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#040E21]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,152,13,0.18),transparent_50%)]" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
            <div className="max-w-3xl">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                  Ready to Move?
                </span>
              </div>

              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                Turn your current car into your{" "}
                <span className="block text-[#FF5C68]">next upgrade</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300 sm:text-lg">
                Get a competitive offer for your vehicle, trade it in for a
                better fit, and move forward without the usual dealership
                pressure.
              </p>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="space-y-5">
            <section className="rounded-[28px] border border-white/10 bg-[#071A38] p-6">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D41F2D]/10 text-[#FF5C68]">
                  <CarFront size={18} />
                </div>
                <h2 className="text-2xl font-black tracking-tight text-white">
                  How it works
                </h2>
              </div>

              <div className="grid gap-5 md:grid-cols-3">
                {steps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-[24px] border border-white/10 bg-[#071A38] p-5"
                  >
                    <div className="mb-5 flex h-10 w-10 items-center justify-center rounded-full bg-[#D41F2D] text-sm font-black text-black">
                      {index + 1}
                    </div>
                    <h3 className="text-xl font-bold text-white">
                      {step.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7 text-zinc-300">
                      {step.copy}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>

        {/* Vehicle Details & Estimated Value */}
        <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <form
            onSubmit={handleSubmit}
            className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-start"
          >
            {/* Vehicle Details */}
            <div className="overflow-hidden rounded-[30px] border border-white/10 bg-[#071A38] shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
              {/* Header */}
              <div className="border-b border-white/10 px-5 py-5 sm:px-7 sm:py-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D41F2D]/20 bg-[#D41F2D]/10 text-[#5FA8E8]">
                    <Gauge size={21} />
                  </div>

                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                      Vehicle information
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight text-white sm:text-3xl">
                      Tell us about your car
                    </h2>

                    <p className="mt-2 max-w-xl text-sm leading-6 text-zinc-400">
                      Enter your vehicle details to receive an estimated market
                      value.
                    </p>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="p-5 sm:p-7">
                <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                  <label className="block">
                    <span className={labelClass}>
                      Brand
                      <span className="text-[#FF5C68]">*</span>
                    </span>
                    <input
                      type="text"
                      name="brand"
                      value={form.brand}
                      onChange={handleChange}
                      placeholder="e.g. BMW"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClass}>
                      Model
                      <span className="text-[#FF5C68]">*</span>
                    </span>
                    <input
                      type="text"
                      name="model"
                      value={form.model}
                      onChange={handleChange}
                      placeholder="e.g. 5 Series"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClass}>
                      Year
                      <span className="text-[#FF5C68]">*</span>
                    </span>
                    <input
                      type="number"
                      name="year"
                      min="2000"
                      max="2035"
                      value={form.year}
                      onChange={handleChange}
                      placeholder="2023"
                      required
                      className={inputClass}
                    />
                  </label>

                  <label className="block">
                    <span className={labelClass}>
                      Vehicle type
                      <span className="text-[#FF5C68]">*</span>
                    </span>
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option>Sedan</option>
                      <option>SUV</option>
                      <option>Hatchback</option>
                      <option>Truck</option>
                      <option>Luxury</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className={labelClass}>
                      Mileage
                      <span className="text-[#FF5C68]">*</span>
                    </span>
                    <div className="relative">
                      <input
                        type="number"
                        name="mileage"
                        min="0"
                        value={form.mileage}
                        onChange={handleChange}
                        placeholder="18,500"
                        required
                        className={`${inputClass} pr-20`}
                      />
                      <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-medium text-zinc-600">
                        KM
                      </span>
                    </div>
                  </label>

                  <label className="block">
                    <span className={labelClass}>
                      Condition
                      <span className="text-[#FF5C68]">*</span>
                    </span>
                    <select
                      name="condition"
                      value={form.condition}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option>Excellent</option>
                      <option>Good</option>
                      <option>Fair</option>
                    </select>
                  </label>
                </div>

                {/* Contact details */}
                <div className="mt-7 border-t border-white/10 pt-6">
                  <div className="mb-5 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#D41F2D]/20 bg-[#D41F2D]/10 text-[#5FA8E8]">
                      <UserRound size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                        Contact details
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        So our team can reach you. Phone or email is required.
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                    <label className="block sm:col-span-2">
                      <span className={labelClass}>
                        Full name
                        <span className="text-[#FF5C68]">*</span>
                      </span>
                      <input
                        type="text"
                        name="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Juan Dela Cruz"
                        autoComplete="name"
                        required
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Phone</span>
                      <input
                        type="tel"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="09XX XXX XXXX"
                        autoComplete="tel"
                        className={inputClass}
                      />
                    </label>

                    <label className="block">
                      <span className={labelClass}>Email</span>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={inputClass}
                      />
                    </label>
                  </div>
                </div>

                {/* Bottom message */}
                <div className="mt-5 border-t border-white/10 pt-5">
                  <div className="flex items-start gap-3">
                    <Sparkles
                      size={16}
                      className="mt-0.5 shrink-0 text-[#FF5C68]"
                    />

                    <p className="text-xs leading-5 text-zinc-500">
                      Your final offer may vary depending on inspection results,
                      vehicle history, documentation, and current market
                      conditions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Estimated Value */}
            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-[40px] bg-[#D41F2D]/5 blur-3xl" />

              <div className="relative overflow-hidden rounded-[30px] border border-[#D41F2D]/25 bg-[#071A38] shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#D41F2D] to-transparent" />

                <div className="p-5 sm:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#D41F2D] shadow-[0_0_10px_rgba(191,152,13,0.8)]" />
                        <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                          Instant estimate
                        </p>
                      </div>

                      <h2 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
                        Your Car Value
                      </h2>

                      <p className="mt-2 text-sm leading-6 text-zinc-500">
                        A preliminary estimate based on your vehicle
                        information.
                      </p>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#D41F2D]/20 bg-[#D41F2D]/10 text-[#5FA8E8]">
                      <Gauge size={20} />
                    </div>
                  </div>

                  {/* Main Value */}
                  <div className="relative mt-5 overflow-hidden rounded-[24px] border border-[#D41F2D]/20 bg-gradient-to-br from-[#071A38] via-[#071A38] to-[#071A38] p-6 sm:p-7">
                    <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-white/[0.06] blur-3xl" />

                    <div className="relative">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                          Estimated market value
                        </p>

                        <span className="rounded-full border border-[#D41F2D]/20 bg-[#D41F2D]/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#5FA8E8]">
                          Live
                        </span>
                      </div>

                      <p className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                        ₱{estimate.toLocaleString()}
                      </p>

                      <p className="mt-2 text-xs text-zinc-500">
                        Preliminary estimate • Subject to inspection
                      </p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-white/10 bg-[#071A38] p-4 transition-colors hover:border-white/15">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Market range
                      </p>

                      <p className="mt-2 text-base font-bold leading-6 text-white">
                        ₱{rangeLow.toLocaleString()}
                        <span className="mx-1 text-zinc-600">—</span>₱
                        {rangeHigh.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-white/10 bg-[#071A38] p-4 transition-colors hover:border-white/15">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                        Vehicle condition
                      </p>

                      <p className="mt-2 text-base font-bold text-white">
                        {form.condition}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-6 border-t border-white/10 pt-5">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <button
                        type="submit"
                        disabled={status === "submitting"}
                        className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl bg-[#D41F2D] px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#D41F2D]/10 transition-all duration-300 hover:bg-[#E8404B] hover:shadow-[#D41F2D]/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <BadgeCheck
                          size={18}
                          className="transition-transform duration-300 group-hover:scale-110"
                        />

                        <span>
                          {status === "submitting"
                            ? "Submitting..."
                            : "Submit for Review"}
                        </span>

                        <ArrowRight
                          size={17}
                          className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </button>

                      <Link
                        href="/showroom"
                        className="group inline-flex flex-1 items-center justify-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-[#D41F2D]/40 hover:bg-[#D41F2D]/10 hover:text-[#5FA8E8]"
                      >
                        <CarFront
                          size={18}
                          className="text-[#FF5C68] transition-transform duration-300 group-hover:scale-110"
                        />

                        <span>View Showroom</span>

                        <ArrowRight
                          size={16}
                          className="text-zinc-500 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#FF5C68]"
                        />
                      </Link>
                    </div>

                    {status === "error" && (
                      <p
                        role="alert"
                        className="mt-3 text-center text-[11px] leading-5 text-[#FF5C68]"
                      >
                        {errorMessage}
                      </p>
                    )}

                    {status === "success" && (
                      <p
                        role="status"
                        className="mt-3 text-center text-[11px] leading-5 text-[#5FA8E8]"
                      >
                        Thanks! Your vehicle details were submitted. Our team
                        will contact you soon.
                      </p>
                    )}

                    {(status === "idle" || status === "submitting") && (
                      <p className="mt-3 text-center text-[11px] leading-5 text-zinc-600">
                        Submit your vehicle details for our team to review your
                        estimate.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </form>

          <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                  Why drivers choose us
                </span>
                <span className="h-px w-10 bg-[#D41F2D]" />
              </div>

              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl">
                A car buying experience built around you.
              </h2>
            </div>

            <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {values.map((value) => {
                const Icon = value.icon;

                return (
                  <div
                    key={value.title}
                    className="group rounded-[26px] border border-white/10 bg-[#071A38] p-6 transition-all duration-300 hover:border-[#D41F2D]/50 hover:bg-[#071A38] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#FF5C68] transition-all duration-300 group-hover:border-[#D41F2D]/60 group-hover:bg-[#D41F2D]/20">
                        <Icon size={22} />
                      </div>

                      <h3 className="text-md font-bold leading-tight text-white sm:text-xl">
                        {value.title}
                      </h3>
                    </div>

                    <p className="text-md mt-5 leading-7 text-zinc-400">
                      {value.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
