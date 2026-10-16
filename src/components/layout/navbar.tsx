// components/layout/navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Download, Menu, ShoppingCart, X } from "lucide-react";
import { useCart } from "@/context/cart-context";
import UserMenu from "@/components/layout/user-menu";
import NotificationBell from "@/components/layout/notification-bell";
import { Wordmark } from "@/components/layout/wordmark";
import LanguageSwitcher, {
  GoogleTranslateLoader,
} from "@/components/layout/language-switcher";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Showroom", href: "/showroom" },
  { name: "Sold Cars", href: "/sold-cars" },
  { name: "Sell / Trade", href: "/sell-trade" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Careers", href: "/careers" },
  { name: "Contact", href: "/contact" },
];

// Full desktop nav starts at xl (1280px). Below that: hamburger drawer.
const DESKTOP_MIN_WIDTH = 1280;

// Header height: 64px phones, 72px tablets, 80px desktop (+1px border).
// On the homepage the header overlays the hero, so pull content up by that much.
const HEADER_OFFSET = "-mb-[65px] sm:-mb-[73px] xl:-mb-[81px]";

// Palette: red #D41F2D | red text #FF5C68 | navy #040E21 | blue accent #3D8FD9
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

// One quiet button style for every round/utility button in the header.
// The only loud element in the bar is the active red pill.
const utilBtn =
  "border border-white/15 bg-white/[0.04] text-white/90 backdrop-blur-md transition-colors duration-200 hover:border-[#FF5C68]/70 hover:bg-white/10 hover:text-white";

// Make the Login / account element rendered by <UserMenu /> match utilBtn.
const accountStyle =
  "[&>a]:rounded-full [&>a]:border [&>a]:border-white/15 [&>a]:bg-white/[0.04] [&>a:hover]:border-[#FF5C68]/70 [&>a:hover]:bg-white/10 [&>button]:rounded-full [&>button]:border [&>button]:border-white/15 [&>button]:bg-white/[0.04] [&>button:hover]:border-[#FF5C68]/70 [&>button:hover]:bg-white/10";

