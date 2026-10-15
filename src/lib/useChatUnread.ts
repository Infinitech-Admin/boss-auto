// File: lib/useChatUnread.ts
"use client";

import { useEffect, useState } from "react";

/** Total unread customer messages, for the admin sidebar badge. */
export function useChatUnread(intervalMs = 10000): number {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let stopped = false;

    const run = async () => {
      try {
        const res = await fetch("/api/proxy/admin/chats/unread-count", {
          credentials: "include",
          cache: "no-store",
          headers: { Accept: "application/json" },
        });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as { total_unread?: number };
        setTotal(data.total_unread ?? 0);
      } catch {
        // ignore: badge just keeps its last value
      }
    };

    run();
    const timer = window.setInterval(run, intervalMs);

    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [intervalMs]);

  return total;
}
