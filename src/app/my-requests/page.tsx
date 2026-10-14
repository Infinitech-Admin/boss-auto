// app/my-requests/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight, CarFront, Check, Film, Loader2 } from "lucide-react";

import Navbar from "../../components/layout/navbar";
import Footer from "../../components/layout/footer";
import { apiFetch } from "@/lib/chunk-upload";

type RequestStatus = "new" | "contacted" | "closed";

type MyRequest = {
  id: number;
  brand: string;
  model: string;
  year: number;
  mileage: number;
  type: string;
  condition: string;
  estimate: number;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  media: { type: "image" | "video"; url: string }[];
};

const STATUS: Record<
  RequestStatus,
  { label: string; description: string; badge: string; step: number }
> = {
  new: {
    label: "Under review",
    description: "We received your request. Our team will review it soon.",
    badge: "border-[#3D8FD9]/40 bg-[#3D8FD9]/10 text-[#5FA8E8]",
    step: 0,
  },
  contacted: {
    label: "We contacted you",
    description:
      "Our team has reached out. Please check your phone or email, and reply to us.",
    badge: "border-amber-400/40 bg-amber-400/10 text-amber-300",
    step: 1,
  },
  closed: {
    label: "Closed",
    description:
      "This request is closed. You can send a new one anytime from the Sell / Trade page.",
    badge: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
    step: 2,
  },
};

const STEPS = ["Submitted", "Contacted", "Closed"];

const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function MyRequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<MyRequest[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await apiFetch("/my-sell-trade");

        if (res.status === 401) {
          router.replace(
            `/login?redirect=${encodeURIComponent("/my-requests")}`,
          );
          return;
        }

        if (!res.ok) throw new Error("Request failed");

        const json = await res.json();
        if (!cancelled) setRequests(json.data ?? []);
      } catch {
        if (!cancelled)
          setError("Unable to load your requests. Please try again.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#071A38] text-white">
        <section className="relative overflow-hidden border-b border-[#D41F2D]/20 bg-[#040E21]">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,31,45,0.18),transparent_50%)]" />
          <div className="relative mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                My account
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
              My sell / trade requests
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-300 sm:text-base">
              Track the status of the cars you sent us for review.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
          {error ? (
            <p
              role="alert"
              className="rounded-2xl border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]"
            >
              {error}
            </p>
          ) : requests === null ? (
            <div className="flex items-center justify-center gap-2 py-20 text-zinc-400">
              <Loader2 size={18} className="animate-spin" />
              Loading your requests...
            </div>
          ) : requests.length === 0 ? (
            <div className="rounded-[28px] border border-white/10 bg-[#040E21] p-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#FF5C68]">
                <CarFront size={22} />
              </div>
              <h2 className="text-xl font-bold">No requests yet</h2>
              <p className="mt-2 text-sm text-zinc-400">
                Get a value estimate and send your car in for review.
              </p>
              <Link
                href="/sell-trade"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#E8404B]"
              >
                Sell / Trade your car
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <ul className="space-y-5">
              {requests.map((r) => {
                const status = STATUS[r.status] ?? STATUS.new;
                const photos = r.media.filter((m) => m.type === "image");
                const videoCount = r.media.length - photos.length;

                return (
                  <li
                    key={r.id}
                    className="rounded-[28px] border border-white/10 bg-[#040E21] p-5 sm:p-7"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-black sm:text-2xl">
                          {r.year} {r.brand} {r.model}
                        </h2>
                        <p className="mt-1 text-xs text-zinc-500">
                          Request #{r.id} · Sent {formatDate(r.created_at)}
                        </p>
                      </div>

                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${status.badge}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-zinc-300">
                      {status.description}
                    </p>

                    {/* Progress */}
                    <ol className="mt-5 flex items-center">
                      {STEPS.map((label, index) => {
                        const done = index <= status.step;
                        return (
                          <li
                            key={label}
                            className="flex flex-1 items-center last:flex-none"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className={`flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold ${done ? "border-[#D41F2D] bg-[#D41F2D] text-white" : "border-white/15 text-zinc-500"}`}
                              >
                                {done ? <Check size={14} /> : index + 1}
                              </span>
                              <span
                                className={`text-xs font-semibold ${done ? "text-white" : "text-zinc-500"}`}
                              >
                                {label}
                              </span>
                            </div>
                            {index < STEPS.length - 1 && (
                              <span
                                className={`mx-3 h-px flex-1 ${index < status.step ? "bg-[#D41F2D]" : "bg-white/10"}`}
                              />
                            )}
                          </li>
                        );
                      })}
                    </ol>

                    {/* Details */}
                    <dl className="mt-6 grid gap-4 border-t border-white/10 pt-5 text-sm sm:grid-cols-4">
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Estimate
                        </dt>
                        <dd className="mt-1 font-bold text-white">
                          ₱{r.estimate.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Mileage
                        </dt>
                        <dd className="mt-1 font-bold text-white">
                          {r.mileage.toLocaleString()} km
                        </dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Type
                        </dt>
                        <dd className="mt-1 font-bold text-white">{r.type}</dd>
                      </div>
                      <div>
                        <dt className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
                          Condition
                        </dt>
                        <dd className="mt-1 font-bold text-white">
                          {r.condition}
                        </dd>
                      </div>
                    </dl>

                    {r.media.length > 0 && (
                      <div className="mt-5 flex flex-wrap items-center gap-2">
                        {photos.slice(0, 6).map((m) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            key={m.url}
                            src={m.url}
                            alt=""
                            className="h-14 w-14 rounded-lg border border-white/10 object-cover"
                          />
                        ))}
                        {videoCount > 0 && (
                          <span className="flex h-14 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs text-zinc-300">
                            <Film size={16} className="text-[#FF5C68]" />
                            {videoCount} video{videoCount === 1 ? "" : "s"}
                          </span>
                        )}
                      </div>
                    )}

                    <p className="mt-5 text-[11px] text-zinc-500">
                      Last updated {formatDate(r.updated_at)}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>

      <Footer />
    </>
  );
}
