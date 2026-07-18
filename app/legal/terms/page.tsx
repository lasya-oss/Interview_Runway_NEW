import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Terms of use — draft before launch",
  description:
    "Plain-language draft terms for InterviewRunway. Seller details, grievance contact, and final refund terms remain pending before payment activation.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <PageShell>
      <PageHero
        quiet
        eyebrow="LEGAL · LAUNCH DRAFT"
        title="Terms you should be able to read once."
        body="These draft terms explain the intended ground rules. They are not ready to govern a paid purchase until the seller details, grievance contact, and final refund window are completed and published."
      />

      <section className="content-section" aria-labelledby="terms-status-title">
        <div className="container">
          <article className="content-card glass-card">
            <p className="module-kicker">NOT YET ACTIVE FOR PURCHASES</p>
            <h2 id="terms-status-title">Required launch details are pending</h2>
            <p>
              The legal seller name and address, grievance officer and contact
              method, governing-law details, and final refund window have not
              been supplied. Payments must remain disabled until they are
              completed.
            </p>
          </article>
        </div>
      </section>

      <section className="content-section" aria-labelledby="terms-title">
        <div className="container content-narrow">
          <SectionHeading
            eyebrow="PLAIN-LANGUAGE TERMS"
            title="The intended agreement."
            id="terms-title"
          />

          <h2>What InterviewRunway provides</h2>
          <p>
            InterviewRunway offers interview-preparation content, optional AI
            practice tools, and optional coaching. The product page and checkout
            will state what is included, how long access lasts, any usage limits,
            and the full price before you pay.
          </p>

          <h2>No outcome guarantee</h2>
          <p>
            The service supports preparation. It does not guarantee an
            interview, job, salary, visa, sponsorship, promotion, or any other
            hiring outcome. You remain responsible for applications, interview
            decisions, and how you use the material.
          </p>

          <h2>Your account and permitted use</h2>
          <p>
            Access is for the purchaser&apos;s personal use. Do not share account
            access, resell the service, distribute paid materials, interfere
            with the service, or use it unlawfully. You are responsible for
            keeping account credentials secure and for information submitted
            through your account.
          </p>

          <h2>AI-assisted features</h2>
          <p>
            AI output can be incomplete or wrong and should be checked before
            relying on it. Do not submit confidential employer information,
            proprietary interview questions, or personal data you do not have
            permission to use.
          </p>

          <h2>Payments and access</h2>
          <p>
            The checkout will show the exact INR amount, applicable taxes, the
            payment processor, and the access being purchased. No optional
            upgrade will be pre-selected. Paid access will begin only after a
            successful payment confirmation.
          </p>

          <h2>Refunds and cancellations</h2>
          <p>
            The final refund window and product-specific eligibility rules are
            still pending. They will appear in the{" "}
            <Link href="/legal/refund">Refund Policy</Link> and at checkout
            before payments are activated.
          </p>

          <h2>Content and service changes</h2>
          <p>
            InterviewRunway may improve, replace, or retire material. Any change
            that materially affects a paid entitlement will be handled under
            the live terms presented at purchase, not hidden in a later update.
          </p>

          <h2>Contact and complaints</h2>
          <p>
            The seller contact and grievance escalation route are pending and
            will be listed here before launch. The live terms will also include
            an effective date and explain how material updates are communicated.
          </p>

          <p>
            Please also read the <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
