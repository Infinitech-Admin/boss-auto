"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ClipboardList, LogIn, LogOut } from "lucide-react";

import { useAuth } from "@/context/auth-context";

const LOGIN_HREF = "/login"; // ADJUST if your login page lives elsewhere
const ORDERS_HREF = "/orders";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

export default function UserMenu() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when navigating.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on outside click / Escape.
  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    router.push("/");
    router.refresh();
  };

  // Still checking who's logged in -> placeholder, so the navbar doesn't jump.
  if (isLoading) {
    return (
      <div
        aria-hidden
        className="h-11 w-11 animate-pulse rounded-full bg-white/10 sm:h-12 sm:w-12"
      />
    );
  }

  // Logged out -> Login button.
  if (!user) {
    return (
      <Link
        href={LOGIN_HREF}
        className={`flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-[#061B3D]/30 px-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-[#D41F2D] hover:text-[#5FA8E8] sm:h-12 sm:px-4 ${focusRing}`}
      >
        <LogIn size={18} strokeWidth={2} />
        <span className="hidden sm:inline">Login</span>
      </Link>
    );
  }

  // Logged in -> avatar + dropdown.
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        className={`flex h-11 w-11 items-center justify-center rounded-full border border-[#D41F2D]/60 bg-[#D41F2D] text-sm font-black text-black shadow-[0_10px_30px_rgba(191,152,13,0.25)] transition-all duration-300 hover:bg-[#E8404B] sm:h-12 sm:w-12 ${focusRing}`}
      >
        {getInitials(user.name)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-3 w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#0A2A5C] shadow-[0_20px_60px_rgba(0,0,0,0.55)]"
        >
          <div className="border-b border-white/10 px-4 py-3">
            <p className="truncate text-sm font-semibold text-white">
              {user.name}
            </p>
            <p className="truncate text-xs text-zinc-500">{user.email}</p>
          </div>

          <div className="p-1.5">
            <Link
              href={ORDERS_HREF}
              role="menuitem"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:bg-[#D41F2D]/10 hover:text-[#5FA8E8] ${focusRing}`}
            >
              <ClipboardList size={16} />
              My orders
            </Link>

            <button
              type="button"
              role="menuitem"
              onClick={handleLogout}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-zinc-200 transition-colors hover:bg-[#D41F2D]/10 hover:text-[#E8404B] ${focusRing}`}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
