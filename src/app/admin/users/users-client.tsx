"use client";

import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  BadgeCheck,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Eye,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  approveAdminUser,
  fetchAdminUsers,
  isAbortError,
  rejectAdminUser,
  type AdminUser,
  type ApiError,
  type UserRole,
  type UserStatus,
} from "@/lib/api";

type Tab = "all" | "customer" | "reseller" | "agent" | "pending";

const TABS: { value: Tab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "customer", label: "Customers" },
  { value: "reseller", label: "Resellers" },
  { value: "agent", label: "Agents" },
  { value: "pending", label: "Pending" },
];

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/** Customers (and admins) never go through approval. */
function needsApproval(role: UserRole) {
  return role === "reseller" || role === "agent";
}

/* ------------------------------ Reusable dialog ----------------------------- */

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
        className="absolute inset-0 bg-[#040E21]/70 backdrop-blur-sm"
        onClick={() => {
          if (!busy) onClose();
        }}
      />
      <div
        className={`relative max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#040E21] p-6 shadow-2xl ${
          wide ? "max-w-lg" : "max-w-md"
        }`}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/* --------------------------------- Badges ---------------------------------- */

const ROLE_STYLES: Record<UserRole, string> = {
  customer: "bg-white/5 text-zinc-300",
  reseller: "bg-sky-500/10 text-sky-300",
  agent: "bg-violet-500/10 text-violet-300",
  admin: "bg-amber-500/10 text-amber-300",
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${ROLE_STYLES[role] ?? ROLE_STYLES.customer}`}
    >
      {role}
    </span>
  );
}

const STATUS_STYLES: Record<UserStatus, string> = {
  pending: "bg-amber-500/10 text-amber-300",
  approved: "bg-emerald-500/10 text-emerald-300",
  rejected: "bg-[#D41F2D]/10 text-[#FF5C68]",
};

function StatusBadge({ user }: { user: AdminUser }) {
  // Customers don't use approval, so show their email verification instead.
  if (!needsApproval(user.role)) {
    return user.email_verified ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
        <BadgeCheck size={11} /> Verified
      </span>
    ) : (
      <span className="inline-flex rounded-full bg-white/5 px-2.5 py-0.5 text-[11px] font-semibold text-zinc-400">
        Unverified
      </span>
    );
  }

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_STYLES[user.status]}`}
    >
      {user.status}
    </span>
  );
}

/* ------------------------------- Row actions ------------------------------- */

function RowActions({
  user,
  onView,
  onApprove,
  onReject,
}: {
  user: AdminUser;
  onView: (u: AdminUser) => void;
  onApprove: (u: AdminUser) => void;
  onReject: (u: AdminUser) => void;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors";
  const canDecide = needsApproval(user.role);

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onView(user)}
        title="View details"
        aria-label={`View ${user.name}`}
        className={`${btn} hover:border-white/25 hover:bg-white/10 hover:text-white`}
      >
        <Eye size={14} />
      </button>
      {canDecide && user.status !== "approved" && (
        <button
          type="button"
          onClick={() => onApprove(user)}
          title="Approve"
          aria-label={`Approve ${user.name}`}
          className={`${btn} hover:border-emerald-400/50 hover:bg-emerald-500/10 hover:text-emerald-300`}
        >
          <CheckCircle2 size={14} />
        </button>
      )}
      {canDecide && user.status !== "rejected" && (
        <button
          type="button"
          onClick={() => onReject(user)}
          title={user.status === "approved" ? "Revoke access" : "Reject"}
          aria-label={`Reject ${user.name}`}
          className={`${btn} hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#FF5C68]`}
        >
          <XCircle size={14} />
        </button>
      )}
    </div>
  );
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#D41F2D]/15 text-sm font-bold uppercase text-[#FF5C68]">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        name.trim().charAt(0) || "?"
      )}
    </span>
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
    <div>
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 whitespace-pre-line text-sm leading-6 text-zinc-200">
        {children}
      </dd>
    </div>
  );
}

/* ----------------------------------- Page ---------------------------------- */

