"use client";

import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertTriangle,
  Film,
  FileText,
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import {
  deleteAdminBlogPost,
  fetchAdminBlogPosts,
  resolveMediaUrl,
  type ApiError,
  type BlogPost,
} from "@/lib/api";
import BlogFormDrawer from "@/components/admin/blog-form-drawer";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------ Reusable dialog ----------------------------- */

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

/* ------------------------------- Row actions ------------------------------- */

function RowActions({
  post,
  onEdit,
  onDelete,
}: {
  post: BlogPost;
  onEdit: (p: BlogPost) => void;
  onDelete: (p: BlogPost) => void;
}) {
  const btn =
    "flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-zinc-300 transition-colors hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#FF5C68]";

  return (
    <div className="flex items-center justify-end gap-1.5">
      <button
        type="button"
        onClick={() => onEdit(post)}
        title="Edit"
        aria-label={`Edit ${post.title}`}
        className={btn}
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={() => onDelete(post)}
        title="Delete"
        aria-label={`Delete ${post.title}`}
        className={btn}
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
}

function Thumb({
  post,
  baseUrl,
  size,
}: {
  post: BlogPost;
  baseUrl: string;
  size: string;
}) {
  return (
    <span
      className={`flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[#D41F2D]/15 text-[#FF5C68]`}
    >
      {post.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveMediaUrl(post.image, baseUrl)}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : post.video ? (
        <Film size={16} />
      ) : (
        <FileText size={16} />
      )}
    </span>
  );
}

function MediaBadges({ post }: { post: BlogPost }) {
  return (
    <div className="flex items-center gap-1.5">
      {post.image && (
        <span className="inline-flex items-center gap-1 rounded-full bg-white/5 px-2 py-0.5 text-[11px] text-zinc-300">
          <ImageIcon size={11} /> Image
        </span>
      )}
      {post.video && (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#D41F2D]/10 px-2 py-0.5 text-[11px] text-[#FF5C68]">
          <Film size={11} /> Video
        </span>
      )}
      {!post.image && !post.video && (
        <span className="text-[11px] text-zinc-500">Text only</span>
      )}
    </div>
  );
}

/* ----------------------------------- Page ---------------------------------- */

export default function BlogClient({ imageBaseUrl }: { imageBaseUrl: string }) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [drawerPost, setDrawerPost] = useState<BlogPost | null | undefined>(
    undefined,
  );

  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
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
      const { data } = await fetchAdminBlogPosts();
      setPosts(data);
    } catch (err) {
      setError((err as ApiError).message || "Failed to load blog posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q),
    );
  }, [posts, search]);

  const openDeleteDialog = (post: BlogPost) => {
    setDeleteError("");
    setDeleteTarget(post);
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
      await deleteAdminBlogPost(deleteTarget.id);
      setPosts((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError((err as ApiError).message || "Failed to delete post.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white sm:text-2xl">Blog</h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage blog posts, photos, and videos.
          </p>
        </div>
        <button
          onClick={() => setDrawerPost(null)}
          className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white transition-all hover:brightness-105"
        >
          <Plus size={16} />
          New post
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
          placeholder="Search by title or description..."
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
          Loading posts...
        </div>
      ) : (
        <>
          <p className="text-xs text-zinc-500">
            {filtered.length} post{filtered.length !== 1 ? "s" : ""} found
          </p>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-white/10 bg-[#071A38]/70 lg:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Post</th>
                  <th className="px-5 py-3 font-medium">Media</th>
                  <th className="px-5 py-3 font-medium">Created</th>
                  <th className="px-5 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Thumb
                          post={p}
                          baseUrl={imageBaseUrl}
                          size="h-10 w-14"
                        />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-white">
                            {p.title}
                          </p>
                          <p className="line-clamp-1 max-w-md text-xs text-zinc-500">
                            {p.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <MediaBadges post={p} />
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {formatDate(p.created_at)}
                    </td>
                    <td className="px-5 py-3">
                      <RowActions
                        post={p}
                        onEdit={setDrawerPost}
                        onDelete={openDeleteDialog}
                      />
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-zinc-500"
                    >
                      No posts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile / tablet cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:hidden">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-white/10 bg-[#071A38]/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Thumb post={p} baseUrl={imageBaseUrl} size="h-10 w-14" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">
                        {p.title}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDate(p.created_at)}
                      </p>
                    </div>
                  </div>
                  <RowActions
                    post={p}
                    onEdit={setDrawerPost}
                    onDelete={openDeleteDialog}
                  />
                </div>
                <p className="mt-3 line-clamp-2 text-xs text-zinc-400">
                  {p.description}
                </p>
                <div className="mt-3">
                  <MediaBadges post={p} />
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full rounded-2xl border border-white/10 bg-[#071A38]/70 py-10 text-center text-sm text-zinc-500">
                No posts found.
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete confirmation */}
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
              <h2 className="text-lg font-bold text-white">Delete post?</h2>
              <p className="mt-1.5 text-sm leading-6 text-zinc-400">
                You’re about to delete{" "}
                <span className="font-semibold text-white">
                  {deleteTarget?.title}
                </span>
                . Its image and video files will be removed too. This can’t be
                undone.
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

      {drawerPost !== undefined && (
        <BlogFormDrawer
          post={drawerPost ?? undefined}
          imageBaseUrl={imageBaseUrl}
          onClose={() => setDrawerPost(undefined)}
          onSaved={load}
        />
      )}
    </div>
  );
}
