// components/animated-splash.tsx
"use client";

import { useEffect, useState } from "react";
import { Wordmark } from "@/components/layout/wordmark";

/**
 * AnimatedSplash — "tachometer" version
 * -------------------------------------
 * The BOSS AUTO EXCHANGE logo is revealed left to right in step with a
 * tachometer that sweeps from 0 to redline: the red arc fills, the needle
 * climbs, and the % counter runs. The tire (the O in AUTO) spins the whole
 * time. At redline the logo flares, then everything fades into the homepage.
 *
 * - Shows only when running as an installed PWA (standalone).
 * - Once per session.
 * - Test in a normal browser tab: /?splash
 * - Respects prefers-reduced-motion.
 *
 * Place as the FIRST child inside <body> in app/layout.tsx.
 */

type Props = {
  /** How long the splash stays before it starts fading out (ms). */
  duration?: number;
  /** Fade-out length (ms). */
  fadeMs?: number;
};

type Phase = "pending" | "show" | "exit" | "done";

const SESSION_KEY = "bax-splash-seen";

/* ---------- Gauge geometry (viewBox 200 x 150, 240° sweep) ---------- */
const CX = 100;
const CY = 92;
const rad = (deg: number) => (deg * Math.PI) / 180;

// 33 ticks: every 7.5°, a major tick (and number) every 4th, redline from 6
const TICKS = Array.from({ length: 33 }, (_, i) => ({
  i,
  angle: -120 + 7.5 * i,
  major: i % 4 === 0,
  red: i >= 24,
}));

