"use client";

import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { useAuth } from "@/context/auth-context";
import { useCart } from "@/context/cart-context";
import { placeOrder, type ApiError } from "@/lib/api";

// ---------------------------------------------------------------------------
// ADJUST: payment settings
// ---------------------------------------------------------------------------
const DOWNPAYMENT_RATE = 0.2; // 20% — keep in sync with OrderController.php
const MAX_PROOF_SIZE_MB = 5;

// Optional: lets guests who already have an account log in and come back.
const CHECKOUT_PATH = "/checkout"; // ADJUST if your route is different
const LOGIN_URL = `/login?redirect=${encodeURIComponent(CHECKOUT_PATH)}`;

type PaymentMethodId = "gcash" | "maya" | "bank";

const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  bankName?: string;
  accountName: string;
  accountNumber: string; // shown to the customer
  copyValue: string; // what the copy button copies
}[] = [
  {
    id: "gcash",
    label: "GCash",
    accountName: "Justin De Castro",
    accountNumber: "0945 675 4591",
    copyValue: "09456754591",
  },
  {
    id: "maya",
    label: "Maya",
    accountName: "Justin De Castro",
    accountNumber: "0945 675 4591",
    copyValue: "09456754591",
  },
  {
    id: "bank",
    label: "Bank transfer",
    bankName: "YOUR BANK NAME", // ADJUST
    accountName: "Justin De Castro",
    accountNumber: "0000 0000 0000", // ADJUST
    copyValue: "000000000000", // ADJUST
  },
];
// ---------------------------------------------------------------------------

const getPriceValue = (price: string) => Number(price.replace(/[₱,]/g, ""));

const formatPrice = (value: number) =>
  `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 0 })}`;

type FormState = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  reference: string;
};

type ErrorKey = keyof FormState | "proof";

const initialForm: FormState = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  notes: "",
  reference: "",
};

// Laravel field name -> form field name (for 422 validation errors)
const serverFieldMap: Record<string, ErrorKey> = {
  full_name: "fullName",
  email: "email",
  phone: "phone",
  address: "address",
  notes: "notes",
  payment_reference: "reference",
  payment_proof: "proof",
};

const inputClasses =
  "w-full rounded-2xl border border-white/10 bg-[#061B3D]/20 px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-[#D41F2D]";

const labelClasses =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-zinc-400";

