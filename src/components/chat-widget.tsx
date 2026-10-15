"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, Headphones, MessageCircle, Send, User, X } from "lucide-react";
import { apiRequest, type ApiError } from "@/lib/api";

const BUSINESS_NAME = "Boss Auto Exchange";
const FACEBOOK_URL = "https://www.facebook.com/bossautoexchange";
const ADDRESS = "L7, B132, Arellano cor. Diokno St., Muntinlupa City";

const STORAGE_KEY = "bae_chat_uuid";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

type Mode = "bot" | "form" | "live";

interface ChatMessage {
  id: string;
  role: "bot" | "user" | "agent";
  text: string;
  serverId?: number;
}

interface ServerMessage {
  id: number;
  sender: "customer" | "agent";
  body: string;
  created_at: string;
}

const QUICK_REPLIES = [
  "I want to sell my car",
  "Financing options",
  "Book a test drive",
  "Where are you located?",
];

const WELCOME_TEXT = `Hi there! 👋 I'm the ${BUSINESS_NAME} assistant. Ask me about buying, selling, or financing a car.`;

function fromServer(m: ServerMessage): ChatMessage {
  return {
    id: `s-${m.id}`,
    serverId: m.id,
    role: m.sender === "agent" ? "agent" : "user",
    text: m.body,
  };
}

function readSavedUuid(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveUuid(value: string | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, value);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage blocked: chat still works for this visit
  }
}

function getBotReply(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("sell") || text.includes("trade")) {
    return "Great! Head to our Sell / Trade page and submit your car's details. Our team will review it and get back to you with a valuation.";
  }

  if (text.includes("financ")) {
    return `We can go over financing options with you. Send us a message on our Facebook page (${FACEBOOK_URL}) or through our Contact page and our team will follow up.`;
  }

  if (text.includes("test drive") || text.includes("book")) {
    return 'Happy to help! Pick a car from our Showroom and tap "Book Test Drive" on its page, or share the model here and I\'ll pass it along.';
  }

  if (
    text.includes("where") ||
    text.includes("location") ||
    text.includes("address") ||
    text.includes("visit")
  ) {
    return `You can find us at ${ADDRESS}. Please message us on Facebook first so we can confirm our hours before you visit.`;
  }

  if (text.includes("hour") || text.includes("open")) {
    return `Please message us on our Facebook page (${FACEBOOK_URL}) to confirm our current hours before you visit.`;
  }

  if (
    text.includes("contact") ||
    text.includes("facebook") ||
    text.includes("message") ||
    text.includes("call")
  ) {
    return `The fastest way to reach us is through our Facebook page: ${FACEBOOK_URL}. You can also use the form on our Contact page.`;
  }

  return 'Thanks for reaching out! Tap "Talk to an agent" if you\'d like a person from our team to reply. Anything specific I can help you with in the meantime?';
}

