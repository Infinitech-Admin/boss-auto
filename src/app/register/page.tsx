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
import { Check, Eye, EyeOff, Loader2, X } from "lucide-react";
import { register, type ApiError } from "@/lib/api";
import {
  AuthShell,
  authButtonClass,
  authErrorClass,
  authInputClass,
  authLabelClass,
  authLinkClass,
} from "@/components/auth/auth-shell";

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

  return (
    <AuthShell
      headline="Start your engine."
      blurb="Create an account to save listings, track offers and sell or trade in your car."
    >
      <form onSubmit={handleSubmit} noValidate>
        <h1 className="mb-1 text-2xl font-bold text-white">
          Create your account
        </h1>
        <p className="mb-6 text-sm text-zinc-400">
          Join Boss Auto Exchange in a few quick steps.
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
          <label htmlFor="name" className={authLabelClass}>
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            value={form.name}
            onChange={handleChange}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={authInputClass}
            placeholder="Juan Dela Cruz"
          />
          {errors.name && (
            <p id="name-error" className={authErrorClass}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Phone */}
        <div className="mb-4">
          <label htmlFor="phone" className={authLabelClass}>
            Phone <span className="font-normal text-zinc-500">(optional)</span>
          </label>
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
            aria-invalid={!!errors.phone}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={authInputClass}
            placeholder="09171234567"
          />
          {errors.phone && (
            <p id="phone-error" className={authErrorClass}>
              {errors.phone}
            </p>
          )}
        </div>

        {/* Email */}
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
            onBlur={handleBlur}
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

        {/* Password */}
        <div className="mb-4">
          <label htmlFor="password" className={authLabelClass}>
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              value={form.password}
              onChange={handleChange}
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              className={`${authInputClass} pr-12`}
              placeholder="Create a password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
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

          {form.password.length > 0 && (
            <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
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
          <label htmlFor="password_confirmation" className={authLabelClass}>
            Confirm password
          </label>
          <input
            id="password_confirmation"
            name="password_confirmation"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            required
            value={form.password_confirmation}
            onChange={handleChange}
            aria-invalid={
              (form.password_confirmation.length > 0 && !passwordsMatch) ||
              !!errors.password_confirmation
            }
            className={authInputClass}
            placeholder="Re-enter your password"
          />
          {form.password_confirmation.length > 0 && !passwordsMatch && (
            <p className={authErrorClass}>Passwords do not match.</p>
          )}
          {errors.password_confirmation && (
            <p className={authErrorClass}>{errors.password_confirmation}</p>
          )}
        </div>

        <button type="submit" disabled={loading} className={authButtonClass}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          {loading ? "Creating account..." : "Create account"}
        </button>

        <p className="mt-6 text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className={authLinkClass}>
            Sign in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

function RuleItem({ met, children }: { met: boolean; children: ReactNode }) {
  return (
    <li
      className={`flex items-center gap-1.5 ${met ? "font-medium text-emerald-400" : "text-zinc-400"}`}
    >
      {met ? <Check size={14} aria-hidden /> : <X size={14} aria-hidden />}
      {children}
      <span className="sr-only">{met ? " (met)" : " (not met)"}</span>
    </li>
  );
}