export default function AnimatedSplash({
  duration = 3700,
  fadeMs = 600,
}: Props) {
  const [phase, setPhase] = useState<Phase>("pending");

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.matchMedia("(display-mode: window-controls-overlay)").matches ||
      window.matchMedia("(display-mode: fullscreen)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    const forced = new URLSearchParams(window.location.search).has("splash");

    let seen = false;
    try {
      seen = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* storage unavailable: just show */
    }

    if ((!standalone && !forced) || (seen && !forced)) {
      setPhase("done");
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const total = reduced ? 1000 : duration;

    setPhase("show");
    const exitTimer = window.setTimeout(() => setPhase("exit"), total);
    const doneTimer = window.setTimeout(() => setPhase("done"), total + fadeMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [duration, fadeMs]);

  if (phase === "done") return null;

  return (
    <div
      className="bax-splash"
      data-active={phase === "show" || phase === "exit"}
      data-exit={phase === "exit"}
      role="status"
      aria-live="polite"
      aria-label="Loading Boss Auto Exchange"
      style={{ ["--bax-fade" as string]: `${fadeMs}ms` }}
    >
      <div className="bax-stage">
        {/* Logo: revealed in step with the needle, tire spins */}
        <div className="bax-logo">
          <Wordmark spin="always" />
        </div>

        {/* Tachometer = the loading bar */}
        <div className="bax-gauge" aria-hidden="true">
          <svg viewBox="0 0 200 150" overflow="visible">
            <defs>
              <linearGradient id="baxArc" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0" stopColor="#D41F2D" />
                <stop offset="1" stopColor="#ff4757" />
              </linearGradient>
              <linearGradient id="baxNeedle" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#D41F2D" />
                <stop offset="1" stopColor="#ff6b78" />
              </linearGradient>
              <radialGradient id="baxGlow">
                <stop offset="0" stopColor="#D41F2D" stopOpacity="0.5" />
                <stop offset="1" stopColor="#D41F2D" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* glow behind the dial, brightens as RPM climbs */}
            <circle
              className="bax-gglow"
              cx={CX}
              cy={CY}
              r="78"
              fill="url(#baxGlow)"
            />

            {/* track */}
            <path
              d="M30.72 132 A80 80 0 1 1 169.28 132"
              fill="none"
              stroke="rgba(255,255,255,0.09)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* redline zone */}
            <path
              d="M174.48 49 A86 86 0 0 1 174.48 135"
              fill="none"
              stroke="#D41F2D"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.85"
            />
            {/* progress arc */}
            <path
              className="bax-arc"
              d="M30.72 132 A80 80 0 1 1 169.28 132"
              pathLength={100}
              fill="none"
              stroke="url(#baxArc)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="100"
            />

            {/* ticks */}
            <g strokeLinecap="round">
              {TICKS.map((t) => (
                <line
                  key={t.i}
                  x1={CX}
                  y1={CY - 74}
                  x2={CX}
                  y2={CY - (t.major ? 62 : 68)}
                  transform={`rotate(${t.angle} ${CX} ${CY})`}
                  stroke={t.red ? "#ff4757" : "#fff"}
                  strokeOpacity={t.major ? 0.9 : 0.4}
                  strokeWidth={t.major ? 2 : 1}
                />
              ))}
            </g>

            {/* numbers 0–8 */}
            <g className="bax-nums" textAnchor="middle" fontSize="9">
              {TICKS.filter((t) => t.major).map((t) => (
                <text
                  key={t.i}
                  x={(CX + 50 * Math.sin(rad(t.angle))).toFixed(2)}
                  y={(CY - 50 * Math.cos(rad(t.angle)) + 3.2).toFixed(2)}
                  fill={t.red ? "#ff4757" : "#fff"}
                  fillOpacity={t.red ? 1 : 0.75}
                >
                  {t.i / 4}
                </text>
              ))}
              <text
                x={CX}
                y="66"
                fontSize="5"
                fill="#fff"
                fillOpacity="0.45"
                letterSpacing="1"
              >
                x1000 r/min
              </text>
            </g>

            {/* needle */}
            <g className="bax-needle">
              <polygon
                points="98.6,102 98,92 100,24 102,92 101.4,102"
                fill="url(#baxNeedle)"
              />
            </g>
            {/* hub */}
            <circle
              cx={CX}
              cy={CY}
              r="7"
              fill="#0b1020"
              stroke="#fff"
              strokeWidth="2"
            />
            <circle cx={CX} cy={CY} r="2.6" fill="#D41F2D" />
          </svg>

          {/* % readout */}
          <div className="bax-readout" />
        </div>
      </div>

      <style>{`
        @property --bax-n {
          syntax: "<integer>";
          inherits: true;
          initial-value: 0;
        }

        .bax-splash {
          --red: #D41F2D;
          --red-glow: #ff4757;
          --navy: #040E21;
          --t0: 300ms;      /* sweep start */
          --drive: 2600ms;  /* sweep duration (gauge = loading bar) */
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background:
            radial-gradient(55% 40% at 50% 55%, rgba(212,31,45,0.2), transparent 70%),
            var(--navy);
          opacity: 1;
          transition: opacity var(--bax-fade, 600ms) ease, transform var(--bax-fade, 600ms) ease;
          padding: env(safe-area-inset-top) env(safe-area-inset-right)
                   env(safe-area-inset-bottom) env(safe-area-inset-left);
        }
        @media (display-mode: standalone),
               (display-mode: window-controls-overlay),
               (display-mode: fullscreen) {
          .bax-splash { display: flex; }
        }
        .bax-splash[data-active="true"] { display: flex; }
        .bax-splash[data-exit="true"] {
          opacity: 0;
          transform: scale(1.04);
          pointer-events: none;
        }

        .bax-stage {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: fit-content;
          font-size: clamp(56px, 19vw, 104px); /* logo size drives everything */
        }

        /* ---------- Logo: revealed left to right with the needle ---------- */
        .bax-logo {
          display: flex;
          justify-content: center;
          font-size: 1em;
          clip-path: inset(0 100% 0 0);
          animation:
            bax-reveal var(--drive) linear var(--t0) forwards,
            bax-flare 700ms ease-out 2900ms;
        }

        /* ---------- Gauge ---------- */
        .bax-gauge {
          position: relative;
          width: 2.4em;
          margin: 0.35em auto 0;
          animation: bax-flare 700ms ease-out 2900ms;
        }
        .bax-gauge svg { display: block; width: 100%; height: auto; overflow: visible; }
        .bax-gauge text {
          font-family: "Arial Black", "Helvetica Neue", Arial, system-ui, sans-serif;
          font-weight: 900;
          font-style: italic;
        }

        .bax-arc {
          stroke-dashoffset: 100;
          filter: drop-shadow(0 0 3px rgba(255,71,87,0.9));
          animation: bax-arc var(--drive) linear var(--t0) both;
        }
        .bax-needle {
          transform-box: view-box;
          transform-origin: 100px 92px;
          transform: rotate(-120deg);
          filter: drop-shadow(0 0 3px rgba(255,71,87,0.9));
          animation: bax-needle var(--drive) linear var(--t0) both;
        }
        .bax-gglow {
          opacity: 0.1;
          animation: bax-gglow var(--drive) linear var(--t0) both;
        }

        .bax-readout {
          position: absolute;
          left: 50%;
          top: 74%;
          transform: translateX(-50%);
          font-family: "Arial Black", "Helvetica Neue", Arial, system-ui, sans-serif;
          font-weight: 900;
          font-style: italic;
          font-size: 0.3em;
          line-height: 1;
          color: #fff;
          text-shadow: 0 0 0.4em rgba(255,71,87,0.6);
          font-variant-numeric: tabular-nums;
          counter-reset: bax-n var(--bax-n);
          animation: bax-count var(--drive) linear var(--t0) both;
        }
        .bax-readout::before { content: counter(bax-n) "%"; }

        /* ---------- Keyframes ---------- */
        /* needle, arc, counter and logo reveal share one speed curve */
        @keyframes bax-needle {
          0%   { transform: rotate(-120deg); animation-timing-function: linear; }
          85%  { transform: rotate(84deg);   animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1); }
          100% { transform: rotate(120deg); }
        }
        @keyframes bax-arc {
          0%   { stroke-dashoffset: 100; animation-timing-function: linear; }
          85%  { stroke-dashoffset: 15;  animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1); }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes bax-count {
          0%   { --bax-n: 0;   animation-timing-function: linear; }
          85%  { --bax-n: 85;  animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1); }
          100% { --bax-n: 100; }
        }
        @keyframes bax-gglow {
          0%   { opacity: 0.1; }
          100% { opacity: 0.9; }
        }
        @keyframes bax-reveal {
          0%   { clip-path: inset(0 100% 0 0); animation-timing-function: linear; }
          85%  { clip-path: inset(0 15% 0 0);  animation-timing-function: cubic-bezier(0.2, 0.7, 0.3, 1); }
          100% { clip-path: inset(0 0 0 0); }
        }
        @keyframes bax-flare {
          0%   { filter: brightness(1) drop-shadow(0 0 0 rgba(61,143,217,0)); }
          35%  { filter: brightness(1.3) drop-shadow(0 0 0.22em rgba(61,143,217,0.85)); }
          100% { filter: brightness(1) drop-shadow(0 0 0 rgba(61,143,217,0)); }
        }

        @media (prefers-reduced-motion: reduce) {
          .bax-splash *, .bax-splash *::before {
            animation-duration: 1ms !important;
            animation-delay: 0ms !important;
            animation-iteration-count: 1 !important;
            transition: none !important;
          }
          .bax-splash[data-exit="true"] { transform: none; }
        }
      `}</style>
    </div>
  );
}
