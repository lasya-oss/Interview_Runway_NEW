import type { Metadata } from "next";
import Link from "next/link";
import {
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Privacy policy | InterviewRunway",
  description:
    "How InterviewRunway collects, uses, and protects your data, in plain language. Data controller: VividLabs AI, support@vividlabsai.com. Effective 17 September 2026.",
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <PageShell>
      <PageHero
        quiet
        eyebrow="LEGAL"
        title="Your data should have a clear job."
        body="What we collect, why, who processes it, and your rights. Data controller: VividLabs AI — support@vividlabsai.com. Effective 17 September 2026."
      />

      <section className="content-section" aria-labelledby="privacy-title">
        <div className="container content-narrow">
          <SectionHeading
            eyebrow="PRIVACY IN PLAIN LANGUAGE"
            title="What is collected, and why."
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
            Essential server logs may record connection, device, and browser
            details for security and reliability. Optional page, referral, and
            feature-usage analytics are disabled until you choose to allow
            analytics. Your choice is stored in your browser and can be changed
            at any time using the Analytics choices link in the footer.
          </p>
          <p>
            Paddle returns transaction status, amount, method type, and
            identifiers for payments. InterviewRunway never asks you to enter
            card or UPI credentials into its own fields — payment details go
            directly to Paddle.
          </p>

          <h2>How the information is used</h2>
          <ul>
            <li>Provide access, learning features, scores, and support.</li>
            <li>Process and reconcile payments and issue purchase records.</li>
            <li>Secure the service and investigate misuse or failures.</li>
            <li>Understand product performance and improve the experience.</li>
            <li>Meet accounting, tax, consumer, and other legal obligations.</li>
          </ul>

          <h2>Service providers</h2>
          <p>
            Your data is processed by the providers that run the service, each
            for its own job:
          </p>
          <ul>
            <li>
              <strong>Cloudflare</strong> — hosting, edge delivery, and the D1
              database that stores accounts, progress, and sessions.
            </li>
            <li>
              <strong>Google</strong> — sign-in (Google OAuth) and report
              delivery (Gmail).
            </li>
            <li>
              <strong>Paddle</strong> — payment processing as merchant of
              record. Card and bank details go to Paddle, never to us.
            </li>
            <li>
              <strong>Groq and Cerebras</strong> — AI processing for practice,
              evaluation, and feedback features.
            </li>
          </ul>

          <h2>AI processing and sensitive material</h2>
          <p>
            Text or files used by an AI feature are sent to the configured AI
            provider to produce that feature&apos;s result. Do not submit secrets,
            employer-confidential material, leaked interview content, government
            identifiers, financial credentials, or another person&apos;s data
            without permission.
          </p>

          <h2>Retention and deletion</h2>
          <p>
            Account and learning data are kept while your account is active and
            deleted on request. Support messages are kept for 24 months.
            Payment and transaction records are kept as long as tax and
            accounting law requires (up to 7 years). Anonymized analytics may
            be kept longer. To request access, correction, or deletion of your
            data, write to{" "}
            <a href="mailto:support@vividlabsai.com">
              support@vividlabsai.com
            </a>
            .
          </p>

          <h2>Your choices</h2>
          <p>
            You can reject optional analytics without losing access to the site,
            change that choice later, update account information in the product,
            opt out of marketing email at any time, and request access,
            correction, or deletion of your personal data at the address above.
          </p>

          <h2>Grievances</h2>
          <p>
            For privacy complaints or grievance redressal, contact our
            Grievance Officer, Lasya Priya, at{" "}
            <a href="mailto:support@vividlabsai.com">
              support@vividlabsai.com
            </a>
            . We acknowledge grievances within 48 hours and resolve them within
            30 days.
          </p>

          <h2>Security</h2>
          <p>
            Reasonable safeguards are used, but no online service can promise
            perfect security. Confirmed incidents are handled under applicable
            notification requirements.
          </p>

          <h2>Children</h2>
          <p>
            InterviewRunway is for job seekers aged 18 and above and is not
            directed at children.
          </p>

          <h2>Changes to this policy</h2>
          <p>
            Material changes will be announced by email or site notice with a
            new effective date before they take effect.
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
