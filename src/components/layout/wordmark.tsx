type WordmarkProps = {
  className?: string;
  /** Kept for compatibility with existing usages; no longer animates. */
  spin?: "hover" | "always";
};

export function Wordmark({ className = "" }: WordmarkProps) {
  return (
    <span
      translate="no"
      role="img"
      aria-label="Boss Auto Exchange"
      className={`notranslate relative inline-block aspect-[900/320] w-[3.6em] shrink-0 select-none leading-none drop-shadow-[0_0_12px_rgba(61,143,217,0.55)] transition-[filter] duration-300 group-hover:drop-shadow-[0_0_18px_rgba(61,143,217,0.95)] ${className}`}
    >
      {/* Logo without the tire */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/logo-base.png"
        alt=""
        draggable={false}
        className="block h-full w-full"
      />

      {/* Tire (the O in AUTO), static */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo/logo-tire.png"
        alt=""
        draggable={false}
        className="pointer-events-none absolute left-[24.17%] top-[60.96%] aspect-square w-[13.25%]"
      />
    </span>
  );
}

export default Wordmark;
