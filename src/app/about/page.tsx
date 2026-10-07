// Path: app/about/page.tsx
"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  BadgeCheck,
  CalendarCheck,
  CarFront,
  Images,
  MapPin,
  Phone,
  Repeat,
  ShieldCheck,
  Users,
} from "lucide-react";

import Navbar from "../../components/layout/navbar";
import Footer from "../../components/layout/footer";
import CTA from "../../components/home/cta";

// Source: Boss Auto Exchange Facebook page.
const BUSINESS = {
  name: "Boss Auto Exchange",
  address:
    "Block 132 Lot 7 C. Arellano St. cor J. Diokno, Katarungan Village, Poblacion, Muntinlupa City, Philippines, 1776",
  phoneDisplay: "0906 021 8568",
  phoneHref: "tel:+639060218568",
  facebook: "https://www.facebook.com/bossautoexchange",
  instagram: "https://www.instagram.com/boss.autoexchange",
  tiktok: "https://www.tiktok.com/@boss.autoexchange",
};

const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${BUSINESS.name}, ${BUSINESS.address}`,
)}`;

const facts = [
  { icon: MapPin, text: "Poblacion, Muntinlupa City" },
  { icon: Repeat, text: "Buy, sell, and trade in one place" },
  { icon: Images, text: "Photos and videos on every listing" },
  { icon: CalendarCheck, text: "Book a test drive online" },
];

const services = [
  {
    icon: CarFront,
    title: "Buy a car",
    description:
      "Browse the showroom with specs, mileage, photos, and videos shown up front, then pick the one that fits your life and budget.",
    href: "/showroom",
    cta: "Browse the showroom",
  },
  {
    icon: Banknote,
    title: "Sell your car",
    description:
      "Get a quick value estimate online and send your car in for review. Our team will get back to you.",
    href: "/sell-trade",
    cta: "Get a value estimate",
  },
  {
    icon: Repeat,
    title: "Trade it in",
    description:
      "Moving up or switching? Trade in your current car and put it toward your next one.",
    href: "/sell-trade",
    cta: "Start a trade-in",
  },
];

const journeys = [
  {
    title: "Buying with us",
    steps: [
      "Browse listings with full specs, mileage, photos, and videos.",
      "Message us or book a test drive online.",
      "Visit the showroom and drive it in person.",
    ],
  },
  {
    title: "Selling or trading in",
    steps: [
      "Enter your car's details and get a quick value estimate.",
      "Send it in for review.",
      "Our team gets back to you with the next steps.",
    ],
  },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Honest guidance",
    description:
      "The right purchase starts with clear information and no pressure. Every recommendation is based on your needs, not just the cars on our lot.",
  },
  {
    icon: BadgeCheck,
    title: "Clear details",
    description:
      "Specs, mileage, photos, and videos are on every listing, so you can decide with confidence whether it's your first car or your next upgrade.",
  },
  {
    icon: Users,
    title: "Friendly service",
    description:
      "From your first message to the final handover, our team is patient, responsive, and easy to talk to.",
  },
];

const socials = [
  { label: "Facebook", href: BUSINESS.facebook },
  { label: "Instagram", href: BUSINESS.instagram },
  { label: "TikTok", href: BUSINESS.tiktok },
];

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

