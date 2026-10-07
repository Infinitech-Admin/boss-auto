// components/auth/auth-shell.tsx
//
// Shared layout for /login and /register: dark navy page, red + blue glow,
// the Boss Auto Exchange wordmark on the left, the form card on the right.

import type { ReactNode } from "react";
import Link from "next/link";
import { Wordmark } from "@/components/layout/wordmark";

export const authInputClass =
  "w-full rounded-lg border border-[#0C2347] bg-[#040E21] px-4 py-3 text-base text-white placeholder-zinc-500 outline-none transition-all focus:border-[#D41F2D] focus:shadow-[0_0_0_3px_rgba(212,31,45,0.25)] aria-[invalid=true]:border-[#FF5C68]";

export const authLabelClass = "mb-1.5 block text-sm font-medium text-zinc-300";
export const authErrorClass = "mt-1.5 text-sm text-[#FF5C68]";

export const authButtonClass =
  "flex w-full items-center justify-center gap-2 rounded-lg bg-[#D41F2D] py-3.5 text-base font-bold text-white shadow-[0_0_22px_rgba(212,31,45,0.55)] transition-all hover:bg-[#E8404B] hover:shadow-[0_0_30px_rgba(212,31,45,0.8)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FF5C68] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none";

export const authLinkClass =
  "font-semibold text-[#FF5C68] underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

export function AuthShell({
  headline,
  blurb,
  children,
}: {
  headline: string;
  blurb: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#040E21] px-4 py-12 sm:px-8">
      {/* Glow: red behind the brand, blue behind the card, blending in the middle */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(45%_55%_at_35%_50%,rgba(212,31,45,0.28),transparent_70%),radial-gradient(40%_50%_at_75%_60%,rgba(11,91,168,0.30),transparent_70%)]"
      />

      {/* One centered group: brand and card sit side by side */}
      <div className="relative z-10 grid w-full max-w-5xl items-center gap-8 lg:grid-cols-[1fr_28rem] lg:gap-14 xl:gap-20">
        {/* Brand (desktop) */}
        <section className="hidden flex-col gap-8 lg:flex lg:justify-self-end">
          <Link
            href="/"
            aria-label="Boss Auto Exchange home"
            className="group w-fit focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-[#D41F2D]"
          >
            <Wordmark className="text-7xl xl:text-8xl" />
          </Link>
          <div className="max-w-md">
            <h2 className="text-4xl font-black italic leading-tight tracking-tight text-white">
              {headline}
            </h2>
            <p className="mt-3 text-base text-blue-100/80">{blurb}</p>
          </div>
        </section>

        {/* Form column */}
        <section className="flex flex-col items-center">
          {/* Brand (mobile) */}
          <Link
            href="/"
            aria-label="Boss Auto Exchange home"
            className="group mb-8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D41F2D] lg:hidden"
          >
            <Wordmark className="text-5xl" />
          </Link>

          <div className="w-full max-w-md rounded-2xl border border-[#3D8FD9]/40 bg-[#040E21]/80 p-6 shadow-[0_0_40px_rgba(61,143,217,0.18),0_0_80px_rgba(212,31,45,0.12)] backdrop-blur-md sm:p-8 lg:max-w-none">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
