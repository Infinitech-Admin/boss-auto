"use client";

import { useEffect, useState } from "react";
import { enablePush } from "@/lib/push";

const DISMISS_KEY = "push-prompt-dismissed-at";
const DISMISS_DAYS = 7;

export default function NotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    if (Notification.permission === "denied") return;

    try {
      const last = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (last && Date.now() - last < DISMISS_DAYS * 86400000) return;
    } catch {}

    let cancelled = false;

    const timer = setTimeout(async () => {
      let subscribed = false;
      try {
        const reg = await navigator.serviceWorker?.getRegistration();
        subscribed = !!(reg && (await reg.pushManager.getSubscription()));
      } catch {}

      if (!cancelled && !subscribed) setOpen(true);
    }, 2000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
    setOpen(false);
  }

  async function handleEnable() {
    setLoading(true);
    setError(null);
    try {
      const ok = await enablePush();
      if (ok) {
        setOpen(false);
      } else {
        // Permission denied or push not supported on this device
        dismiss();
      }
    } catch (e) {
      console.error("[push] enable failed:", e);
      const status = (e as { status?: number })?.status;
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      setError(status ? `${msg} (HTTP ${status})` : msg);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="push-prompt-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0B2347] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-3xl">
          🔔
        </div>

        <h2 id="push-prompt-title" className="text-lg font-semibold text-white">
          Stay in the loop
        </h2>
        <p className="mt-2 text-sm text-white/70">
          Turn on notifications to get the latest announcements, new arrivals,
          and updates right on your device.
        </p>

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-6 flex flex-col gap-2">
          <button
            onClick={handleEnable}
            disabled={loading}
            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[#071A38] transition hover:bg-white/90 disabled:opacity-60"
          >
            {loading ? "Enabling..." : "Enable notifications"}
          </button>
          <button
            onClick={dismiss}
            disabled={loading}
            className="rounded-lg px-4 py-2.5 text-sm text-white/60 transition hover:text-white"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
