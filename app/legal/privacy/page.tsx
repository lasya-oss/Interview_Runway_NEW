import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Privacy policy — draft before launch",
  description:
    "InterviewRunway's plain-language draft privacy policy covering account, learning, payment, support, and analytics data.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <PageHero
        quiet
        eyebrow="LEGAL · LAUNCH DRAFT"
        title="Your data should have a clear job."
        body="This draft describes the data the service is expected to use. The final policy will name the enabled providers, retention periods, seller, and privacy contact before accounts or payments go live."
      />

      <section className="content-section" aria-labelledby="privacy-status-title">
        <div className="container">
          <article className="content-card glass-card">
            <p className="module-kicker">PRE-LAUNCH DISCLOSURE</p>
            <h2 id="privacy-status-title">Required details are still pending</h2>
            <p>
              The legal seller or data-controller identity, grievance and privacy
              contact, enabled service-provider list, retention schedule, and
              final refund window have not been supplied. They must be published
              before payment activation.
            </p>
          </article>
        </div>
      </section>

      <section className="content-section" aria-labelledby="privacy-title">
        <div className="container content-narrow">
          <SectionHeading
            eyebrow="PRIVACY IN PLAIN LANGUAGE"
            title="What may be collected, and why."
            id="privacy-title"
          />

          <h2>Information you provide</h2>
          <ul>
            <li>Contact and account details, such as name, email, and phone.</li>
            <li>
              Learning data, including goals, practice answers, mock-interview
              transcripts, scores, study plans, and progress.
            </li>
            <li>
              Files or text you choose to submit, such as a resume or LinkedIn
              profile draft.
            </li>
            <li>Messages sent for support, refunds, or grievance handling.</li>
          </ul>

          <h2>Information created when you use the service</h2>
          <p>
            The service may record basic device, browser, page, referral, and
            feature-usage data for security, reliability, and funnel measurement.
            Payment providers may return transaction status, amount, method type,
            and identifiers. InterviewRunway will not ask you to enter full card
            or UPI credentials into its own fields.
          </p>

          <h2>How the information may be used</h2>
          <ul>
            <li>Provide access, learning features, scores, and support.</li>
            <li>Process and reconcile payments and issue purchase records.</li>
            <li>Secure the service and investigate misuse or failures.</li>
            <li>Understand product performance and improve the experience.</li>
            <li>Meet accounting, tax, consumer, and other legal obligations.</li>
          </ul>

          <h2>Service providers</h2>
          <p>
            The live service may rely on providers for hosting, authentication,
            storage, payments, email, analytics, advertising measurement, and AI
            processing. The final policy will name the providers actually enabled
            and explain relevant data transfers before launch.
          </p>

          <h2>AI processing and sensitive material</h2>
          <p>
            Text or files used by an AI feature may be sent to the configured AI
            provider to produce that feature&apos;s result. Do not submit secrets,
            employer-confidential material, leaked interview content, government
            identifiers, financial credentials, or another person&apos;s data without
            permission.
          </p>

          <h2>Retention and deletion</h2>
          <p>
            A final retention schedule has not yet been set. The live policy will
            explain how long account, learning, payment, support, and analytics
            records are kept, along with the deletion or access request process.
          </p>

          <h2>Your choices</h2>
          <p>
            Available controls will cover account information, optional marketing,
            relevant analytics consent, and requests to access, correct, or delete
            data where applicable. The privacy and grievance contact for those
            requests is pending before launch.
          </p>

          <h2>Security</h2>
          <p>
            Reasonable safeguards will be used, but no online service can promise
            perfect security. Confirmed incidents will be handled under applicable
            notification requirements.
          </p>

          <p>
            Payment and refund handling is described in the{" "}
            <Link href="/legal/refund">Refund Policy</Link>.
          </p>
        </div>
      </section>
    </PageShell>
  );
}
