"use client";

import Link from "next/link";
import { Mail, MessageCircle, Phone, Send } from "lucide-react";
import { usePathname } from "next/navigation";

const FACEBOOK_URL = "https://www.facebook.com/autoprimecartrading/";

const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

// lucide-react no longer ships brand/logo icons,
// so Facebook is a small inline SVG.
function FacebookIcon({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      aria-hidden="true"
      className={className}
    >
      <path d="M22 12.06C22 6.51 17.52 2 12 2S2 6.51 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.23.2 2.23.2v2.47h-1.26c-1.24 0-1.63.78-1.63 1.58v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
    </svg>
  );
}

export interface FloatingSocialProps {
  facebookHref?: string;
  chatHref?: string;
  telegramHref?: string;
  email?: string;
  phone?: string;
}

interface SocialLink {
  name: string;
  href: string;
  icon: React.ElementType;
  bg: string;
  glow: string;
}

export default function FloatingSocial({
  facebookHref = FACEBOOK_URL,
  chatHref = "#",
  telegramHref = "https://t.me",
  // TODO: replace with the real email address and phone number
  email = "hello@mikmiksgarahe.com",
  phone = "+630000000000",
}: FloatingSocialProps) {
  const pathname = usePathname() ?? "";

  // Hide floating social buttons on all admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  const links: SocialLink[] = [
    {
      name: "Facebook",
      href: facebookHref,
      icon: FacebookIcon,
      bg: "bg-[#1877F2]",
      glow: "shadow-[0_0_18px_rgba(24,119,242,0.55)]",
    },
    {
      name: "Live Chat",
      href: chatHref,
      icon: MessageCircle,
      bg: "bg-[#25D366]",
      glow: "shadow-[0_0_18px_rgba(37,211,102,0.55)]",
    },
    {
      name: "Telegram",
      href: telegramHref,
      icon: Send,
      bg: "bg-[#229ED9]",
      glow: "shadow-[0_0_18px_rgba(34,158,217,0.55)]",
    },
    {
      name: "Email Us",
      href: `mailto:${email}`,
      icon: Mail,
      bg: "bg-[#EA4335]",
      glow: "shadow-[0_0_18px_rgba(234,67,53,0.55)]",
    },
    {
      name: "Call Us",
      href: `tel:${phone}`,
      icon: Phone,
      bg: "bg-[#2563EB]",
      glow: "shadow-[0_0_18px_rgba(37,99,235,0.55)]",
    },
  ];

  return (
    <div
      aria-label="Contact us"
      className="fixed right-3 top-1/2 z-40 -translate-y-1/2"
    >
      {/* Connecting line */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-transparent via-[#D41F2D]/40 to-transparent" />

      <div className="flex flex-col items-center gap-3 rounded-full border border-white/10 bg-[#061B3D]/40 p-2 backdrop-blur-md">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <Link
              key={link.name}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel={
                link.href.startsWith("http") ? "noopener noreferrer" : undefined
              }
              aria-label={link.name}
              className={`group relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform duration-300 hover:scale-110 sm:h-11 sm:w-11 ${link.bg} ${link.glow} ${focusRing}`}
            >
              <Icon size={18} strokeWidth={2.25} className="sm:h-5 sm:w-5" />

              {/* Tooltip */}
              <span className="pointer-events-none absolute right-full mr-3 translate-x-1 whitespace-nowrap rounded-md border border-white/10 bg-[#061B3D] px-2.5 py-1 text-xs font-medium text-white opacity-0 shadow-[0_10px_30px_rgba(0,0,0,0.35)] transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
