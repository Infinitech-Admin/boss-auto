"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  RefreshCw,
  ShoppingBag,
  X,
} from "lucide-react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/context/auth-context";
import { apiRequest, isAbortError } from "@/lib/api";

type OrderStatus =
  | "pending_verification"
  | "confirmed"
  | "rejected"
  | "cancelled";

type Order = {
  id: number;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  downpayment: number;
  balance: number;
  payment_method: "gcash" | "maya" | "bank";
  payment_reference: string | null;
  payment_proof_url: string | null;
  created_at: string;
  items: {
    id: number;
    vehicle_id: number | null;
    name: string;
    unit_price: number;
    quantity: number;
  }[];
};

const LOGIN_HREF = "/login"; // ADJUST if your login page lives elsewhere

const formatPrice = (value: number) =>
  `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

const PAYMENT_LABELS: Record<Order["payment_method"], string> = {
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank transfer",
};

const STATUS_META: Record<
  OrderStatus,
  { label: string; badge: string; message: string }
> = {
  pending_verification: {
    label: "Verifying payment",
    badge: "border-[#E8404B]/40 bg-[#E8404B]/10 text-[#FF5C68]",
    message:
      "We received your order and are checking your payment screenshot. We'll contact you once it's verified.",
  },
  confirmed: {
    label: "Confirmed",
    badge: "border-[#E8404B]/40 bg-[#E8404B]/10 text-[#FF5C68]",
    message:
      "Your payment is verified. A sales advisor will contact you about the next steps.",
  },
  rejected: {
    label: "Payment issue",
    badge: "border-[#E8404B]/40 bg-[#E8404B]/10 text-[#FF5C68]",
    message:
      "We couldn't verify your payment. Please contact us and send a clearer screenshot.",
  },
  cancelled: {
    label: "Cancelled",
    badge: "border-zinc-500/40 bg-zinc-500/10 text-zinc-300",
    message: "This order was cancelled.",
  },
};

type StepState = "done" | "current" | "failed" | "todo";

const STEP_LABELS = ["Order placed", "Payment verification", "Order confirmed"];

function stepStates(status: OrderStatus): StepState[] {
  switch (status) {
    case "confirmed":
      return ["done", "done", "done"];
    case "rejected":
      return ["done", "failed", "todo"];
    default:
      return ["done", "current", "todo"];
  }
}

function Tracker({ status }: { status: OrderStatus }) {
  const states = stepStates(status);

  return (
    <ol className="grid grid-cols-3 gap-2">
      {STEP_LABELS.map((label, i) => {
        const state = states[i];
        const lineActive =
          i > 0 && states[i - 1] === "done" && state !== "todo";

        const circle =
          state === "done"
            ? "border-[#D41F2D] bg-[#D41F2D] text-black"
            : state === "current"
              ? "border-[#D41F2D] bg-[#D41F2D]/10 text-[#5FA8E8]"
              : state === "failed"
                ? "border-[#E8404B] bg-[#E8404B]/10 text-[#FF5C68]"
                : "border-white/15 bg-[#040E21]/30 text-zinc-600";

        return (
          <li key={label} className="relative flex flex-col items-center">
            {i > 0 && (
              <span
                aria-hidden
                className={`absolute right-1/2 top-4 h-0.5 w-full ${
                  lineActive ? "bg-[#D41F2D]" : "bg-white/10"
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border ${circle}`}
            >
              {state === "done" && <Check size={15} strokeWidth={3} />}
              {state === "current" && <Clock size={15} />}
              {state === "failed" && <X size={15} strokeWidth={3} />}
              {state === "todo" && <span className="text-xs">{i + 1}</span>}
            </span>
            <span
              className={`mt-2 text-center text-[11px] font-medium leading-4 sm:text-xs ${
                state === "todo" ? "text-zinc-600" : "text-zinc-300"
              }`}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function OrderCard({ order }: { order: Order }) {
  const meta = STATUS_META[order.status] ?? STATUS_META.pending_verification;

  return (
    <article className="rounded-[28px] border border-white/10 bg-[#071A38] p-5 sm:p-7">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">
            Order
          </p>
          <h2 className="mt-1 text-lg font-bold text-white sm:text-xl">
            {order.order_number}
          </h2>
          <p className="mt-1 text-xs text-zinc-500">
            Placed on {formatDate(order.created_at)}
          </p>
        </div>

        <span
          className={`rounded-full border px-3 py-1 text-xs font-semibold ${meta.badge}`}
        >
          {meta.label}
        </span>
      </div>

      {/* Tracker */}
      {order.status !== "cancelled" && (
        <div className="mt-6">
          <Tracker status={order.status} />
        </div>
      )}

      <p className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-zinc-300">
        {meta.message}
      </p>

      {/* Items */}
      <div className="mt-6 space-y-3 border-t border-white/10 pt-5">
        {order.items.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-3 text-sm"
          >
            <div className="min-w-0">
              {item.vehicle_id ? (
                <Link
                  href={`/showroom/car/${item.vehicle_id}`}
                  className="block truncate font-semibold text-white transition-colors hover:text-[#5FA8E8]"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="block truncate font-semibold text-white">
                  {item.name}
                </span>
              )}
              <span className="text-xs text-zinc-500">Qty {item.quantity}</span>
            </div>
            <span className="shrink-0 font-bold text-[#FF5C68]">
              {formatPrice(item.unit_price * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Amounts */}
      <div className="mt-5 space-y-2.5 border-t border-white/10 pt-5 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Total price</span>
          <span className="font-semibold text-white">
            {formatPrice(order.subtotal)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Downpayment (20%)</span>
          <span className="font-semibold text-white">
            {formatPrice(order.downpayment)}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-zinc-400">Remaining balance</span>
          <span className="font-semibold text-white">
            {formatPrice(order.balance)}
          </span>
        </div>
      </div>

      {/* Payment info */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-zinc-400">
        <span>
          Paid via{" "}
          <span className="font-semibold text-zinc-200">
            {PAYMENT_LABELS[order.payment_method] ?? order.payment_method}
          </span>
          {order.payment_reference && <> · Ref {order.payment_reference}</>}
        </span>

        {order.payment_proof_url && (
          <a
            href={order.payment_proof_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-semibold text-[#FF5C68] transition-colors hover:text-[#3D8FD9]"
          >
            View screenshot
            <ExternalLink size={13} />
          </a>
        )}
      </div>
    </article>
  );
}

function Skeleton() {
  return (
    <div className="space-y-5">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="h-72 animate-pulse rounded-[28px] border border-white/10 bg-[#071A38]"
        />
      ))}
    </div>
  );
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();

  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const load = useCallback(async (signal?: AbortSignal) => {
    setError("");
    try {
      const res = await apiRequest<{ data: Order[] }>("/orders", { signal });
      setOrders(res.data ?? []);
    } catch (err) {
      if (isAbortError(err)) return;
      setError(
        err instanceof Error ? err.message : "Couldn't load your orders.",
      );
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setOrders(null);
      return;
    }

    const controller = new AbortController();
    void load(controller.signal);
    return () => controller.abort();
  }, [authLoading, user, load]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  let content: React.ReactNode;

  if (authLoading) {
    content = <Skeleton />;
  } else if (!user) {
    content = (
      <div className="rounded-[28px] border border-dashed border-white/15 bg-[#071A38] px-6 py-16 text-center">
        <p className="text-xl font-semibold text-white">
          Log in to see your orders
        </p>
        <p className="mt-2 text-sm text-zinc-400">
          Track the status of your reservations and payments.
        </p>
        <Link
          href={LOGIN_HREF}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B]"
        >
          Log in
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  } else if (error && orders === null) {
    content = (
      <div className="rounded-[28px] border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-6 py-12 text-center">
        <p className="text-sm text-[#FF5C68]">{error}</p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-4 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#D41F2D]"
        >
          Try again
        </button>
      </div>
    );
  } else if (orders === null) {
    content = <Skeleton />;
  } else if (orders.length === 0) {
    content = (
      <div className="rounded-[28px] border border-dashed border-white/15 bg-[#071A38] px-6 py-20 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
          <ShoppingBag className="text-[#FF5C68]" size={26} />
        </div>
        <p className="mt-6 text-xl font-semibold text-white">No orders yet</p>
        <p className="mt-2 text-sm text-zinc-400">
          When you place an order, you can track it here.
        </p>
        <Link
          href="/showroom"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B]"
        >
          Browse showroom
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  } else {
    content = (
      <div className="space-y-5">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#071A38] text-white">
        <section className="border-b border-[#D41F2D]/20 bg-[#040E21]">
          <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-[#D41F2D]" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#FF5C68]">
                Your Account
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
              <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
                My Orders
              </h1>

              {user && orders !== null && (
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#D41F2D] hover:text-[#5FA8E8] disabled:opacity-60"
                >
                  <RefreshCw
                    size={14}
                    className={isRefreshing ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          {content}
        </section>
      </main>
      <Footer />
    </>
  );
}
