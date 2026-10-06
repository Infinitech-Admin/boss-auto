"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import {
  deleteAdminTestDrive,
  fetchAdminTestDrives,
  TEST_DRIVE_STATUSES,
  updateAdminTestDrive,
  type ApiError,
  type TestDriveBooking,
  type TestDriveStatus,
} from "@/lib/api";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** "2026-10-05" (or ISO datetime) -> "Mon, Oct 5, 2026" */
const formatScheduleDate = (value: string) => {
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/** "13:00" or "13:00:00" -> "1:00 PM" */
const formatTime = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return "—";
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
};

const bookingLabel = (b: TestDriveBooking) => `#${b.id}`;

const vehicleName = (b: TestDriveBooking) =>
  b.vehicle_name || (b.vehicle_id ? `Vehicle #${b.vehicle_id}` : "—");

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-[#D41F2D]/10 text-[#E8404B]",
  confirmed: "bg-[#D41F2D]/10 text-[#E8404B]",
  completed: "bg-zinc-500/15 text-zinc-300",
  cancelled: "bg-[#D41F2D]/10 text-[#E8404B]",
};

const FALLBACK_STATUS_STYLE = "bg-zinc-500/15 text-zinc-400";

const statusStyle = (status: string) =>
  STATUS_STYLES[status.toLowerCase()] ?? FALLBACK_STATUS_STYLE;

const statusLabel = (status: string) =>
  status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");

