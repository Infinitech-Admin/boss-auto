
"use client";

import { Turnstile } from "@marsidev/react-turnstile";

type TurnstileCaptchaProps = {
    onVerify: (token: string) => void;
    onExpire?: () => void;
    onError?: () => void;
};

export default function TurnstileCaptcha({
    onVerify,
    onExpire,
    onError,
}: TurnstileCaptchaProps) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
        return (
            <p role="alert" className="text-sm text-red-500">
                CAPTCHA configuration is missing.
            </p>
        );
    }

    return (
        <div className="my-4">
            <Turnstile
                siteKey={siteKey}
                onSuccess={onVerify}
                onExpire={onExpire}
                onError={onError}
                options={{
                    theme: "auto",
                    size: "flexible",
                    appearance: "always",
                    execution: "render",
                }}
            />
        </div>
    );
}
