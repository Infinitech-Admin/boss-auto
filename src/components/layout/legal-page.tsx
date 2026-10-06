// Path: components/layout/legal-page.tsx
import Link from "next/link";

import Navbar from "./navbar";
import Footer from "./footer";

export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
};

export default function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#191610] text-white">
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#0d0b09]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(191,152,13,0.18),transparent_50%)]" />

          <div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                {eyebrow}
              </span>
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              {title}
            </h1>

            <p className="mt-4 text-sm text-zinc-400">
              Last updated: {updated}
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="rounded-[28px] border border-white/10 bg-[#120f0d] p-6 sm:p-10">
            <p className="text-base leading-7 text-zinc-300">{intro}</p>

            <div className="mt-10 space-y-10">
              {sections.map((section, index) => (
                <article key={section.title}>
                  <h2 className="flex items-baseline gap-3 text-xl font-bold text-white">
                    <span className="text-sm font-semibold text-[#D41F2D]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {section.title}
                  </h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p
                      key={paragraph}
                      className="mt-3 text-sm leading-7 text-zinc-300"
                    >
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-zinc-300 marker:text-[#D41F2D]">
                      {section.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                </article>
              ))}
            </div>

            <div className="mt-12 flex flex-wrap gap-3 border-t border-white/10 pt-6 text-sm">
              <Link
                href="/privacy-policy"
                className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
              >
                Privacy Policy
              </Link>
              <span className="text-zinc-600">•</span>
              <Link
                href="/terms-and-conditions"
                className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
              >
                Terms &amp; Conditions
              </Link>
              <span className="text-zinc-600">•</span>
              <Link
                href="/contact"
                className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
