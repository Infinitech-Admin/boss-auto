// app/verify-email/page.tsx

"use client";

import {
  Suspense,
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Car, Loader2, MailCheck } from "lucide-react";
import { resendVerification, verifyEmail, type ApiError } from "@/lib/api";

const RESEND_COOLDOWN_SECONDS = 30;

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";

  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  function handleDigitChange(index: number, value: string) {
    const clean = value.replace(/\D/g, "").slice(0, 1);
    setDigits((prev) => {
      const next = [...prev];
      next[index] = clean;
      return next;
    });
    if (clean && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: ClipboardEvent<HTMLDivElement>) {
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pasted) return;
    e.preventDefault();
    setDigits(
      pasted
        .padEnd(6, " ")
        .split("")
        .map((c) => (c === " " ? "" : c)),
    );
    inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setNotice("");
    const code = digits.join("");

    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }

    setLoading(true);
    try {
      await verifyEmail({ email, code });
      router.push("/login?verified=1");
    } catch (err) {
      const apiErr = err as ApiError;
      setError(apiErr.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError("");
    setNotice("");
    try {
      const data = await resendVerification({ email });
      setNotice(data.message || "A new code has been sent if needed.");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(
        apiErr.message ||
          "Unable to resend right now. Please try again shortly.",
      );
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-[#040E21] via-[#0C2347] to-[#040E21] px-4 py-16">
      <div className="pointer-events-none absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-[#FFFFFF]/15 blur-[130px]" />
      <div className="pointer-events-none absolute top-1/3 right-[-120px] h-[380px] w-[380px] rounded-full bg-[#D41F2D]/20 blur-[130px]" />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, #fff 0 40px, transparent 40px 90px)",
          maskImage: "linear-gradient(to top, black, transparent)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-black text-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#FF5C68]">
              <Car size={20} />
            </span>
            Auto<span className="text-[#FF5C68]">Trade</span>
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-[#071A38]/70 p-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:p-8"
        >
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 text-[#FF5C68]">
            <MailCheck size={22} />
          </div>
          <h1 className="text-lg font-bold text-white">Verify your email</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Enter the 6-digit code sent to{" "}
            <span className="text-zinc-200">{email || "your email"}</span>
          </p>

          {error && (
            <div className="mt-4 rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]">
              {error}
            </div>
          )}
          {notice && !error && (
            <div className="mt-4 rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]">
              {notice}
            </div>
          )}

          <div className="mt-6 flex justify-center gap-2" onPaste={handlePaste}>
            {digits.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputsRef.current[index] = el;
                }}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="h-12 w-11 rounded-xl border border-white/10 bg-[#040E21]/60 text-center text-lg font-semibold text-white outline-none transition-colors focus:border-[#D41F2D]/60"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#D41F2D] to-[#E8404B] py-3.5 text-sm font-bold text-white transition-all duration-300 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Verifying..." : "Verify Email"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className="mt-4 text-sm font-medium text-[#FF5C68] transition-colors hover:text-[#FF5C68] disabled:cursor-not-allowed disabled:text-zinc-600"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailForm />
    </Suspense>
  );
}
