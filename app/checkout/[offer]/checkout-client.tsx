"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useRef, useState } from "react";
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
  const paddleRef = useRef<Promise<Paddle | undefined> | null>(null);
  const configured = Boolean(clientToken);

  const beginCheckout = async () => {
    if (!clientToken || state === "preparing") return;

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
        body: JSON.stringify({ offer: "vault" }),
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
      <button
        className="checkout-button"
        type="button"
        onClick={beginCheckout}
        disabled={!configured || state === "preparing"}
        aria-describedby="paddle-checkout-note"
      >
        {state === "preparing"
          ? "Preparing secure checkout…"
          : configured
            ? "Continue to secure checkout"
            : "Checkout configuration unavailable"}
      </button>
      <p
        className="preview-notice"
        id="paddle-checkout-note"
        role={state === "error" ? "alert" : undefined}
      >
        {state === "error"
          ? message
          : "Enter the email you want on the receipt, review the final total, and choose your payment method before completing purchase."}
      </p>
    </div>
  );
}
