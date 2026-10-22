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
    title: "Verified vehicles",
    description: "Carefully inspected cars",
  },
  {
    icon: CircleDollarSign,
    title: "Flexible financing",
    description: "Options built around you",
  },
  {
    icon: CarFront,
    title: "Trade-in welcome",
    description: "Upgrade your current vehicle",
  },
  {
    icon: BadgeCheck,
    title: "Easy transactions",
    description: "From inquiry to handover",
  },
];

// Same slant as the italic Boss logo, used for the image edge and buttons.
const SLANT = "lg:[clip-path:polygon(14%_0,100%_0,100%_100%,0_100%)]";

// One entrance sequence on page load:
// stripe sweeps in -> photo slides in and slowly settles -> headline lines
// rise one by one -> text and buttons fade up -> benefits strip rises.
// Everything is CSS-only and switched off for people who prefer reduced motion.
const heroAnimations = `
  @keyframes hero-stripe-in {
    from { transform: translateX(35%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes hero-photo-in {
    from { transform: translateX(12%); opacity: 0; }
    to   { transform: translateX(0);   opacity: 1; }
  }
  @keyframes hero-zoom {
    from { transform: scale(1.14); }
    to   { transform: scale(1); }
  }
  @keyframes hero-line-in {
    from { transform: translateY(110%); }
    to   { transform: translateY(0); }
  }
  @keyframes hero-bar-in {
    from { transform: scaleX(0); }
    to   { transform: scaleX(1); }
  }
  @keyframes hero-fade-up {
    from { transform: translateY(18px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes hero-rise {
    from { transform: translateY(100%); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  @keyframes hero-pulse {
    0%   { box-shadow: 0 0 0 0 rgba(212, 31, 45, 0.55); }
    70%  { box-shadow: 0 0 0 16px rgba(212, 31, 45, 0); }
    100% { box-shadow: 0 0 0 0 rgba(212, 31, 45, 0); }
  }

  .hero-stripe { animation: hero-stripe-in 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.05s both; }
  .hero-photo  { animation: hero-photo-in 1.1s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
  .hero-zoom   { animation: hero-zoom 9s cubic-bezier(0.22, 1, 0.36, 1) 0.2s both; }
  .hero-line   { animation: hero-line-in 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .hero-bar    { transform-origin: left; animation: hero-bar-in 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.25s both; }
  .hero-fade   { animation: hero-fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
  .hero-rise   { animation: hero-rise 0.9s cubic-bezier(0.22, 1, 0.36, 1) 1.15s both; }
  .hero-pulse  { animation: hero-pulse 2.8s ease-out 2.6s infinite; }

  @media (prefers-reduced-motion: reduce) {
    .hero-stripe, .hero-photo, .hero-zoom, .hero-line,
    .hero-bar, .hero-fade, .hero-rise, .hero-pulse {
      animation: none !important;
    }
  }
`;

const headlineLines = ["Your next car,", "checked and", "ready to drive."];

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[85vh] flex-col overflow-hidden bg-[#040E21]">
      <style>{heroAnimations}</style>

      {/* Soft blue depth behind the text side */}
      <div className="pointer-events-none absolute -left-40 top-1/4 h-[420px] w-[620px] rounded-full bg-[#0C2347] opacity-70 blur-[120px]" />

      {/* Red slanted stripe (peeks out beside the photo on desktop) */}
      <div
        aria-hidden="true"
        className={`hero-stripe absolute inset-y-0 right-0 hidden w-[59.5%] bg-[#D41F2D] lg:block ${SLANT}`}
      />

      {/* Photo panel: full background on mobile, slanted right panel on desktop */}
      <div
        className={`hero-photo absolute inset-0 lg:left-auto lg:w-[58%] ${SLANT}`}
      >
        <Image
          src="/showroom-collection.jpg"
          alt="Premium car showroom"
          fill
          priority
          sizes="(min-width: 1024px) 58vw, 100vw"
          className="hero-zoom object-cover object-center"
        />
        {/* Mobile: darken for text. Desktop: light tint only */}
        <div className="absolute inset-0 bg-[#040E21]/80 lg:bg-[#040E21]/20" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#040E21]/80 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-4 pb-10 pt-32 sm:px-6 lg:px-8">
        <div className="max-w-xl lg:max-w-[46%]">
          {/* The bar is wrapped so its scale animation doesn't fight the skew */}
          <div className="hero-bar mb-6 w-16">
            <span
              aria-hidden="true"
              className="block h-1.5 w-full -skew-x-12 bg-[#D41F2D]"
            />
          </div>

          <h1 className="text-5xl font-black italic leading-[0.95] tracking-[-0.03em] text-white sm:text-6xl lg:text-7xl">
            {headlineLines.map((line, index) => (
              <span
                key={line}
                className="-mb-[0.1em] block overflow-hidden pb-[0.1em] pr-3"
              >
                <span
                  className="hero-line block"
                  style={{ animationDelay: `${0.4 + index * 0.14}s` }}
                >
                  {line}
                </span>
              </span>
            ))}
          </h1>

          <p
            className="hero-fade mt-6 max-w-md text-base leading-7 text-blue-100/80 lg:text-lg"
            style={{ animationDelay: "0.9s" }}
          >
            Every vehicle is inspected before it reaches the showroom, with
            clear details from your first look to the day you get the keys.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:gap-4">
            {/* Primary CTA */}
            <div className="hero-fade" style={{ animationDelay: "1.05s" }}>
              <Link
                href="/showroom"
                className="hero-pulse group block -skew-x-12 rounded-md bg-[#D41F2D] text-sm font-bold text-white shadow-lg shadow-[#D41F2D]/20 transition-colors duration-300 hover:bg-[#E8404B] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="flex skew-x-12 items-center justify-center gap-3 px-7 py-4">
                  Browse cars
                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </span>
              </Link>
            </div>

            {/* Secondary CTA */}
            <div className="hero-fade" style={{ animationDelay: "1.17s" }}>
              <Link
                href="/sell-trade"
                className="block -skew-x-12 rounded-md border-2 border-white/30 bg-[#040E21]/40 text-sm font-semibold text-white backdrop-blur-md transition-colors duration-300 hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span className="flex skew-x-12 items-center justify-center px-7 py-3.5">
                  Sell or trade your car
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits strip: full width, divided by hairlines instead of cards */}
      <div className="hero-rise relative z-20 border-t-2 border-[#D41F2D] bg-[#071A38]/90 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <ul className="grid grid-cols-2 gap-px bg-white/10 lg:grid-cols-4">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <li
                  key={benefit.title}
                  className="flex items-center gap-3 bg-[#071A38] px-3 py-4 sm:gap-4 sm:px-5 sm:py-5"
                >
                  <Icon
                    size={28}
                    strokeWidth={1.8}
                    className="shrink-0 text-[#FF5C68]"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-white sm:text-base">
                      {benefit.title}
                    </h3>
                    <p className="mt-0.5 text-xs leading-5 text-blue-100/60 sm:text-sm">
                      {benefit.description}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
