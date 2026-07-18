"use client";

import { useState } from "react";
import type { OfferKey } from "@/app/lib/site-data";

type PreviewOutcome = "success" | "pending" | "failed";

export function CheckoutClient({
  offer,
  premium = false,
}: {
  offer: OfferKey;
  premium?: boolean;
}) {
  const [method, setMethod] = useState("upi");
  const [outcome, setOutcome] = useState<PreviewOutcome>("success");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const methods = [
    { id: "upi", name: "UPI", detail: "Preview an app-based approval", recommended: true },
    { id: "card", name: "Card", detail: "Preview hosted card authorisation", recommended: false },
    { id: "netbanking", name: "Netbanking", detail: "Preview a bank redirect", recommended: false },
    ...(premium
      ? [{ id: "emi", name: "EMI", detail: "Preview an eligibility handoff", recommended: false }]
      : []),
  ];
  const outcomes: Array<{ id: PreviewOutcome; name: string; detail: string }> = [
    { id: "success", name: "Approved", detail: "Show the successful handoff state" },
    { id: "pending", name: "Pending", detail: "Show asynchronous verification" },
    { id: "failed", name: "Declined", detail: "Show a recoverable failure" },
  ];

  const runPreview = async () => {
    setStatus("loading");
    try {
      const response = await fetch("/api/checkout-preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ offer, method, outcome }),
      });
      const result = (await response.json()) as {
        ok?: boolean;
        redirect?: string;
      };
      if (!response.ok || !result.ok || !result.redirect) {
        setStatus("error");
        return;
      }
      window.location.assign(result.redirect);
    } catch {
      setStatus("error");
    }
  };

  return (
    <div>
      <div className="payment-options" role="radiogroup" aria-label="Preview payment method">
        {methods.map((item) => (
          <label className="payment-option" key={item.id}>
            <input
              type="radio"
              name="payment-method"
              value={item.id}
              checked={method === item.id}
              onChange={() => setMethod(item.id)}
            />
            <span><b>{item.name}</b><small>{item.detail}</small></span>
            {item.recommended ? <span className="recommended-tag">RECOMMENDED</span> : null}
          </label>
        ))}
      </div>

      <p className="module-kicker" style={{ marginTop: 28 }}>PREVIEW OUTCOME</p>
      <div className="payment-options" role="radiogroup" aria-label="Preview outcome">
        {outcomes.map((item) => (
          <label className="payment-option" key={item.id}>
            <input
              type="radio"
              name="preview-outcome"
              value={item.id}
              checked={outcome === item.id}
              onChange={() => setOutcome(item.id)}
            />
            <span><b>{item.name}</b><small>{item.detail}</small></span>
          </label>
        ))}
      </div>

      <button
        className="checkout-button"
        type="button"
        onClick={runPreview}
        disabled={status === "loading"}
        aria-describedby="checkout-preview-note"
      >
        {status === "loading" ? "Preparing preview…" : "Run no-charge checkout preview"}
      </button>
      <p className="preview-notice" id="checkout-preview-note" role={status === "error" ? "alert" : undefined}>
        {status === "error"
          ? "The preview could not be started. Please try again."
          : "Interactive demo only — no payment details, order, charge, or entitlement will be created."}
      </p>
    </div>
  );
}
