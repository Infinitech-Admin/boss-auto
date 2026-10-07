"use client";

import { useState } from "react";
import { Calculator, Download, FileText } from "lucide-react";

/* ------------------------------------------------------------------ */
/* TYPES                                                               */
/* ------------------------------------------------------------------ */

type Method = "flat" | "reducing";

/** Lender with a FORM (typed inputs). Only Global Dominion uses this. */
type Field = {
  key: string;
  label: string;
  step?: string;
  min?: number;
  max?: number;
  allowed?: number[];
  hint?: string;
  fromPrice?: boolean;
  defaultValue?: string;
  unit?: string;
};

type Output = { label: string; value: string; primary?: boolean };

type FormLender = {
  kind: "form";
  id: string;
  name: string;
  fields: Field[];
  calculate: (v: Record<string, number>) => Output[] | null;
};

/** Lender with BUTTONS (down payment %) and a list of terms. */
type PlanLender = {
  kind: "plans";
  id: string;
  name: string;
  /** Down payment buttons, in %. e.g. [10, 20, 30] or [10, 15, 20, 25]. */
  dpOptions: number[];
  defaultDp: number;
  /** Loan terms in months. */
  terms: number[];
  /** Interest rate PER MONTH (%) for each term in `terms`. */
  rates: Record<number, number>;
  method: Method;
  /** Show the rate under each term on screen. */
  showRate: boolean;
  /** true while rates/terms are placeholders. Shows a dev note. */
  pending?: boolean;
};

type Lender = FormLender | PlanLender;

type Plan = {
  months: number;
  rate: number;
  monthly: number;
  totalInterest: number;
  totalPayable: number;
};

/** What the PDF / Word files print. Built the same way for both lender types. */
type Quote = {
  summary: [string, string][];
  results: [string, string][];
  table?: { head: string[]; rows: string[][] };
};

/* ------------------------------------------------------------------ */
/* HELPERS                                                             */
/* ------------------------------------------------------------------ */

