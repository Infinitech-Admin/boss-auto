import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";

// TODO: replace with the real Auto-Prime Facebook page
const FACEBOOK_URL = "https://www.facebook.com/";

const FacebookIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

// Auto-Prime Car Trading palette
// primary  #D41F2D | hover #E8404B | text #FFFFFF | background #000000
const focusRing =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D41F2D]";

// Text logo styled like the Auto-Prime logo.
// Place inside an element with the `group` class for hover effects.
function Wordmark({ className = "" }: { className?: string }) {
  return (
    <span
      className={`flex flex-col items-center whitespace-nowrap leading-none ${className}`}
    >
      <span className="font-light uppercase tracking-[0.2em] text-white transition-colors duration-300 group-hover:text-zinc-300">
        Auto-Prime
      </span>
      <span className="mt-1 text-[0.45em] font-medium uppercase tracking-[0.35em] text-[#D41F2D] transition-colors duration-300 group-hover:text-[#E8404B]">
        Car Trading
      </span>
    </span>
  );
}

const socialLink =
  "flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 transition-all duration-300 hover:border-[#D41F2D]/50 hover:bg-[#D41F2D]/10 hover:text-[#D41F2D]";

export default function Footer() {
  return (
    <>
      <footer className="border-t border-[#D41F2D] bg-[#061B3D] text-white">
        <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          {/* Main Footer */}
          <div className="grid gap-12 py-14 md:grid-cols-2 lg:grid-cols-4 lg:py-16">
            {/* Brand */}
            <div className="lg:col-span-1">
              {/* Logo (text wordmark) */}
              <Link
                href="/"
                aria-label="Auto-Prime Car Trading home"
                className={`group inline-block ${focusRing}`}
              >
                <Wordmark className="text-2xl" />
              </Link>

              <p className="mt-5 max-w-sm text-sm leading-6 text-zinc-400">
                Premium vehicles, transparent transactions, and a better way to
                find your next drive.
              </p>

              {/* Socials */}
              <div className="mt-6 flex items-center gap-3">
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Auto-Prime Car Trading on Facebook"
                  className={`${socialLink} ${focusRing}`}
                >
                  <FacebookIcon className="size-4" />
                </a>

                <a
                  href="#"
                  aria-label="Instagram"
                  className={`${socialLink} ${focusRing}`}
                >
                  <InstagramIcon className="size-4" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Explore
              </h3>

              <ul className="mt-6 space-y-3 text-sm">
                <li>
                  <Link
                    href="/showroom"
                    className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
                  >
                    Browse Inventory
                  </Link>
                </li>

                <li>
                  <Link
                    href="/sell-trade"
                    className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
                  >
                    Sell / Trade Car
                  </Link>
                </li>

                <li>
                  <Link
                    href="/about"
                    className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
                  >
                    About Us
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact"
                    className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Services
              </h3>

              <ul className="mt-6 space-y-3 text-sm">
                <li>
                  <Link
                    href="/showroom"
                    className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
                  >
                    Vehicle Sales
                  </Link>
                </li>

                <li>
                  <Link
                    href="/sell-trade"
                    className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
                  >
                    Vehicle Trade-In
                  </Link>
                </li>

                <li>
                  <Link
                    href="/contact"
                    className="text-zinc-400 transition-colors hover:text-[#D41F2D]"
                  >
                    Test Drive
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-white">
                Contact
              </h3>

              <div className="mt-6 space-y-4 text-sm">
                <div className="flex gap-3 text-zinc-400">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-[#D41F2D]" />
                  <address className="not-italic">
                    Your showroom address
                    <br />
                    Your City, Philippines
                  </address>
                </div>

                {/* TODO: replace with the real phone number (tel: needs a number) */}
                <a
                  href="tel:+630000000000"
                  className="flex items-center gap-3 text-zinc-400 transition-colors hover:text-[#D41F2D]"
                >
                  <Phone className="size-4 text-[#D41F2D]" />
                  +63 000 000 0000
                </a>

                {/* TODO: replace with the real email address */}
                <a
                  href="mailto:hello@autoprime.com"
                  className="flex items-center gap-3 text-zinc-400 transition-colors hover:text-[#D41F2D]"
                >
                  <Mail className="size-4 text-[#D41F2D]" />
                  hello@autoprime.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom */}
          <div className="flex flex-col gap-4 border-t border-white/10 py-6 text-center text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:text-left">
            <div className="space-y-1">
              <p>
                &copy; {new Date().getFullYear()} Auto-Prime Car Trading. All
                rights reserved.
              </p>
              <span>
                Powered by{" "}
                <Link
                  href="https://www.infinitechphil.com/"
                  className="transition-colors hover:text-[#D41F2D]"
                >
                  Infinitech Advertising Corporation
                </Link>
              </span>
            </div>

            <div className="flex justify-center gap-5 sm:justify-end">
              <Link
                href="/privacy-policy"
                className="transition-colors hover:text-[#D41F2D]"
              >
                Privacy Policy
              </Link>

              <Link
                href="/terms-and-conditions"
                className="transition-colors hover:text-[#D41F2D]"
              >
                Terms &amp; Conditions
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
