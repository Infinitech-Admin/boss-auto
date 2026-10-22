// File: lib/chatPush.ts
// Registers THIS browser/phone for admin chat notifications.
// Reuses the existing public /push-subscriptions endpoint (host allow-list
// included), then flags the device as an admin device.

import { apiRequest, subscribePush, type ApiError } from "@/lib/api";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""; // same key your announcements use

export interface PushResult {
  status: "enabled" | "denied" | "unsupported" | "error";
  /** Which step failed, shown to the admin so problems are easy to find. */
  detail?: string;
}

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function describe(err: unknown): string {
  const e = err as Partial<ApiError>;
  const status = e?.status ? ` (HTTP ${e.status})` : "";
  return `${e?.message ?? "Unknown error"}${status}`;
}

export async function enableAdminChatPush(): Promise<PushResult> {
  if (
    !("serviceWorker" in navigator) ||
    !("PushManager" in window) ||
    !("Notification" in window)
  ) {
    return { status: "unsupported" };
  }

  if (!VAPID_PUBLIC_KEY) {
    return {
      status: "error",
      detail:
        "NEXT_PUBLIC_VAPID_PUBLIC_KEY is missing in your Next.js env. Add it and restart.",
    };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { status: "denied" };

  // Step 1: service worker
  let registration: ServiceWorkerRegistration;
  try {
    const existing = await navigator.serviceWorker.getRegistration();
    if (!existing) {
      return {
        status: "error",
        detail:
          "No service worker is registered. Push only works on a production build (next build + next start) or your deployed site; next-pwa is usually off in dev.",
      };
    }
    registration = await navigator.serviceWorker.ready;
  } catch (err) {
    return { status: "error", detail: `Service worker: ${describe(err)}` };
  }

  // Step 2: browser push subscription
  let subscription: PushSubscription;
  try {
    subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          VAPID_PUBLIC_KEY,
        ) as BufferSource,
      }));
  } catch (err) {
    return {
      status: "error",
      detail: `Browser subscribe failed (check the VAPID public key): ${describe(err)}`,
    };
  }

  const { endpoint, keys } = subscription.toJSON();
  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return {
      status: "error",
      detail: "The browser returned an incomplete subscription.",
    };
  }

  // Step 3: save it with your existing endpoint (CSRF + proxy handled by lib/api.ts)
  try {
    await subscribePush({
      endpoint,
      keys: { p256dh: keys.p256dh, auth: keys.auth },
    });
  } catch (err) {
    return { status: "error", detail: `Saving subscription: ${describe(err)}` };
  }

  // Step 4: flag it as an admin device (admin-only endpoint)
  try {
    await apiRequest("/admin/chats/push-device", {
      method: "POST",
      body: { endpoint },
    });
  } catch (err) {
    return {
      status: "error",
      detail: `Marking as admin device: ${describe(err)}`,
    };
  }

  return { status: "enabled" };
}