export default function About() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071A38] text-white">
        {/* HERO */}
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#040E21]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,31,45,0.18),transparent_50%)]" />

          {/* Oversized wheel, echoes the logo */}
          <svg
            aria-hidden="true"
            viewBox="0 0 100 100"
            className="pointer-events-none absolute -bottom-40 -left-40 h-[480px] w-[480px] text-[#D41F2D] opacity-[0.09] lg:-left-24 lg:-bottom-56 lg:h-[640px] lg:w-[640px]"
          >
            <circle
              cx="50"
              cy="50"
              r="47"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <circle
              cx="50"
              cy="50"
              r="30"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
            />
            <g stroke="currentColor" strokeWidth="3.5" strokeLinecap="round">
              {[0, 72, 144, 216, 288].map((angle) => (
                <line
                  key={angle}
                  x1="50"
                  y1="50"
                  x2="50"
                  y2="22"
                  transform={`rotate(${angle} 50 50)`}
                />
              ))}
            </g>
            <circle cx="50" cy="50" r="7" fill="currentColor" />
          </svg>

          <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-20 lg:pt-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-14">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-10 bg-[#D41F2D]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                    About us
                  </span>
                </div>

                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Quality cars,
                  <span className="block text-[#FF5C68]">honest terms.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Boss Auto Exchange is a car dealership in Poblacion,
                  Muntinlupa City. We buy, sell, and trade cars, with clear
                  details and a straightforward path to ownership.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/showroom"
                    className={`inline-flex items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-7 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B] hover:shadow-[0_0_30px_rgba(212,31,45,0.25)] ${focusRing}`}
                  >
                    Browse the showroom
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    href="/sell-trade"
                    className={`inline-flex items-center justify-center rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-[#D41F2D]/50 hover:bg-white/10 ${focusRing}`}
                  >
                    Sell / Trade your car
                  </Link>
                </div>
              </div>

              {/* Visit panel */}
              <div className="rounded-[30px] border border-white/10 bg-[#071A38] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-7">
                <h2 className="text-2xl font-black text-white">
                  Visit the showroom
                </h2>

                <div className="mt-6 space-y-5">
                  <div className="flex gap-3">
                    <MapPin
                      size={18}
                      className="mt-1 shrink-0 text-[#FF5C68]"
                    />
                    <p className="text-sm leading-7 text-zinc-300">
                      {BUSINESS.address}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <Phone size={18} className="shrink-0 text-[#FF5C68]" />
                    <a
                      href={BUSINESS.phoneHref}
                      className="font-semibold text-[#FF5C68] transition-colors hover:text-[#E8404B]"
                    >
                      {BUSINESS.phoneDisplay}
                    </a>
                  </div>
                </div>

                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full border border-[#D41F2D]/50 bg-[#D41F2D]/10 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#D41F2D]/20 ${focusRing}`}
                >
                  Get directions
                  <ArrowUpRight size={16} />
                </a>

                <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-white/10 pt-5 text-sm">
                  <span className="mr-1 text-zinc-400">Follow us</span>
                  {socials.map((social) => (
                    <a
                      key={social.label}
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-semibold text-white transition-colors hover:border-[#D41F2D] hover:text-[#FF5C68] ${focusRing}`}
                    >
                      {social.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Facts bar */}
          <div className="relative border-t border-white/10 bg-[#040E21]/80">
            <ul className="mx-auto grid max-w-7xl grid-cols-1 gap-x-8 gap-y-4 px-4 py-5 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
              {facts.map(({ icon: Icon, text }) => (
                <li
                  key={text}
                  className="flex items-center gap-3 text-sm text-zinc-300"
                >
                  <Icon size={18} className="shrink-0 text-[#FF5C68]" />
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* WHAT WE DO */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <h2 className="max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
            One dealership for every way you move.
          </h2>

          <div className="mt-10 grid overflow-hidden rounded-[28px] border border-white/10 bg-[#040E21] md:grid-cols-3 md:divide-x md:divide-white/10">
            {services.map(({ icon: Icon, title, description, href, cta }) => (
              <div
                key={title}
                className="flex flex-col border-t border-white/10 p-6 first:border-t-0 sm:p-8 md:border-t-0"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#FF5C68]">
                  <Icon size={22} />
                </div>

                <h3 className="mt-5 text-xl font-bold text-white">{title}</h3>
                <p className="mt-3 flex-1 text-base leading-7 text-zinc-400">
                  {description}
                </p>

                <Link
                  href={href}
                  className={`mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#FF5C68] transition-colors hover:text-[#E8404B] ${focusRing}`}
                >
                  {cta}
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="border-y border-white/10 bg-[#040E21]">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <h2 className="max-w-2xl text-3xl font-black tracking-tight text-white sm:text-4xl">
              How it works
            </h2>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {journeys.map((journey) => (
                <div
                  key={journey.title}
                  className="rounded-[26px] border border-white/10 bg-[#071A38] p-6 sm:p-8"
                >
                  <h3 className="text-xl font-bold text-white">
                    {journey.title}
                  </h3>

                  <ol className="mt-6 space-y-5">
                    {journey.steps.map((step, index) => (
                      <li key={step} className="flex gap-4">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#D41F2D]/40 bg-[#D41F2D]/10 text-sm font-bold text-[#FF5C68]">
                          {index + 1}
                        </span>
                        <span className="pt-1 text-base leading-7 text-zinc-300">
                          {step}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* VALUES */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                We make buying feel confident,{" "}
                <span className="text-[#FF5C68]">not complicated.</span>
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-zinc-300">
                Whether you&apos;re shopping for a family SUV, a city car, or a
                pickup for work, we help you find something that fits your life
                and your budget.
              </p>
            </div>

            <ul className="divide-y divide-white/10 border-y border-white/10">
              {values.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-5 py-7">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#FF5C68]">
                    <Icon size={22} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <p className="mt-2 text-base leading-7 text-zinc-400">
                      {description}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <CTA />
      </main>
      <Footer />
    </>
  );
}
