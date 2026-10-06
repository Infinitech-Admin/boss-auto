"use client";

import { useMemo, useState } from "react";
import { Calculator, Download, FileText } from "lucide-react";

/**
 * Interest rate (per year) for each loan term, used to compute the monthly
 * estimate. Palitan ng rate ng partner bank/dealership. Pwedeng magkaiba ang
 * rate kada term (usually mas mababa ang rate sa mas maikling term).
 * NOTE: Nasa client bundle ito, kaya makikita pa rin sa dev tools.
 * Kung confidential talaga, ilipat ang computation sa backend API.
 */
const TERM_RATES: Record<number, number> = {
  1: 0.08,
  2: 0.08,
  3: 0.08,
  4: 0.08,
  5: 0.08,
};

/** Terms offered, in years. */
const TERM_YEARS = [1, 2, 3, 4, 5] as const;

/**
 * true (default): ipapakita ang interest rate (UI, PDF, Word).
 * false: itatago ang rate; monthly estimate lang ang makikita.
 */
const SHOW_RATE = true;

/**
 * false (default): hindi ipapakita ang total interest at total payable
 *                  sa screen.
 * true: ipapakita rin sa screen.
 */
const SHOW_INTEREST_BREAKDOWN = false;

/**
 * true (default): ang downloaded PDF/Word quotation ay DETAILED
 *                 (monthly, total interest, total payable, at monthly
 *                 per down payment 10/20/30%), kahit hidden sa screen.
 * false: sumusunod ang PDF/Word sa SHOW_INTEREST_BREAKDOWN.
 */
const EXPORT_DETAILS = true;

const DP_OPTIONS = [10, 20, 30] as const;

const DISCLAIMER =
  "This is an estimate only and not a loan approval or binding offer. Final rates, fees and terms are subject to bank/dealer approval.";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

type Plan = {
  years: number;
  months: number;
  rate: number;
  monthly: number;
  totalInterest: number;
  totalPayable: number;
};

