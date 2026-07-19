"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/app/lib/analytics";

type VerificationStatus =
  | "active"
  | "pending"
  | "failed"
  | "expired"
  | "revoked";

const COPY: Record<
  VerificationStatus,
  { eyebrow: string; title: string; body: string }
> = {
  active: {
    eyebrow: "CLEARANCE CONFIRMED",
    title: "Your Foundation access is active.",
    body: "Payment is confirmed and your Foundation flight plan is ready.",
  },
  pending: {
    eyebrow: "VERIFYING CLEARANCE",
    title: "Payment returned. Access is being verified.",
    body: "Your payment is being securely confirmed. This page will update automatically.",
  },
  failed: {
    eyebrow: "CHECKOUT INTERRUPTED",
    title: "Access was not activated.",
    body: "The payment handoff did not complete. No Foundation entitlement was created for this checkout session.",
  },
  expired: {
    eyebrow: "SESSION EXPIRED",
    title: "This checkout window has closed.",
    body: "Start a new secure checkout to continue. An expired browser session cannot activate access.",
  },
  revoked: {
    eyebrow: "ACCESS REVOKED",
    title: "This purchase is no longer active.",
    body: "An approved refund or payment reversal was received, so the related Foundation access was removed.",
  },
};

export function CheckoutVerification({
  checkoutSessionId,
  initialStatus,
}: {
  checkoutSessionId: string;
  initialStatus: VerificationStatus;
}) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    if (status === "active") trackEvent("checkout_completed", { offer: "vault" });
  }, [status]);

  useEffect(() => {
    if (status !== "pending") return;

    let cancelled = false;
    let attempts = 0;
    const poll = async () => {
      attempts += 1;
      const response = await fetch(
        `/api/checkout/status?session=${encodeURIComponent(checkoutSessionId)}`,
        { cache: "no-store" },
      ).catch(() => null);

      if (response?.ok) {
        const result = (await response.json()) as { status?: VerificationStatus };
        if (!cancelled && result.status) setStatus(result.status);
      }

      if (!cancelled && attempts < 30 && status === "pending") {
        window.setTimeout(poll, 1500);
      }
    };

    const timer = window.setTimeout(poll, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [checkoutSessionId, status]);

  const copy = COPY[status];

  return (
    <section className="checkout-card verification-card" aria-live="polite">
      <div className={`verification-orbit verification-orbit-${status}`} aria-hidden="true">
        <i /><i /><i /><span />
      </div>
      <p className="module-kicker">{copy.eyebrow}</p>
      <h1>{copy.title}</h1>
      <p className="checkout-intro">{copy.body}</p>

      <dl className="verification-record">
        <div><dt>Product</dt><dd>InterviewRunway Foundation</dd></div>
        <div><dt>Status</dt><dd>{status === "active" ? "Payment verified" : "Verification pending"}</dd></div>
      </dl>

      <div className="hero-actions">
        {status === "active" ? (
          <Link className="primary-cta" href="/vault">Open Foundation overview <span aria-hidden="true">↗</span></Link>
        ) : (
          <Link className="primary-cta" href="/checkout/vault">Return to checkout <span aria-hidden="true">↗</span></Link>
        )}
        <Link className="text-link" href="/pricing">Back to pricing</Link>
      </div>
    </section>
  );
}
