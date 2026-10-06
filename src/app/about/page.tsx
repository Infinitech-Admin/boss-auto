// Path: app/about/page.tsx
"use client";

import {
  Award,
  BadgeCheck,
  CarFront,
  CalendarCheck,
  Images,
  Repeat,
  ShieldCheck,
  Users,
} from "lucide-react";

import Navbar from "../../components/layout/navbar";
import Footer from "../../components/layout/footer";
import CTA from "../../components/home/cta";

// Source: public dealer listings (Zigwheels, Carmudi) show Auto Prime Car Trading
// as a used car dealer in BF Resort Village, Las Piñas City.
// Facebook: https://www.facebook.com/autoprimecartrading/
const stats = [
  { value: "Las Piñas", label: "BF Resort Village showroom" },
  { value: "Buy • Sell • Trade", label: "Used cars, handled in one place" },
  { value: "Photos & Videos", label: "On every vehicle listing" },
  { value: "Test Drive", label: "Book online, drive in person" },
];

const values = [
  {
    icon: ShieldCheck,
    title: "Honest guidance",
    description:
      "We believe the right purchase starts with clear information and no pressure. Every recommendation is based on your needs, not just the cars on our lot.",
  },
  {
    icon: BadgeCheck,
    title: "Clear details",
    description:
      "Each listing shows the specs, mileage, photos, and videos up front, so you can decide with confidence whether it's your first car or your next upgrade.",
  },
  {
    icon: Repeat,
    title: "Sell or trade-in",
    description:
      "Have a car to sell or trade? Get a quick value estimate online, send it in for review, and our team will get back to you.",
  },
  {
    icon: Users,
    title: "Friendly service",
    description:
      "From your first message to the final handover, our team is patient, responsive, and easy to talk to.",
  },
];

export default function About() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#0B0714] text-white">
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#080b0f]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(225,29,46,0.18),transparent_50%)]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 lg:pt-24">
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="mb-5 flex items-center gap-3">
                  <span className="h-px w-10 bg-[#D41F2D]" />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                    Our story
                  </span>
                </div>

                <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                  Quality used cars,
                  <span className="block text-[#D41F2D]">honest terms.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                  Auto Prime Car Trading is a used car dealership in BF Resort
                  Village, Las Piñas City. We buy, sell, and trade pre-owned
                  cars, with clear details and a straightforward path to
                  ownership.
                </p>
              </div>

              <div className="rounded-[30px] border border-white/10 bg-[#120f0d] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] sm:p-7">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs uppercase tracking-[0.22em] text-zinc-400">
                      Auto Prime Car Trading
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">
                      How we work
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#D41F2D]/15 text-[#D41F2D]">
                    <CarFront size={22} />
                  </div>
                </div>

                <div className="mt-6 space-y-5 text-lg leading-7 text-zinc-300">
                  <p>
                    Buying a car should feel clear, confident, and personal. We
                    show the details of every vehicle up front, so you know what
                    to expect before you visit.
                  </p>
                  <p>
                    Looking to buy, sell, or trade in your current car? Our team
                    walks you through each step, from the first enquiry to the
                    final handover.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-[24px] border border-white/10 bg-[#120f0d] p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.18)]"
                >
                  <div className="text-2xl font-black text-[#D41F2D] sm:text-3xl">
                    {stat.value}
                  </div>
                  <p className="mt-3 text-base text-zinc-300">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div className="rounded-[30px] border border-[#D41F2D]/20 bg-[#120f0d] p-6 sm:p-8">
              <div className="mb-6 flex items-center gap-3 text-[#D41F2D]">
                <Award size={20} />
                <span className="text-xs font-semibold uppercase tracking-[0.28em]">
                  Our promise
                </span>
              </div>

              <h3 className="text-3xl font-black tracking-tight text-white">
                Thoughtful service at every step.
              </h3>

              <ul className="mt-6 space-y-4 text-sm leading-7 text-zinc-300">
                {[
                  "Buy, sell, or trade in: you choose what works for you.",
                  "Friendly people who listen first and explain clearly.",
                  "Simple, upfront communication from first enquiry to delivery.",
                ].map((item) => (
                  <li key={item} className="flex gap-3">
                    <span className="mt-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#D41F2D]/15 text-[#D41F2D]">
                      <BadgeCheck size={12} />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(225,29,46,0.18),transparent_45%)] p-6 sm:p-8">
              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                  The Auto Prime difference
                </p>
                <h3 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  We make buying feel confident, not complicated.
                </h3>
                <p className="mt-5 max-w-xl text-base leading-7 text-zinc-300">
                  Whether you&apos;re shopping for a family SUV, a city car, or
                  a pickup for work, we help you find something that fits your
                  life and your budget.
                </p>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-zinc-300">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <Images size={16} className="text-[#D41F2D]" />
                    Photos & videos
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
                    <CalendarCheck size={16} className="text-[#D41F2D]" />
                    Book a test drive
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 pt-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-5 flex items-center justify-center gap-3">
                <span className="h-px w-10 bg-[#D41F2D]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
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
                    className="group rounded-[26px] border border-white/10 bg-[#120f0d] p-6 transition-all duration-300 hover:border-[#D41F2D]/50 hover:bg-[#15120f] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#D41F2D] transition-all duration-300 group-hover:border-[#D41F2D]/60 group-hover:bg-[#D41F2D]/20">
                        <Icon size={22} />
                      </div>

                      <h3 className="text-base font-bold leading-tight text-white sm:text-xl">
                        {value.title}
                      </h3>
                    </div>

                    <p className="mt-5 text-base leading-7 text-zinc-400">
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
