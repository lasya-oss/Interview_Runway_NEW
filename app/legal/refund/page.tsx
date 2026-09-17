import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Refund policy | InterviewRunway",
  description:
    "InterviewRunway's refund policy in plain language. Digital products are final sale once access is granted; duplicate charges and failed activations are exceptions. Operated by VividLabs AI.",
  alternates: { canonical: "/legal/refund" },
};

export default function RefundPolicyPage() {
  return (
    <PageShell>
      <PageHero
        quiet
        eyebrow="LEGAL"
        title="Refunds, without fine-print games."
        body="InterviewRunway products are digital goods delivered instantly. All sales are final once access is granted — here is exactly what that means, and the exceptions."
      />

      <section className="content-section" aria-labelledby="refund-principles-title">
        <div className="container content-narrow">
          <SectionHeading
            eyebrow="THE POLICY"
            title="What happens after you pay."
            id="refund-principles-title"
          />

          <h2>All sales are final</h2>
          <p>
            Vault access, Second Seat practice sessions, and coaching products
            are digital goods: access is granted immediately on successful
            payment and cannot be returned. We do not offer refunds once access
            has been granted, for any reason including change of mind.
          </p>

          <h2>Before you pay</h2>
          <p>
            Checkout states the exact product, price, taxes, access terms, and
            any usage limits. Nothing is pre-selected or added silently. If
            anything is unclear, write to{" "}
            <a href="mailto:support@vividlabsai.com">
              support@vividlabsai.com
            </a>{" "}
            before paying.
          </p>

          <h2>Exceptions: duplicate charges and failed activation</h2>
          <p>
            If you are charged twice for the same purchase, or a payment is
            debited but no access is created, that is not a refund request —
            it is a billing error, and we fix billing errors. Write to{" "}
            <a href="mailto:support@vividlabsai.com">
              support@vividlabsai.com
            </a>{" "}
            with the email used at checkout and the transaction reference.
            Confirmed duplicates and failed activations are reversed through
            Paddle; bank-side reversals can take 5–10 business days to appear
            on your statement.
          </p>

          <h2>Failed or pending payments</h2>
          <p>
            Payments that fail or stay pending are handled between Paddle and
            your bank — no money reaches us. If your account shows a debit but
            checkout reported a failure, contact us at the address above and we
            will trace it.
          </p>

          <h2>Coaching scheduling</h2>
          <p>
            Scheduled 1:1 coaching sessions cancelled with at least 24 hours
            notice are rescheduled, not refunded. Missed sessions without
            notice are forfeited.
          </p>

          <h2>Your legal rights</h2>
          <p>
            This policy does not limit rights that cannot legally be excluded.
            If the policy and applicable law differ, applicable law controls.
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
