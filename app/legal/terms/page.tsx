import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Terms of use | InterviewRunway",
  description:
    "The terms governing your use of InterviewRunway, in plain language. Operated by VividLabs AI. Effective 17 September 2026.",
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return (
    <PageShell>
      <PageHero
        quiet
        eyebrow="LEGAL"
        title="Terms you should be able to read once."
        body="The ground rules for using InterviewRunway, in plain language. Effective 17 September 2026."
      />

      <section className="content-section" aria-labelledby="terms-title">
        <div className="container content-narrow">
          <SectionHeading
            eyebrow="PLAIN-LANGUAGE TERMS"
            title="The agreement."
            id="terms-title"
          />

          <h2>Who we are</h2>
          <p>
            InterviewRunway is operated by VividLabs AI (&ldquo;we&rdquo;,
            &ldquo;us&rdquo;). For anything about these terms, your account, or
            a purchase, contact{" "}
            <a href="mailto:support@vividlabsai.com">
              support@vividlabsai.com
            </a>
            .
          </p>

          <h2>What InterviewRunway provides</h2>
          <p>
            InterviewRunway offers interview-preparation content, AI practice
            tools, and optional coaching. The product page and checkout state
            what is included, how long access lasts, any usage limits, and the
            full price before you pay.
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
            Payments are processed by Paddle, which acts as the merchant of
            record — the charge on your statement will appear from Paddle.
            Checkout shows the exact amount, applicable taxes, and the access
            terms before you pay. No optional upgrade is pre-selected. Paid
            access begins only after a successful payment confirmation.
          </p>

          <h2>Refunds</h2>
          <p>
            InterviewRunway products are digital goods delivered instantly, and
            all sales are final once access is granted. The exceptions —
            duplicate charges and payments that never created access — are
            described in the <Link href="/legal/refund">Refund Policy</Link>.
          </p>

          <h2>Content and service changes</h2>
          <p>
            InterviewRunway may improve, replace, or retire material. Any change
            that materially affects a paid entitlement will be handled under
            the terms presented at purchase, not hidden in a later update.
          </p>

          <h2>Contact and grievances</h2>
          <p>
            For support, billing questions, or complaints, write to{" "}
            <a href="mailto:support@vividlabsai.com">
              support@vividlabsai.com
            </a>
            . Our Grievance Officer is Lasya Priya, reachable at the same
            address. We acknowledge grievances within 48 hours and resolve
            them within 30 days.
          </p>

          <h2>Governing law</h2>
          <p>
            These terms are governed by the laws of India. Disputes are subject
            to the exclusive jurisdiction of the courts at the seller&apos;s
            principal place of business.
          </p>

          <h2>Changes to these terms</h2>
          <p>
            If these terms change materially, the updated version will carry a
            new effective date and paying customers will be notified by email
            or site notice before the change affects their entitlements.
          </p>

          <p>
            Please also read the <Link href="/legal/privacy">Privacy Policy</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
