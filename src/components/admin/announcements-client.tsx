"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Bell,
  ExternalLink,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  deleteAdminAnnouncement,
  fetchAdminAnnouncements,
  fetchPushSubscriberCount,
  type Announcement,
  type ApiError,
} from "@/lib/api";
import AnnouncementFormDrawer from "@/components/admin/announcement-form-drawer";

function formatDate(value: string | null) {
  if (!value) return "Not published yet";
  return new Date(value).toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Dialog({
  open,
  onClose,
  children,
  busy = false,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  busy?: boolean;
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
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-[#040E21] p-6 shadow-2xl">
        {children}
      </div>
    </div>,
    document.body,
  );
}

export default function AnnouncementsClient() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [drawerItem, setDrawerItem] = useState<Announcement | null | undefined>(
    undefined,
  );

  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await fetchAdminAnnouncements();
      setItems(data);
    } catch (err) {
      setError((err as ApiError).message || "Failed to load announcements.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    fetchPushSubscriberCount()
      .then((res) => setSubscribers(res.data.subscribers))
      .catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.message.toLowerCase().includes(q),
    );
  }, [items, search]);

  const closeDeleteDialog = useCallback(() => {
    setDeleteTarget(null);
    setDeleteError("");
  }, []);

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    try {
      await deleteAdminAnnouncement(deleteTarget.id);
      setItems((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(
        (err as ApiError).message || "Failed to delete announcement.",
      );
    } finally {
      setDeleting(false);
    }
  }

  const iconBtn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#FF5C68]";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">
            Announcements
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Post updates for your customers.
          </p>
          {subscribers !== null && (
            <p className="mt-1 inline-flex items-center gap-1.5 text-xs text-zinc-500">
              <Bell size={12} />
              {subscribers} device{subscribers !== 1 ? "s" : ""} will get phone
              notifications
            </p>
          )}
        </div>
        <button
          onClick={() => setDrawerItem(null)}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105"
        >
          <Plus size={16} />
          New announcement
        </button>
      </div>

      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
        />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by title or message..."
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
          Loading announcements...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {filtered.length} announcement{filtered.length !== 1 ? "s" : ""}{" "}
            found
          </p>

          <ul className="space-y-3">
            {filtered.map((a) => (
              <li
                key={a.id}
                className="flex gap-4 rounded-2xl border border-white/10 bg-[#071A38]/70 p-4 sm:p-5"
              >
                <span className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#D41F2D]/15 text-[#FF5C68] sm:flex">
                  <Megaphone size={18} />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate text-sm font-semibold text-white sm:text-base">
                      {a.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                        a.is_published
                          ? "bg-[#D41F2D]/10 text-[#FF5C68]"
                          : "bg-white/5 text-zinc-400"
                      }`}
                    >
                      {a.is_published ? "Published" : "Draft"}
                    </span>
                    {a.push_sent_at && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
                        <Bell size={11} /> Notified
                      </span>
                    )}
                  </div>

                  <p className="mt-1.5 line-clamp-2 text-sm text-zinc-400">
                    {a.message}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                    <span>{formatDate(a.published_at)}</span>
                    {a.url && (
                      <span className="inline-flex items-center gap-1">
                        <ExternalLink size={11} />
                        {a.url}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-start gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDrawerItem(a)}
                    title="Edit"
                    aria-label={`Edit ${a.title}`}
                    className={iconBtn}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteError("");
                      setDeleteTarget(a);
                    }}
                    title="Delete"
                    aria-label={`Delete ${a.title}`}
                    className={iconBtn}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}

            {filtered.length === 0 && (
              <li className="rounded-2xl border border-white/10 bg-[#071A38]/70 py-10 text-center text-sm text-zinc-500">
                No announcements yet.
              </li>
            )}
          </ul>
        </>
      )}

      {mounted && (
        <Dialog
          open={!!deleteTarget}
          onClose={closeDeleteDialog}
          busy={deleting}
        >
          <div className="flex items-start gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#D41F2D]/10 text-[#FF5C68]">
              <AlertTriangle size={20} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white">
                Delete announcement?
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                You’re about to delete{" "}
                <span className="font-semibold text-white">
                  {deleteTarget?.title}
                </span>
                . This can’t be undone.
              </p>
            </div>
          </div>

          {deleteError && (
            <div className="mt-4 rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]">
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
              className="flex items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#E8404B] disabled:opacity-60"
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

      {drawerItem !== undefined && (
        <AnnouncementFormDrawer
          announcement={drawerItem ?? undefined}
          onClose={() => setDrawerItem(undefined)}
          onSaved={load}
        />
      )}
    </div>
  );
}
