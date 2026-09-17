"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useRef, useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/app/lib/analytics";

type CheckoutState = "idle" | "preparing" | "error";

export function CheckoutClient({
  clientToken,
  environment,
}: {
  clientToken: string | null;
  environment: "production" | "sandbox";
}) {
  const [state, setState] = useState<CheckoutState>("idle");
  const [message, setMessage] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const paddleRef = useRef<Promise<Paddle | undefined> | null>(null);
  const configured = Boolean(clientToken);

  const beginCheckout = async () => {
    if (!clientToken || !termsAccepted || state === "preparing") return;

    trackEvent("checkout_started", { offer: "vault", surface: "paddle_button" });

    setState("preparing");
    setMessage("");

    try {
      paddleRef.current ??= initializePaddle({
        environment,
        token: clientToken,
      });
      const paddle = await paddleRef.current;
      if (!paddle) throw new Error("Secure checkout could not be initialized");

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offer: "vault", termsAccepted: true }),
      });
      const result = (await response.json().catch(() => null)) as {
        checkoutSessionId?: string;
        error?: string;
        transactionId?: string;
      } | null;

      if (
        !response.ok ||
        !result?.checkoutSessionId ||
        !result.transactionId
      ) {
        throw new Error(result?.error || "Checkout could not be prepared");
      }

      const successUrl = new URL("/checkout/success", window.location.origin);
      successUrl.searchParams.set("session", result.checkoutSessionId);

      paddle.Checkout.open({
        settings: {
          displayMode: "overlay",
          locale: "en",
          showAddDiscounts: false,
          showAddTaxId: true,
          successUrl: successUrl.toString(),
          theme: "light",
          variant: "one-page",
        },
        transactionId: result.transactionId,
      });

      setState("idle");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Secure checkout could not be opened. Please try again.",
      );
      setState("error");
    }
  };

  return (
    <div className="paddle-checkout-action">
      <div className="checkout-final-sale" id="checkout-final-sale">
        <strong>ALL SALES ARE FINAL</strong>
        <p>
          This is an immediately delivered digital product. No refunds are
          offered after access is granted, except reversals for a duplicate
          charge or a payment that fails to activate access. Read the full{" "}
          <Link href="/legal/refund">Refund Policy</Link>.
        </p>
      </div>

      <label className="checkout-acceptance">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          required
        />
        <span>
          I agree to the <Link href="/legal/terms">Terms</Link> and{" "}
          <Link href="/legal/refund">Refund Policy</Link>, and I understand
          that this digital purchase is final once access is granted.
        </span>
      </label>

      <button
        className="checkout-button"
        type="button"
        onClick={beginCheckout}
        disabled={!configured || !termsAccepted || state === "preparing"}
        aria-describedby="checkout-final-sale paddle-checkout-note"
      >
        {state === "preparing"
          ? "Preparing secure checkout…"
          : configured
            ? termsAccepted
              ? "Continue to secure checkout"
              : "Accept the terms to continue"
            : "Checkout configuration unavailable"}
      </button>
      <p
        className="preview-notice"
        id="paddle-checkout-note"
        role={state === "error" ? "alert" : undefined}
      >
        {state === "error"
          ? message
          : "In Paddle, enter the email you want on the receipt and review the exact tax-adjusted total before its final payment button. Nothing else is added to your order."}
      </p>
    </div>
  );
}
