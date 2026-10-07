// components/layout/wordmark.tsx
//
// Shared Boss Auto Exchange logo. Used by the navbar, login and register.
// Place it inside an element with the `group` class for the hover effects.
// Size it with a text-size class: everything inside scales with em.

// Wheel used as the "O" in BOSS. Spins when the parent `group` is hovered
// (disabled for reduced motion).
export function WheelO() {
  return (
    <span
      aria-hidden="true"
      className="ml-[0.11em] mr-[-0.03em] flex h-[0.9em] w-[0.9em] shrink-0 -translate-y-[0.035em] items-center justify-center"
    >
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full drop-shadow-[0_0_8px_rgba(212,31,45,0.95)] group-hover:animate-spin motion-reduce:animate-none [animation-duration:1.2s]"
      >
        {/* Tire */}
        <circle
          cx="50"
          cy="50"
          r="47"
          fill="#0A0F1C"
          stroke="#FFFFFF"
          strokeWidth="5"
        />
        {/* Rim */}
        <circle
          cx="50"
          cy="50"
          r="30"
          fill="#1B2436"
          stroke="#FF5C68"
          strokeWidth="5"
        />
        {/* Spokes */}
        <g stroke="#FFFFFF" strokeWidth="6" strokeLinecap="round">
          {[0, 72, 144, 216, 288].map((angle) => (
            <line
              key={angle}
              x1="50"
              y1="50"
              x2="50"
              y2="25"
              transform={`rotate(${angle} 50 50)`}
            />
          ))}
        </g>
        {/* Hub */}
        <circle cx="50" cy="50" r="9" fill="#FFFFFF" />
        <circle cx="50" cy="50" r="3.5" fill="#D41F2D" />
      </svg>
    </span>
  );
}

// Big white italic "BOSS" (the O is a wheel) with a red "AUTO EXCHANGE" bar
// that spans the full width of the word, like the logo artwork.
export function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex flex-col items-stretch whitespace-nowrap leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] ${className}`}
    >
      <span
        role="img"
        aria-label="Boss"
        className="flex items-center justify-center font-black uppercase italic tracking-[0.04em] text-white [text-shadow:0_0_22px_rgba(212,31,45,0.95),0_0_6px_rgba(255,255,255,0.35),3px_3px_0_#D41F2D] transition-all duration-300 group-hover:[text-shadow:0_0_30px_rgba(255,92,104,1),0_0_8px_rgba(255,255,255,0.5),3px_3px_0_#E8404B]"
      >
        <span aria-hidden="true">B</span>
        <WheelO />
        <span aria-hidden="true">SS</span>
      </span>
      <span className="mt-[0.35em] block rounded-[0.2em] bg-[#D41F2D] px-[0.6em] py-[0.25em] text-center text-[0.34em] font-extrabold uppercase italic tracking-[0.16em] text-white shadow-[0_0_16px_rgba(212,31,45,0.85)] transition-colors duration-300 group-hover:bg-[#E8404B]">
        Auto Exchange
      </span>
    </span>
  );
}
