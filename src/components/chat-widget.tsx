"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Bot, MessageCircle, Send, User, X } from "lucide-react";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

interface ChatMessage {
  id: string;
  role: "bot" | "user";
  text: string;
}

const QUICK_REPLIES = [
  "I want to sell my car",
  "Financing options",
  "Book a test drive",
];

function getBotReply(message: string): string {
  const text = message.toLowerCase();

  if (text.includes("sell") || text.includes("trade")) {
    return "Great — head to our Sell / Trade page and submit your car's details. Our team will send you a valuation within 24 hours.";
  }

  if (text.includes("financ")) {
    return "We work with several lenders and offer flexible terms. Want me to have a finance specialist call you?";
  }

  if (text.includes("test drive") || text.includes("book")) {
    return 'Happy to help! Pick a car from our Showroom and tap "Book Test Drive" on its page, or share the model here and I\'ll pass it along.';
  }

  if (text.includes("hour") || text.includes("open")) {
    return "We're open Mon–Sat, 9am–7pm. Feel free to drop by or reach us anytime here.";
  }

  return "Thanks for reaching out! A member of our team will follow up shortly. Anything specific I can help you with in the meantime?";
}

export default function ChatWidget() {
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [input, setInput] = useState("");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "bot",
      text: "Hi there! 👋 I'm the AutoTrade assistant. Ask me about buying, selling, or financing a car.",
    },
  ]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isTyping, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasUnread(false);
  };

  const sendMessage = (text: string) => {
    const trimmed = text.trim();

    if (!trimmed) return;

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
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

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    sendMessage(input);
  };

  // Hide chatbot on all admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {/* Chat panel */}
      {isOpen && (
        <div className="flex h-[min(70vh,560px)] w-[min(92vw,360px)] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#061B3D] shadow-[0_20px_60px_rgba(0,0,0,0.55)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#0A2A5C] px-4 py-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#D41F2D] text-black">
                <Bot size={18} strokeWidth={2.25} />
              </div>

              <div className="leading-tight">
                <div className="text-sm font-semibold text-white">
                  AutoTrade Assistant
                </div>

                <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D41F2D]" />
                  Online now
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
                {message.role === "bot" && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#D41F2D]/15 text-[#5FA8E8]">
                    <Bot size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
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
            {messages.length === 1 && !isTyping && (
              <div className="flex flex-wrap gap-2 pt-1">
                {QUICK_REPLIES.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendMessage(reply)}
                    className={`rounded-full border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-3 py-1.5 text-xs font-medium text-[#5FA8E8] transition-colors hover:bg-[#D41F2D]/20 ${focusRing}`}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-white/10 bg-[#0A2A5C] p-3"
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Type your message..."
              aria-label="Type your message"
              className={`flex-1 rounded-full border border-white/10 bg-[#061B3D]/40 px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 ${focusRing}`}
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

      {/* Toggle button */}
      <button
        type="button"
        aria-label={isOpen ? "Close chat" : "Open chat"}
        onClick={() => (isOpen ? setIsOpen(false) : handleOpen())}
        className={`relative flex h-14 w-14 items-center justify-center rounded-full bg-[#D41F2D] text-black shadow-[0_10px_30px_rgba(191,152,13,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_12px_35px_rgba(191,152,13,0.55)] ${focusRing}`}
      >
        {isOpen ? (
          <X size={24} strokeWidth={2.25} />
        ) : (
          <MessageCircle size={24} strokeWidth={2.25} />
        )}

        {hasUnread && !isOpen && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D41F2D] ring-2 ring-[#061B3D]">
            <span className="h-2 w-2 animate-ping rounded-full bg-[#E8404B]" />
          </span>
        )}
      </button>
    </div>
  );
}