const STATUS_FILTERS = ["All", ...TEST_DRIVE_STATUSES];

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
      <span className="break-words text-right font-medium text-white">
        {children}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function TestDrivesClient() {
  const [bookings, setBookings] = useState<TestDriveBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const [selected, setSelected] = useState<TestDriveBooking | null>(null);

  // Editing (inside the details dialog)
  const [nextStatus, setNextStatus] = useState<TestDriveStatus>("pending");
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveNotice, setSaveNotice] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Fetch whenever page / search / status changes (or Refresh is clicked).
  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAdminTestDrives({
          page,
          search: debouncedSearch || undefined,
          status: statusFilter === "All" ? undefined : statusFilter,
        });
        if (cancelled) return;
        setBookings(res.data);
        setLastPage(res.last_page);
        setTotal(res.total);
      } catch (err) {
        if (cancelled) return;
        setError((err as ApiError).message || "Failed to load bookings.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, statusFilter, reloadKey]);

  const closeDetails = useCallback(() => setSelected(null), []);

  // Reset the editor whenever a different booking is opened.
  useEffect(() => {
    setNextStatus(selected?.status ?? "pending");
    setAdminNotes(selected?.admin_notes ?? "");
    setSaveError("");
    setSaveNotice("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  const statusChanged = !!selected && nextStatus !== selected.status;
  const notesChanged =
    !!selected && adminNotes.trim() !== (selected.admin_notes ?? "");
  const dirty = statusChanged || notesChanged;

  async function save() {
    if (!selected || !dirty) return;

    setSaving(true);
    setSaveError("");
    setSaveNotice("");
    try {
      const { data } = await updateAdminTestDrive(selected.id, {
        ...(statusChanged ? { status: nextStatus } : {}),
        ...(notesChanged ? { admin_notes: adminNotes.trim() || null } : {}),
      });
      setBookings((prev) => prev.map((b) => (b.id === data.id ? data : b)));
      setSelected(data);
      setAdminNotes(data.admin_notes ?? "");
      setSaveNotice("Changes saved.");
    } catch (err) {
      const apiErr = err as ApiError;
      setSaveError(
        apiErr.errors?.status?.[0] ||
          apiErr.errors?.admin_notes?.[0] ||
          apiErr.message ||
          "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function removeBooking() {
    if (!selected) return;
    if (
      !window.confirm(
        `Delete booking ${bookingLabel(selected)}? This can't be undone.`,
      )
    )
      return;

    setDeleting(true);
    setSaveError("");
    try {
      await deleteAdminTestDrive(selected.id);
      setSelected(null);
      setReloadKey((k) => k + 1);
    } catch (err) {
      setSaveError((err as ApiError).message || "Failed to delete booking.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Test drive bookings
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review test drive requests and confirm schedules.
          </p>
        </div>
        <button
          onClick={() => setReloadKey((k) => k + 1)}
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
            placeholder="Search by name, email or phone..."
            className="w-full rounded-xl border border-white/10 bg-[#0A2A5C]/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60"
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
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
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
          Loading bookings...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {total} booking{total !== 1 ? "s" : ""} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#0A2A5C]/70 lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Booking</th>
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Vehicle</th>
                  <th className="px-5 py-3 font-medium">Schedule</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Requested</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr
                    key={b.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                          <CalendarCheck size={16} />
                        </span>
                        <span className="font-medium text-white">
                          {bookingLabel(b)}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <p className="font-medium text-white">{b.full_name}</p>
                      <p className="text-xs text-zinc-500">{b.email}</p>
                    </td>
                    <td className="px-5 py-3 text-zinc-300">
                      {vehicleName(b)}
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-white">
                        {formatScheduleDate(b.preferred_date)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatTime(b.preferred_time)}
                      </p>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(b.status)}`}
                      >
                        {statusLabel(b.status)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {formatDate(b.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setSelected(b)}
                          title="View details"
                          aria-label={`View booking ${bookingLabel(b)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#D41F2D]"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bookings.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No bookings match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {bookings.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelected(b)}
                className="rounded-2xl border border-white/10 bg-[#0A2A5C]/70 p-4 text-left transition-colors hover:border-[#D41F2D]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                      <CalendarCheck size={18} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {b.full_name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {bookingLabel(b)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(b.status)}`}
                  >
                    {statusLabel(b.status)}
                  </span>
                </div>

                <p className="mt-4 text-sm font-semibold text-white">
                  {vehicleName(b)}
                </p>

                <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span>
                    {formatScheduleDate(b.preferred_date)} ·{" "}
                    {formatTime(b.preferred_time)}
                  </span>
                  <span className="text-zinc-500">
                    {formatDate(b.created_at)}
                  </span>
                </div>
              </button>
            ))}
            {bookings.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#0A2A5C]/70 py-10 text-center text-sm text-zinc-500">
                No bookings match your search.
              </div>
            )}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Page {page} of {lastPage}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Previous page"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  aria-label="Next page"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Booking details dialog */}
      {mounted && (
        <Dialog open={!!selected} onClose={closeDetails}>
          {selected && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold text-white">
                    Booking {bookingLabel(selected)}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Requested {formatDate(selected.created_at)}
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

              {/* Manage: status + admin notes */}
              <section className="mt-5 rounded-xl border border-[#D41F2D]/20 bg-[#061B3D]/20 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Manage booking
                </h3>

                <label className="mb-1.5 block text-xs text-zinc-400">
                  Status
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => {
                    setNextStatus(e.target.value as TestDriveStatus);
                    setSaveError("");
                    setSaveNotice("");
                  }}
                  disabled={saving || deleting}
                  className="w-full rounded-xl border border-white/10 bg-[#061B3D] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D41F2D]/60 disabled:opacity-60"
                >
                  {TEST_DRIVE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {statusLabel(status)}
                    </option>
                  ))}
                </select>

                <label className="mb-1.5 mt-4 block text-xs text-zinc-400">
                  Internal notes (not shown to the customer)
                </label>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => {
                    setAdminNotes(e.target.value);
                    setSaveError("");
                    setSaveNotice("");
                  }}
                  disabled={saving || deleting}
                  placeholder="e.g. Called customer, confirmed for 2 PM"
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#061B3D] px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60 disabled:opacity-60"
                />

                <div className="mt-3 flex justify-end">
                  <button
                    type="button"
                    onClick={save}
                    disabled={saving || deleting || !dirty}
                    className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {saving && <Loader2 size={15} className="animate-spin" />}
                    {saving ? "Saving..." : "Save changes"}
                  </button>
                </div>

                {saveError && (
                  <p className="mt-3 rounded-lg border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-3 py-2 text-xs text-[#E8404B]">
                    {saveError}
                  </p>
                )}
                {saveNotice && (
                  <p className="mt-3 rounded-lg border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-3 py-2 text-xs text-[#E8404B]">
                    {saveNotice}
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
                  <DetailRow label="Email">
                    <a
                      href={`mailto:${selected.email}`}
                      className="hover:text-[#D41F2D]"
                    >
                      {selected.email}
                    </a>
                  </DetailRow>
                  <DetailRow label="Phone">
                    <a
                      href={`tel:${selected.phone}`}
                      className="hover:text-[#D41F2D]"
                    >
                      {selected.phone}
                    </a>
                  </DetailRow>
                </section>

                {/* Booking */}
                <section className="rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                  <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                    Schedule
                  </h3>
                  <DetailRow label="Vehicle">{vehicleName(selected)}</DetailRow>
                  <DetailRow label="Date">
                    {formatScheduleDate(selected.preferred_date)}
                  </DetailRow>
                  <DetailRow label="Time">
                    <span className="text-[#D41F2D]">
                      {formatTime(selected.preferred_time)}
                    </span>
                  </DetailRow>
                </section>
              </div>

              {/* Customer notes */}
              <section className="mt-5 rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Customer notes
                </h3>
                {selected.notes ? (
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                    {selected.notes}
                  </p>
                ) : (
                  <p className="text-sm text-zinc-500">No notes provided.</p>
                )}
              </section>

              {/* Danger zone */}
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={removeBooking}
                  disabled={deleting || saving}
                  className="flex items-center gap-2 rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/5 px-4 py-2 text-xs font-medium text-[#E8404B] transition-colors hover:bg-[#D41F2D]/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {deleting ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                  {deleting ? "Deleting..." : "Delete booking"}
                </button>
              </div>
            </>
          )}
        </Dialog>
      )}
    </div>
  );
}
