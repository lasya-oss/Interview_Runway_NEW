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
    title: "Your Vault access is active.",
    body: "Paddle confirmed the transaction through a signed server webhook. The entitlement is attached to your signed-in InterviewRunway account.",
  },
  pending: {
    eyebrow: "VERIFYING CLEARANCE",
    title: "Payment returned. Access is being verified.",
    body: "This page is waiting for Paddle's signed server confirmation. It will update automatically; a browser redirect alone cannot unlock the Vault.",
  },
  failed: {
    eyebrow: "CHECKOUT INTERRUPTED",
    title: "Access was not activated.",
    body: "The payment handoff did not complete. No Vault entitlement was created for this checkout session.",
  },
  expired: {
    eyebrow: "SESSION EXPIRED",
    title: "This checkout window has closed.",
    body: "Start a new secure checkout to receive a fresh Paddle transaction. An expired browser session cannot activate access.",
  },
  revoked: {
    eyebrow: "ACCESS REVOKED",
    title: "This purchase is no longer active.",
    body: "Paddle reported an approved refund or chargeback for the matched transaction, so its Vault entitlement was revoked.",
  },
};

export function CheckoutVerification({
  checkoutSessionId,
  initialStatus,
  userEmail,
}: {
  checkoutSessionId: string;
  initialStatus: VerificationStatus;
  userEmail: string;
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
        <div><dt>Account</dt><dd>{userEmail}</dd></div>
        <div><dt>Product</dt><dd>InterviewRunway Vault</dd></div>
        <div><dt>Authority</dt><dd>{status === "active" ? "Paddle webhook verified" : "Awaiting verified event"}</dd></div>
      </dl>

      <div className="hero-actions">
        {status === "active" ? (
          <Link className="primary-cta" href="/vault">Open Vault overview <span aria-hidden="true">↗</span></Link>
        ) : (
          <Link className="primary-cta" href="/checkout/vault">Return to checkout <span aria-hidden="true">↗</span></Link>
        )}
        <Link className="text-link" href="/pricing">Back to pricing</Link>
      </div>
    </section>
  );
}