/** "₱1,250,000" | "1250000" | 1250000 -> 1250000 */
export function parsePrice(price: string | number): number {
  if (typeof price === "number") return price;
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** 103333.333 -> "103,333.33" */
const fmt = (n: number) =>
  n.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const peso = (n: number) => `₱${fmt(n)}`;

/** 0.02 -> "2%", 1.25 -> "1.25%" */
const fmtPct = (pct: number) => `${parseFloat(pct.toFixed(2))}%`;

function computePlan(
  method: Method,
  financed: number,
  ratePct: number,
  months: number,
): Omit<Plan, "months" | "rate"> {
  const r = ratePct / 100;
  if (method === "flat") {
    const totalInterest = financed * r * months;
    const totalPayable = financed + totalInterest;
    return { monthly: totalPayable / months, totalInterest, totalPayable };
  }
  const monthly =
    r === 0
      ? financed / months
      : (financed * r) / (1 - Math.pow(1 + r, -months));
  const totalPayable = monthly * months;
  return { monthly, totalInterest: totalPayable - financed, totalPayable };
}

function buildPlans(l: PlanLender, financed: number): Plan[] {
  return l.terms.map((months) => {
    const rate = l.rates[months] ?? 0;
    return { months, rate, ...computePlan(l.method, financed, rate, months) };
  });
}

const termTitle = (months: number) =>
  months % 12 === 0
    ? `${months / 12} year${months / 12 > 1 ? "s" : ""}`
    : `${months} months`;

/* ------------------------------------------------------------------ */
/* LENDERS                                                             */
/* ------------------------------------------------------------------ */

const flatFormula = ({
  amount,
  rate,
  term,
}: Record<string, number>): Output[] | null => {
  if (!(amount > 0) || !(term > 0) || !(rate >= 0)) return null;
  // Flat (add-on) rate: interest is always on the ORIGINAL amount.
  const interest = amount * (rate / 100) * term;
  const total = amount + interest;
  return [
    {
      label: "Your monthly payment will be",
      value: fmt(total / term),
      primary: true,
    },
    { label: "Total interest paid", value: fmt(interest) },
    { label: "Total loan repayment", value: fmt(total) },
  ];
};

/** Same rate for every term (placeholder helper). */
const sameRate = (terms: number[], rate: number) =>
  Object.fromEntries(terms.map((t) => [t, rate])) as Record<number, number>;

const PLAN_TERMS = [12, 24, 36, 48]; // max 48 months

const LENDERS: Lender[] = [
  {
    // TODO: replace dpOptions, terms, rates and method with Asia Link's own.
    kind: "plans",
    id: "asia-link",
    name: "Asia Link",
    dpOptions: [10, 20, 30],
    defaultDp: 30,
    terms: PLAN_TERMS,
    rates: sameRate(PLAN_TERMS, 1.5),
    method: "flat",
    showRate: true,
    pending: true,
  },

  {
    // CONFIRMED against the online calculator:
    // 1,000,000 @ 2% / month, 12 months -> 103,333.33 / 240,000.00 / 1,240,000.00
    // Rules (their "Calculator Assumptions"): flat add-on rate, amount
    // 10,000 to 2,000,000, terms 6/12/18/24/36, rate hint 1.25% to 1.60%.
    kind: "form",
    id: "global-dominion",
    name: "Global Dominion",
    fields: [
      {
        key: "amount",
        label: "Loan Amount (PHP)",
        fromPrice: true,
        min: 10000,
        max: 2000000,
        hint: "Minimum 10,000, maximum 2,000,000.",
      },
      {
        key: "rate",
        label: "Monthly Interest Rate (%)",
        step: "0.01",
        defaultValue: "2",
        unit: "%",
        hint: "Rates usually range from 1.25% to 1.60%.",
      },
      {
        key: "term",
        label: "Loan Term (Months)",
        step: "1",
        allowed: [6, 12, 18, 24, 36],
        defaultValue: "12",
        unit: " months",
        hint: "Available terms: 6, 12, 18, 24 or 36 months.",
      },
    ],
    calculate: flatFormula,
  },

  {
    // TODO: replace with JACCS Cambodia's own (check currency too).
    kind: "plans",
    id: "jaccs-cambodia",
    name: "JACCS Cambodia",
    dpOptions: [10, 20, 30],
    defaultDp: 30,
    terms: PLAN_TERMS,
    rates: sameRate(PLAN_TERMS, 1.5),
    method: "flat",
    showRate: true,
    pending: true,
  },

  {
    // TODO: replace with SAC Financing's own.
    kind: "plans",
    id: "sac-financing",
    name: "SAC Financing",
    dpOptions: [10, 15, 20, 25],
    defaultDp: 25,
    terms: PLAN_TERMS,
    rates: sameRate(PLAN_TERMS, 1.5),
    method: "flat",
    showRate: true,
    pending: true,
  },
];

const DISCLAIMER =
  "This is an estimate only and not a loan approval or binding offer. Final rates, fees and terms are subject to lender approval.";

/** Show total interest / total payable on screen for the button lenders. */
const SHOW_INTEREST_BREAKDOWN = false;

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const todayLabel = () =>
  new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

/* ------------------------------------------------------------------ */
/* COMPONENT                                                           */
/* ------------------------------------------------------------------ */

export default function FinancingCalculator({
  carName,
  price,
  year,
  disabled = false,
}: {
  carName: string;
  price: string | number;
  year?: number | string;
  disabled?: boolean;
}) {
  const total = parsePrice(price);

  const [lenderId, setLenderId] = useState("global-dominion");

  // Form values (only form lenders), kept per lender.
  const [store, setStore] = useState<Record<string, Record<string, string>>>(
    () =>
      Object.fromEntries(
        LENDERS.filter((l): l is FormLender => l.kind === "form").map((l) => [
          l.id,
          Object.fromEntries(
            l.fields.map((f) => [
              f.key,
              f.fromPrice
                ? total > 0
                  ? String(Math.round(total))
                  : ""
                : (f.defaultValue ?? ""),
            ]),
          ),
        ]),
      ),
  );

  // Selected down payment (only plan lenders), kept per lender.
  const [dpStore, setDpStore] = useState<Record<string, number>>({});

  if (total <= 0) return null;

  const lender = LENDERS.find((l) => l.id === lenderId) ?? LENDERS[0];
  const safeName = carName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const title = `${year ? `${year} ` : ""}${carName}`;
  const fileBase = `financing-${safeName}-${lender.id}`;

  /* ----- compute per lender type; both end up as a `quote` ----- */
  let quote: Quote | null = null;

  // form lender
  const values = lender.kind === "form" ? store[lender.id] : {};
  const errors: Record<string, string> = {};
  let outputs: Output[] | null = null;

  // plan lender
  const dp =
    lender.kind === "plans" ? (dpStore[lender.id] ?? lender.defaultDp) : 0;
  const downPayment = (total * dp) / 100;
  const financed = total - downPayment;
  const plans = lender.kind === "plans" ? buildPlans(lender, financed) : [];

  if (lender.kind === "form") {
    const numeric = Object.fromEntries(
      lender.fields.map((f) => [f.key, Number(values[f.key])]),
    );
    const num0 = (n: number) => n.toLocaleString("en-US");
    lender.fields.forEach((f) => {
      const n = numeric[f.key];
      if (values[f.key] === "" || !Number.isFinite(n)) return;
      if (f.min !== undefined && n < f.min)
        errors[f.key] = `Must be at least ${num0(f.min)}.`;
      else if (f.max !== undefined && n > f.max)
        errors[f.key] = `Must not exceed ${num0(f.max)}.`;
      else if (f.allowed && !f.allowed.includes(n))
        errors[f.key] = `Choose one of: ${f.allowed.join(", ")}.`;
    });
    outputs = Object.keys(errors).length ? null : lender.calculate(numeric);

    if (outputs) {
      quote = {
        summary: lender.fields.map((f) => [
          f.label,
          f.unit
            ? `${values[f.key]}${f.unit}`
            : fmt(Number(values[f.key]) || 0),
        ]),
        results: outputs.map((o) => [
          o.primary ? "Monthly payment" : o.label,
          o.value,
        ]),
      };
    }
  } else {
    quote = {
      summary: [
        ["Vehicle price", `PHP ${fmt(total)}`],
        [`Down payment (${dp}%)`, `PHP ${fmt(downPayment)}`],
        ["Amount financed", `PHP ${fmt(financed)}`],
      ],
      results: [],
      table: {
        head: [
          "Term",
          ...(lender.showRate ? ["Rate / mo"] : []),
          "Monthly payment",
          "Total interest",
          "Total payable",
        ],
        rows: plans.map((p) => [
          termTitle(p.months),
          ...(lender.showRate ? [fmtPct(p.rate)] : []),
          `PHP ${fmt(p.monthly)}`,
          `PHP ${fmt(p.totalInterest)}`,
          `PHP ${fmt(p.totalPayable)}`,
        ]),
      },
    };
  }

  /* ----------------------------- PDF ----------------------------- */
  const downloadPdf = async () => {
    if (!quote) return;
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const LEFT = 48;
    const RIGHT = 547;
    let y = 56;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("Financing Quotation", LEFT, y);
    y += 26;
    doc.setFontSize(14);
    doc.text(title, LEFT, y);
    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`${lender.name} · Prepared on ${todayLabel()}`, LEFT, y);
    doc.setTextColor(0);
    y += 28;
    doc.setFontSize(10.5);

    quote.summary.forEach(([label, value]) => {
      doc.setFont("helvetica", "normal");
      doc.text(label, LEFT, y);
      doc.text(value, RIGHT, y, { align: "right" });
      y += 20;
    });

    if (quote.results.length) {
      doc.setDrawColor(191, 152, 13);
      doc.line(LEFT, y - 8, RIGHT, y - 8);
      y += 10;
      quote.results.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(label, LEFT, y);
        doc.text(value, RIGHT, y, { align: "right" });
        y += 20;
      });
    }

    if (quote.table) {
      const { head, rows } = quote.table;
      const n = head.length;
      const start = LEFT + 140;
      const gap = (RIGHT - start) / (n - 1);
      const colX = (i: number) => (i === 0 ? LEFT : start + gap * i);

      y += 12;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      head.forEach((h, i) =>
        doc.text(h, colX(i), y, { align: i === 0 ? "left" : "right" }),
      );
      y += 6;
      doc.setDrawColor(0);
      doc.line(LEFT, y, RIGHT, y);
      y += 16;

      rows.forEach((row) => {
        row.forEach((cell, i) => {
          // monthly payment column is bold
          const monthlyCol = head.indexOf("Monthly payment");
          doc.setFont("helvetica", i === monthlyCol ? "bold" : "normal");
          doc.text(cell, colX(i), y, { align: i === 0 ? "left" : "right" });
        });
        y += 20;
      });
      doc.setFontSize(10.5);
    }

    y += 16;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(doc.splitTextToSize(DISCLAIMER, RIGHT - LEFT), LEFT, y);

    doc.save(`${fileBase}${lender.kind === "plans" ? `-${dp}dp` : ""}.pdf`);
  };

  /* ---------------------------- WORD ----------------------------- */
  // HTML-based .doc: opens directly in Microsoft Word, no extra library.
  const downloadWord = () => {
    if (!quote) return;
    const summary = quote.summary
      .map(([l, v]) => `<tr><td>${l}</td><td>${v}</td></tr>`)
      .join("");
    const results = quote.results
      .map(([l, v]) => `<tr><td><b>${l}</b></td><td><b>${v}</b></td></tr>`)
      .join("");
    const table = quote.table
      ? `<table class="grid"><tr>${quote.table.head
          .map((h) => `<th>${h}</th>`)
          .join("")}</tr>${quote.table.rows
          .map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`)
          .join("")}</table>`
      : "";

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Financing Quotation</title>
<style>
  body{font-family:Calibri,Arial,sans-serif;font-size:11pt}
  h1{font-size:20pt;margin-bottom:0}
  h2{font-size:14pt;margin-top:4pt}
  table{border-collapse:collapse;width:100%;margin-top:12pt}
  td,th{border:1px solid #999;padding:6pt;text-align:left}
  th{background:#eee}
  .meta{color:#777;font-size:9pt}
  .note{color:#777;font-size:9pt;margin-top:16pt}
</style></head>
<body>
  <h1>Financing Quotation</h1>
  <h2>${title}</h2>
  <p class="meta">${lender.name} · Prepared on ${todayLabel()}</p>
  <table>${summary}${results}</table>
  ${table}
  <p class="note">${DISCLAIMER}</p>
</body></html>`;

    download(
      new Blob(["\ufeff", html], { type: "application/msword" }),
      `${fileBase}${lender.kind === "plans" ? `-${dp}dp` : ""}.doc`,
    );
  };

  /* ------------------------------ UI ----------------------------- */
  const inputClass = `w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-base text-white placeholder:text-zinc-500 ${focusRing}`;
  const primary = outputs?.find((o) => o.primary);
  const secondary = outputs?.filter((o) => !o.primary) ?? [];

  return (
    <section
      aria-label="Financing"
      className="min-w-0 rounded-[28px] border border-white/10 bg-[#071A38] p-5 sm:p-6"
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D41F2D]/10">
          <Calculator className="text-[#FF5C68]" size={18} />
        </div>
        <h2 className="text-xl font-bold text-white">Loan Calculator</h2>
      </div>

      {/* Lender tabs */}
      <div
        role="tablist"
        aria-label="Financing company"
        className="mb-6 flex flex-wrap gap-2"
      >
        {LENDERS.map((l) => {
          const active = l.id === lender.id;
          return (
            <button
              key={l.id}
              role="tab"
              type="button"
              id={`tab-${l.id}`}
              aria-selected={active}
              aria-controls="loan-panel"
              onClick={() => setLenderId(l.id)}
              className={`rounded-full border px-4 py-2 text-sm font-bold transition-all sm:px-5 sm:py-2.5 ${
                active
                  ? "border-[#D41F2D] bg-[#D41F2D] text-white"
                  : "border-white/15 bg-white/5 text-white hover:border-[#D41F2D]/60"
              } ${focusRing}`}
            >
              {l.name}
            </button>
          );
        })}
      </div>

      <div
        id="loan-panel"
        role="tabpanel"
        aria-labelledby={`tab-${lender.id}`}
        className="min-w-0"
      >
        {lender.kind === "form" ? (
          /* ============ FORM (Global Dominion) ============ */
          <div className="grid grid-cols-1 gap-6">
            <div className="min-w-0">
              <p className="mb-4 text-xs text-zinc-400">
                Fields marked with an <span className="text-[#FF5C68]">*</span>{" "}
                are required
              </p>

              <div className="space-y-5">
                {lender.fields.map((f) => (
                  <div key={`${lender.id}-${f.key}`}>
                    <label
                      htmlFor={`${lender.id}-${f.key}`}
                      className="mb-2 block text-sm font-bold text-white"
                    >
                      {f.label} <span className="text-[#FF5C68]">*</span>
                    </label>
                    <input
                      id={`${lender.id}-${f.key}`}
                      type="number"
                      inputMode="decimal"
                      min={f.min ?? 0}
                      max={f.max}
                      step={f.step}
                      required
                      aria-invalid={!!errors[f.key]}
                      aria-describedby={`${lender.id}-${f.key}-note`}
                      value={values[f.key]}
                      onChange={(e) =>
                        setStore((s) => ({
                          ...s,
                          [lender.id]: {
                            ...s[lender.id],
                            [f.key]: e.target.value,
                          },
                        }))
                      }
                      className={`${inputClass} ${
                        errors[f.key] ? "border-[#FF5C68]" : ""
                      }`}
                    />
                    {(errors[f.key] || f.hint) && (
                      <p
                        id={`${lender.id}-${f.key}-note`}
                        className={`mt-1.5 text-xs ${
                          errors[f.key] ? "text-[#FF5C68]" : "text-zinc-500"
                        }`}
                      >
                        {errors[f.key] ?? f.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div
              aria-live="polite"
              className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-4 py-8 text-center"
            >
              <p className="text-base text-zinc-300">
                {primary?.label ?? "Your monthly payment will be"}
              </p>
              <p className="mt-3 max-w-full break-all text-3xl font-black tabular-nums text-white sm:text-4xl">
                {primary?.value ?? "0.00"}
              </p>

              {secondary.map((o, i) => (
                <div key={o.label} className={i === 0 ? "mt-8" : "mt-6"}>
                  <p className="text-base text-zinc-300">{o.label}</p>
                  <p className="mt-1 break-words text-lg font-bold text-white">
                    {o.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ============ BUTTONS (down payment + terms) ============ */
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Down payment
            </p>
            <div
              role="group"
              aria-label="Down payment percentage"
              className="mt-3 flex flex-wrap gap-2"
            >
              {lender.dpOptions.map((opt) => {
                const active = opt === dp;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={active}
                    onClick={() =>
                      setDpStore((s) => ({ ...s, [lender.id]: opt }))
                    }
                    className={`rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${
                      active
                        ? "border-[#D41F2D] bg-[#D41F2D] text-white"
                        : "border-white/15 bg-white/5 text-white hover:border-[#D41F2D]/60"
                    } ${focusRing}`}
                  >
                    {opt}%
                  </button>
                );
              })}
            </div>

            <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#071A38] text-sm">
              {[
                ["Vehicle price", peso(total)],
                [`Down payment (${dp}%)`, peso(downPayment)],
                ["Amount financed", peso(financed)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between gap-4 px-4 py-3"
                >
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="break-words text-right font-bold text-white">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>

            <p className="mt-6 text-xs uppercase tracking-[0.2em] text-zinc-500">
              Monthly payment by term
            </p>
            <ul className="mt-3 space-y-2">
              {plans.map((p) => (
                <li
                  key={`${lender.id}-${dp}-${p.months}`}
                  className="min-w-0 rounded-2xl border border-[#D41F2D]/25 bg-[#071A38] px-4 py-3 transition-colors hover:border-[#D41F2D]/60"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#5FA8E8]">
                        {termTitle(p.months)}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {p.months} months
                        {lender.showRate && <> · {fmtPct(p.rate)} per month</>}
                      </p>
                    </div>
                    <div className="min-w-0 text-right">
                      <p className="break-words text-lg font-black leading-tight text-[#FF5C68] sm:text-xl">
                        {peso(p.monthly)}
                      </p>
                      <p className="text-xs text-zinc-500">per month</p>
                    </div>
                  </div>

                  {SHOW_INTEREST_BREAKDOWN && (
                    <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-sm">
                      <div className="flex justify-between gap-3">
                        <span className="text-zinc-500">Total interest</span>
                        <span className="font-semibold text-white">
                          {peso(p.totalInterest)}
                        </span>
                      </div>
                      <div className="flex justify-between gap-3">
                        <span className="text-zinc-500">Total payable</span>
                        <span className="font-semibold text-white">
                          {peso(p.totalPayable)}
                        </span>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Downloads */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled || !quote}
          onClick={downloadPdf}
          className={`inline-flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#3D8FD9] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          <Download size={16} />
          Download PDF
        </button>
        <button
          type="button"
          disabled={disabled || !quote}
          onClick={downloadWord}
          className={`inline-flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:border-[#D41F2D] hover:bg-[#D41F2D]/10 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          <FileText size={16} />
          Download Word
        </button>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Estimate only. Final rates and terms are subject to lender approval.
      </p>
    </section>
  );
}
