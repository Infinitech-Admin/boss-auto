"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Bell, BellOff, Send, Smartphone } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { enableAdminChatPush } from "@/lib/chatPush";

const SOUND_KEY = "bae_admin_chat_sound";

interface Conversation {
  id: number;
  name: string;
  contact: string;
  status: "open" | "closed";
  unread: number;
  last_message: string | null;
  last_sender: "customer" | "agent" | null;
  last_message_at: string | null;
}

interface Msg {
  id: number;
  sender: "customer" | "agent";
  body: string;
  created_at: string;
}

/**
 * All chat admin requests go through your existing apiRequest (lib/api.ts),
 * so the proxy, session cookie and CSRF token are handled the same way as
 * the rest of the admin. Paths are relative to /api/admin/chats.
 */
function api<T>(
  path: string,
  init?: { method?: "GET" | "POST" | "PATCH"; body?: unknown },
): Promise<T> {
  return apiRequest<T>(`/admin/chats${path}`, init);
}

function formatTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

export default function AdminChatsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [pushDetail, setPushDetail] = useState("");
  const [pushState, setPushState] = useState<
    "idle" | "working" | "enabled" | "denied" | "unsupported" | "error"
  >("idle");

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundOnRef = useRef(false);
  const prevTotalRef = useRef<number | null>(null);
  const lastMsgIdRef = useRef(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const isClosed = selected?.status === "closed";

  // Sound setup. Browsers block audio until the page gets a click, so the
  // first click anywhere "unlocks" it silently.
  useEffect(() => {
    audioRef.current = new Audio("/sounds/notify.mp3");

    try {
      const saved = localStorage.getItem(SOUND_KEY) === "1";
      setSoundOn(saved);
      soundOnRef.current = saved;
    } catch {
      // storage blocked: sound stays off until toggled
    }

    const unlock = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = true;
      audio
        .play()
        .then(() => {
          audio.pause();
          audio.currentTime = 0;
          audio.muted = false;
        })
        .catch(() => {
          audio.muted = false;
        });
    };

    document.addEventListener("click", unlock, { once: true });
    return () => document.removeEventListener("click", unlock);
  }, []);

  const enablePush = async () => {
    setPushState("working");
    setPushDetail("");
    const result = await enableAdminChatPush();
    setPushDetail(result.detail ?? "");
    setPushState(result.status);
  };

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    soundOnRef.current = next;
    try {
      localStorage.setItem(SOUND_KEY, next ? "1" : "0");
    } catch {
      // ignore
    }
    if (next) audioRef.current?.play().catch(() => {});
  };

  // Conversation list: poll every 4s, ding when unread count goes up.
  const loadList = useCallback(async () => {
    try {
      const data = await api<{ data: Conversation[]; total_unread: number }>(
        "",
      );
      setConversations(data.data);
      setTotalUnread(data.total_unread);
      setLoaded(true);

      if (
        prevTotalRef.current !== null &&
        data.total_unread > prevTotalRef.current &&
        soundOnRef.current
      ) {
        audioRef.current?.play().catch(() => {});
      }
      prevTotalRef.current = data.total_unread;
    } catch {
      // keep the last list; try again next tick
    }
  }, []);

  useEffect(() => {
    loadList();
    const timer = window.setInterval(loadList, 4000);
    return () => window.clearInterval(timer);
  }, [loadList]);

  // Opened from a push notification: /admin/chats?c=12
  useEffect(() => {
    const id = Number(new URLSearchParams(window.location.search).get("c"));
    if (Number.isInteger(id) && id > 0) setSelectedId(id);
  }, []);

  // Tab title alert.
  useEffect(() => {
    const original = document.title.replace(/^\(\d+\) New message — /, "");
    document.title =
      totalUnread > 0 ? `(${totalUnread}) New message — ${original}` : original;
    return () => {
      document.title = original;
    };
  }, [totalUnread]);

  // Open thread: poll every 3s, mark as read when customer messages arrive.
  useEffect(() => {
    if (selectedId === null) return;

    let cancelled = false;
    setMessages([]);
    lastMsgIdRef.current = 0;

    const load = async () => {
      try {
        const data = await api<{ messages: Msg[] }>(
          `/${selectedId}/messages?after=${lastMsgIdRef.current}`,
        );
        if (cancelled || !data.messages.length) return;

        lastMsgIdRef.current = Math.max(
          lastMsgIdRef.current,
          ...data.messages.map((m) => m.id),
        );

        setMessages((prev) => {
          const known = new Set(prev.map((m) => m.id));
          const fresh = data.messages.filter((m) => !known.has(m.id));
          return fresh.length ? [...prev, ...fresh] : prev;
        });

        if (data.messages.some((m) => m.sender === "customer")) {
          api(`/${selectedId}/read`, { method: "POST" })
            .then(loadList)
            .catch(() => {});
        }
      } catch {
        // ignore: next tick retries
      }
    };

    load();
    const timer = window.setInterval(load, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selectedId, loadList]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = input.trim();
    if (!body || selectedId === null || sending || isClosed) return;

    setSending(true);
    try {
      const data = await api<{ message: Msg }>(`/${selectedId}/messages`, {
        method: "POST",
        body: { body },
      });
      setMessages((prev) =>
        prev.some((m) => m.id === data.message.id)
          ? prev
          : [...prev, data.message],
      );
      setInput("");
      loadList();
    } catch {
      // keep the text in the box so nothing is lost;
      // refresh the list in case the chat was closed meanwhile
      loadList();
    } finally {
      setSending(false);
    }
  };

  const setStatus = async (status: "open" | "closed") => {
    if (selectedId === null) return;
    try {
      await api(`/${selectedId}`, {
        method: "PATCH",
        body: { status },
      });
      loadList();
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Chats</h1>
          <p className="text-sm text-zinc-400">
            {totalUnread > 0
              ? `${totalUnread} unread ${totalUnread === 1 ? "message" : "messages"}`
              : "No unread messages"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-1.5">
          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={toggleSound}
              aria-pressed={soundOn}
              className={`flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5 ${focusRing}`}
            >
              {soundOn ? <Bell size={16} /> : <BellOff size={16} />}
              {soundOn ? "Sound on" : "Enable sound"}
            </button>

            <button
              type="button"
              onClick={enablePush}
              disabled={pushState === "working" || pushState === "enabled"}
              className={`flex items-center gap-2 rounded-full border border-white/10 px-3.5 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5 disabled:opacity-60 ${focusRing}`}
            >
              <Smartphone size={16} />
              {pushState === "enabled"
                ? "Notifications on for this device"
                : pushState === "working"
                  ? "Enabling..."
                  : "Notify me when the site is closed"}
            </button>
          </div>

          {pushState === "denied" && (
            <p role="alert" className="text-xs text-[#E8404B]">
              Notifications are blocked. Allow them in your browser's site
              settings, then try again.
            </p>
          )}
          {pushState === "unsupported" && (
            <p role="alert" className="text-xs text-[#E8404B]">
              This browser can't receive push notifications. On iPhone, add the
              site to your Home Screen first.
            </p>
          )}
          {pushState === "error" && (
            <p role="alert" className="text-xs text-[#E8404B]">
              Couldn't turn on notifications.
              {pushDetail
                ? ` ${pushDetail}`
                : " Check that you're logged in and try again."}
            </p>
          )}
        </div>
      </div>

      <div className="grid h-[75vh] min-h-[420px] overflow-hidden rounded-2xl border border-white/10 bg-[#040E21] md:grid-cols-[320px_1fr]">
        {/* List */}
        <div
          className={`overflow-y-auto border-white/10 md:border-r ${
            selected ? "hidden md:block" : "block"
          }`}
        >
          {!loaded && (
            <p className="p-4 text-sm text-zinc-400">Loading chats...</p>
          )}

          {loaded && conversations.length === 0 && (
            <p className="p-4 text-sm text-zinc-400">
              No chats yet. When a visitor taps &ldquo;Talk to an agent&rdquo;
              on the site, their conversation will show up here.
            </p>
          )}

          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(c.id)}
                  className={`flex w-full flex-col gap-1 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/[0.04] ${focusRing} ${
                    c.id === selectedId ? "bg-white/[0.06]" : ""
                  }`}
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-white">
                      {c.name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500">
                      {formatTime(c.last_message_at)}
                    </span>
                  </span>

                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-zinc-400">
                      {c.last_sender === "agent" ? "You: " : ""}
                      {c.last_message ?? ""}
                    </span>

                    {c.unread > 0 && (
                      <span
                        aria-label={`${c.unread} unread`}
                        className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#D41F2D] px-1.5 text-xs font-semibold text-black"
                      >
                        {c.unread}
                      </span>
                    )}
                  </span>

                  {c.status === "closed" && (
                    <span className="text-xs text-zinc-500">Closed</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Thread */}
        <div
          className={`min-h-0 flex-col ${selected ? "flex" : "hidden md:flex"}`}
        >
          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-zinc-500">
              Select a chat to read and reply.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-white/10 bg-[#071A38] px-4 py-3">
                <button
                  type="button"
                  aria-label="Back to chat list"
                  onClick={() => setSelectedId(null)}
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-zinc-300 hover:bg-white/5 md:hidden ${focusRing}`}
                >
                  <ArrowLeft size={18} />
                </button>

                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold text-white">
                    {selected.name}
                  </div>
                  <div className="truncate text-xs text-zinc-400">
                    {selected.contact}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setStatus(isClosed ? "open" : "closed")}
                  className={`rounded-full border border-white/10 px-3 py-1.5 text-xs text-zinc-200 hover:bg-white/5 ${focusRing}`}
                >
                  {isClosed ? "Reopen chat" : "Close chat"}
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${
                      m.sender === "agent" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div className="max-w-[75%]">
                      <div
                        className={`whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                          m.sender === "agent"
                            ? "rounded-br-sm bg-[#D41F2D] text-black"
                            : "rounded-bl-sm bg-white/[0.06] text-zinc-100"
                        }`}
                      >
                        {m.body}
                      </div>
                      <div
                        className={`mt-1 text-xs text-zinc-500 ${
                          m.sender === "agent" ? "text-right" : ""
                        }`}
                      >
                        {formatTime(m.created_at)}
                      </div>
                    </div>
                  </div>
                ))}

                {isClosed && (
                  <p className="pt-2 text-center text-xs text-zinc-500">
                    This chat is closed. Reopen it to reply.
                  </p>
                )}

                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={send}
                className="flex items-center gap-2 border-t border-white/10 bg-[#071A38] p-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isClosed ? "Chat is closed" : "Type a reply..."}
                  aria-label="Type a reply"
                  maxLength={1000}
                  disabled={isClosed}
                  className={`flex-1 rounded-full border border-white/10 bg-[#040E21]/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
                />

                <button
                  type="submit"
                  aria-label="Send reply"
                  disabled={!input.trim() || sending || isClosed}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D41F2D] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                >
                  <Send size={16} strokeWidth={2.25} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
