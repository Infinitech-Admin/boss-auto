// app/login/page.tsx

"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import TurnstileCaptcha from "@/components/TurnstileCaptcha";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { login, fetchMe, type ApiError } from "@/lib/api";
import { useAuth } from "@/context/auth-context";
import { markHasAccount, pendingReturnTo, safeRedirect } from "@/lib/auth-hint";
import {
  AuthShell,
  authButtonClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/auth-shell";

interface LoginForm {
  email: string;
  password: string;
  remember: boolean;
}

const ROLE_REDIRECTS: Record<string, string> = {
  admin: "/admin",
  reseller: "/reseller/dashboard",
  agent: "/agent/dashboard",
  customer: "/",
};

const DEFAULT_REDIRECT = "/";
const DASHBOARD_ROLES = ["admin", "reseller", "agent"];

export default function LoginPage() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [form, setForm] = useState<LoginForm>({
    email: "",
    password: "",
    remember: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);

  const [redirect, setRedirect] = useState<string | null>(null);

  useEffect(() => {
    setRedirect(
      safeRedirect(
        new URLSearchParams(window.location.search).get("redirect")
      )
    );
  }, []);

  const registerHref = redirect
    ? `/register?redirect=${encodeURIComponent(redirect)}`
    : "/register";

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (name === "email" || name === "password") {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (loading) return;

    setErrors({});
    setFormError("");

    if (!captchaToken) {
      setFormError("Please complete the CAPTCHA before signing in.");
      return;
    }

    setLoading(true);
    const token = captchaToken;

    try {
      const data = await login({
        ...form,
        turnstile_token: token,
      });

      markHasAccount();
      await refresh();

      const role = data?.user?.role ?? (await fetchMe()).user.role;

      const fromUrl = safeRedirect(
        new URLSearchParams(window.location.search).get("redirect")
      );

      const returnTo =
        redirect ??
        fromUrl ??
        (DASHBOARD_ROLES.includes(role) ? null : pendingReturnTo());

      const destination =
        returnTo ?? ROLE_REDIRECTS[role] ?? DEFAULT_REDIRECT;

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

        if (fieldErrors.captcha || fieldErrors.turnstile_token) {
          setFormError("CAPTCHA verification failed. Please try again.");
        } else if (fieldErrors.email || fieldErrors.password) {
          setFormError("Please check your login credentials.");
        } else {
          setFormError(
            apiErr.message || "Unable to sign in. Please try again."
          );
        }
      } else {
        setFormError(
          apiErr.message || "Unable to sign in. Please try again."
        );
      }
    } finally {
      setLoading(false);
      setCaptchaToken("");
      setCaptchaKey((key) => key + 1);
    }
  }


  return (
    <AuthShell
      headline="Your next car is waiting."
      blurb="Sign in to save listings, track offers and pick up where you left off."
    >
      <form onSubmit={handleSubmit}>
        <h1 className="mb-1 text-2xl font-bold text-white">
          Welcome back
        </h1>

        <p className="mb-6 text-sm text-zinc-400">
          Sign in to your Boss Auto Exchange account.
        </p>

        {formError && (
          <div
            role="alert"
            className="mb-5 rounded-lg border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]"
          >
            {formError}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className={authLabelClass}>
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={handleChange}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            className={authInputClass}
            placeholder="you@example.com"
          />
          {errors.email && (
            <p id="email-error" className={authErrorClass}>
              {errors.email}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              aria-describedby={
                errors.password ? "password-error" : undefined
              }
              className={`${authInputClass} pr-12`}
              placeholder="Enter your password"
            />

            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 transition-colors hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#D41F2D]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className={authErrorClass}>
              {errors.password}
            </p>
          )}
        </div>

        <div className="mb-6 flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-zinc-400">
            <input
              type="checkbox"
              name="remember"
              checked={form.remember}
              onChange={handleChange}
              className="h-4 w-4 rounded border-zinc-700 bg-[#040E21] accent-[#D41F2D]"
            />
            Remember me
          </label>

          <Link
            href="/forgot-password"
            className={`text-sm ${authLinkClass}`}
          >
            Forgot password?
          </Link>
        </div>

        <div className="mb-4">
          <TurnstileCaptcha
            key={captchaKey}
            onVerify={(token) => {
              setCaptchaToken(token);
              setFormError("");
            }}
            onExpire={() => {
              setCaptchaToken(""); 
              setFormError("Verification expired. Please complete it again.");
            }}
            onError={() => {
              setCaptchaToken("");
              setFormError(
                "CAPTCHA could not load. Please refresh and try again."
              );
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !captchaToken}
          className={authButtonClass}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          New to Boss Auto Exchange?{" "}
          <Link href={registerHref} className={authLinkClass}>
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
