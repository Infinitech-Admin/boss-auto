// app/login/page.tsx

"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { login, fetchMe, type ApiError } from "@/lib/api";

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

// Where each role lands after signing in.
// Change "/" to "/dashboard" once customer accounts have their own dashboard.
const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  user: "/",
};

const DEFAULT_REDIRECT = "/";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setFormError("");
    setLoading(true);

    try {
      const data = await login(form);

      // Use the role from the login response; if the API doesn't return
      // the user there, fall back to /me (the session cookie is already set).
      // The redirect is only for UX — /admin must still be protected on the
      // server (middleware / layout) and in the API.
      const role = data?.user?.role ?? (await fetchMe()).user.role;

      // If we were sent here from a protected page (e.g. checkout), go back
      // there. Only same-site paths are allowed, to avoid open redirects.
      const redirectParam = new URLSearchParams(window.location.search).get(
        "redirect",
      );
      const safeRedirect =
        redirectParam &&
        redirectParam.startsWith("/") &&
        !redirectParam.startsWith("//")
          ? redirectParam
          : null;

      const destination =
        safeRedirect ?? ROLE_REDIRECTS[role] ?? DEFAULT_REDIRECT;

      router.push(destination);
      router.refresh();
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const key in apiErr.errors) {
          fieldErrors[key] = apiErr.errors[key][0];
        }
        setErrors(fieldErrors);
      } else {
        setFormError(apiErr.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-800 bg-[#061B3D] py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-red-600 focus:ring-2 focus:ring-red-600/30";

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#061B3D]">
      {/* The one bold moment: a red racing stripe cutting across the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 h-full w-[60%] -skew-x-12 bg-gradient-to-br from-red-700 via-red-600 to-red-950 lg:left-[-8%] lg:w-[48%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 hidden h-full w-[3px] -skew-x-12 bg-red-500 lg:left-[40%] lg:block"
      />

      {/* Brand panel (desktop) */}
      <section className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#061B3D] text-red-500">
            <Car size={20} />
          </span>
          <span className="text-xl font-black tracking-tight">AutoPrime</span>
        </Link>

        <div className="max-w-sm">
          <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-white">
            Your next car is waiting.
          </h2>
          <p className="mt-4 text-base text-red-100/90">
            Sign in to save listings, track offers and pick up where you left
            off.
          </p>
        </div>
      </section>

      {/* Form panel */}
      <section className="relative z-10 flex w-full items-center justify-center px-4 py-16 lg:w-1/2">
        <div className="w-full max-w-md">
          {/* Brand (mobile) */}
          <div className="mb-8 text-center lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-2xl font-black tracking-tight text-white"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-600/15 text-red-500">
                <Car size={20} />
              </span>
              AutoPrime
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-zinc-800 bg-[#061B3D] p-6 shadow-[0_0_0_1px_rgba(220,38,38,0.15),0_30px_80px_rgba(220,38,38,0.18)] sm:p-8"
          >
            <h1 className="mb-1 text-2xl font-bold text-white">Welcome back</h1>
            <p className="mb-6 text-sm text-zinc-400">
              Sign in to your AutoPrime account.
            </p>

            {formError && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-600/40 bg-red-600/10 px-4 py-3 text-sm text-red-300"
              >
                {formError}
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-400">{errors.email}</p>
              )}
            </div>

            <div className="mb-3">
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={17}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className={`${inputClass} pr-11`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-white focus-visible:outline-none focus-visible:text-white"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password}</p>
              )}
            </div>

            <div className="mb-6 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-zinc-400">
                <input
                  type="checkbox"
                  name="remember"
                  checked={form.remember}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-zinc-700 bg-[#061B3D] accent-red-600"
                />
                Remember me
              </label>
              {/* <Link
                href="/forgot-password"
                className="text-sm font-medium text-red-500 hover:text-red-400"
              >
                Forgot password?
              </Link> */}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-400">
              New to AutoPrime?{" "}
              <Link
                href="/register"
                className="font-semibold text-red-500 hover:text-red-400"
              >
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}
