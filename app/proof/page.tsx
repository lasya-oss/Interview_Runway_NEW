import type { Metadata } from "next";
import Link from "next/link";
import {
  CtaLink,
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Results and testimonial policy",
  description:
    "How InterviewRunway verifies learner outcomes, records consent, links evidence, and handles testimonial removal requests.",
  alternates: { canonical: "/proof" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Results and testimonial policy | InterviewRunway",
    description:
      "No anonymous praise or composite stories—only consented learner outcomes supported by a reviewable source.",
    url: "/proof",
  },
};

export default function ProofPage() {
  return (
    <PageShell>
      <PageHero
        motif="signal"
        eyebrow="PROOF / EVIDENCE STANDARD"
        title={
          <>
            Real outcomes—or <em>no claim.</em>
          </>
        }
        body="No learner testimonials or outcomes have been supplied for verification, so none are published here. This page defines the evidence, consent, and removal standard every future result must meet."
      >
        <div className="hero-actions">
          <CtaLink href="#publication-standard">
            Review the standard <span aria-hidden="true">↓</span>
          </CtaLink>
          <Link className="text-link" href="/about">
            See the founder standard <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageHero>

      <section className="content-section" id="publication-standard" aria-labelledby="chain-title">
        <div className="container">
          <SectionHeading
            eyebrow="CHAIN OF EVIDENCE"
            title="Every result needs a person, a source, and permission."
            body="A polished quote is not proof by itself. Publication requires a record that can survive a reasonable challenge without exposing private learner information."
            id="chain-title"
          />

          <div className="content-grid content-grid-three">
            <article className="content-card glass-card">
              <p className="module-kicker">01 / PERSON</p>
              <h3>A real learner</h3>
              <p>
                Identity is confirmed before publication. Public attribution
                uses only the name, role, and company details the learner has
                explicitly approved.
              </p>
            </article>

            <article className="content-card glass-card">
              <p className="module-kicker">02 / SOURCE</p>
              <h3>A reviewable record</h3>
              <p>
                The result is tied to a dated source such as a learner&apos;s own
                post, an approved message, or another record retained for
                verification.
              </p>
            </article>

            <article className="content-card glass-card">
              <p className="module-kicker">03 / CONSENT</p>
              <h3>Permission to publish</h3>
              <p>
                Consent covers the exact quote, context, attribution, source
                link, and image—rather than a blanket approval that can be
                stretched later.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section method-section" aria-labelledby="review-process-title">
        <div className="container method-layout">
          <div className="method-copy">
            <SectionHeading
              eyebrow="PUBLICATION WORKFLOW"
              title="Check the record before shaping the story."
              body="Outcome language should reflect what happened, not imply that one product caused every part of a hiring decision."
              id="review-process-title"
            />
          </div>

          <ol className="method-list">
            <li>
              <span>01</span>
              <div>
                <h3>Collect the original</h3>
                <p>
                  Keep the dated source, product used, and learner-approved
                  context together in one review record.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Verify the wording</h3>
                <p>
                  Confirm dates, role, company, and measurable outcome. Remove
                  implications the source cannot support.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Approve the final card</h3>
                <p>
                  Show the learner the final quote, attribution, image, and
                  source link exactly as they will appear.
                </p>
              </div>
            </li>
            <li>
              <span>04</span>
              <div>
                <h3>Respect removal</h3>
                <p>
                  Remove a disputed result while it is reviewed, preserve the
                  request, and republish only with renewed approval.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="content-section" aria-labelledby="claims-title">
        <div className="container">
          <SectionHeading
            eyebrow="CLAIMS FILTER"
            title="Specific enough to audit. Modest enough to trust."
            id="claims-title"
          />

          <div className="fit-grid">
            <article className="fit-card fit-card-positive">
              <p className="fit-label">ELIGIBLE TO PUBLISH</p>
              <ul>
                <li>A named or learner-approved attribution</li>
                <li>A precise outcome with relevant date and context</li>
                <li>A source link where public sharing is approved</li>
                <li>Written consent covering the final presentation</li>
              </ul>
            </article>

            <article className="fit-card">
              <p className="fit-label">REJECTED OR HELD BACK</p>
              <ul>
                <li>Anonymous praise with no privately verified record</li>
                <li>Composite stories assembled from multiple learners</li>
                <li>Compensation or placement claims without context</li>
                <li>Screenshots published without explicit permission</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="section-pad proof-section" aria-labelledby="register-title">
        <div className="container proof-layout">
          <div>
            <p className="eyebrow">CURRENT EVIDENCE REGISTER</p>
            <h2 id="register-title">No learner claims are live yet.</h2>
          </div>
          <div className="proof-panel glass-card">
            <span className="status-pill"><i /> POLICY ACTIVE · 0 CLAIMS PUBLISHED</span>
            <p>
              This is a deliberate empty state, not a missing carousel. A
              monitored removal contact and response window will be published
              here before the first testimonial goes live.
            </p>
            <CtaLink href="/vault">
              See what the Vault includes <span aria-hidden="true">→</span>
            </CtaLink>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
