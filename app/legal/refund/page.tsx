import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Refund policy",
  description:
    "InterviewRunway's plain-language refund standard for digital Foundation access, the Second Seat, and Human Calibration.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPolicyPage() {
  return (
    <PageShell>
      <PageHero
        quiet
        eyebrow="LEGAL · REFUND STANDARD"
        title="Refunds, without fine-print games."
        body="Review the exact access, refund eligibility, window, and any product-specific limits shown with your order before you confirm payment. Nothing is added silently."
      />

      <section className="content-section" aria-labelledby="refund-status-title">
        <div className="container">
          <article className="content-card glass-card">
            <p className="module-kicker">READ BEFORE PURCHASE</p>
            <h2 id="refund-status-title">Your order terms are shown before payment</h2>
            <p>
              The order screen states the product, entitlement, final amount,
              applicable taxes, and the refund conditions attached to that
              purchase. Do not assume a refund window that is not shown there.
            </p>
          </article>
        </div>
      </section>

      <section className="content-section" aria-labelledby="refund-principles-title">
        <div className="container content-narrow">
          <SectionHeading
            eyebrow="THE POLICY STANDARD"
            title="What the final policy will make clear."
            id="refund-principles-title"
          />

          <h2>Before you pay</h2>
          <p>
            Checkout will state the exact product, price, taxes, access terms,
            refund eligibility, refund window, and any product-specific limits.
            Nothing will be pre-selected or added silently.
          </p>

          <h2>If you request a refund</h2>
          <p>
            Use the support route shown on your order confirmation and provide
            the purchase reference and reason for the request. The response will
            explain the eligibility decision and, when approved, the expected
            return process in plain language.
          </p>

          <h2>Different products may need different rules</h2>
          <p>
            Digital Foundation access, included or added Second Seat practice
            time, and scheduled Human Calibration are different services. Any different eligibility or
            cancellation rules will be disclosed beside the relevant offer
            before payment—not introduced after purchase.
          </p>

          <h2>Failed or duplicate payments</h2>
          <p>
            Support covers duplicate charges and payments that are debited but
            do not create access. The payment provider or bank may also handle a
            reversal. Use the support route on the order confirmation so the
            transaction can be traced without exposing payment details.
          </p>

          <h2>Your legal rights</h2>
          <p>
            The final policy will not limit rights that cannot legally be
            excluded. If the policy and applicable law differ, applicable law
            controls.
          </p>

          <p>
            See the related <Link href="/legal/terms">Terms</Link> and{" "}
            <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
