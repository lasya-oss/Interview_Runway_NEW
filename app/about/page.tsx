import type { Metadata } from "next";
import Link from "next/link";
import {
  CtaLink,
  PageHero,
  PageShell,
  SectionHeading,
} from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "About the founder",
  description:
    "InterviewRunway's standard for publishing a verified founder profile, professional record, and coaching scope without unsupported claims.",
  alternates: { canonical: "/about" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "About the founder | InterviewRunway",
    description:
      "A transparent record of who is behind InterviewRunway and how founder credentials are verified before publication.",
    url: "/about",
  },
};

export default function AboutPage() {
  return (
    <PageShell>
      <PageHero
        motif="signal"
        eyebrow="ABOUT / ACCOUNTABILITY"
        title={
          <>
            Human guidance needs a <em>verifiable human.</em>
          </>
        }
        body="This page will carry the founder's real identity, photograph, professional history, and coaching scope once each item has been supplied and checked. Until then, we will not substitute a stock portrait, vague biography, or borrowed credibility."
      >
        <div className="hero-actions">
          <CtaLink href="/proof">
            Read the evidence standard <span aria-hidden="true">→</span>
          </CtaLink>
          <Link className="text-link" href="/premium">
            See the 1:1 coaching scope <span aria-hidden="true">→</span>
          </Link>
        </div>
      </PageHero>

      <section className="content-section" aria-labelledby="profile-record-title">
        <div className="container">
          <SectionHeading
            eyebrow="FOUNDER RECORD"
            title="Published when the record is complete—not before."
            body="The founder profile is intentionally held to the same standard as a learner outcome: specific, attributable, and supported by a source."
            id="profile-record-title"
          />

          <div className="content-grid content-grid-three">
            <article className="content-card glass-card">
              <p className="module-kicker">01 / IDENTITY</p>
              <h3>Name and public profile</h3>
              <p>
                The founder&apos;s full public name and a professional profile
                must be available for an independent identity check.
              </p>
              <ul>
                <li>Status: source material not supplied</li>
                <li>No anonymous founder biography</li>
              </ul>
            </article>

            <article className="content-card glass-card">
              <p className="module-kicker">02 / EXPERIENCE</p>
              <h3>Roles, companies, and dates</h3>
              <p>
                Any employment, hiring, interviewing, or coaching claim must
                be precise enough to verify and narrow enough to avoid
                overstating experience.
              </p>
              <ul>
                <li>Status: credentials not supplied</li>
                <li>Links required for material claims</li>
              </ul>
            </article>

            <article className="content-card glass-card">
              <p className="module-kicker">03 / PORTRAIT</p>
              <h3>A real, consented photograph</h3>
              <p>
                A founder photograph will appear only when the founder provides
                it and approves its use. A generated or stock stand-in would
                weaken the trust this page is meant to establish.
              </p>
              <ul>
                <li>Status: photograph not supplied</li>
                <li>Useful alt text added with the final asset</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="founder-standard-title">
        <div className="container">
          <SectionHeading
            eyebrow="THE PUBLIC STANDARD"
            title="Enough detail to make your own trust decision."
            body="Before paid founder-led coaching is presented as available, the public record should answer who is teaching, what qualifies them, and where their responsibility ends."
            id="founder-standard-title"
          />

          <div className="fit-grid">
            <article className="fit-card fit-card-positive">
              <p className="fit-label">WHAT WILL BE SHOWN</p>
              <ul>
                <li>A named founder and current professional profile</li>
                <li>Specific, source-linked roles and relevant experience</li>
                <li>A clear description of the coaching method and scope</li>
                <li>A direct route for corrections and accountability</li>
              </ul>
            </article>

            <article className="fit-card">
              <p className="fit-label">WHAT WILL NOT COUNT AS PROOF</p>
              <ul>
                <li>Unverifiable titles or unnamed company associations</li>
                <li>Generic claims of placing people at top companies</li>
                <li>A stock, generated, or unapproved founder portrait</li>
                <li>Job, compensation, visa, or placement guarantees</li>
              </ul>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section method-section" aria-labelledby="accountability-title">
        <div className="container method-layout">
          <div className="method-copy">
            <SectionHeading
              eyebrow="ACCOUNTABILITY LOOP"
              title="Verify. Define. Keep current."
              body="Trust is not a one-time biography exercise. The record should remain accurate as roles, availability, and the coaching offer change."
              id="accountability-title"
            />
          </div>

          <ol className="method-list">
            <li>
              <span>01</span>
              <div>
                <h3>Verify the source</h3>
                <p>
                  Check identity and material career claims against public or
                  privately reviewed records before they become marketing copy.
                </p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Define the engagement</h3>
                <p>
                  State what 1:1 support includes, who it is suitable for, and
                  what it cannot promise before a learner pays or books.
                </p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Correct the record</h3>
                <p>
                  Date material updates and provide a visible correction path
                  so stale credentials or offer details do not remain live.
                </p>
              </div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section-pad proof-section" aria-labelledby="profile-status-title">
        <div className="container proof-layout">
          <div>
            <p className="eyebrow">CURRENT PROFILE STATUS</p>
            <h2 id="profile-status-title">No placeholder identity disguised as proof.</h2>
          </div>
          <div className="proof-panel glass-card">
            <span className="status-pill"><i /> VERIFICATION POLICY ACTIVE</span>
            <p>
              Founder identity, credentials, and a real portrait have not been
              supplied to this build. This page remains out of search results
              until that record is complete.
            </p>
            <Link className="text-link" href="/proof">
              Review the results policy <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
