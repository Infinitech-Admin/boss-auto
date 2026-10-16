"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { Suspense, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { resetPassword, type ApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#040E21] px-4 py-3 pr-12 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-[#D41F2D]/60 focus:outline-none focus:ring-1 focus:ring-[#D41F2D]/40";

const labelClass =
  "mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400";

function PasswordField({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          required
          minLength={8}
          autoComplete="new-password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
          placeholder="At least 8 characters"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-[#FF5C68]">{error}</p>}
    </div>
  );
}

function ResetPasswordForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";
  const isWelcome = params.get("welcome") === "1";

  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  // Link is missing what it needs — nothing to submit.
  if (!token || !email) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
          <TriangleAlert size={28} className="text-[#FF5C68]" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Invalid link</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          This password link is incomplete or has expired. Request a new one and
          try again.
        </p>
        <Link
          href="/forgot-password"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#E8404B]"
        >
          Request a new link
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  if (isDone) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/30 bg-[#D41F2D]/10">
          <CheckCircle2 size={30} className="text-[#FF5C68]" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Password set</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-300">
          {isWelcome
            ? "Your account is ready. You can now log in."
            : "Your password has been updated. You can now log in."}
        </p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-[#E8404B]"
        >
          Go to login
          <ArrowRight size={16} />
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (password !== confirmation) {
      setFieldErrors({ password_confirmation: ["Passwords do not match."] });
      return;
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        token,
        email,
        password,
        password_confirmation: confirmation,
      });
      setIsDone(true);
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) setFieldErrors(apiErr.errors);
      setError(
        apiErr.errors?.email?.[0] ||
          apiErr.message ||
          "We couldn’t update your password. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D41F2D]/15 text-[#FF5C68]">
        <KeyRound size={22} />
      </div>
      <h1 className="mt-5 text-2xl font-bold">
        {isWelcome ? "Set your password" : "Reset your password"}
      </h1>
      <p className="mt-2 text-sm leading-6 text-zinc-400">
        {isWelcome
          ? "Your application was approved. Choose a password to activate your account."
          : "Choose a new password for your account."}
      </p>
      <p className="mt-3 truncate rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-zinc-400">
        {email}
      </p>

      <div className="mt-6 grid gap-5">
        <PasswordField
          id="password"
          label="New password"
          value={password}
          onChange={setPassword}
          error={fieldErrors.password?.[0]}
        />
        <PasswordField
          id="password_confirmation"
          label="Confirm password"
          value={confirmation}
          onChange={setConfirmation}
          error={fieldErrors.password_confirmation?.[0]}
        />
      </div>

      {error && !fieldErrors.password && (
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
            Saving...
          </>
        ) : (
          <>
            {isWelcome ? "Set password" : "Reset password"}
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-1"
            />
          </>
        )}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <>
      <Navbar />
      <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#071A38] px-4 py-16 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(212,31,45,0.18),transparent_55%)]" />
        <div className="relative w-full max-w-md rounded-[28px] border border-white/10 bg-[#071A38] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)] sm:p-8">
          {/* useSearchParams must sit inside a Suspense boundary */}
          <Suspense fallback={null}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
