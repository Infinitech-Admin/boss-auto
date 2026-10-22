"use client";

import { forwardRef } from "react";
import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";

type Props = {
  onToken: (token: string) => void;
};

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

/**
 * Cloudflare Turnstile widget.
 * - onToken("") is called when the token expires or errors.
 * - Use the ref to call ref.current?.reset() after a failed submit
 *   (a token can only be used once).
 */
const TurnstileWidget = forwardRef<TurnstileInstance, Props>(
  function TurnstileWidget({ onToken }, ref) {
    // No key configured (e.g. local dev without keys): render nothing.
    if (!SITE_KEY) return null;

    return (
      <Turnstile
        ref={ref}
        siteKey={SITE_KEY}
        options={{ theme: "dark" }}
        onSuccess={onToken}
        onExpire={() => onToken("")}
        onError={() => onToken("")}
      />
    );
  },
);

export default TurnstileWidget;
