"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Download, Menu, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import UserMenu from "@/components/layout/user-menu";
import NotificationBell from "@/components/layout/notification-bell";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Showroom", href: "/showroom" },
  { name: "Sold Cars", href: "/sold-cars" },
  { name: "Sell / Trade", href: "/sell-trade" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/contact" },
];

// Matches header height (72/76/80px) + 1px border
const HEADER_OFFSET = "-mb-[73px] sm:-mb-[77px] lg:-mb-[81px]";

// Boss Auto Exchange palette
// red #D41F2D | red hover #E8404B | red text #FF5C68 | blue glow #0B5BA8
// background #040E21 | text #FFFFFF
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

// Glow styles shared by the header buttons
const glowRed =
  "border-[#FF5C68]/70 shadow-[0_0_22px_rgba(212,31,45,0.75),inset_0_0_12px_rgba(212,31,45,0.25)] hover:border-[#FF5C68] hover:shadow-[0_0_32px_rgba(212,31,45,0.95),inset_0_0_14px_rgba(212,31,45,0.35)]";
const glowBlue =
  "border-[#3D8FD9]/80 shadow-[0_0_22px_rgba(61,143,217,0.7),inset_0_0_10px_rgba(61,143,217,0.2)] hover:border-[#FF5C68] hover:shadow-[0_0_28px_rgba(212,31,45,0.85)]";

// Applies the same glow to the Login button rendered inside <UserMenu />
const loginGlow =
  "[&>a]:border-[#3D8FD9]/80 [&>a]:shadow-[0_0_22px_rgba(61,143,217,0.7)] [&>a:hover]:border-[#FF5C68] [&>a:hover]:shadow-[0_0_28px_rgba(212,31,45,0.85)] [&>button]:border-[#3D8FD9]/80 [&>button]:shadow-[0_0_22px_rgba(61,143,217,0.7)] [&>button:hover]:border-[#FF5C68] [&>button:hover]:shadow-[0_0_28px_rgba(212,31,45,0.85)]";

