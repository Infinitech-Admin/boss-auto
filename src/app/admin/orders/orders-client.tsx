"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  ExternalLink,
  Eye,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  fetchAdminOrders,
  ORDER_STATUSES,
  resolveMediaUrl,
  updateAdminOrderStatus,
  type ApiError,
  type Order,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const formatPrice = (value: number | string | null | undefined) =>
  `₱${Number(value ?? 0).toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const PAYMENT_LABELS: Record<string, string> = {
  gcash: "GCash",
  maya: "Maya",
  bank: "Bank transfer",
};

const paymentLabel = (method: string) =>
  PAYMENT_LABELS[method] ?? method.replace(/_/g, " ");

// ADJUST: match the status values your OrderController uses.
// Unknown statuses fall back to the neutral style below.
const STATUS_STYLES: Record<string, string> = {
  pending_verification: "bg-[#D41F2D]/10 text-[#E8404B]",
  pending: "bg-[#D41F2D]/10 text-[#E8404B]",
  confirmed: "bg-[#D41F2D]/10 text-[#E8404B]",
  ready_for_pick_up: "bg-violet-500/10 text-violet-400",
  paid: "bg-[#D41F2D]/10 text-[#E8404B]",
  completed: "bg-zinc-500/15 text-zinc-300",
  cancelled: "bg-[#D41F2D]/10 text-[#E8404B]",
};

const FALLBACK_STATUS_STYLE = "bg-zinc-500/15 text-zinc-400";

const statusStyle = (status: string) =>
  STATUS_STYLES[status.toLowerCase()] ?? FALLBACK_STATUS_STYLE;

const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

/* -------------------------------------------------------------------------- */
/*  Reusable dialog                                                           */
/* -------------------------------------------------------------------------- */

function Dialog({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#061B3D]/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#061B3D] p-6 shadow-2xl">
        {children}
      </div>
    </div>,
    document.body,
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-1.5 text-sm">
      <span className="shrink-0 text-zinc-400">{label}</span>
      <span className="text-right font-medium text-white break-words">
        {children}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function OrdersClient({
  imageBaseUrl,
}: {
  imageBaseUrl: string;
}) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<Order | null>(null);

  // Status editing (inside the details dialog)
  const [nextStatus, setNextStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateNotice, setUpdateNotice] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchAdminOrders();
      setOrders(data);
    } catch (err) {
      setError((err as ApiError).message || "Failed to load orders.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Build the filter chips from whatever statuses actually exist.
  const statusFilters = useMemo(
    () => ["All", ...Array.from(new Set(orders.map((o) => o.status)))],
    [orders],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesSearch =
        !q ||
        o.order_number.toLowerCase().includes(q) ||
        o.full_name.toLowerCase().includes(q) ||
        o.email.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "All" || o.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const closeDetails = useCallback(() => setSelected(null), []);

  // Reset the status editor whenever a different order is opened.
  useEffect(() => {
    setNextStatus(selected?.status ?? "");
    setUpdateError("");
    setUpdateNotice("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  async function saveStatus() {
    if (!selected || nextStatus === selected.status) return;

    setUpdating(true);
    setUpdateError("");
    setUpdateNotice("");
    try {
      const { data } = await updateAdminOrderStatus(selected.id, nextStatus);
      setOrders((prev) => prev.map((o) => (o.id === data.id ? data : o)));
      setSelected(data);
      setUpdateNotice("Status updated.");
    } catch (err) {
      const apiErr = err as ApiError;
      setUpdateError(
        apiErr.errors?.status?.[0] ||
          apiErr.message ||
          "Failed to update status.",
      );
    } finally {
      setUpdating(false);
    }
  }

  const proofUrl = selected?.payment_proof
    ? resolveMediaUrl(selected.payment_proof, imageBaseUrl)
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Orders</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review customer orders and payment screenshots.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order no., name, email or phone..."
            className="w-full rounded-xl border border-white/10 bg-[#0A2A5C]/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal
            size={15}
            className="hidden shrink-0 text-zinc-500 sm:block"
          />
          {statusFilters.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? "bg-[#D41F2D]/15 text-[#D41F2D]"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {status === "All" ? status : statusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#E8404B]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#0A2A5C]/70 py-16 text-sm text-zinc-400">
          <Loader2 size={18} className="mr-2 animate-spin text-[#D41F2D]" />
          Loading orders...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {filtered.length} order{filtered.length !== 1 ? "s" : ""} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#0A2A5C]/70 lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Order</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Total</th>
                  <th className="px-5 py-3 font-medium">Downpayment</th>
                  <th className="px-5 py-3 font-medium">Payment</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                          <Receipt size={16} />
                        </span>
                        <span className="font-medium text-white">
                          {o.order_number}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{o.full_name}</p>
                      <p className="text-xs text-zinc-500">{o.email}</p>
                    </td>
                    <td className="px-5 py-3 text-white">
                      {formatPrice(o.subtotal)}
                    </td>
                    <td className="px-5 py-3 text-zinc-300">
                      {formatPrice(o.downpayment)}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {paymentLabel(o.payment_method)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(o.status)}`}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {formatDate(o.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelected(o)}
                          title="View details"
                          aria-label={`View order ${o.order_number}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#D41F2D]"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No orders match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelected(o)}
                className="rounded-2xl border border-white/10 bg-[#0A2A5C]/70 p-4 text-left transition-colors hover:border-[#D41F2D]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                      <Receipt size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {o.order_number}
                      </p>
                      <p className="text-xs text-zinc-500">{o.full_name}</p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(o.status)}`}
                  >
                    {statusLabel(o.status)}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">
                    {formatPrice(o.subtotal)}
                  </span>
                  <span className="text-zinc-400">
                    DP {formatPrice(o.downpayment)}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>{paymentLabel(o.payment_method)}</span>
                  <span>{formatDate(o.created_at)}</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#0A2A5C]/70 py-10 text-center text-sm text-zinc-500">
                No orders match your search.
              </div>
            )}
          </div>
        </>
      )}

      {/* Order details dialog */}
      {mounted && (
        <Dialog open={!!selected} onClose={closeDetails}>
          {selected && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white">
                    Order {selected.order_number}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Placed {formatDate(selected.created_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(selected.status)}`}
                  >
                    {statusLabel(selected.status)}
                  </span>
                  <button
                    type="button"
                    onClick={closeDetails}
                    aria-label="Close"
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Update status */}
              <section className="mt-5 rounded-xl border border-[#D41F2D]/20 bg-[#061B3D]/20 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Update status
                </h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={nextStatus}
                    onChange={(e) => {
                      setNextStatus(e.target.value);
                      setUpdateError("");
                      setUpdateNotice("");
                    }}
                    disabled={updating}
                    className="flex-1 rounded-xl border border-white/10 bg-[#061B3D] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D41F2D]/60 disabled:opacity-60"
                  >
                    {ORDER_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={saveStatus}
                    disabled={updating || nextStatus === selected.status}
                    className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating && <Loader2 size={15} className="animate-spin" />}
                    {updating ? "Saving..." : "Save status"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Confirming an order reduces vehicle stock. Cancelling a
                  confirmed order puts it back.
                </p>
                {updateError && (
                  <p className="mt-3 rounded-lg border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-3 py-2 text-xs text-[#E8404B]">
                    {updateError}
                  </p>
                )}
                {updateNotice && (
                  <p className="mt-3 rounded-lg border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-3 py-2 text-xs text-[#E8404B]">
                    {updateNotice}
                  </p>
                )}
              </section>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                {/* Customer */}
                <section className="rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Customer
                  </h3>
                  <DetailRow label="Name">{selected.full_name}</DetailRow>
                  <DetailRow label="Email">{selected.email}</DetailRow>
                  <DetailRow label="Phone">{selected.phone}</DetailRow>
                  <DetailRow label="Address">{selected.address}</DetailRow>
                  {selected.notes && (
                    <DetailRow label="Notes">{selected.notes}</DetailRow>
                  )}
                </section>

                {/* Payment */}
                <section className="rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Payment
                  </h3>
                  <DetailRow label="Method">
                    {paymentLabel(selected.payment_method)}
                  </DetailRow>
                  <DetailRow label="Reference">
                    {selected.payment_reference || "—"}
                  </DetailRow>
                  <DetailRow label="Total">
                    {formatPrice(selected.subtotal)}
                  </DetailRow>
                  <DetailRow label="Downpayment">
                    <span className="text-[#D41F2D]">
                      {formatPrice(selected.downpayment)}
                    </span>
                  </DetailRow>
                  <DetailRow label="Balance">
                    {formatPrice(selected.balance)}
                  </DetailRow>
                </section>
              </div>

              {/* Items */}
              {selected.items && selected.items.length > 0 && (
                <section className="mt-5 rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Items
                  </h3>
                  <ul className="divide-y divide-white/5">
                    {selected.items.map((item, i) => (
                      <li
                        key={item.id ?? `${item.vehicle_id}-${i}`}
                        className="flex items-center justify-between gap-3 py-2 text-sm"
                      >
                        <span className="text-white">
                          {item.name || `Vehicle #${item.vehicle_id}`}
                        </span>
                        <span className="text-zinc-400">
                          Qty {item.quantity}
                          {item.price != null &&
                            ` · ${formatPrice(item.price)}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* Payment screenshot */}
              <section className="mt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Payment screenshot
                </h3>
                {proofUrl ? (
                  <a
                    href={proofUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative block overflow-hidden rounded-xl border border-white/10 bg-[#061B3D]/30"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofUrl}
                      alt={`Payment proof for ${selected.order_number}`}
                      className="mx-auto max-h-96 w-auto object-contain"
                    />
                    <span className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-[#061B3D]/70 px-3 py-1.5 text-xs font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
                      <ExternalLink size={12} />
                      Open full size
                    </span>
                  </a>
                ) : (
                  <p className="rounded-xl border border-dashed border-white/10 py-6 text-center text-sm text-zinc-500">
                    No screenshot uploaded.
                  </p>
                )}
              </section>
            </>
          )}
        </Dialog>
      )}
    </div>
  );
}