export default function CheckoutPage() {
  // `user` is optional now: logged-in users get their details prefilled,
  // guests just fill in the form.
  const { user } = useAuth();
  const { items, clearCart, isHydrated } = useCart();

  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<ErrorKey, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [paidAmount, setPaidAmount] = useState(0);
  const [submittedAsGuest, setSubmittedAsGuest] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodId>("gcash");
  const [proof, setProof] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prefill name/email/phone for logged-in users (without overwriting what
  // they typed). Does nothing for guests.
  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      fullName: current.fullName || user.name || "",
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  // Preview of the selected screenshot.
  useEffect(() => {
    if (!proof) {
      setProofPreview("");
      return;
    }
    const url = URL.createObjectURL(proof);
    setProofPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [proof]);

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) => sum + getPriceValue(item.price) * item.quantity,
        0,
      ),
    [items],
  );
  const total = subtotal;
  const downpayment = Math.round(total * DOWNPAYMENT_RATE);
  const balance = total - downpayment;

  const selectedMethod = PAYMENT_METHODS.find((m) => m.id === paymentMethod)!;

  const handleChange =
    (field: keyof FormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
      setErrors((current) => ({ ...current, [field]: undefined }));
    };

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrors((c) => ({ ...c, proof: "Please upload an image file." }));
      event.target.value = "";
      return;
    }
    if (file.size > MAX_PROOF_SIZE_MB * 1024 * 1024) {
      setErrors((c) => ({
        ...c,
        proof: `Image must be ${MAX_PROOF_SIZE_MB}MB or smaller.`,
      }));
      event.target.value = "";
      return;
    }

    setProof(file);
    setErrors((c) => ({ ...c, proof: undefined }));
  };

  const removeProof = () => {
    setProof(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(selectedMethod.copyValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — ignore
    }
  };

  const validate = (): boolean => {
    const nextErrors: Partial<Record<ErrorKey, string>> = {};

    if (!form.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Enter a valid email address.";
    }
    if (!form.phone.trim()) nextErrors.phone = "Phone number is required.";
    if (!form.address.trim())
      nextErrors.address = "Delivery / pickup address is required.";
    if (!proof) nextErrors.proof = "Upload your payment screenshot.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (items.length === 0 || !validate() || !proof) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      // Multipart, because we're uploading the screenshot.
      const data = new FormData();
      data.append("full_name", form.fullName.trim());
      data.append("email", form.email.trim());
      data.append("phone", form.phone.trim());
      data.append("address", form.address.trim());
      if (form.notes.trim()) data.append("notes", form.notes.trim());

      // Only ids + quantities. The server calculates prices and the 20%.
      items.forEach((item, i) => {
        data.append(`items[${i}][vehicle_id]`, String(item.id));
        data.append(`items[${i}][quantity]`, String(item.quantity));
      });

      data.append("payment_method", paymentMethod);
      if (form.reference.trim())
        data.append("payment_reference", form.reference.trim());
      data.append("payment_proof", proof);

      // From lib/api.ts — works for guests and logged-in users.
      const result = await placeOrder(data);

      setSubmittedAsGuest(!user);
      setOrderNumber(result?.data?.order_number ?? "");
      setPaidAmount(Number(result?.data?.downpayment ?? downpayment));
      setIsSubmitted(true);
      clearCart();
    } catch (err) {
      const apiErr = err as ApiError;

      // Laravel 422 -> show messages under the matching fields.
      if (apiErr?.errors) {
        const fieldErrors: Partial<Record<ErrorKey, string>> = {};
        for (const [key, messages] of Object.entries(apiErr.errors)) {
          const field = serverFieldMap[key];
          if (field) fieldErrors[field] = messages[0];
        }
        setErrors(fieldErrors);
      }
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-[#191610] px-4 text-white">
          <div className="w-full max-w-lg rounded-[28px] border border-[#D41F2D]/30 bg-[#120f0d] px-6 py-12 text-center shadow-[0_25px_80px_rgba(0,0,0,0.35)] sm:px-10">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-[#D41F2D]/40 bg-[#D41F2D]/10">
              <CheckCircle2 className="text-[#D41F2D]" size={30} />
            </div>

            <h1 className="mt-6 text-3xl font-black tracking-tight text-white">
              Order submitted
            </h1>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              Thank you! Your order{" "}
              {orderNumber && (
                <span className="font-semibold text-[#F3D77A]">
                  {orderNumber}
                </span>
              )}{" "}
              has been received. We&apos;ll verify your{" "}
              {formatPrice(paidAmount)} downpayment and a sales advisor will
              contact you to confirm the next steps.
            </p>

            {submittedAsGuest && (
              <p className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-zinc-400">
                Please save your order number
                {orderNumber ? ` (${orderNumber})` : ""}. You&apos;ll need it,
                along with the email you used, when contacting us about this
                order.
              </p>
            )}

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/showroom"
                className="inline-flex items-center justify-center rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B]"
              >
                Continue browsing
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#D41F2D]/60 hover:bg-white/10"
              >
                Back to home
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  // Wait for the saved cart before showing anything, so we don't flash
  // "Your cart is empty".
  if (!isHydrated) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-[#191610]" />
        <Footer />
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen items-center justify-center bg-[#191610] px-4 text-white">
          <div className="w-full max-w-md rounded-[28px] border border-dashed border-white/15 bg-[#120f0d] px-6 py-14 text-center">
            <p className="text-xl font-semibold text-white">
              Your cart is empty
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Add a vehicle to your cart before proceeding to checkout.
            </p>
            <Link
              href="/showroom"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-[#E8404B]"
            >
              Browse showroom
            </Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#191610] text-white">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Link
            href="/cart"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#D41F2D] transition-colors hover:text-[#dbc15b]"
          >
            <ArrowLeft size={16} />
            Back to cart
          </Link>

          <div className="mt-5 flex items-center gap-3">
            <span className="h-px w-10 bg-[#D41F2D]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#D41F2D]">
              Order Details
            </span>
          </div>

          <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Checkout
          </h1>

          {!user && (
            <p className="mt-3 text-sm text-zinc-400">
              Checking out as a guest. No account needed.{" "}
              <Link
                href={LOGIN_URL}
                className="font-semibold text-[#D41F2D] transition-colors hover:text-[#dbc15b]"
              >
                Already have an account? Log in
              </Link>
            </p>
          )}

          <div className="mt-10 grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            {/* Form */}
            <form
              onSubmit={handleSubmit}
              noValidate
              className="rounded-[28px] border border-white/10 bg-[#120f0d] p-6 sm:p-8"
            >
              <h2 className="text-lg font-bold text-white">
                Contact information
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="fullName" className={labelClasses}>
                    Full name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={handleChange("fullName")}
                    placeholder="Juan Dela Cruz"
                    className={inputClasses}
                    aria-invalid={Boolean(errors.fullName)}
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.fullName}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className={labelClasses}>
                    Email address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="you@email.com"
                    className={inputClasses}
                    aria-invalid={Boolean(errors.email)}
                  />
                  {errors.email && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className={labelClasses}>
                    Phone number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={form.phone}
                    onChange={handleChange("phone")}
                    placeholder="09XX XXX XXXX"
                    className={inputClasses}
                    aria-invalid={Boolean(errors.phone)}
                  />
                  {errors.phone && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.phone}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="address" className={labelClasses}>
                    Delivery / pickup address
                  </label>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={handleChange("address")}
                    placeholder="Street, City, Province"
                    className={inputClasses}
                    aria-invalid={Boolean(errors.address)}
                  />
                  {errors.address && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.address}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="notes" className={labelClasses}>
                    Additional notes{" "}
                    <span className="text-zinc-600">(optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    value={form.notes}
                    onChange={handleChange("notes")}
                    placeholder="Preferred schedule, financing questions, trade-in details..."
                    rows={3}
                    className={`${inputClasses} resize-none`}
                  />
                </div>
              </div>

              {/* Payment */}
              <div className="mt-8 border-t border-white/10 pt-8">
                <h2 className="text-lg font-bold text-white">
                  Downpayment ({Math.round(DOWNPAYMENT_RATE * 100)}%)
                </h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Send{" "}
                  <span className="font-semibold text-[#F3D77A]">
                    {formatPrice(downpayment)}
                  </span>{" "}
                  using any method below, then upload your screenshot.
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map((method) => {
                    const active = method.id === paymentMethod;
                    return (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        aria-pressed={active}
                        className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition-colors ${
                          active
                            ? "border-[#D41F2D] bg-[#D41F2D]/10 text-[#F3D77A]"
                            : "border-white/10 bg-[#061B3D]/20 text-zinc-300 hover:border-white/25"
                        }`}
                      >
                        {method.label}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-2xl border border-[#D41F2D]/20 bg-[#061B3D]/20 p-4 text-sm">
                  {selectedMethod.bankName && (
                    <div className="flex items-center justify-between py-1">
                      <span className="text-zinc-400">Bank</span>
                      <span className="font-semibold text-white">
                        {selectedMethod.bankName}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between py-1">
                    <span className="text-zinc-400">Account name</span>
                    <span className="font-semibold text-white">
                      {selectedMethod.accountName}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 py-1">
                    <span className="text-zinc-400">
                      {selectedMethod.id === "bank"
                        ? "Account number"
                        : "Number"}
                    </span>
                    <span className="flex items-center gap-2 font-semibold text-white">
                      {selectedMethod.accountNumber}
                      <button
                        type="button"
                        onClick={copyNumber}
                        aria-label="Copy account number"
                        className="rounded-full border border-white/10 p-1.5 text-zinc-300 transition-colors hover:border-[#D41F2D]/60 hover:text-[#D41F2D]"
                      >
                        {copied ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="text-zinc-400">Amount to send</span>
                    <span className="text-base font-black text-[#D41F2D]">
                      {formatPrice(downpayment)}
                    </span>
                  </div>
                </div>

                {/* Screenshot upload */}
                <div className="mt-5">
                  <label className={labelClasses}>Payment screenshot</label>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProofChange}
                    className="hidden"
                    id="proof"
                  />

                  {proof ? (
                    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#061B3D]/20 p-3">
                      {proofPreview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={proofPreview}
                          alt="Payment screenshot preview"
                          className="h-16 w-16 shrink-0 rounded-xl object-cover"
                        />
                      ) : (
                        <div className="h-16 w-16 shrink-0 rounded-xl bg-white/5" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {proof.name}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {(proof.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={removeProof}
                        aria-label="Remove screenshot"
                        className="rounded-full border border-white/10 p-2 text-zinc-300 transition-colors hover:border-red-400/60 hover:text-red-400"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-sm transition-colors hover:border-[#D41F2D]/60 ${
                        errors.proof
                          ? "border-red-400/60 text-red-300"
                          : "border-white/20 text-zinc-400"
                      }`}
                    >
                      <Upload size={20} className="text-[#D41F2D]" />
                      Tap to upload screenshot
                      <span className="text-xs text-zinc-600">
                        JPG, PNG or WEBP · max {MAX_PROOF_SIZE_MB}MB
                      </span>
                    </button>
                  )}

                  {errors.proof && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.proof}
                    </p>
                  )}
                </div>

                <div className="mt-4">
                  <label htmlFor="reference" className={labelClasses}>
                    Reference number{" "}
                    <span className="text-zinc-600">(optional)</span>
                  </label>
                  <input
                    id="reference"
                    type="text"
                    value={form.reference}
                    onChange={handleChange("reference")}
                    placeholder="e.g. GCash ref. no."
                    className={inputClasses}
                  />
                  {errors.reference && (
                    <p className="mt-1.5 text-xs text-red-400">
                      {errors.reference}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-6 flex items-start gap-2.5 rounded-2xl border border-white/10 bg-white/5 p-4 text-xs leading-5 text-zinc-400">
                <ShieldCheck
                  size={16}
                  className="mt-0.5 shrink-0 text-[#D41F2D]"
                />
                Your order is confirmed once we verify your payment screenshot.
                The remaining {formatPrice(balance)} balance will be arranged
                with your sales advisor.
              </div>

              {submitError && (
                <p
                  role="alert"
                  className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                >
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#d8b53c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting
                  ? "Submitting..."
                  : `Submit order • ${formatPrice(downpayment)} downpayment`}
              </button>
            </form>

            {/* Order summary */}
            <div className="rounded-[28px] border border-[#D41F2D]/20 bg-[#120f0d] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.35)] lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-white">Your order</h2>

              <div className="mt-5 space-y-4 border-b border-white/10 pb-5">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-[#0d0d0d]">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          unoptimized
                          className="object-contain p-1"
                        />
                      ) : null}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">
                        {item.name}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Qty {item.quantity}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-[#D41F2D]">
                      {formatPrice(getPriceValue(item.price) * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 space-y-3 border-b border-white/10 pb-5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Total price</span>
                  <span className="font-semibold text-white">
                    {formatPrice(total)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">
                    Balance ({100 - Math.round(DOWNPAYMENT_RATE * 100)}%)
                  </span>
                  <span className="font-semibold text-white">
                    {formatPrice(balance)}
                  </span>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-base font-semibold text-white">
                  Downpayment due today
                </span>
                <span className="text-2xl font-black text-[#D41F2D]">
                  {formatPrice(downpayment)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
