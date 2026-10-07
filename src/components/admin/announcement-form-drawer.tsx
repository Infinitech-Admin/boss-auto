"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Loader2, X } from "lucide-react";
import {
  createAnnouncement,
  updateAnnouncement,
  type Announcement,
  type ApiError,
} from "@/lib/api";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#040E21]/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 outline-none focus:border-[#D41F2D]/60";

const TITLE_MAX = 150;
const MESSAGE_MAX = 1000;

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

export default function AnnouncementFormDrawer({
  announcement,
  onClose,
  onSaved,
}: {
  announcement?: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEditing = Boolean(announcement);

  const [title, setTitle] = useState(announcement?.title ?? "");
  const [message, setMessage] = useState(announcement?.message ?? "");
  const [url, setUrl] = useState(announcement?.url ?? "");
  const [isPublished, setIsPublished] = useState(
    announcement?.is_published ?? true,
  );
  // New announcements notify by default; edits don't, so a typo fix won't ping everyone.
  const [sendPush, setSendPush] = useState(!announcement);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const willNotify = isPublished && sendPush;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    const cleanUrl = url.trim();

    if (!title.trim()) return setError("Title is required.");
    if (!message.trim()) return setError("Message is required.");
    if (cleanUrl && !/^(\/|https?:\/\/)/i.test(cleanUrl)) {
      return setError(
        'Link must start with "/" (e.g. /showroom) or "https://".',
      );
    }

    const payload = {
      title: title.trim(),
      message: message.trim(),
      url: cleanUrl || null,
      is_published: isPublished,
      send_push: isPublished && sendPush,
    };

    setSaving(true);
    try {
      if (announcement) {
        await updateAnnouncement(announcement.id, payload);
      } else {
        await createAnnouncement(payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError((err as ApiError).message || "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#040E21]/60 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-[#040E21] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <h2 className="text-lg font-bold text-white">
            {isEditing ? "Edit announcement" : "New announcement"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-6">
            {error && (
              <div className="rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]">
                {error}
              </div>
            )}

            <Field label="Title" hint={`${title.length}/${TITLE_MAX}`}>
              <input
                required
                maxLength={TITLE_MAX}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={inputClass}
                placeholder="e.g. New arrivals this weekend"
              />
            </Field>

            <Field label="Message" hint={`${message.length}/${MESSAGE_MAX}`}>
              <textarea
                required
                rows={5}
                maxLength={MESSAGE_MAX}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={inputClass}
                placeholder="Keep it short. This is what customers will read."
              />
            </Field>

            <Field
              label="Link (optional)"
              hint="Where it opens when tapped. Use /showroom or a full https:// link."
            >
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className={inputClass}
                placeholder="/showroom"
              />
            </Field>

            <label className="flex items-center gap-3 text-sm text-zinc-300">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-[#040E21] text-[#FF5C68] focus:ring-[#D41F2D]"
              />
              Published (visible to customers)
            </label>

            {isPublished && (
              <div>
                <label className="flex items-center gap-3 text-sm text-zinc-300">
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={(e) => setSendPush(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 bg-[#040E21] text-[#FF5C68] focus:ring-[#D41F2D]"
                  />
                  {announcement?.push_sent_at
                    ? "Send the phone notification again"
                    : "Send a phone notification"}
                </label>
                <p className="mt-1.5 pl-7 text-xs text-zinc-500">
                  Sent once, right after you save. Only customers who turned on
                  notifications will get it.
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60"
            >
              {saving && <Loader2 size={15} className="animate-spin" />}
              {isEditing
                ? willNotify
                  ? "Save & notify"
                  : "Save changes"
                : isPublished
                  ? willNotify
                    ? "Publish & notify"
                    : "Publish announcement"
                  : "Save as draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