// Minimal shape of the event we care about — not in the standard lib.dom types yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Wheel used as the "O" in BOSS. Sized in em so it scales with the wordmark.
// Spins when the parent `group` is hovered (disabled for reduced motion).
function WheelO() {
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

// Text logo: big white "BOSS" (the O is a wheel) with a red "AUTO EXCHANGE" tag.
// Place inside an element with the `group` class for hover effects.
// Size is controlled with a text-size class (everything scales with em).
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex flex-col items-center whitespace-nowrap leading-none drop-shadow-[0_2px_10px_rgba(0,0,0,0.7)] ${className}`}
    >
      <span
        role="img"
        aria-label="Boss"
        className="flex items-center font-black uppercase italic tracking-[0.08em] text-white [text-shadow:0_0_22px_rgba(212,31,45,0.95),0_0_6px_rgba(255,255,255,0.35),2px_2px_0_#D41F2D] transition-all duration-300 group-hover:[text-shadow:0_0_30px_rgba(255,92,104,1),0_0_8px_rgba(255,255,255,0.5),2px_2px_0_#E8404B]"
      >
        <span aria-hidden="true">B</span>
        <WheelO />
        <span aria-hidden="true">SS</span>
      </span>
      <span className="mt-1.5 rounded-[3px] bg-[#D41F2D] px-2 py-[3px] text-[0.34em] font-extrabold uppercase italic tracking-[0.24em] text-white shadow-[0_0_16px_rgba(212,31,45,0.85)] transition-colors duration-300 group-hover:bg-[#E8404B]">
        Auto Exchange
      </span>
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname() ?? "";
  const { totalItems } = useCart();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const isHome = pathname === "/";

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isSolid = !isHome || isScrolled || isMenuOpen;
  const canInstall = !isAppInstalled && installPrompt !== null;

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 24);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // PWA install prompt handling
  useEffect(() => {
    const standaloneQuery = window.matchMedia("(display-mode: standalone)");

    const updateStandalone = () => {
      const isStandalone =
        standaloneQuery.matches ||
        // iOS Safari
        (window.navigator as Navigator & { standalone?: boolean })
          .standalone === true;
      setIsAppInstalled(isStandalone);
    };

    updateStandalone();
    standaloneQuery.addEventListener("change", updateStandalone);

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsAppInstalled(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      standaloneQuery.removeEventListener("change", updateStandalone);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === "accepted") {
      setInstallPrompt(null);
    }
  };

  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMenuOpen(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isMenuOpen]);

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 motion-reduce:transition-none ${isHome ? HEADER_OFFSET : ""} ${isSolid ? "border-[#D41F2D]/20 bg-[#040E21]/90 backdrop-blur-xl" : "border-transparent bg-transparent"}`}
      >
        <nav
          aria-label="Main"
          className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        >
          <div className="flex h-[72px] items-center justify-between gap-4 sm:h-[76px] lg:h-20 lg:grid lg:grid-cols-[1fr_auto_1fr]">
            {/* LOGO (text wordmark) */}
            <Link
              href="/"
              aria-label="Boss Auto Exchange home"
              className={`group flex w-fit items-center justify-self-start ${focusRing}`}
            >
              <Wordmark className="text-3xl sm:text-4xl lg:text-5xl" />
            </Link>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden items-center gap-1 rounded-full border border-white/15 bg-[#040E21]/75 p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl lg:flex">
              {navigation.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex items-center rounded-full px-4 py-2 text-sm font-semibold transition-all duration-300 ${focusRing} ${active ? "bg-[#D41F2D] text-white shadow-[0_0_18px_rgba(212,31,45,0.7)]" : "text-white/85 hover:bg-white/10 hover:text-white"}`}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* RIGHT SIDE: INSTALL + CART + ACCOUNT + MOBILE MENU */}
            <div className="ml-auto flex items-center gap-2">
              {/* Install App */}
              {canInstall && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className={`hidden items-center gap-2 rounded-full border bg-[#D41F2D]/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:bg-[#D41F2D]/20 sm:flex ${glowRed} ${focusRing}`}
                >
                  <Download size={16} strokeWidth={2.25} />
                  Install App
                </button>
              )}

              {/* Announcement notifications */}
              <NotificationBell className={`${glowBlue} ${focusRing}`} />

              {/* Cart */}
              <Link
                href="/cart"
                aria-label={`View cart${totalItems > 0 ? `, ${totalItems} item${totalItems === 1 ? "" : "s"}` : ""}`}
                className={`relative flex h-11 w-11 items-center justify-center rounded-full border bg-[#040E21]/30 text-white backdrop-blur-md transition-all duration-300 hover:text-[#FF5C68] sm:h-12 sm:w-12 ${glowBlue} ${focusRing}`}
              >
                <ShoppingCart size={20} strokeWidth={2} />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D41F2D] px-1 text-[10px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {/* Account: avatar + "My orders" (or Login when logged out) */}
              <div className={`flex items-center ${loginGlow}`}>
                <UserMenu />
              </div>

              {/* Mobile / Tablet Menu */}
              <button
                type="button"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsMenuOpen((open) => !open)}
                className={`flex h-11 w-11 items-center justify-center rounded-full border text-white backdrop-blur-md transition-all duration-300 sm:h-12 sm:w-12 lg:hidden ${isMenuOpen ? `bg-[#D41F2D]/10 ${glowRed}` : `bg-[#040E21]/30 ${glowBlue}`} ${focusRing}`}
              >
                {isMenuOpen ? (
                  <X size={21} strokeWidth={2} />
                ) : (
                  <Menu size={21} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* MOBILE / TABLET MENU */}
      <div
        id="mobile-menu"
        aria-hidden={!isMenuOpen}
        className={`fixed inset-0 z-40 lg:hidden transition-all duration-500 ${isMenuOpen ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        {/* Backdrop */}
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMenuOpen(false)}
          className="absolute inset-0 cursor-default bg-[#040E21]/70 backdrop-blur-md"
        />

        {/* Navigation Drawer */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-md border-l border-[#D41F2D]/20 bg-[#040E21] shadow-[-20px_0_80px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Drawer Header */}
          <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5 sm:h-[76px] sm:px-6">
            <Link
              href="/"
              aria-label="Boss Auto Exchange home"
              onClick={() => setIsMenuOpen(false)}
              className={`group ${focusRing}`}
            >
              <Wordmark className="text-3xl" />
            </Link>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsMenuOpen(false)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-blue-100 transition-all hover:border-[#D41F2D] hover:text-white hover:shadow-[0_0_18px_rgba(212,31,45,0.55)] ${focusRing}`}
            >
              <X size={19} />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="flex h-[calc(100%-72px)] flex-col overflow-y-auto px-5 py-7 sm:h-[calc(100%-76px)] sm:px-6">
            {/* Install App (mobile) */}
            {canInstall && (
              <button
                type="button"
                onClick={handleInstallClick}
                className={`mb-6 flex items-center justify-center gap-2 rounded-full border bg-[#D41F2D]/10 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:bg-[#D41F2D]/20 ${glowRed} ${focusRing}`}
              >
                <Download size={16} strokeWidth={2.25} />
                Install App
              </button>
            )}

            {/* Label */}
            <div
              className={`mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-[#5FA8E8] transition-all duration-500 ${isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
            >
              Explore Boss Auto Exchange
            </div>

            {/* Navigation */}
            <nav>
              <ul className="space-y-1">
                {navigation.map((item, index) => {
                  const active = isActive(item.href);

                  return (
                    <li
                      key={item.name}
                      style={{
                        transitionDelay: isMenuOpen
                          ? `${80 + index * 55}ms`
                          : "0ms",
                      }}
                      className={`transition-all duration-500 ease-out ${isMenuOpen ? "translate-x-0 opacity-100" : "translate-x-5 opacity-0"}`}
                    >
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className={`group relative flex min-h-[62px] items-center justify-between border-b border-white/[0.07] rounded-lg px-3 text-xl font-semibold tracking-tight transition-all duration-300 sm:min-h-[68px] sm:text-2xl ${focusRing} ${active ? "border-l-2 border-l-[#D41F2D] bg-gradient-to-r from-[#D41F2D]/25 to-transparent text-white" : "text-white/85 hover:bg-white/5 hover:text-white"}`}
                      >
                        <span className="flex items-center gap-4">
                          {/* Active indicator */}
                          <span
                            className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${active ? "bg-[#D41F2D] shadow-[0_0_14px_rgba(212,31,45,0.8)]" : "bg-transparent group-hover:bg-[#D41F2D]/50"}`}
                          />
                          {item.name}
                        </span>

                        <ArrowRight
                          size={19}
                          className={`transition-all duration-300 ${active ? "translate-x-0 text-[#FF5C68] opacity-100" : "translate-x-[-6px] text-blue-200/50 opacity-0 group-hover:translate-x-0 group-hover:text-[#FF5C68] group-hover:opacity-100"}`}
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