export default function UsersClient() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const [viewTarget, setViewTarget] = useState<AdminUser | null>(null);
  const [decision, setDecision] = useState<{
    user: AdminUser;
    action: "approve" | "reject";
  } | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  // Back to page 1 whenever the filter changes.
  useEffect(() => {
    setPage(1);
  }, [tab, debouncedSearch]);

  const refreshPendingCount = useCallback(async () => {
    try {
      const res = await fetchAdminUsers({ status: "pending", page: 1 });
      setPendingCount(res.total);
    } catch {
      /* the badge is non-critical */
    }
  }, []);

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setLoading(true);
      setError("");
      try {
        const res = await fetchAdminUsers(
          {
            role:
              tab === "customer" || tab === "reseller" || tab === "agent"
                ? tab
                : undefined,
            status: tab === "pending" ? "pending" : undefined,
            search: debouncedSearch || undefined,
            page,
          },
          { signal },
        );
        setUsers(res.data);
        setLastPage(res.last_page);
        setTotal(res.total);
        if (tab === "pending") setPendingCount(res.total);
      } catch (err) {
        if (isAbortError(err)) return;
        setError((err as ApiError).message || "Failed to load users.");
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [tab, debouncedSearch, page],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  useEffect(() => {
    refreshPendingCount();
  }, [refreshPendingCount]);

  const openDecision = (user: AdminUser, action: "approve" | "reject") => {
    setActionError("");
    setDecision({ user, action });
  };

  const closeDecision = useCallback(() => {
    setDecision(null);
    setActionError("");
  }, []);

  async function confirmDecision() {
    if (!decision) return;
    const { user, action } = decision;
    setActing(true);
    setActionError("");
    try {
      const { data } =
        action === "approve"
          ? await approveAdminUser(user.id)
          : await rejectAdminUser(user.id);

      setUsers((prev) =>
        tab === "pending"
          ? prev.filter((u) => u.id !== user.id)
          : prev.map((u) => (u.id === user.id ? data : u)),
      );
      if (tab === "pending") setTotal((t) => Math.max(0, t - 1));
      setViewTarget((v) => (v && v.id === user.id ? data : v));
      setDecision(null);
      refreshPendingCount();
    } catch (err) {
      setActionError(
        (err as ApiError).message ||
          `Failed to ${action === "approve" ? "approve" : "reject"} user.`,
      );
    } finally {
      setActing(false);
    }
  }

  const isApprove = decision?.action === "approve";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl">Users</h1>
        <p className="mt-1 text-sm text-zinc-400">
          Manage customers, and review reseller and agent applications.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => {
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                active
                  ? "border-[#D41F2D] bg-[#D41F2D]/15 text-white"
                  : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/25 hover:text-white"
              }`}
            >
              {t.label}
              {t.value === "pending" && pendingCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#D41F2D] px-1.5 text-[11px] font-bold text-white">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full rounded-xl border border-white/10 bg-[#071A38]/70 py-2.5 pl-10 pr-4 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-white/10 bg-[#071A38]/70 py-16 text-sm text-zinc-400">
          <Loader2 size={18} className="mr-2 animate-spin text-[#FF5C68]" />
          Loading users...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {total} user{total !== 1 ? "s" : ""} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#071A38]/70 lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Location</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} src={u.photo_url} />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {u.name}
                          </p>
                          <p className="truncate text-xs text-zinc-500">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {u.location || "—"}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge user={u} />
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {formatDate(u.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <RowActions
                        user={u}
                        onView={setViewTarget}
                        onApprove={(x) => openDecision(x, "approve")}
                        onReject={(x) => openDecision(x, "reject")}
                      />
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {users.map((u) => (
              <div
                key={u.id}
                className="rounded-2xl border border-white/10 bg-[#071A38]/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.name} src={u.photo_url} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {u.name}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {u.email}
                      </p>
                    </div>
                  </div>
                  <RowActions
                    user={u}
                    onView={setViewTarget}
                    onApprove={(x) => openDecision(x, "approve")}
                    onReject={(x) => openDecision(x, "reject")}
                  />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <RoleBadge role={u.role} />
                  <StatusBadge user={u} />
                  {u.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                      <MapPin size={11} /> {u.location}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-xs text-zinc-500">
                  Joined {formatDate(u.created_at)}
                </p>
              </div>
            ))}
            {users.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#071A38]/70 py-10 text-center text-sm text-zinc-500">
                No users found.
              </div>
            )}
          </div>

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-500">
                Page {page} of {lastPage}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft size={15} /> Prev
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
                  disabled={page >= lastPage}
                  className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Details */}
      {mounted && (
        <Dialog open={!!viewTarget} onClose={() => setViewTarget(null)} wide>
          {viewTarget && (
            <>
              <div className="flex items-center gap-4">
                <Avatar name={viewTarget.name} src={viewTarget.photo_url} />
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-bold text-white">
                    {viewTarget.name}
                  </h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <RoleBadge role={viewTarget.role} />
                    <StatusBadge user={viewTarget} />
                  </div>
                </div>
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <DetailRow label="Email">{viewTarget.email}</DetailRow>
                <DetailRow label="Phone">{viewTarget.phone || "—"}</DetailRow>
                <DetailRow label="Location">
                  {viewTarget.location || "—"}
                </DetailRow>
                <DetailRow label="Joined">
                  {formatDate(viewTarget.created_at)}
                </DetailRow>
                {needsApproval(viewTarget.role) && (
                  <DetailRow label="Approved on">
                    {formatDate(viewTarget.approved_at)}
                  </DetailRow>
                )}
              </dl>

              {needsApproval(viewTarget.role) && (
                <dl className="mt-4 space-y-4">
                  <DetailRow label="Experience">
                    {viewTarget.experience || "—"}
                  </DetailRow>
                  <DetailRow label="Message">
                    {viewTarget.message || "—"}
                  </DetailRow>
                  <DetailRow label="Valid ID">
                    {viewTarget.id_url ? (
                      <a
                        href={viewTarget.id_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-block"
                        title="Open full size"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={viewTarget.id_url}
                          alt={`ID of ${viewTarget.name}`}
                          className="max-h-48 rounded-xl border border-white/10 object-contain transition-opacity group-hover:opacity-80"
                        />
                      </a>
                    ) : (
                      "Not provided"
                    )}
                  </DetailRow>
                </dl>
              )}

              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setViewTarget(null)}
                  className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                >
                  Close
                </button>
                {needsApproval(viewTarget.role) &&
                  viewTarget.status !== "rejected" && (
                    <button
                      type="button"
                      onClick={() => openDecision(viewTarget, "reject")}
                      className="rounded-full border border-[#D41F2D]/40 px-5 py-2.5 text-sm font-semibold text-[#FF5C68] transition-colors hover:bg-[#D41F2D]/10"
                    >
                      {viewTarget.status === "approved" ? "Revoke" : "Reject"}
                    </button>
                  )}
                {needsApproval(viewTarget.role) &&
                  viewTarget.status !== "approved" && (
                    <button
                      type="button"
                      onClick={() => openDecision(viewTarget, "approve")}
                      className="rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-500"
                    >
                      Approve
                    </button>
                  )}
              </div>
            </>
          )}
        </Dialog>
      )}

      {/* Approve / reject confirmation */}
      {mounted && (
        <Dialog open={!!decision} onClose={closeDecision} busy={acting}>
          <div className="flex items-start gap-4">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                isApprove
                  ? "bg-emerald-500/10 text-emerald-300"
                  : "bg-[#D41F2D]/10 text-[#FF5C68]"
              }`}
            >
              {isApprove ? (
                <ShieldCheck size={20} />
              ) : (
                <AlertTriangle size={20} />
              )}
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">
                {isApprove
                  ? "Approve application?"
                  : decision?.user.status === "approved"
                    ? "Revoke access?"
                    : "Reject application?"}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                {isApprove ? (
                  <>
                    <span className="font-semibold text-white">
                      {decision?.user.name}
                    </span>{" "}
                    will be approved as a {decision?.user.role} and can log in
                    to their account.
                  </>
                ) : (
                  <>
                    <span className="font-semibold text-white">
                      {decision?.user.name}
                    </span>{" "}
                    will not be able to log in as a {decision?.user.role}. You
                    can approve them again later.
                  </>
                )}
              </p>
            </div>
          </div>

          {actionError && (
            <div className="mt-4 rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]">
              {actionError}
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeDecision}
              disabled={acting}
              className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDecision}
              disabled={acting}
              className={`flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white transition-colors disabled:opacity-60 ${
                isApprove
                  ? "bg-emerald-600 hover:bg-emerald-500"
                  : "bg-[#D41F2D] hover:bg-[#E8404B]"
              }`}
            >
              {acting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving...
                </>
              ) : isApprove ? (
                <>
                  <CheckCircle2 size={15} />
                  Approve
                </>
              ) : (
                <>
                  <XCircle size={15} />
                  {decision?.user.status === "approved" ? "Revoke" : "Reject"}
                </>
              )}
            </button>
          </div>
        </Dialog>
      )}
    </div>
  );
}