export default function ChatWidget() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");

  const [mode, setMode] = useState<Mode>("bot");
  const [uuid, setUuid] = useState<string | null>(null);
  const [closed, setClosed] = useState(false);
  const [form, setForm] = useState({ name: "", contact: "", message: "" });
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "welcome", role: "bot", text: WELCOME_TEXT },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef(0);
  const isOpenRef = useRef(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Resume an earlier live chat from this browser.
  useEffect(() => {
    const saved = readSavedUuid();
    if (!saved) return;
    setUuid(saved);
    setMode("live");
    setMessages([
      {
        id: "welcome-live",
        role: "bot",
        text: "Welcome back! Your conversation with our team is below.",
      },
    ]);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, isOpen, mode, closed]);

  // Fetch new messages and the chat status from the server.
  const poll = useCallback(async () => {
    if (!uuid) return;

    try {
      const data = await apiRequest<{
        messages: ServerMessage[];
        status?: "open" | "closed";
      }>(`/chat/conversations/${uuid}/messages?after=${lastIdRef.current}`, {
        headers: { "Cache-Control": "no-cache" },
      });

      // Always sync the status, even when there are no new messages.
      if (data.status) setClosed(data.status === "closed");

      if (!data.messages.length) return;

      lastIdRef.current = Math.max(
        lastIdRef.current,
        ...data.messages.map((m) => m.id),
      );

      setMessages((prev) => {
        const known = new Set(prev.map((m) => m.serverId));
        const fresh = data.messages
          .filter((m) => !known.has(m.id))
          .map(fromServer);
        return fresh.length ? [...prev, ...fresh] : prev;
      });

      if (
        data.messages.some((m) => m.sender === "agent") &&
        !isOpenRef.current
      ) {
        setHasUnread(true);
      }
    } catch (err) {
      // Conversation no longer exists: go back to the bot.
      if ((err as ApiError).status === 404) {
        saveUuid(null);
        lastIdRef.current = 0;
        setUuid(null);
        setClosed(false);
        setMode("bot");
      }
      // Any other error is a network hiccup: try again on the next tick.
    }
  }, [uuid]);

  // Poll every 4s while the panel is open, every 15s while closed.
  useEffect(() => {
    if (mode !== "live" || !uuid) return;

    poll();

    const timer = window.setInterval(
      () => {
        if (!document.hidden) poll();
      },
      isOpen ? 4000 : 15000,
    );

    return () => window.clearInterval(timer);
  }, [mode, uuid, isOpen, poll]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const sendBotMessage = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text: trimmed },
    ]);
    setInput("");
    setIsTyping(true);

    window.setTimeout(
      () => {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            role: "bot",
            text: getBotReply(trimmed),
          },
        ]);
        setIsTyping(false);
      },
      700 + Math.random() * 500,
    );
  };

  const sendLiveMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !uuid || closed) return;

    const tempId = crypto.randomUUID();

    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", text: trimmed },
    ]);
    setInput("");

    try {
      const { message } = await apiRequest<{ message: ServerMessage }>(
        `/chat/conversations/${uuid}/messages`,
        { method: "POST", body: { body: trimmed } },
      );

      // If polling already added this message, drop the optimistic copy.
      setMessages((prev) =>
        prev.some((m) => m.serverId === message.id)
          ? prev.filter((m) => m.id !== tempId)
          : prev.map((m) =>
              m.id === tempId ? { ...m, serverId: message.id } : m,
            ),
      );
    } catch (err) {
      const status = (err as ApiError).status;

      // Chat was closed by the team: lock the widget.
      if (status === 409) {
        setClosed(true);
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        return;
      }

      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: "Your message didn't send. Please check your connection and try again.",
        },
      ]);
    }
  };

  const openForm = () => {
    const lastUserText = [...messages]
      .reverse()
      .find((m) => m.role === "user")?.text;

    setForm((f) => ({ ...f, message: f.message || lastUserText || "" }));
    setFormError("");
    setMode("form");
  };

  const startLive = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const name = form.name.trim();
    const contact = form.contact.trim();
    const message = form.message.trim();

    if (!name || !contact || !message) {
      setFormError("Please fill in your name, phone or email, and message.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const data = await apiRequest<{
        uuid: string;
        messages: ServerMessage[];
      }>("/chat/conversations", {
        method: "POST",
        body: { name, contact, message },
      });

      saveUuid(data.uuid);
      lastIdRef.current = Math.max(0, ...data.messages.map((m) => m.id));

      setUuid(data.uuid);
      setClosed(false);
      setMessages((prev) => [
        ...prev,
        ...data.messages.map(fromServer),
        {
          id: crypto.randomUUID(),
          role: "bot",
          text: "Thanks! Our team has your message and will reply here. You can close this chat and come back anytime.",
        },
      ]);
      setMode("live");
    } catch {
      setFormError("We couldn't start the chat. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  // Reset everything so the visitor can begin a fresh conversation.
  const startNewChat = () => {
    saveUuid(null);
    lastIdRef.current = 0;
    setUuid(null);
    setClosed(false);
    setInput("");
    setForm({ name: "", contact: "", message: "" });
    setFormError("");
    setMessages([{ id: "welcome", role: "bot", text: WELCOME_TEXT }]);
    setMode("bot");
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "live") sendLiveMessage(input);
    else sendBotMessage(input);
  };

  // Hide chatbot on all admin pages
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  const isLive = mode === "live";
  const isLocked = isLive && closed;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* Chat panel */}
      {isOpen && (
        <div className="flex h-[min(70vh,560px)] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#040E21] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#071A38] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D41F2D] text-black">
                {isLive ? (
                  <Headphones size={18} strokeWidth={2.25} />
                ) : (
                  <Bot size={18} strokeWidth={2.25} />
                )}
              </div>

              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">
                  {isLive
                    ? `${BUSINESS_NAME} Team`
                    : `${BUSINESS_NAME} Assistant`}
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      isLocked ? "bg-zinc-500" : "bg-[#D41F2D]"
                    }`}
                  />
                  {isLocked
                    ? "Chat closed"
                    : isLive
                      ? "Live chat"
                      : "Online now"}
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close chat"
              onClick={() => setIsOpen(false)}
              className={`flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/5 hover:text-white ${focusRing}`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 space-y-3 overflow-y-auto px-4 py-4"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-end gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role !== "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D41F2D]/15 text-[#5FA8E8]">
                    {message.role === "agent" ? (
                      <Headphones size={14} />
                    ) : (
                      <Bot size={14} />
                    )}
                  </div>
                )}

                <div
                  className={`max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-sm bg-[#D41F2D] text-black"
                      : "rounded-bl-sm bg-white/[0.06] text-zinc-100"
                  }`}
                >
                  {message.text}
                </div>

                {message.role === "user" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-zinc-300">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-end gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D41F2D]/15 text-[#5FA8E8]">
                  <Bot size={14} />
                </div>

                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white/[0.06] px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400" />
                </div>
              </div>
            )}

            {/* Quick replies */}
            {mode === "bot" && messages.length === 1 && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendBotMessage(reply)}
                    className={`rounded-full border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-3 py-1.5 text-xs font-medium text-[#5FA8E8] transition-colors hover:bg-[#D41F2D]/20 ${focusRing}`}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Agent handoff form */}
          {mode === "form" && (
            <form
              onSubmit={startLive}
              className="space-y-2.5 border-t border-white/10 bg-[#071A38] p-3"
            >
              <p className="text-xs text-zinc-400">
                Tell us how to reach you and what you need. Our team will reply
                in this chat.
              </p>

              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Your name"
                aria-label="Your name"
                maxLength={100}
                className={`w-full rounded-xl border border-white/10 bg-[#040E21]/40 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 ${focusRing}`}
              />

              <input
                type="text"
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder="Phone or email"
                aria-label="Phone or email"
                maxLength={150}
                className={`w-full rounded-xl border border-white/10 bg-[#040E21]/40 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 ${focusRing}`}
              />

              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can we help?"
                aria-label="Your message"
                rows={2}
                maxLength={1000}
                className={`w-full resize-none rounded-xl border border-white/10 bg-[#040E21]/40 px-3.5 py-2.5 text-sm text-white placeholder:text-zinc-500 ${focusRing}`}
              />

              {formError && (
                <p role="alert" className="text-xs text-[#E8404B]">
                  {formError}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("bot")}
                  className={`rounded-full px-3 py-2 text-xs text-zinc-400 transition-colors hover:text-white ${focusRing}`}
                >
                  Back to assistant
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`ml-auto rounded-full bg-[#D41F2D] px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 ${focusRing}`}
                >
                  {submitting ? "Starting..." : "Start chat"}
                </button>
              </div>
            </form>
          )}

          {/* Closed notice */}
          {isLocked && (
            <div className="space-y-2 border-t border-white/10 bg-[#071A38] p-3">
              <p className="text-xs text-zinc-400">
                This chat was closed by our team. Start a new chat if you still
                need help.
              </p>
              <button
                type="button"
                onClick={startNewChat}
                className={`w-full rounded-full bg-[#D41F2D] px-4 py-2 text-sm font-semibold text-black transition-all hover:brightness-110 ${focusRing}`}
              >
                Start a new chat
              </button>
            </div>
          )}

          {/* Input */}
          {mode !== "form" && !isLocked && (
            <div className="border-t border-white/10 bg-[#071A38]">
              {mode === "bot" && (
                <div className="px-3 pt-3">
                  <button
                    type="button"
                    onClick={openForm}
                    className={`flex items-center gap-1.5 rounded-full border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-3 py-1.5 text-xs font-medium text-[#5FA8E8] transition-colors hover:bg-[#D41F2D]/20 ${focusRing}`}
                  >
                    <Headphones size={13} />
                    Talk to an agent
                  </button>
                </div>
              )}

              <form
                onSubmit={handleSubmit}
                className="flex items-center gap-2 p-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Type your message..."
                  aria-label="Type your message"
                  maxLength={1000}
                  className={`flex-1 rounded-full border border-white/10 bg-[#040E21]/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 ${focusRing}`}
                />

                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={!input.trim()}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D41F2D] text-black transition-all duration-200 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 ${focusRing}`}
                >
                  <Send size={16} strokeWidth={2.25} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-[#D41F2D] text-black shadow-[0_10px_30px_rgba(212,31,45,0.45)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_35px_rgba(212,31,45,0.65)] ${focusRing}`}
      >
        {isOpen ? (
          <X size={24} strokeWidth={2.25} />
        ) : (
          <MessageCircle size={24} strokeWidth={2.25} />
        )}

        {hasUnread && !isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D41F2D] ring-2 ring-[#040E21]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#E8404B]" />
          </span>
        )}
      </button>
    </div>
  );
}
