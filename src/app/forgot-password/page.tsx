"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Loader2, Mail, MailCheck } from "lucide-react";
import { useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { forgotPassword, type ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#040E21] px-4 py-3 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-[#D41F2D]/60 focus:outline-none focus:ring-1 focus:ring-[#D41F2D]/40";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await forgotPassword(email.trim());
      setIsSent(true);
    } catch (err) {
      const apiErr = err as ApiError;
      setError(
        apiErr.errors?.email?.[0] ||
          apiErr.message ||
          "We couldn’t send the email right now. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#071A38] px-4 py-16 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,31,45,0.18),transparent_55%)]" />

        <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#071A38] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
          {isSent ? (
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
                <MailCheck size={28} className="text-[#FF5C68]" />
              </div>
              <h1 className="mt-6 text-2xl font-bold">Check your email</h1>
              <p className="mt-3 text-sm leading-6 text-zinc-300">
                If an account exists for{" "}
                <span className="font-semibold text-white">{email}</span>, we’ve
                sent a link to reset your password. It expires in 60 minutes.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#FF5C68]"
              >
                <ArrowLeft size={16} />
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D41F2D]/15 text-[#FF5C68]">
                <Mail size={22} />
              </div>
              <h1 className="mt-5 text-2xl font-bold">Forgot password?</h1>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                Enter your email and we’ll send you a link to set a new
                password.
              </p>

              <div className="mt-6">
                <label
                  htmlFor="email"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>

              {error && (
                <p className="mt-4 rounded-xl border border-[#D41F2D]/30 bg-[#D41F2D]/10 px-4 py-3 text-sm text-zinc-200">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(212,31,45,0.35)] transition-all hover:bg-[#E8404B] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight
                      size={16}
                      className="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </>
                )}
              </button>

              <Link
                href="/login"
                className="mt-5 flex items-center justify-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
              >
                <ArrowLeft size={15} />
                Back to login
              </Link>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