// Round header buttons: 40px phones, 44px from sm up.
const roundBtn = "h-10 w-10 sm:h-11 sm:w-11";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
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
    if (outcome === "accepted") setInstallPrompt(null);
  };

  // Drawer: lock scroll, Esc to close, auto-close when resized to desktop
  useEffect(() => {
    if (!isMenuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };
    const handleResize = () => {
      if (window.innerWidth >= DESKTOP_MIN_WIDTH) setIsMenuOpen(false);
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
      {/* Google Translate engine (hidden). Mounted once. */}
      <GoogleTranslateLoader />

      <header
        className={`sticky top-0 z-50 border-b pt-[env(safe-area-inset-top)] transition-colors duration-300 motion-reduce:transition-none ${isHome ? HEADER_OFFSET : ""} ${isSolid ? "border-white/10 bg-[#040E21]/90 backdrop-blur-xl" : "border-transparent bg-transparent"}`}
      >
        <nav
          aria-label="Main"
          className="mx-auto w-full max-w-[1600px] px-3 sm:px-6 xl:px-8"
        >
          {/*
            3-zone grid: [logo] [nav, truly centered] [actions]
            auto | 1fr | auto  -> the middle zone can never overlap the sides.
            Below xl the middle zone is hidden, so the grid collapses to
            logo (left) + actions (right).
          */}
          <div className="grid h-16 grid-cols-[auto_1fr] items-center gap-3 sm:h-[72px] sm:gap-4 xl:h-20 xl:grid-cols-[auto_1fr_auto] xl:gap-6">
            {/* ZONE 1: LOGO */}
            <Link
              href="/"
              aria-label="Boss Auto Exchange home"
              className={`group flex w-fit shrink-0 items-center rounded-md ${focusRing}`}
            >
              <Wordmark className="text-[26px] sm:text-4xl xl:text-[40px]" />
            </Link>

            {/* ZONE 2: DESKTOP NAV (xl+) */}
            <div className="col-start-2 row-start-1 hidden min-w-0 justify-center xl:flex">
              <ul className="flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        className={`flex items-center whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors duration-200 2xl:px-4 ${focusRing} ${active ? "bg-[#D41F2D] text-white" : "text-white/80 hover:bg-white/10 hover:text-white"}`}
                      >
                        {item.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* ZONE 3: ACTIONS */}
            <div className="col-start-2 row-start-1 flex min-w-0 items-center justify-end gap-1.5 sm:gap-2 xl:col-start-3">
              {/* Install App: icon on xl, icon + label on 2xl */}
              {canInstall && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  aria-label="Install app"
                  title="Install app"
                  className={`hidden h-11 w-11 items-center justify-center gap-2 rounded-full text-sm font-semibold xl:flex 2xl:w-auto 2xl:px-4 ${utilBtn} border-[#D41F2D]/60 bg-[#D41F2D]/15 hover:bg-[#D41F2D]/25 ${focusRing}`}
                >
                  <Download size={18} strokeWidth={2.25} />
                  <span className="hidden whitespace-nowrap 2xl:inline">
                    Install App
                  </span>
                </button>
              )}

              {/* Language: desktop only (drawer elsewhere) */}
              <div className="hidden xl:flex">
                <LanguageSwitcher focusRing={focusRing} />
              </div>

              <NotificationBell className={`${utilBtn} ${focusRing}`} />

              <Link
                href="/cart"
                aria-label={`View cart${totalItems > 0 ? `, ${totalItems} item${totalItems === 1 ? "" : "s"}` : ""}`}
                className={`relative flex ${roundBtn} shrink-0 items-center justify-center rounded-full ${utilBtn} ${focusRing}`}
              >
                <ShoppingCart size={19} strokeWidth={2} />
                {totalItems > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#D41F2D] px-1 text-[10px] font-bold text-white">
                    {totalItems > 99 ? "99+" : totalItems}
                  </span>
                )}
              </Link>

              {/* Account: from sm up in the bar; on phones it lives in the drawer */}
              <div className={`hidden items-center sm:flex ${accountStyle}`}>
                <UserMenu />
              </div>

              {/* Menu button (below xl) */}
              <button
                type="button"
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={isMenuOpen}
                aria-controls="mobile-menu"
                onClick={() => setIsMenuOpen((open) => !open)}
                className={`flex ${roundBtn} shrink-0 items-center justify-center rounded-full xl:hidden ${isMenuOpen ? "border border-[#D41F2D]/70 bg-[#D41F2D]/15 text-white" : utilBtn} ${focusRing}`}
              >
                {isMenuOpen ? (
                  <X size={20} strokeWidth={2} />
                ) : (
                  <Menu size={20} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* DRAWER (below xl). overflow-hidden so the closed drawer never adds page width. */}
      <div
        id="mobile-menu"
        aria-hidden={!isMenuOpen}
        className={`fixed inset-0 z-40 overflow-hidden transition-opacity duration-300 xl:hidden ${isMenuOpen ? "visible opacity-100" : "invisible opacity-0"}`}
      >
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setIsMenuOpen(false)}
          tabIndex={isMenuOpen ? 0 : -1}
          className="absolute inset-0 cursor-default bg-[#040E21]/70 backdrop-blur-md"
        />

        <div
          className={`absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-[#040E21] pb-[env(safe-area-inset-bottom)] shadow-[-20px_0_80px_rgba(0,0,0,0.55)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${isMenuOpen ? "translate-x-0" : "translate-x-full"}`}
        >
          {/* Drawer header */}
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4 pt-[env(safe-area-inset-top)] sm:h-[72px] sm:px-6">
            <Link
              href="/"
              aria-label="Boss Auto Exchange home"
              onClick={() => setIsMenuOpen(false)}
              className={`group rounded-md ${focusRing}`}
            >
              <Wordmark className="text-3xl" />
            </Link>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsMenuOpen(false)}
              className={`flex h-10 w-10 items-center justify-center rounded-full ${utilBtn} ${focusRing}`}
            >
              <X size={19} />
            </button>
          </div>

          {/* Drawer body */}
          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-6 sm:px-6">
            {/* Phones only: account lives here */}
            <div className={`mb-5 flex items-center sm:hidden ${accountStyle}`}>
              <UserMenu />
            </div>

            <nav aria-label="Mobile">
              <ul className="space-y-1">
                {navigation.map((item) => {
                  const active = isActive(item.href);
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        onClick={() => setIsMenuOpen(false)}
                        className={`group flex min-h-[56px] items-center justify-between rounded-xl px-4 text-lg font-semibold transition-colors duration-200 ${focusRing} ${active ? "bg-[#D41F2D] text-white" : "text-white/85 hover:bg-white/5 hover:text-white"}`}
                      >
                        {item.name}
                        <ArrowRight
                          size={18}
                          className={
                            active
                              ? "opacity-100"
                              : "opacity-0 transition-opacity group-hover:opacity-70"
                          }
                        />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Utilities pinned to the bottom */}
            <div className="mt-auto space-y-3 pt-8">
              <LanguageSwitcher variant="drawer" focusRing={focusRing} />

              {canInstall && (
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className={`flex w-full items-center justify-center gap-2 rounded-full border border-[#D41F2D]/60 bg-[#D41F2D]/15 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#D41F2D]/25 ${focusRing}`}
                >
                  <Download size={16} strokeWidth={2.25} />
                  Install App
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
