"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarCheck, CheckCircle2, X } from "lucide-react";

import {
  createTestDrive,
  fetchTestDriveSlots,
  isAbortError,
  type ApiError,
  type CreateTestDriveResponse,
  type TestDriveSlot,
} from "@/lib/api";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#171410] px-3.5 py-3 text-sm text-white placeholder:text-zinc-500 [color-scheme:dark] focus:border-[#D41F2D] focus:outline-none";

const inputInvalidClass = "!border-red-500/60 focus:!border-red-500";

/** Local YYYY-MM-DD, `daysFromNow` days ahead. */
function localDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** "13:00" -> "1:00 PM" */
function timeLabel(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const suffix = h >= 12 ? "PM" : "AM";
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${suffix}`;
}

function dateLabel(date: string): string {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-PH", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/* -------------------------------------------------------------------------- */
/*  Validation                                                                */
/* -------------------------------------------------------------------------- */

interface FormState {
  full_name: string;
  phone: string;
  email: string;
  preferred_date: string;
  preferred_time: string;
  notes: string;
}

const EMPTY_FORM: FormState = {
  full_name: "",
  phone: "",
  email: "",
  preferred_date: "",
  preferred_time: "",
  notes: "",
};

type ClientErrors = Partial<Record<keyof FormState, string>>;

/** PH mobile: 11 digits, starts with 09. */
const PHONE_RE = /^09\d{9}$/;

const EMAIL_RE =
  /^[A-Za-z0-9](?:[A-Za-z0-9._%+-]{0,62}[A-Za-z0-9])?@(?:[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

/** Digits only, max 11. Also turns a pasted "+63 917 ..." into "0917...". */
function sanitizePhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("639") && digits.length >= 12) {
    digits = "0" + digits.slice(2);
  }
  return digits.slice(0, 11);
}

/** Common typos of popular providers -> what they probably meant. */
const DOMAIN_TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmal.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahooo.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
};

/** Throwaway inbox providers. Extend as needed. */
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "sharklasers.com",
  "10minutemail.com",
  "tempmail.com",
  "temp-mail.org",
  "yopmail.com",
  "trashmail.com",
  "throwawaymail.com",
  "getnada.com",
  "maildrop.cc",
  "fakeinbox.com",
]);

/** Keyboard-mash sequences (rows and columns). */
const KEYBOARD_RUNS = [
  "qwer",
  "wert",
  "erty",
  "rtyu",
  "tyui",
  "yuio",
  "uiop",
  "asdf",
  "sdfg",
  "dfgh",
  "fghj",
  "ghjk",
  "hjkl",
  "zxcv",
  "xcvb",
  "cvbn",
  "vbnm",
  "qaz",
  "wsx",
  "edc",
  "rfv",
];

/**
 * Heuristic: does the part before the "@" look like random typing?
 * Catches things like "asdhaksdgb", "xkqjzpwv", "qwertyuiop", "aaaaaa".
 * Real names/nicknames ("juan.delacruz", "maria_santos92") pass because they
 * have normal vowel/consonant patterns.
 */
function looksRandom(local: string): boolean {
  const lower = local.toLowerCase();
  const letters = lower.replace(/[^a-z]/g, "");

  // Nothing but digits/symbols, e.g. "123456@gmail.com"
  if (letters.length === 0) return true;

  // 4+ of the same character in a row: "aaaa", "zzzzz"
  if (/(.)\1{3,}/.test(lower)) return true;

  // Check each alphabetic chunk separately ("juan.delacruz92" -> juan, delacruz)
  for (const seg of lower.split(/[^a-z]+/).filter(Boolean)) {
    if (KEYBOARD_RUNS.some((k) => seg.includes(k))) return true;

    // 5+ consonants in a row (y counts as a vowel): "ksdgb", "hdgsj"
    if (/[^aeiouy]{5,}/.test(seg)) return true;

    // Very few vowels in a longer chunk
    if (seg.length >= 6) {
      const vowels = (seg.match(/[aeiouy]/g) ?? []).length;
      if (vowels / seg.length < 0.2) return true;
    }
  }

  return false;
}

function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Email is required.";

  const [local = "", domain = ""] = email.split("@");
  if (!EMAIL_RE.test(email) || email.includes("..") || local.length > 64) {
    return "Enter a valid email address.";
  }

  const d = domain.toLowerCase();

  if (DOMAIN_TYPOS[d]) {
    return `Did you mean ${local}@${DOMAIN_TYPOS[d]}?`;
  }
  if (DISPOSABLE_DOMAINS.has(d)) {
    return "Disposable email addresses aren’t allowed.";
  }
  if (looksRandom(local)) {
    return "This email looks invalid. Please enter your real email address.";
  }
  return undefined;
}

function validateField(
  name: keyof FormState,
  value: string,
): string | undefined {
  switch (name) {
    case "full_name": {
      const v = value.trim();
      if (!v) return "Full name is required.";
      if (v.length < 2) return "Please enter your full name.";
      return undefined;
    }
    case "phone":
      if (!value) return "Phone number is required.";
      if (!PHONE_RE.test(value)) {
        return "Enter an 11-digit mobile number starting with 09 (e.g. 09171234567).";
      }
      return undefined;
    case "email":
      return validateEmail(value);
    case "preferred_date":
      return value ? undefined : "Please choose a date.";
    case "preferred_time":
      return value ? undefined : "Please choose a time.";
    default:
      return undefined;
  }
}

const VALIDATED_FIELDS: (keyof FormState)[] = [
  "full_name",
  "phone",
  "email",
  "preferred_date",
  "preferred_time",
];

function validateAll(form: FormState): ClientErrors {
  const errors: ClientErrors = {};
  for (const name of VALIDATED_FIELDS) {
    const message = validateField(name, form[name]);
    if (message) errors[name] = message;
  }
  return errors;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function TestDriveDialog({
  open,
  onClose,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  vehicle: { id: number; name: string };
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [slots, setSlots] = useState<TestDriveSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [clientErrors, setClientErrors] = useState<ClientErrors>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CreateTestDriveResponse["data"] | null>(
    null,
  );

  // Native <dialog>: gives us focus trapping, Esc to close and a backdrop.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      setForm(EMPTY_FORM);
      setSlots([]);
      setClientErrors({});
      setFieldErrors({});
      setFormError(null);
      setResult(null);
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  // Load free slots whenever the date changes.
  useEffect(() => {
    if (!open || !form.preferred_date) {
      setSlots([]);
      return;
    }

    const controller = new AbortController();
    setSlotsLoading(true);

    fetchTestDriveSlots(vehicle.id, form.preferred_date, {
      signal: controller.signal,
    })
      .then(({ data }) => {
        setSlots(data);
        setSlotsLoading(false);
        setForm((f) =>
          data.some((s) => s.time === f.preferred_time && s.available)
            ? f
            : { ...f, preferred_time: "" },
        );
      })
      .catch((err: unknown) => {
        if (isAbortError(err)) return;
        setSlots([]);
        setSlotsLoading(false);
        setFieldErrors((prev) => ({
          ...prev,
          preferred_date: [
            (err as ApiError).errors?.date?.[0] ??
              (err as ApiError).message ??
              "Couldn’t load available times.",
          ],
        }));
      });

    return () => controller.abort();
  }, [open, form.preferred_date, vehicle.id]);

  const clearErrorsFor = (name: keyof FormState) => {
    setClientErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
    setFieldErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  };

  const setField = (name: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
    clearErrorsFor(name);
  };

  /** Validate one field when the user leaves it. */
  const blurField = (name: keyof FormState) => {
    const message = validateField(name, form[name]);
    setClientErrors((prev) => {
      const next = { ...prev };
      if (message) next[name] = message;
      else delete next[name];
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (submitting) return;

    const errors = validateAll(form);
    if (Object.keys(errors).length > 0) {
      setClientErrors(errors);
      setFormError("Please check the highlighted fields.");
      // Focus the first invalid input once the errors have rendered.
      requestAnimationFrame(() => {
        dialogRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    setClientErrors({});

    try {
      const res = await createTestDrive({
        vehicle_id: vehicle.id,
        full_name: form.full_name.trim(),
        phone: form.phone,
        email: form.email.trim().toLowerCase(),
        preferred_date: form.preferred_date,
        preferred_time: form.preferred_time,
        notes: form.notes.trim() || undefined,
      });
      setResult(res.data);
    } catch (err) {
      const apiErr = err as ApiError;
      setFieldErrors(apiErr.errors ?? {});
      setFormError(
        apiErr.errors
          ? "Please check the highlighted fields."
          : apiErr.message || "Something went wrong. Please try again.",
      );
      // A "slot taken" error means our slot list is stale — refresh it.
      if (apiErr.errors?.preferred_time) {
        setForm((f) => ({ ...f, preferred_time: "" }));
      }
    } finally {
      setSubmitting(false);
    }
  };

  /** Client-side message first, then whatever the server returned. */
  const errorFor = (name: keyof FormState) =>
    clientErrors[name] ?? fieldErrors[name]?.[0];

  const inputCls = (name: keyof FormState, extra = "") =>
    `${inputClass} ${errorFor(name) ? inputInvalidClass : ""} ${extra}`;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => {
        // Click on the backdrop (the dialog element itself) closes it.
        if (e.target === dialogRef.current) onClose();
      }}
      aria-labelledby="test-drive-title"
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-[28px] border border-[#D41F2D]/20 bg-[#120f0d] p-0 text-white shadow-[0_25px_80px_rgba(0,0,0,0.6)] backdrop:bg-[#061B3D]/70 backdrop:backdrop-blur-sm"
    >
      <div className="max-h-[90vh] overflow-y-auto p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#D41F2D]/10">
              <CalendarCheck className="text-[#D41F2D]" size={20} />
            </div>
            <div>
              <h2 id="test-drive-title" className="text-lg font-bold">
                Book a test drive
              </h2>
              <p className="text-sm text-zinc-400">{vehicle.name}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-zinc-300 transition-colors hover:border-[#D41F2D] hover:text-white ${focusRing}`}
          >
            <X size={16} />
          </button>
        </div>

        {result ? (
          /* Success */
          <div className="py-4 text-center">
            <CheckCircle2 className="mx-auto text-red-400" size={48} />
            <h3 className="mt-4 text-xl font-bold">Request received</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              {dateLabel(result.preferred_date)} at{" "}
              {timeLabel(result.preferred_time)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Reference{" "}
              <span className="font-semibold text-[#F3D77A]">
                {result.reference}
              </span>
            </p>
            <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-zinc-400">
              We’ll contact you by phone or email to confirm your schedule.
            </p>
            <button
              type="button"
              onClick={onClose}
              className={`mt-6 inline-flex items-center justify-center rounded-full bg-[#D41F2D] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#d8b53c] ${focusRing}`}
            >
              Done
            </button>
          </div>
        ) : (
          /* Form */
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            {formError && (
              <p
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/5 px-3.5 py-2.5 text-sm text-red-300"
              >
                {formError}
              </p>
            )}

            <Field label="Full name" error={errorFor("full_name")}>
              <input
                type="text"
                autoComplete="name"
                required
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
                onBlur={() => blurField("full_name")}
                aria-invalid={!!errorFor("full_name")}
                className={inputCls("full_name")}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" error={errorFor("phone")}>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  placeholder="09171234567"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setField("phone", sanitizePhone(e.target.value))
                  }
                  onBlur={() => blurField("phone")}
                  aria-invalid={!!errorFor("phone")}
                  className={inputCls("phone")}
                />
              </Field>

              <Field label="Email" error={errorFor("email")}>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  required
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  onBlur={() => blurField("email")}
                  aria-invalid={!!errorFor("email")}
                  className={inputCls("email")}
                />
              </Field>
            </div>

            <Field label="Preferred date" error={errorFor("preferred_date")}>
              <input
                type="date"
                required
                min={localDate(1)}
                max={localDate(60)}
                value={form.preferred_date}
                onChange={(e) => setField("preferred_date", e.target.value)}
                aria-invalid={!!errorFor("preferred_date")}
                className={inputCls("preferred_date")}
              />
            </Field>

            <Field
              label="Preferred time"
              error={errorFor("preferred_time")}
              group
            >
              {!form.preferred_date ? (
                <p className="rounded-xl border border-dashed border-white/10 px-3.5 py-3 text-sm text-zinc-500">
                  Choose a date to see available times.
                </p>
              ) : slotsLoading ? (
                <p className="px-1 py-3 text-sm text-zinc-500">
                  Checking availability…
                </p>
              ) : slots.length === 0 ? (
                <p className="px-1 py-3 text-sm text-zinc-500">
                  No times available for this date.
                </p>
              ) : (
                <div
                  role="radiogroup"
                  aria-label="Preferred time"
                  className="grid grid-cols-3 gap-2 sm:grid-cols-4"
                >
                  {slots.map((slot) => {
                    const selected = form.preferred_time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        disabled={!slot.available}
                        onClick={() => setField("preferred_time", slot.time)}
                        className={`rounded-xl border px-2 py-2.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:text-zinc-600 disabled:line-through ${
                          selected
                            ? "border-[#D41F2D] bg-[#D41F2D] text-black"
                            : "border-white/10 bg-[#171410] text-white hover:border-[#D41F2D]/60 disabled:hover:border-white/10"
                        } ${focusRing}`}
                      >
                        {timeLabel(slot.time)}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>

            <Field label="Notes (optional)" error={errorFor("notes")}>
              <textarea
                rows={3}
                maxLength={1000}
                placeholder="Anything we should prepare? e.g. trade-in, financing questions"
                value={form.notes}
                onChange={(e) => setField("notes", e.target.value)}
                className={inputCls("notes", "resize-none")}
              />
            </Field>

            <button
              type="submit"
              disabled={
                submitting ||
                !form.full_name ||
                !form.phone ||
                !form.email ||
                !form.preferred_date ||
                !form.preferred_time
              }
              className={`flex w-full items-center justify-center rounded-full bg-[#D41F2D] px-5 py-3.5 text-sm font-bold text-white transition-all hover:bg-[#d8b53c] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#D41F2D] ${focusRing}`}
            >
              {submitting ? "Sending request…" : "Request test drive"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}

function Field({
  label,
  error,
  group = false,
  children,
}: {
  label: string;
  error?: string;
  /** Use for a group of buttons (not a single input), so it isn't wrapped in a <label>. */
  group?: boolean;
  children: React.ReactNode;
}) {
  const Wrapper = group ? "div" : "label";

  return (
    <Wrapper className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-300">
        {label}
      </span>
      {children}
      {error && (
        <span role="alert" className="mt-1.5 block text-xs text-red-400">
          {error}
        </span>
      )}
    </Wrapper>
  );
}
