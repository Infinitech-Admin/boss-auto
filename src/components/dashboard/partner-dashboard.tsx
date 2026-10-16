// components/dashboard/partner-dashboard.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowRight, Clock, Handshake, Store } from "lucide-react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/context/auth-context";

type PartnerRole = "reseller" | "agent";

const COPY = {
  reseller: {
    icon: Store,
    title: "Reseller dashboard",
    intro: "Browse units, buy for resale, and track your purchases.",
    stats: ["Active purchases", "Units bought", "Total spent"],
    actions: [
      { href: "/showroom", label: "Browse inventory" },
      { href: "/orders", label: "View my purchases" },
    ],
  },
  agent: {
    icon: Handshake,
    title: "Agent dashboard",
    intro: "Refer buyers, follow up on deals, and track your commissions.",
    stats: ["Referrals", "Deals closed", "Commission earned"],
    actions: [
      { href: "/showroom", label: "Browse listings to refer" },
      { href: "/contact", label: "Contact the team" },
    ],
  },
} as const;

/** Where each role's dashboard lives. Used by the guard and the user menu. */
export const DASHBOARD_HREF: Record<PartnerRole, string> = {
  reseller: "/reseller/dashboard",
  agent: "/agent/dashboard",
};

export default function PartnerDashboard({ role }: { role: PartnerRole }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== role) {
      // Wrong role: send reseller/agent to their own dashboard, others home.
      const own = DASHBOARD_HREF[user.role as PartnerRole];
      router.replace(own ?? "/");
    }
  }, [isLoading, user, role, router]);

  if (isLoading || !user || user.role !== role) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#071A38]" />
      </>
    );
  }

  const copy = COPY[role];
  const Icon = copy.icon;

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#071A38] text-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#D41F2D]/40 bg-[#D41F2D]/10 text-[#FF5C68]">
              <Icon size={26} />
            </span>
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                {copy.title}
              </h1>
              <p className="text-sm text-zinc-400">
                Welcome back, {user.name.split(" ")[0]}. {copy.intro}
              </p>
            </div>
          </div>

          {user.status === "pending" && (
            <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-zinc-200">
              <Clock size={18} className="mt-0.5 shrink-0 text-[#FF5C68]" />
              Your application is still being reviewed. Some features unlock
              after approval.
            </div>
          )}

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {copy.stats.map((label) => (
              <div
                key={label}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                  {label}
                </p>
                <p className="mt-3 text-3xl font-black text-white">0</p>
              </div>
            ))}
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {copy.actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="group flex items-center justify-between rounded-2xl border border-white/10 bg-[#040E21] px-5 py-4 text-sm font-semibold transition-colors hover:border-[#D41F2D]/50"
              >
                {a.label}
                <ArrowRight
                  size={16}
                  className="text-[#FF5C68] transition-transform group-hover:translate-x-1"
                />
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
