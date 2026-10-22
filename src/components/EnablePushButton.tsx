"use client";

import { useEffect, useState } from "react";
import { enablePush } from "@/lib/push";

export default function EnablePushButton() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "on" | "denied" | "error"
  >("idle");

  useEffect(() => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") setStatus("on");
    if (Notification.permission === "denied") setStatus("denied");
  }, []);

  async function handleClick() {
    setStatus("loading");
    try {
      const ok = await enablePush();
      setStatus(ok ? "on" : "denied");
    } catch (e) {
      console.error(e);
      setStatus("error");
    }
  }

  if (status === "on") return <p>Notifications enabled ✅</p>;
  if (status === "denied")
    return (
      <p>
        Notifications are blocked. Please allow them in your browser or site
        settings.
      </p>
    );
  if (status === "error")
    return <p>Something went wrong. Please try again later.</p>;

  return (
    <button onClick={handleClick} disabled={status === "loading"}>
      {status === "loading" ? "Enabling..." : "Enable notifications"}
    </button>
  );
}
