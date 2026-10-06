// Path: <your admin folder>/contact/contact-client.tsx (next to page.tsx)
"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  Search,
  Send,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  fetchInquiries,
  fetchInquiry,
  INQUIRY_STATUSES,
  sendInquiryReply,
  updateInquiryStatus,
  type ContactApiError,
  type Inquiry,
  type InquiryStatus,
} from "@/lib/contact-api";

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const DEFAULT_SUBJECT = "Re: Your enquiry with AutoTrade";

const fullName = (i: Pick<Inquiry, "first_name" | "last_name">) =>
  `${i.first_name} ${i.last_name}`.trim();

const formatDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatDateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const STATUS_STYLES: Record<InquiryStatus, string> = {
  new: "bg-red-500/10 text-red-400",
  read: "bg-zinc-500/15 text-zinc-300",
  replied: "bg-red-500/10 text-red-400",
  closed: "bg-zinc-500/15 text-zinc-400",
};

const FALLBACK_STATUS_STYLE = "bg-zinc-500/15 text-zinc-400";

const statusStyle = (status: string) =>
  STATUS_STYLES[status as InquiryStatus] ?? FALLBACK_STATUS_STYLE;

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
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0d0d] p-6 shadow-2xl">
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

export default function ContactClient() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | InquiryStatus>(
    "All",
  );
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ lastPage: 1, total: 0 });

  // Details dialog
  const [selected, setSelected] = useState<Inquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  // Status editing
  const [nextStatus, setNextStatus] = useState<InquiryStatus>("new");
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const [updateNotice, setUpdateNotice] = useState("");

  // Email reply
  const [replySubject, setReplySubject] = useState(DEFAULT_SUBJECT);
  const [replyBody, setReplyBody] = useState("");
  const [sending, setSending] = useState(false);
  const [replyError, setReplyError] = useState("");
  const [replyNotice, setReplyNotice] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetchInquiries({
        status: statusFilter === "All" ? undefined : statusFilter,
        search: search || undefined,
        page,
      });
      setInquiries(res.data);
      setMeta({ lastPage: res.last_page, total: res.total });
    } catch (err) {
      setError((err as ContactApiError).message || "Failed to load enquiries.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  // Keep the list row in sync with changes made inside the dialog.
  const syncRow = useCallback(
    (updated: {
      id: number;
      status: InquiryStatus;
      replies_count?: number;
    }) => {
      setInquiries((prev) =>
        prev.map((i) =>
          i.id === updated.id
            ? {
                ...i,
                status: updated.status,
                replies_count: updated.replies_count ?? i.replies_count,
              }
            : i,
        ),
      );
    },
    [],
  );

  const closeDetails = useCallback(() => setSelected(null), []);

  // Reset editors whenever a different enquiry is opened.
  useEffect(() => {
    setUpdateError("");
    setUpdateNotice("");
    setReplySubject(DEFAULT_SUBJECT);
    setReplyBody("");
    setReplyError("");
    setReplyNotice("");
    setDetailError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id]);

  // Keep the status dropdown matching the real status.
  useEffect(() => {
    if (selected) setNextStatus(selected.status);
  }, [selected?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openInquiry(row: Inquiry) {
    setSelected(row);
    setDetailLoading(true);
    setDetailError("");

    try {
      let full = await fetchInquiry(row.id);

      // Opening a new enquiry marks it as read (best effort).
      if (full.status === "new") {
        try {
          const updated = await updateInquiryStatus(full.id, "read");
          full = { ...full, status: updated.status };
          syncRow({ id: full.id, status: full.status });
        } catch {
          /* ignore: the admin can still change the status manually */
        }
      }

      setSelected((current) =>
        current && current.id === full.id ? full : current,
      );
    } catch (err) {
      setDetailError(
        (err as ContactApiError).message || "Failed to load enquiry.",
      );
    } finally {
      setDetailLoading(false);
    }
  }

  async function saveStatus() {
    if (!selected || nextStatus === selected.status) return;

    setUpdating(true);
    setUpdateError("");
    setUpdateNotice("");
    try {
      const updated = await updateInquiryStatus(selected.id, nextStatus);
      setSelected((current) =>
        current ? { ...current, status: updated.status } : current,
      );
      syncRow({ id: selected.id, status: updated.status });
      setUpdateNotice("Status updated.");
    } catch (err) {
      const apiErr = err as ContactApiError;
      setUpdateError(
        apiErr.errors?.status?.[0] ||
          apiErr.message ||
          "Failed to update status.",
      );
    } finally {
      setUpdating(false);
    }
  }

  async function sendReply() {
    if (!selected) return;

    if (!replyBody.trim()) {
      setReplyError("Please write a reply message.");
      return;
    }

    setSending(true);
    setReplyError("");
    setReplyNotice("");
    try {
      const { data } = await sendInquiryReply(selected.id, {
        subject: replySubject.trim() || undefined,
        body: replyBody.trim(),
      });

      const repliesCount =
        (selected.replies_count ?? selected.replies?.length ?? 0) + 1;

      setSelected((current) =>
        current
          ? {
              ...current,
              status: "replied",
              replies_count: repliesCount,
              replies: [data, ...(current.replies ?? [])],
            }
          : current,
      );
      syncRow({
        id: selected.id,
        status: "replied",
        replies_count: repliesCount,
      });

      setReplyBody("");
      setReplySubject(DEFAULT_SUBJECT);
      setReplyNotice(`Reply emailed to ${selected.email}.`);
    } catch (err) {
      const apiErr = err as ContactApiError;
      setReplyError(
        apiErr.errors?.body?.[0] ||
          apiErr.errors?.subject?.[0] ||
          apiErr.message ||
          "Failed to send reply.",
      );
    } finally {
      setSending(false);
    }
  }

  const statusFilters: ("All" | InquiryStatus)[] = ["All", ...INQUIRY_STATUSES];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Contact Us
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Review customer enquiries and reply by email.
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
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            maxLength={100}
            placeholder="Search by name, email, phone or vehicle..."
            className="w-full rounded-xl border border-white/10 bg-[#111111]/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60"
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
              {status === "All" ? status : statusLabel(status)}
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
          Loading enquiries...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {meta.total} enquir{meta.total !== 1 ? "ies" : "y"} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#111111]/70 lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Customer</th>
                  <th className="px-5 py-3 font-medium">Phone</th>
                  <th className="px-5 py-3 font-medium">Looking for</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {inquiries.map((i) => (
                  <tr
                    key={i.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                          <Mail size={16} />
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`truncate text-white ${
                              i.status === "new" ? "font-bold" : "font-medium"
                            }`}
                          >
                            {fullName(i)}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {i.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-zinc-300">{i.phone}</td>
                    <td className="max-w-[200px] truncate px-5 py-3 text-zinc-400">
                      {i.looking_for || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(i.status)}`}
                      >
                        {statusLabel(i.status)}
                      </span>
                      {!!i.replies_count && (
                        <span className="ml-2 text-xs text-zinc-500">
                          {i.replies_count} repl
                          {i.replies_count !== 1 ? "ies" : "y"}
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {formatDate(i.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => openInquiry(i)}
                          title="View enquiry"
                          aria-label={`View enquiry from ${fullName(i)}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#D41F2D]"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {inquiries.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No enquiries match your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {inquiries.map((i) => (
              <button
                key={i.id}
                type="button"
                onClick={() => openInquiry(i)}
                className="rounded-2xl border border-white/10 bg-[#111111]/70 p-4 text-left transition-colors hover:border-[#D41F2D]/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#D41F2D]">
                      <Mail size={18} />
                    </span>
                    <div className="min-w-0">
                      <p
                        className={`truncate text-sm text-white ${
                          i.status === "new" ? "font-bold" : "font-semibold"
                        }`}
                      >
                        {fullName(i)}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {i.email}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${statusStyle(i.status)}`}
                  >
                    {statusLabel(i.status)}
                  </span>
                </div>

                <p className="mt-4 line-clamp-2 text-sm text-zinc-300">
                  {i.message}
                </p>

                <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                  <span className="truncate">{i.looking_for || i.phone}</span>
                  <span>{formatDate(i.created_at)}</span>
                </div>
              </button>
            ))}
            {inquiries.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#111111]/70 py-10 text-center text-sm text-zinc-500">
                No enquiries match your search.
              </div>
            )}
          </div>

          {/* Pagination */}
          {meta.lastPage > 1 && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={14} />
                Previous
              </button>
              <span className="text-xs text-zinc-500">
                Page {page} of {meta.lastPage}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(meta.lastPage, p + 1))}
                disabled={page >= meta.lastPage || loading}
                className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Enquiry details dialog */}
      {mounted && (
        <Dialog open={!!selected} onClose={closeDetails}>
          {selected && (
            <>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-white">
                    {fullName(selected)}
                  </h2>
                  <p className="mt-1 text-xs text-zinc-500">
                    Received {formatDateTime(selected.created_at)}
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

              {detailError && (
                <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {detailError}
                </p>
              )}

              {/* Contact details */}
              <section className="mt-5 rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Customer
                </h3>
                <DetailRow label="Name">{fullName(selected)}</DetailRow>
                <DetailRow label="Email">
                  <a
                    href={`mailto:${selected.email}`}
                    className="text-[#D41F2D] hover:underline"
                  >
                    {selected.email}
                  </a>
                </DetailRow>
                <DetailRow label="Phone">
                  <a
                    href={`tel:${selected.phone.replace(/[^\d+]/g, "")}`}
                    className="hover:text-[#D41F2D]"
                  >
                    {selected.phone}
                  </a>
                </DetailRow>
                <DetailRow label="Looking for">
                  {selected.looking_for || "—"}
                </DetailRow>
              </section>

              {/* Message */}
              <section className="mt-5">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Message
                </h3>
                <p className="whitespace-pre-wrap break-words rounded-xl border-l-2 border-[#D41F2D] bg-[#061B3D]/20 px-4 py-3 text-sm leading-6 text-zinc-200">
                  {selected.message}
                </p>
              </section>

              {/* Reply by email */}
              <section className="mt-5 rounded-xl border border-[#D41F2D]/20 bg-[#061B3D]/20 p-4">
                <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  <Send size={13} />
                  Reply by email
                </h3>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={replySubject}
                    onChange={(e) => {
                      setReplySubject(e.target.value.replace(/[\r\n]/g, ""));
                      setReplyError("");
                    }}
                    maxLength={255}
                    disabled={sending}
                    placeholder="Subject"
                    className="w-full rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60 disabled:opacity-60"
                  />
                  <textarea
                    rows={5}
                    value={replyBody}
                    onChange={(e) => {
                      setReplyBody(e.target.value);
                      setReplyError("");
                    }}
                    maxLength={10000}
                    disabled={sending}
                    placeholder={`Write your reply to ${selected.first_name}...`}
                    className="w-full resize-none rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60 disabled:opacity-60"
                  />
                </div>
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-xs text-zinc-500">
                    Sends to{" "}
                    <span className="text-zinc-300">{selected.email}</span>
                  </p>
                  <button
                    type="button"
                    onClick={sendReply}
                    disabled={sending || !replyBody.trim()}
                    className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Send size={15} />
                    )}
                    {sending ? "Sending..." : "Send reply"}
                  </button>
                </div>
                {replyError && (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {replyError}
                  </p>
                )}
                {replyNotice && (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {replyNotice}
                  </p>
                )}
              </section>

              {/* Reply history */}
              <section className="mt-5 rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Reply history
                </h3>
                {detailLoading && !selected.replies ? (
                  <p className="flex items-center gap-2 py-2 text-sm text-zinc-500">
                    <Loader2
                      size={14}
                      className="animate-spin text-[#D41F2D]"
                    />
                    Loading...
                  </p>
                ) : selected.replies && selected.replies.length > 0 ? (
                  <ul className="divide-y divide-white/5">
                    {selected.replies.map((reply) => (
                      <li key={reply.id} className="py-3 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm font-medium text-white">
                            {reply.subject}
                          </p>
                          <span className="shrink-0 text-xs text-zinc-500">
                            {formatDateTime(reply.sent_at ?? reply.created_at)}
                          </span>
                        </div>
                        <p className="mt-1 whitespace-pre-wrap break-words text-sm text-zinc-400">
                          {reply.body}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="py-2 text-sm text-zinc-500">No replies yet.</p>
                )}
              </section>

              {/* Update status */}
              <section className="mt-5 rounded-xl border border-white/10 bg-[#061B3D]/20 p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                  Update status
                </h3>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <select
                    value={nextStatus}
                    onChange={(e) => {
                      setNextStatus(e.target.value as InquiryStatus);
                      setUpdateError("");
                      setUpdateNotice("");
                    }}
                    disabled={updating}
                    className="flex-1 rounded-xl border border-white/10 bg-[#0a0a0a] px-3 py-2.5 text-sm text-white outline-none focus:border-[#D41F2D]/60 disabled:opacity-60"
                  >
                    {INQUIRY_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {statusLabel(status)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={saveStatus}
                    disabled={updating || nextStatus === selected.status}
                    className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#D41F2D] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {updating && <Loader2 size={15} className="animate-spin" />}
                    {updating ? "Saving..." : "Save status"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Sending a reply sets the status to Replied. Opening a new
                  enquiry marks it as Read.
                </p>
                {updateError && (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {updateError}
                  </p>
                )}
                {updateNotice && (
                  <p className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    {updateNotice}
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
