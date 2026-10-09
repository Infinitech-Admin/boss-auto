"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, Globe, Search } from "lucide-react";

const LANGUAGES: { code: string; name: string }[] = [
  { code: "en", name: "English" },
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "as", name: "Assamese" },
  { code: "ay", name: "Aymara" },
  { code: "az", name: "Azerbaijani" },
  { code: "bm", name: "Bambara" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "bho", name: "Bhojpuri" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "ny", name: "Chichewa" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "co", name: "Corsican" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "dv", name: "Dhivehi" },
  { code: "doi", name: "Dogri" },
  { code: "nl", name: "Dutch" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Estonian" },
  { code: "ee", name: "Ewe" },
  { code: "fil", name: "Filipino (Tagalog)" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "fy", name: "Frisian" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gn", name: "Guarani" },
  { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "Hawaiian" },
  { code: "iw", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "ig", name: "Igbo" },
  { code: "ilo", name: "Ilocano" },
  { code: "id", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "jw", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "rw", name: "Kinyarwanda" },
  { code: "gom", name: "Konkani" },
  { code: "ko", name: "Korean" },
  { code: "kri", name: "Krio" },
  { code: "ku", name: "Kurdish (Kurmanji)" },
  { code: "ckb", name: "Kurdish (Sorani)" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "lv", name: "Latvian" },
  { code: "ln", name: "Lingala" },
  { code: "lt", name: "Lithuanian" },
  { code: "lg", name: "Luganda" },
  { code: "lb", name: "Luxembourgish" },
  { code: "mk", name: "Macedonian" },
  { code: "mai", name: "Maithili" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mni-Mtei", name: "Meiteilon (Manipuri)" },
  { code: "lus", name: "Mizo" },
  { code: "mn", name: "Mongolian" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "or", name: "Odia (Oriya)" },
  { code: "om", name: "Oromo" },
  { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "qu", name: "Quechua" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sm", name: "Samoan" },
  { code: "sa", name: "Sanskrit" },
  { code: "gd", name: "Scots Gaelic" },
  { code: "nso", name: "Sepedi" },
  { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" },
  { code: "es", name: "Spanish" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" },
  { code: "tt", name: "Tatar" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "ti", name: "Tigrinya" },
  { code: "ts", name: "Tsonga" },
  { code: "tr", name: "Turkish" },
  { code: "tk", name: "Turkmen" },
  { code: "ak", name: "Twi (Akan)" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "ug", name: "Uyghur" },
  { code: "uz", name: "Uzbek" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
];

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
    google?: {
      translate: {
        TranslateElement: new (
          options: { pageLanguage: string; autoDisplay: boolean },
          elementId: string,
        ) => unknown;
      };
    };
  }
}

const SCRIPT_ID = "google-translate-script";

/** Mount ONCE (in Navbar). Loads the Google Translate engine (hidden). */
export function GoogleTranslateLoader() {
  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google) return;
      new window.google.translate.TranslateElement(
        { pageLanguage: "en", autoDisplay: false },
        "google_translate_element",
      );
    };

    if (document.getElementById(SCRIPT_ID)) return;
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src =
      "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return <div id="google_translate_element" className="hidden" />;
}

function getCurrentLang(): string {
  if (typeof document === "undefined") return "en";
  const match = document.cookie.match(/(?:^|;\s*)googtrans=\/[^/]+\/([^;]+)/);
  return match ? decodeURIComponent(match[1]) : "en";
}

function applyLanguage(code: string) {
  const host = window.location.hostname;
  const expire = "expires=Thu, 01 Jan 1970 00:00:00 GMT";

  if (code === "en") {
    document.cookie = `googtrans=; path=/; ${expire}`;
    document.cookie = `googtrans=; path=/; domain=.${host}; ${expire}`;
  } else {
    const value = `/en/${code}`;
    document.cookie = `googtrans=${value}; path=/`;
    if (host.includes(".")) {
      document.cookie = `googtrans=${value}; path=/; domain=.${host}`;
    }
  }
  window.location.reload();
}
// "zh-CN" -> "CN", "zh-TW" -> "TW", "mni-Mtei" -> "MNI", "fr" -> "FR"
function getShortCode(code: string): string {
  if (code === "zh-CN") return "CN";
  if (code === "zh-TW") return "TW";
  return code.split("-")[0].toUpperCase();
}
interface Props {
  variant?: "header" | "drawer";
  className?: string;
  focusRing?: string;
}

export default function LanguageSwitcher({
  variant = "header",
  className = "",
  focusRing = "",
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [current, setCurrent] = useState("en");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => setCurrent(getCurrentLang()), []);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (variant === "header" && !rootRef.current?.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, variant]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q
      ? LANGUAGES.filter(
          (l) => l.name.toLowerCase().includes(q) || l.code.toLowerCase() === q,
        )
      : LANGUAGES;
  }, [query]);

  const currentName =
    LANGUAGES.find((l) => l.code === current)?.name ?? "English";

  const panel = (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#040E21] shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      <div className="relative border-b border-white/10 p-2">
        <Search
          size={15}
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-white/50"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search language..."
          aria-label="Search language"
          className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-[#D41F2D] focus:outline-none"
        />
      </div>
      <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
        {filtered.length === 0 && (
          <li className="px-3 py-3 text-sm text-white/50">
            No languages found
          </li>
        )}
        {filtered.map((lang) => {
          const selected = lang.code === current;
          return (
            <li key={lang.code} role="option" aria-selected={selected}>
              <button
                type="button"
                onClick={() => applyLanguage(lang.code)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  selected
                    ? "bg-[#D41F2D]/25 text-white"
                    : "text-white/85 hover:bg-white/10 hover:text-white"
                }`}
              >
                {lang.name}
                {selected && <Check size={15} className="text-[#FF5C68]" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );

  if (variant === "drawer") {
    return (
      <div className={`notranslate ${className}`} translate="no">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className={`flex w-full items-center justify-between rounded-full border border-[#3D8FD9]/80 bg-[#040E21]/30 px-4 py-3 text-sm font-semibold text-white shadow-[0_0_22px_rgba(61,143,217,0.7)] ${focusRing}`}
        >
          <span className="flex items-center gap-2">
            <Globe size={16} /> Language
          </span>
          <span className="text-white/70">{currentName}</span>
        </button>
        {open && <div className="mt-2">{panel}</div>}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      className={`notranslate relative hidden sm:block ${className}`}
      translate="no"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={`Change language (current: ${currentName})`}
        aria-expanded={open}
        aria-haspopup="listbox"
        className={`flex h-11 items-center justify-center gap-1.5 rounded-full border border-[#3D8FD9]/80 bg-[#040E21]/30 px-3.5 text-sm font-semibold text-white shadow-[0_0_22px_rgba(61,143,217,0.7),inset_0_0_10px_rgba(61,143,217,0.2)] backdrop-blur-md transition-all duration-300 hover:border-[#FF5C68] hover:text-[#FF5C68] hover:shadow-[0_0_28px_rgba(212,31,45,0.85)] sm:h-12 ${focusRing}`}
      >
        <Globe size={18} strokeWidth={2} />
        <span className="tracking-wide">{getShortCode(current)}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-3 w-72">{panel}</div>
      )}
    </div>
  );
}
