import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Refund policy — draft before launch",
  description:
    "InterviewRunway's plain-language draft refund policy. Final eligibility and the refund window will be published before payments are enabled.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPolicyPage() {
  return (
    <PageShell>
      <PageHero
        quiet
        eyebrow="LEGAL · LAUNCH DRAFT"
        title="Refunds, without fine-print games."
        body="This is a pre-launch draft, not an active refund offer. The final window, eligibility rules, seller identity, and grievance contact will be published here and shown at checkout before any payment is enabled."
      />

      <section className="content-section" aria-labelledby="refund-status-title">
        <div className="container">
          <article className="content-card glass-card">
            <p className="module-kicker">PAYMENTS ARE NOT YET ACTIVE</p>
            <h2 id="refund-status-title">Launch details still pending</h2>
            <p>
              The final refund window, legal seller name and address, refund
              request channel, and grievance officer details have not been
              supplied. They must be completed before checkout is activated.
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
            The live policy will provide one clear request channel and list the
            information needed to locate the purchase. It will also explain the
            review and payment-return process in plain language.
          </p>

          <h2>Different products may need different rules</h2>
          <p>
            Digital Vault access, usage-based Second Seat access, and scheduled 1:1
            coaching are different services. Any different eligibility or
            cancellation rules will be disclosed beside the relevant offer
            before payment—not introduced after purchase.
          </p>

          <h2>Failed or duplicate payments</h2>
          <p>
            The final support process will cover duplicate charges and payments
            that are debited but do not create access. Razorpay may also handle
            bank-side reversals. A support contact and escalation path will be
            published before launch.
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