/** "₱1,250,000" | "1250000" | 1250000 -> 1250000 */
export function parsePrice(price: string | number): number {
  if (typeof price === "number") return price;
  const n = Number(String(price).replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function monthlyPayment(principal: number, annualRate: number, months: number) {
  const r = annualRate / 12;
  if (r === 0) return principal / months;
  return (principal * r) / (1 - Math.pow(1 + r, -months));
}

const fmt = (n: number, symbol = "₱") =>
  `${symbol}${Math.round(n).toLocaleString("en-PH")}`;

/** 0.08 -> "8%", 0.0875 -> "8.75%" */
const fmtRate = (rate: number) => `${parseFloat((rate * 100).toFixed(2))}%`;

function buildPlans(financed: number): Plan[] {
  return TERM_YEARS.map((years) => {
    const months = years * 12;
    const rate = TERM_RATES[years] ?? 0;
    const monthly = monthlyPayment(financed, rate, months);
    const totalPayable = monthly * months;
    return {
      years,
      months,
      rate,
      monthly,
      totalPayable,
      totalInterest: totalPayable - financed,
    };
  });
}

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

const termLabel = (p: Plan) =>
  `${p.years} year${p.years > 1 ? "s" : ""} (${p.months} mos)`;

const todayLabel = () =>
  new Date().toLocaleDateString("en-PH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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
  const [dp, setDp] = useState<(typeof DP_OPTIONS)[number]>(30);

  const total = parsePrice(price);

  const { downPayment, financed, plans } = useMemo(() => {
    const downPayment = (total * dp) / 100;
    const financed = total - downPayment;
    return { downPayment, financed, plans: buildPlans(financed) };
  }, [total, dp]);

  // For the quotation: monthly payment for EVERY down payment option.
  const matrix = useMemo(
    () =>
      DP_OPTIONS.map((pct) => {
        const amount = (total * pct) / 100;
        return { pct, amount, plans: buildPlans(total - amount) };
      }),
    [total],
  );

  if (total <= 0) return null;

  const safeName = carName.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  const title = `${year ? `${year} ` : ""}${carName}`;
  const detailed = EXPORT_DETAILS || SHOW_INTEREST_BREAKDOWN;

  /* ----------------------------- PDF ----------------------------- */
  const downloadPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    // Helvetica has no ₱ glyph, so use "PHP " in the PDF.
    const money = (n: number) => fmt(n, "PHP ");

    const LEFT = 48;
    const RIGHT = 547;
    let y = 56;

    const ensureSpace = (needed: number) => {
      if (y + needed > 790) {
        doc.addPage();
        y = 56;
      }
    };

    const section = (label: string) => {
      ensureSpace(48);
      y += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(0);
      doc.text(label, LEFT, y);
      y += 8;
      doc.setDrawColor(191, 152, 13);
      doc.line(LEFT, y, RIGHT, y);
      y += 18;
      doc.setFontSize(10.5);
    };

    // --- Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(0);
    doc.text("Financing Quotation", LEFT, y);

    y += 26;
    doc.setFontSize(14);
    doc.text(title, LEFT, y);

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Prepared on ${todayLabel()}`, LEFT, y);
    doc.setTextColor(0);
    y += 6;

    // --- 1. Summary
    section("Loan summary");
    doc.setFont("helvetica", "normal");
    const summary: [string, string][] = [
      ["Vehicle price", money(total)],
      [`Down payment (${dp}%)`, money(downPayment)],
      ["Amount financed", money(financed)],
    ];
    summary.forEach(([label, value]) => {
      doc.text(label, LEFT, y);
      doc.text(value, RIGHT, y, { align: "right" });
      y += 18;
    });

    // --- 2. Selected down payment: all terms
    section(`Monthly payment · ${dp}% down payment`);

    const cols = detailed
      ? { term: LEFT, rate: 215, monthly: 330, interest: 440, payable: RIGHT }
      : { term: LEFT, rate: 300, monthly: RIGHT, interest: 0, payable: 0 };

    doc.setFont("helvetica", "bold");
    doc.text("Term", cols.term, y);
    if (SHOW_RATE) doc.text("Interest rate", cols.rate, y, { align: "right" });
    doc.text("Monthly payment", cols.monthly, y, { align: "right" });
    if (detailed) {
      doc.text("Total interest", cols.interest, y, { align: "right" });
      doc.text("Total payable", cols.payable, y, { align: "right" });
    }
    y += 6;
    doc.setDrawColor(0);
    doc.line(LEFT, y, RIGHT, y);
    y += 17;

    doc.setFont("helvetica", "normal");
    plans.forEach((p) => {
      doc.text(termLabel(p), cols.term, y);
      if (SHOW_RATE)
        doc.text(`${fmtRate(p.rate)} / yr`, cols.rate, y, { align: "right" });
      doc.setFont("helvetica", "bold");
      doc.text(money(p.monthly), cols.monthly, y, { align: "right" });
      doc.setFont("helvetica", "normal");
      if (detailed) {
        doc.text(money(p.totalInterest), cols.interest, y, { align: "right" });
        doc.text(money(p.totalPayable), cols.payable, y, { align: "right" });
      }
      y += 20;
    });

    if (detailed) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(
        `Total cost of ownership = down payment + total payable. Example (${plans[plans.length - 1].years} years): ${money(downPayment + plans[plans.length - 1].totalPayable)}.`,
        LEFT,
        y,
      );
      doc.setTextColor(0);
      doc.setFontSize(10.5);
      y += 10;
    }

    // --- 3. Compare all down payments
    section("Monthly payment by down payment");

    const mCols = [260, 405, RIGHT];
    doc.setFont("helvetica", "bold");
    doc.text("Term", LEFT, y);
    matrix.forEach((m, i) => {
      doc.text(`${m.pct}% down`, mCols[i], y, { align: "right" });
    });
    y += 12;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(120);
    matrix.forEach((m, i) => {
      doc.text(money(m.amount), mCols[i], y, { align: "right" });
    });
    doc.setTextColor(0);
    doc.setFontSize(10.5);
    y += 6;
    doc.line(LEFT, y, RIGHT, y);
    y += 17;

    TERM_YEARS.forEach((years, row) => {
      const label = matrix[0].plans[row];
      doc.text(termLabel(label), LEFT, y);
      matrix.forEach((m, i) => {
        const isSelected = m.pct === dp;
        doc.setFont("helvetica", isSelected ? "bold" : "normal");
        doc.text(money(m.plans[row].monthly), mCols[i], y, { align: "right" });
      });
      doc.setFont("helvetica", "normal");
      y += 20;
      void years;
    });

    // --- Disclaimer
    ensureSpace(60);
    y += 16;
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(doc.splitTextToSize(DISCLAIMER, RIGHT - LEFT), LEFT, y);

    doc.save(`financing-${safeName}-${dp}dp.pdf`);
  };

  /* ---------------------------- WORD ----------------------------- */
  // HTML-based .doc: opens directly in Microsoft Word, no extra library needed.
  const downloadWord = () => {
    const rateTh = SHOW_RATE ? "<th>Interest rate</th>" : "";
    const header = detailed
      ? `<tr><th>Term</th>${rateTh}<th>Monthly payment</th><th>Total interest</th><th>Total payable</th></tr>`
      : `<tr><th>Term</th>${rateTh}<th>Monthly payment</th></tr>`;

    const rows = plans
      .map((p) => {
        const rateCell = SHOW_RATE
          ? `<td>${fmtRate(p.rate)} per year</td>`
          : "";
        return detailed
          ? `<tr><td>${termLabel(p)}</td>${rateCell}<td><b>${fmt(p.monthly)}</b></td><td>${fmt(p.totalInterest)}</td><td>${fmt(p.totalPayable)}</td></tr>`
          : `<tr><td>${termLabel(p)}</td>${rateCell}<td><b>${fmt(p.monthly)}</b></td></tr>`;
      })
      .join("");

    const matrixHeader = `<tr><th>Term</th>${matrix
      .map((m) => `<th>${m.pct}% down<br/><small>${fmt(m.amount)}</small></th>`)
      .join("")}</tr>`;

    const matrixRows = TERM_YEARS.map((_, row) => {
      const cells = matrix
        .map((m) => {
          const v = fmt(m.plans[row].monthly);
          return `<td>${m.pct === dp ? `<b>${v}</b>` : v}</td>`;
        })
        .join("");
      return `<tr><td>${termLabel(matrix[0].plans[row])}</td>${cells}</tr>`;
    }).join("");

    const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
<head><meta charset="utf-8"><title>Financing Quotation</title>
<style>
  body{font-family:Calibri,Arial,sans-serif;font-size:11pt}
  h1{font-size:20pt;margin-bottom:0}
  h2{font-size:14pt;margin-top:4pt}
  h3{font-size:12pt;margin-top:18pt;border-bottom:2px solid #D41F2D}
  table{border-collapse:collapse;width:100%;margin-top:8pt}
  th,td{border:1px solid #999;padding:6pt;text-align:left}
  th{background:#D41F2D;color:#061B3D}
  .meta{color:#777;font-size:9pt}
  .note{color:#777;font-size:9pt;margin-top:16pt}
</style></head>
<body>
  <h1>Financing Quotation</h1>
  <h2>${title}</h2>
  <p class="meta">Prepared on ${todayLabel()}</p>

  <h3>Loan summary</h3>
  <table>
    <tr><td>Vehicle price</td><td>${fmt(total)}</td></tr>
    <tr><td>Down payment (${dp}%)</td><td>${fmt(downPayment)}</td></tr>
    <tr><td>Amount financed</td><td>${fmt(financed)}</td></tr>
  </table>

  <h3>Monthly payment · ${dp}% down payment</h3>
  <table>
    ${header}
    ${rows}
  </table>

  <h3>Monthly payment by down payment</h3>
  <table>
    ${matrixHeader}
    ${matrixRows}
  </table>

  <p class="note">${DISCLAIMER}</p>
</body></html>`;

    download(
      new Blob(["\ufeff", html], { type: "application/msword" }),
      `financing-${safeName}-${dp}dp.doc`,
    );
  };

  return (
    <section
      aria-label="Financing"
      className="min-w-0 rounded-[28px] border border-white/10 bg-[#0A2A5C] p-5 sm:p-6"
    >
      {/* Header */}
      <div className="mb-5 flex items-center gap-3 sm:mb-6">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#D41F2D]/10">
          <Calculator className="text-[#D41F2D]" size={18} />
        </div>
        <h2 className="text-xl font-bold text-white">Financing</h2>
      </div>

      {/* Down payment buttons (10 / 20 / 30) */}
      <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
        Down payment
      </p>
      <div
        role="group"
        aria-label="Down payment percentage"
        className="mt-3 flex flex-wrap gap-2"
      >
        {DP_OPTIONS.map((opt) => {
          const active = opt === dp;
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={active}
              onClick={() => setDp(opt)}
              className={`rounded-full border px-5 py-2.5 text-sm font-bold transition-all ${
                active
                  ? "border-[#D41F2D] bg-[#D41F2D] text-black"
                  : "border-white/15 bg-white/5 text-white hover:border-[#D41F2D]/60"
              } ${focusRing}`}
            >
              {opt}%
            </button>
          );
        })}
      </div>

      {/* Summary: one compact list, so it never wraps awkwardly */}
      <dl className="mt-6 divide-y divide-white/10 rounded-2xl border border-white/10 bg-[#0A2A5C] text-sm">
        {[
          ["Vehicle price", fmt(total)],
          [`Down payment (${dp}%)`, fmt(downPayment)],
          ["Amount financed", fmt(financed)],
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

      {/* Terms: 1 to 5 years, one row each */}
      <p className="mt-6 text-xs uppercase tracking-[0.2em] text-zinc-500">
        Monthly payment by term
      </p>
      <ul className="mt-3 space-y-2">
        {plans.map((p) => (
          <li
            key={`${dp}-${p.years}`}
            className="min-w-0 rounded-2xl border border-[#D41F2D]/25 bg-[#0A2A5C] px-4 py-3 transition-colors hover:border-[#D41F2D]/60"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-bold text-[#5FA8E8]">
                  {p.years} year{p.years > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-zinc-500">
                  {p.months} months
                  {SHOW_RATE && <> · {fmtRate(p.rate)} per year</>}
                </p>
              </div>
              <div className="text-right">
                <p className="break-words text-xl font-black leading-tight text-[#D41F2D]">
                  {fmt(p.monthly)}
                </p>
                <p className="text-xs text-zinc-500">per month</p>
              </div>
            </div>

            {SHOW_INTEREST_BREAKDOWN && (
              <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-sm">
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Total interest</span>
                  <span className="font-semibold text-white">
                    {fmt(p.totalInterest)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-zinc-500">Total payable</span>
                  <span className="font-semibold text-white">
                    {fmt(p.totalPayable)}
                  </span>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Downloads */}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={downloadPdf}
          className={`inline-flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-full bg-[#D41F2D] px-5 py-3 text-sm font-bold text-white transition-all hover:bg-[#3D8FD9] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          <Download size={16} />
          Download PDF
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={downloadWord}
          className={`inline-flex min-w-[9rem] flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:border-[#D41F2D] hover:bg-[#D41F2D]/10 disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
        >
          <FileText size={16} />
          Download Word
        </button>
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Estimate only. Final rates and terms are subject to bank/dealer
        approval.
      </p>
    </section>
  );
}
