"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  CarFront,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import type { ApiError } from "@/lib/api";
import {
  deleteSellTrade,
  fetchAdminSellTrades,
  updateSellTrade,
  type SellTradeRequest,
  type SellTradeStatus,
} from "@/lib/sell-trade-api";

const STATUS_FILTERS: Array<"All" | SellTradeStatus> = [
  "All",
  "new",
  "contacted",
  "closed",
];

const STATUS_OPTIONS: SellTradeStatus[] = ["new", "contacted", "closed"];

const STATUS_STYLES: Record<SellTradeStatus, string> = {
  new: "bg-[#D41F2D]/10 text-[#D41F2D]",
  contacted: "bg-zinc-500/15 text-zinc-300",
  closed: "bg-zinc-500/15 text-zinc-400",
};

const STATUS_LABELS: Record<SellTradeStatus, string> = {
  new: "New",
  contacted: "Contacted",
  closed: "Closed",
};

const formatPeso = (n: number) => `₱${n.toLocaleString()}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

/* -------------------------------------------------------------------------- */
/*  Reusable dialog                                                           */
/* -------------------------------------------------------------------------- */

function Dialog({
  open,
  onClose,
  children,
  busy = false,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Kapag true, hindi ma-close ang dialog (hal. habang nagse-save o nagdedelete). */
  busy?: boolean;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#061B3D]/70 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* -------------------------------------------------------------------------- */
/*  Row action icons (always visible)                                         */
/* -------------------------------------------------------------------------- */

function RowActions({
  item,
  onView,
  onDelete,
}: {
  item: SellTradeRequest;
  onView: (i: SellTradeRequest) => void;
  onDelete: (i: SellTradeRequest) => void;
}) {
  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onView(item)}
        title="View"
        aria-label={`View request from ${item.full_name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#D41F2D]"
      >
        <Eye size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(item)}
        title="Delete"
        aria-label={`Delete request from ${item.full_name}`}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function SellTradeClient() {
  const [items, setItems] = useState<SellTradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | SellTradeStatus>(
    "All",
  );
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Detail dialog state
  const [selected, setSelected] = useState<SellTradeRequest | null>(null);
  const [statusDraft, setStatusDraft] = useState<SellTradeStatus>("new");
  const [notesDraft, setNotesDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Delete dialog state
  const [deleteTarget, setDeleteTarget] = useState<SellTradeRequest | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchAdminSellTrades({
        page,
        perPage: 15,
        search,
        status: statusFilter === "All" ? "" : statusFilter,
      });
      setItems(res.data);
      setLastPage(res.last_page);
      setTotal(res.total);
    } catch (err) {
      setError((err as ApiError).message || "Failed to load requests.");
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  /* ------------------------------ Detail dialog ----------------------------- */

  const openDetail = (item: SellTradeRequest) => {
    setSaveError("");
    setStatusDraft(item.status);
    setNotesDraft(item.notes ?? "");
    setSelected(item);
  };

  const closeDetail = useCallback(() => {
    setSelected(null);
    setSaveError("");
  }, []);

  const hasChanges =
    !!selected &&
    (statusDraft !== selected.status || notesDraft !== (selected.notes ?? ""));

  async function saveChanges() {
    if (!selected) return;
    setSaving(true);
    setSaveError("");
    try {
      const updated = await updateSellTrade(selected.id, {
        status: statusDraft,
        notes: notesDraft,
      });
      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
      setSelected(null);
    } catch (err) {
      setSaveError((err as ApiError).message || "Failed to save changes.");
    } finally {
      setSaving(false);
    }
  }

  /* ----------------------------- Delete dialog ------------------------------ */

  const openDeleteDialog = (item: SellTradeRequest) => {
    setDeleteError("");
    setDeleteTarget(item);
  };

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
    setDeleteError("");
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteSellTrade(deleteTarget.id);
      setDeleteTarget(null);
      setSelected(null);

      if (items.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        load();
      }
    } catch (err) {
      setDeleteError((err as ApiError).message || "Failed to delete request.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">
          Sell / Trade
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Review vehicle submissions from customers and follow up on leads.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, contact, brand or model..."
            className="w-full rounded-xl border border-white/10 bg-[#111111]/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <SlidersHorizontal
            size={15}
            className="hidden shrink-0 text-zinc-500 sm:block"
          />
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium capitalize transition-colors ${
                statusFilter === status
                  ? "bg-[#D41F2D]/15 text-[#D41F2D]"
                  : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#111111]/70 py-16 text-sm text-zinc-400">
          <Loader2 size={18} className="mr-2 animate-spin text-[#D41F2D]" />
          Loading requests...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {total} request{total !== 1 ? "s" : ""} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/70 lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Mileage</th>
                  <th className="px-5 py-3 font-medium">Estimate</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{i.full_name}</p>
                      <p className="text-xs text-zinc-500">
                        {i.phone || i.email}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                          <CarFront size={16} />
                        </span>
                        <div>
                          <p className="font-medium text-white">
                            {i.brand} {i.model}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {i.year} · {i.type} · {i.condition}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {i.mileage.toLocaleString()} km
                    </td>
                    <td className="px-5 py-3 text-white">
                      {formatPeso(i.estimate)}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {formatDate(i.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[i.status]}`}
                      >
                        {STATUS_LABELS[i.status]}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <RowActions
                        item={i}
                        onView={openDetail}
                        onDelete={openDeleteDialog}
                      />
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No requests match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {items.map((i) => (
              <div
                key={i.id}
                className="rounded-2xl border border-white/10 bg-[#111111]/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                      <CarFront size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {i.brand} {i.model}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {i.type} · {i.year}
                      </p>
                    </div>
                  </div>
                  <RowActions
                    item={i}
                    onView={openDetail}
                    onDelete={openDeleteDialog}
                  />
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-semibold text-white">
                    {formatPeso(i.estimate)}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[i.status]}`}
                  >
                    {STATUS_LABELS[i.status]}
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-500">
                  <span>{i.full_name}</span>
                  <span>{formatDate(i.created_at)}</span>
                </div>
              </div>
            ))}
            {items.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#111111]/70 py-10 text-center text-sm text-zinc-500">
                No requests match your search.
              </div>
            )}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between text-xs text-zinc-500">
              <p>
                Page {page} of {lastPage}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <button
                  type="button"
                  disabled={page >= lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail dialog */}
      {mounted && (
        <Dialog open={!!selected} onClose={closeDetail} busy={saving} wide>
          {selected && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
                Request #{selected.id}
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                {selected.full_name}
              </h2>

              <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 text-sm">
                <div>
                  <dt className="text-xs text-zinc-500">Phone</dt>
                  <dd className="mt-1 text-white">{selected.phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Email</dt>
                  <dd className="mt-1 break-all text-white">
                    {selected.email || "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Vehicle</dt>
                  <dd className="mt-1 text-white">
                    {selected.year} {selected.brand} {selected.model}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Type</dt>
                  <dd className="mt-1 text-white">{selected.type}</dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Mileage</dt>
                  <dd className="mt-1 text-white">
                    {selected.mileage.toLocaleString()} km
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-zinc-500">Condition</dt>
                  <dd className="mt-1 text-white">{selected.condition}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-zinc-500">Customer estimate</dt>
                  <dd className="mt-1 text-2xl font-bold text-[#D41F2D]">
                    {formatPeso(selected.estimate)}
                  </dd>
                </div>
              </dl>

              <div className="mt-5">
                <label
                  htmlFor="sell-trade-status"
                  className="text-xs text-zinc-500"
                >
                  Status
                </label>
                <select
                  id="sell-trade-status"
                  value={statusDraft}
                  onChange={(e) =>
                    setStatusDraft(e.target.value as SellTradeStatus)
                  }
                  disabled={saving}
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111]/70 px-4 py-2.5 text-sm text-white outline-none focus:border-[#D41F2D]/60"
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-4">
                <label
                  htmlFor="sell-trade-notes"
                  className="text-xs text-zinc-500"
                >
                  Internal notes
                </label>
                <textarea
                  id="sell-trade-notes"
                  rows={4}
                  value={notesDraft}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  disabled={saving}
                  placeholder="Add notes about this lead..."
                  className="mt-2 w-full rounded-xl border border-white/10 bg-[#111111]/70 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60"
                />
              </div>

              {saveError && (
                <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                  {saveError}
                </div>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={() => openDeleteDialog(selected)}
                  disabled={saving}
                  className="flex items-center justify-center gap-2 rounded-full border border-red-500/30 px-5 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Delete
                </button>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeDetail}
                    disabled={saving}
                    className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
                  >
                    Close
                  </button>
                  <button
                    type="button"
                    onClick={saveChanges}
                    disabled={saving || !hasChanges}
                    className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <Loader2 size={15} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save changes"
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </Dialog>
      )}

      {/* Delete confirmation dialog */}
      {mounted && (
        <Dialog
          open={!!deleteTarget}
          onClose={closeDeleteDialog}
          busy={deleting}
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <AlertTriangle size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">Delete request?</h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                You’re about to delete the request from{" "}
                <span className="font-semibold text-white">
                  {deleteTarget?.full_name}
                </span>
                . This action can’t be undone.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {deleteError}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDeleteDialog}
              disabled={deleting}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleting}
              className="flex items-center justify-center gap-2 rounded-full bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600 disabled:opacity-60"
            >
              {deleting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 size={15} />
                  Delete
                </>
              )}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
