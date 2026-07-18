"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { useRef, useState } from "react";

type CheckoutState = "idle" | "preparing" | "error";

export function CheckoutClient({
  clientToken,
  email,
  environment,
}: {
  clientToken: string | null;
  email: string;
  environment: "production" | "sandbox";
}) {
  const [state, setState] = useState<CheckoutState>("idle");
  const [message, setMessage] = useState("");
  const paddleRef = useRef<Promise<Paddle | undefined> | null>(null);
  const configured = Boolean(clientToken);

  const beginCheckout = async () => {
    if (!clientToken || state === "preparing") return;

    setState("preparing");
    setMessage("");

    try {
      paddleRef.current ??= initializePaddle({
        environment,
        token: clientToken,
      });
      const paddle = await paddleRef.current;
      if (!paddle) throw new Error("Paddle could not be initialized");

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
        customer: { email },
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
            ? "Continue securely with Paddle"
            : "Checkout configuration unavailable"}
      </button>
      <p
        className="preview-notice"
        id="paddle-checkout-note"
        role={state === "error" ? "alert" : undefined}
      >
        {state === "error"
          ? message
          : "You will review the final amount and payment method inside Paddle before authorizing anything."}
      </p>
    </div>
  );
}
