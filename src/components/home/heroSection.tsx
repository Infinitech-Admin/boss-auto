import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CarFront,
  CircleDollarSign,
  ShieldCheck,
} from "lucide-react";

const benefits = [
  {
    icon: ShieldCheck,
    title: "Verified Vehicles",
    description: "Carefully inspected cars",
  },
  {
    icon: CircleDollarSign,
    title: "Flexible Financing",
    description: "Options built around you",
  },
  {
    icon: CarFront,
    title: "Trade-In Welcome",
    description: "Upgrade your current vehicle",
  },
  {
    icon: BadgeCheck,
    title: "Easy Transactions",
    description: "From inquiry to handover",
  },
];

const dividers = [
  "border-b sm:border-r lg:border-b-0",
  "border-b lg:border-b-0 lg:border-r",
  "border-b sm:border-b-0 sm:border-r",
  "",
];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[80vh] flex-col overflow-hidden bg-[#061B3D] border-b border-[#0A2A5C]/60">
      {/* Background */}
      <div className="absolute inset-0">
        <Image
          src="/showroom-collection.jpg"
          alt="Premium car showroom"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      {/* Dark Overlay - lightened from black/60 */}
      <div className="absolute inset-0 bg-[#061B3D]/35" />

      {/* Cinematic Left Gradient - lightened + right side now shows through */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#061B3D]/80 via-[#061B3D]/40 to-transparent" />

      {/* Bottom Fade - shortened + lightened */}
      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-[#061B3D]/70 via-[#061B3D]/30 to-transparent" />

      {/* Red Ambient Glow */}
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-[280px] w-[650px] -translate-x-1/2 rounded-full bg-[#0B5BA8]/25 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 py-10 pt-30 sm:px-6 lg:px-8">
        <div className="max-w-4xl">
          {/* Eyebrow */}
          <div className="mb-5 flex items-center gap-3 sm:mb-6">
            <span className="h-px w-10 bg-[#D41F2D] sm:w-12" />

            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#D41F2D] sm:text-xs sm:tracking-[0.3em]">
              Premium Automotive
            </span>
          </div>

          {/* Heading */}
          <h1 className="max-w-4xl text-[3.25rem] font-black leading-[0.9] tracking-[-0.04em] text-white drop-shadow-[0_4px_24px_rgba(0,0,0,0.65)] sm:text-6xl md:text-7xl lg:text-8xl">
            Find Your
            <span className="block text-[#D41F2D]">Next Drive.</span>
          </h1>

          {/* Description */}
          <p className="mt-6 max-w-xl text-sm leading-6 text-zinc-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:mt-7 sm:text-base sm:leading-7 lg:text-lg">
            Premium vehicles, inspected with care and presented with complete
            transparency—from first look to final handover.
          </p>

          {/* CTA Buttons */}
          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row">
            {/* Primary CTA */}
            <Link
              href="/showroom"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-[#D41F2D] px-7 py-4 text-sm font-bold text-white shadow-lg shadow-[#D41F2D]/10 transition-all duration-300 hover:bg-[#E8404B] hover:shadow-[#D41F2D]/25"
            >
              Browse Cars
              <ArrowRight
                size={17}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>

            {/* Secondary CTA */}
            <Link
              href="/sell-trade"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-[#D41F2D]/70 bg-[#061B3D]/30 px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-[#D41F2D] hover:bg-[#D41F2D]/15"
            >
              Sell / Trade Your Car
            </Link>
          </div>
        </div>
      </div>

      {/* BENEFITS - sits in normal flow at the bottom of the hero */}
      <div className="relative z-20 px-4 pb-5 sm:px-6 sm:pb-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#061B3D]/60 shadow-[0_20px_60px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className={`group flex items-center gap-4 border-white/10 p-4 transition-colors duration-300 hover:bg-white/[0.06] sm:p-5 ${dividers[index]}`}
                >
                  {/* Icon */}
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#D41F2D] transition-colors duration-300 group-hover:border-[#D41F2D]/60 group-hover:bg-[#D41F2D]/20">
                    <Icon size={24} strokeWidth={1.8} />
                  </div>

                  {/* Text */}
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-white sm:text-base">
                      {benefit.title}
                    </h3>

                    <p className="mt-1 text-sm leading-5 text-zinc-400 sm:text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
