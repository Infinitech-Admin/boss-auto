// app/register/page.tsx

"use client";

import {
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  Check,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Phone,
  User,
  X,
} from "lucide-react";
import { register, type ApiError } from "@/lib/api";

interface RegisterForm {
  name: string;
  phone: string;
  email: string;
  password: string;
  password_confirmation: string;
}

interface PasswordRules {
  length: boolean;
  lower: boolean;
  upper: boolean;
  number: boolean;
  symbol: boolean;
}

function checkRules(password: string): PasswordRules {
  return {
    length: password.length >= 10,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    number: /\d/.test(password),
    symbol: /[^A-Za-z0-9]/.test(password),
  };
}

// Strict, RFC-5322-ish email pattern (no consecutive dots, valid domain, TLD required).
const EMAIL_REGEX =
  /^(?!.*\.\.)[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// PH mobile format: exactly 11 digits, must start with "09" (e.g. 09171234567).
const PHONE_REGEX = /^09\d{9}$/;

function validateEmail(email: string): string {
  const trimmed = email.trim();
  if (!trimmed) return "Email is required.";
  if (trimmed.length > 254) return "Email is too long.";
  if (!EMAIL_REGEX.test(trimmed)) return "Enter a valid email address.";
  return "";
}

function validatePhone(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return ""; // optional field
  if (!PHONE_REGEX.test(trimmed)) {
    return "Phone must be exactly 11 digits and start with 09 (e.g. 09171234567).";
  }
  return "";
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    phone: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const rules = useMemo(() => checkRules(form.password), [form.password]);
  const passwordsMatch =
    form.password_confirmation.length > 0 &&
    form.password === form.password_confirmation;

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    if (name === "phone") {
      // Digits only, capped at 11 — keeps the field impossible to
      // overtype past the valid PH mobile length.
      const digitsOnly = value.replace(/\D/g, "").slice(0, 11);
      setForm((prev) => ({ ...prev, phone: digitsOnly }));
      if (errors.phone) {
        setErrors((prev) => ({ ...prev, phone: validatePhone(digitsOnly) }));
      }
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "email" && errors.email) {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
  }

  function handleBlur(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    if (name === "email") {
      setErrors((prev) => ({ ...prev, email: validateEmail(value) }));
    }
    if (name === "phone") {
      setErrors((prev) => ({ ...prev, phone: validatePhone(value) }));
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");

    const emailError = validateEmail(form.email);
    const phoneError = validatePhone(form.phone);

    if (emailError || phoneError) {
      setErrors((prev) => ({
        ...prev,
        ...(emailError ? { email: emailError } : { email: "" }),
        ...(phoneError ? { phone: phoneError } : { phone: "" }),
      }));
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const data = await register(form);
      router.push(
        `/verify-email?email=${encodeURIComponent(data.verification_email)}`,
      );
    } catch (err) {
      const apiErr = err as ApiError;
      if (apiErr.errors) {
        const fieldErrors: Record<string, string> = {};
        for (const key in apiErr.errors) {
          fieldErrors[key] = apiErr.errors[key][0];
        }
        setErrors(fieldErrors);
      } else {
        setFormError(
          apiErr.message || "Unable to create your account. Please try again.",
        );
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-[#0C2347] bg-[#040E21] py-3 pl-10 pr-4 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-[#D41F2D] focus:ring-2 focus:ring-[#D41F2D]/30";

  const labelClass = "mb-1.5 block text-sm font-medium text-zinc-300";

  const iconClass =
    "pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500";

  return (
    <main className="relative flex min-h-screen overflow-hidden bg-[#040E21]">
      {/* The one bold moment: a red racing stripe cutting across the page */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 h-full w-[60%] -skew-x-12 bg-gradient-to-br from-[#A8161F] via-[#D41F2D] to-[#A8161F] lg:left-[-8%] lg:w-[48%]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-1/4 top-0 hidden h-full w-[3px] -skew-x-12 bg-[#D41F2D] lg:left-[40%] lg:block"
      />

      {/* Brand panel (desktop) */}
      <section className="relative z-10 hidden w-1/2 flex-col justify-between p-12 lg:flex">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#040E21] text-[#FF5C68]">
            <Car size={20} />
          </span>
          <span className="text-xl font-black tracking-tight">AutoPrime</span>
        </Link>

        <div className="max-w-sm">
          <h2 className="text-5xl font-black leading-[1.05] tracking-tight text-white">
            Start your engine.
          </h2>
          <p className="mt-4 text-base text-red-100/90">
            Create an account to save listings, track offers and sell or trade
            in your car.
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
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D41F2D]/15 text-[#FF5C68]">
                <Car size={20} />
              </span>
              AutoPrime
            </Link>
          </div>

          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-[#0C2347] bg-[#040E21] p-6 shadow-[0_0_0_1px_rgba(212,31,45,0.15),0_30px_80px_rgba(212,31,45,0.18)] sm:p-8"
          >
            <h1 className="mb-1 text-2xl font-bold text-white">
              Create your account
            </h1>
            <p className="mb-6 text-sm text-zinc-400">
              Join AutoPrime in a few quick steps.
            </p>

            {formError && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-[#D41F2D]/40 bg-[#D41F2D]/10 px-4 py-3 text-sm text-[#FF5C68]"
              >
                {formError}
              </div>
            )}

            {/* Name */}
            <div className="mb-4">
              <label htmlFor="name" className={labelClass}>
                Full name
              </label>
              <div className="relative">
                <User size={17} className={iconClass} />
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  required
                  value={form.name}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Juan Dela Cruz"
                />
              </div>
              {errors.name && (
                <p className="mt-1.5 text-xs text-[#FF5C68]">{errors.name}</p>
              )}
            </div>

            {/* Phone */}
            <div className="mb-4">
              <label htmlFor="phone" className={labelClass}>
                Phone <span className="text-zinc-600">(optional)</span>
              </label>
              <div className="relative">
                <Phone size={17} className={iconClass} />
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  maxLength={11}
                  pattern="09\d{9}"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  placeholder="09171234567"
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-xs text-[#FF5C68]">{errors.phone}</p>
              )}
            </div>

            {/* Email */}
            <div className="mb-4">
              <label htmlFor="email" className={labelClass}>
                Email
              </label>
              <div className="relative">
                <Mail size={17} className={iconClass} />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={inputClass}
                  placeholder="you@example.com"
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-[#FF5C68]">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-3">
              <label htmlFor="password" className={labelClass}>
                Password
              </label>
              <div className="relative">
                <Lock size={17} className={iconClass} />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
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
                <p className="mt-1.5 text-xs text-[#FF5C68]">{errors.password}</p>
              )}

              {form.password.length > 0 && (
                <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  <RuleItem met={rules.length}>10+ characters</RuleItem>
                  <RuleItem met={rules.upper && rules.lower}>
                    Upper &amp; lowercase
                  </RuleItem>
                  <RuleItem met={rules.number}>A number</RuleItem>
                  <RuleItem met={rules.symbol}>A symbol</RuleItem>
                </ul>
              )}
            </div>

            {/* Confirm password */}
            <div className="mb-6">
              <label htmlFor="password_confirmation" className={labelClass}>
                Confirm password
              </label>
              <div className="relative">
                <Lock size={17} className={iconClass} />
                <input
                  id="password_confirmation"
                  name="password_confirmation"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  required
                  value={form.password_confirmation}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••••"
                />
              </div>
              {form.password_confirmation.length > 0 && !passwordsMatch && (
                <p className="mt-1.5 text-xs text-[#FF5C68]">
                  Passwords do not match.
                </p>
              )}
              {errors.password_confirmation && (
                <p className="mt-1.5 text-xs text-[#FF5C68]">
                  {errors.password_confirmation}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D41F2D] py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#D41F2D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8404B] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Creating account..." : "Create Account"}
            </button>

            <p className="mt-6 text-center text-sm text-zinc-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-[#FF5C68] hover:text-[#FF5C68]"
              >
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </section>
    </main>
  );
}

function RuleItem({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <li
      className={`flex items-center gap-1.5 ${met ? "text-[#FF5C68]" : "text-zinc-500"}`}
    >
      {met ? <Check size={13} /> : <X size={13} />}
      {children}
    </li>
  );
}
