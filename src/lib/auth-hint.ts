// Path: lib/auth-hint.ts

// Remembers (in this browser only) that the visitor already has an account,
// so guests can be sent straight to /login instead of /register.

const KEY = "has-account";
const SELL_TRADE_DRAFT_KEY = "sell-trade-draft";
const SELL_TRADE_DRAFT_TTL_MS = 6 * 60 * 60 * 1000; // keep in sync with sell-trade page

export function markHasAccount() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* storage unavailable: nothing to do */
  }
}

export function hasAccount(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// Only same-site paths are allowed, to avoid open redirects.
export function safeRedirect(param: string | null): string | null {
  return param && param.startsWith("/") && !param.startsWith("//")
    ? param
    : null;
}

// Fallback for when the ?redirect= param got lost on the way (navbar login,
// refresh, another tab): if a fresh, unsubmitted sell-trade draft exists,
// the visitor was in the middle of it, so send them back there.
export function pendingReturnTo(): string | null {
  try {
    const raw = localStorage.getItem(SELL_TRADE_DRAFT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const savedAt = Number(parsed?.savedAt);
    if (!parsed?.form || !savedAt) return null;
    if (Date.now() - savedAt > SELL_TRADE_DRAFT_TTL_MS) return null;

    return "/sell-trade";
  } catch {
    return null;
  }
}
