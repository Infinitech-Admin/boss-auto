"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, BellOff, BellRing, Loader2 } from "lucide-react";
import { subscribePush, unsubscribePush } from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";

type Status = "loading" | "unsupported" | "idle" | "subscribed" | "denied";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function sendToServer(sub: PushSubscription) {
  const json = sub.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) throw new Error("Bad subscription");
  await subscribePush({ endpoint: json.endpoint, keys: { p256dh, auth } });
}

/**
 * Bell button: turns phone/browser notifications on or off.
 * Hidden on browsers that can't do push (e.g. iPhone Safari outside an
 * installed home-screen app). Pass the same classes as your other round
 * header buttons, e.g. `${glowBlue} ${focusRing}`.
 */
export default function NotificationBell({
  className = "",
}: {
  className?: string;
}) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);

  const showNotice = (text: string) => {
    setNotice(text);
    window.clearTimeout(noticeTimer.current);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 4500);
  };

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const supported =
        VAPID_PUBLIC_KEY &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window;

      if (!supported) {
        setStatus("unsupported");
        return;
      }

      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
        if (cancelled) return;

        if (Notification.permission === "denied") {
          setStatus("denied");
          return;
        }

        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;

        if (existing && Notification.permission === "granted") {
          setStatus("subscribed");
          // Quietly re-save it in case the server lost it or the browser rotated it.
          sendToServer(existing).catch(() => {});
        } else {
          setStatus("idle");
        }
      } catch {
        if (!cancelled) setStatus("unsupported");
      }
    }

    init();
    return () => {
      cancelled = true;
      window.clearTimeout(noticeTimer.current);
    };
  }, []);

  async function enable() {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "idle");
        showNotice(
          permission === "denied"
            ? "Notifications are blocked. Turn them on in your browser or phone settings."
            : "Notifications were not turned on.",
        );
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const sub =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        }));

      await sendToServer(sub);
      setStatus("subscribed");
      showNotice("Done! You'll get updates from Boss Auto Exchange.");
    } catch {
      showNotice("Couldn't turn on notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const sub = await registration.pushManager.getSubscription();
      if (sub) {
        await unsubscribePush(sub.endpoint).catch(() => {});
        await sub.unsubscribe();
      }
      setStatus("idle");
      showNotice("Notifications turned off.");
    } catch {
      showNotice("Couldn't turn off notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function handleClick() {
    if (busy) return;
    if (status === "subscribed") return void disable();
    if (status === "denied") {
      return showNotice(
        "Notifications are blocked. Turn them on in your browser or phone settings.",
      );
    }
    void enable();
  }

  if (status === "loading" || status === "unsupported") return null;

  const label =
    status === "subscribed"
      ? "Notifications on. Tap to turn off"
      : status === "denied"
        ? "Notifications blocked"
        : "Get notified about announcements";

  const Icon = busy
    ? Loader2
    : status === "subscribed"
      ? BellRing
      : status === "denied"
        ? BellOff
        : Bell;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        title={label}
        className={`relative flex h-11 w-11 items-center justify-center rounded-full border bg-[#040E21]/30 text-white backdrop-blur-md transition-all duration-300 hover:text-[#FF5C68] sm:h-12 sm:w-12 ${className}`}
      >
        <Icon
          size={20}
          strokeWidth={2}
          className={busy ? "animate-spin" : ""}
        />
        {status === "subscribed" && !busy && (
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#D41F2D] ring-2 ring-[#040E21]" />
        )}
      </button>

      {notice && (
        <div
          role="status"
          className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/10 bg-[#071A38] p-3 text-xs leading-5 text-zinc-200 shadow-xl"
        >
          {notice}
        </div>
      )}
    </div>
  );
}
