"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Download, Menu, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import UserMenu from "@/components/layout/user-menu";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Showroom", href: "/showroom" },
  { name: "Sell / Trade", href: "/sell-trade" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

// Matches header height (72/76/80px) + 1px border
const HEADER_OFFSET = "-mb-[73px] sm:-mb-[77px] lg:-mb-[81px]";

// Boss Auto Exchange palette
// primary  #D41F2D | hover #E8404B | text #FFFFFF | background #061B3D
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

// Minimal shape of the event we care about — not in the standard lib.dom types yet.
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Text logo styled like the Boss Auto Exchange logo.
// Place inside an element with the `group` class for hover effects.
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex flex-col items-center whitespace-nowrap leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] ${className}`}
    >
      <span className="font-black uppercase italic tracking-[0.12em] text-white transition-colors duration-300 group-hover:text-zinc-300">
        Boss
      </span>
      <span className="mt-1 text-[0.45em] font-bold uppercase italic tracking-[0.3em] text-[#D41F2D] transition-colors duration-300 group-hover:text-[#E8404B]">
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
        className={`sticky top-0 z-50 border-b transition-all duration-300 motion-reduce:transition-none ${isHome ? HEADER_OFFSET : ""} ${isSolid ? "border-[#D41F2D]/20 bg-[#061B3D]/90 backdrop-blur-xl" : "border-transparent bg-transparent"}`}
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
              <Wordmark className="text-lg sm:text-xl lg:text-2xl" />
            </Link>

            {/* DESKTOP NAVIGATION */}
            <div className="hidden h-full lg:flex">
              {navigation.map((item) => {
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`relative flex h-full items-center px-4 text-sm font-medium transition-colors duration-300 ${focusRing} ${active ? "text-white" : "text-zinc-400 hover:text-white"}`}
                  >
                    {item.name}

                    {active && (
                      <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-[#D41F2D] shadow-[0_0_12px_rgba(212,31,45,0.55)]" />
                    )}
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
                  className={`hidden items-center gap-2 rounded-full border border-[#D41F2D]/50 bg-[#D41F2D]/10 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-[#D41F2D] hover:bg-[#D41F2D]/20 sm:flex ${focusRing}`}
                >
                  <Download size={16} strokeWidth={2.25} />
                  Install App
                </button>
              )}

              {/* Cart */}
              <Link
                href="/cart"
                aria-label={`View cart${totalItems > 0 ? `, ${totalItems} item${totalItems === 1 ? "" : "s"}` : ""}`}
                className={`relative flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border border-white/15 bg-[#061B3D]/30 text-white backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-[#D41F2D] hover:text-[#D41F2D] ${focusRing}`}
              >
                <ShoppingCart size={20} strokeWidth={2} />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D41F2D] px-1 text-[10px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {/* Account: avatar + "My orders" (or Login when logged out) */}
              <UserMenu />

              {/* Mobile / Tablet Menu */}
              <button
                type="button"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsMenuOpen((open) => !open)}
                className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full border lg:hidden ${isMenuOpen ? "border-[#D41F2D]/60 bg-[#D41F2D]/10 text-white" : "border-white/15 bg-[#061B3D]/30 text-white"} backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:border-[#D41F2D] ${focusRing}`}
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
          className="absolute inset-0 cursor-default bg-[#061B3D]/70 backdrop-blur-md"
        />

        {/* Navigation Drawer */}
        <div
          className={`absolute right-0 top-0 h-full w-full max-w-md border-l border-[#D41F2D]/20 bg-[#061B3D] shadow-[-20px_0_80px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Drawer Header */}
          <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-5 sm:h-[76px] sm:px-6">
            <Link
              href="/"
              aria-label="Boss Auto Exchange home"
              onClick={() => setIsMenuOpen(false)}
              className={`group ${focusRing}`}
            >
              <Wordmark className="text-xl" />
            </Link>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsMenuOpen(false)}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-zinc-300 transition-all hover:border-[#D41F2D] hover:text-white ${focusRing}`}
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
                className={`mb-6 flex items-center justify-center gap-2 rounded-full border border-[#D41F2D]/50 bg-[#D41F2D]/10 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 hover:border-[#D41F2D] hover:bg-[#D41F2D]/20 ${focusRing}`}
              >
                <Download size={16} strokeWidth={2.25} />
                Install App
              </button>
            )}

            {/* Label */}
            <div
              className={`mb-5 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500 transition-all duration-500 ${isMenuOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
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
                        className={`group relative flex min-h-[62px] items-center justify-between border-b border-white/[0.07] px-1 text-xl font-semibold tracking-tight transition-all duration-300 sm:min-h-[68px] sm:text-2xl ${focusRing} ${active ? "text-white" : "text-zinc-400 hover:text-white"}`}
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
                          className={`transition-all duration-300 ${active ? "translate-x-0 text-[#D41F2D] opacity-100" : "translate-x-[-6px] text-zinc-600 opacity-0 group-hover:translate-x-0 group-hover:text-[#D41F2D] group-hover:opacity-100"}`}
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
