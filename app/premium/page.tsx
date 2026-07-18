import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "1:1 interview coaching",
  description: "Capacity-capped 1:1 interview coaching for InterviewRunway learners with specific, persistent interview gaps.",
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return (
    <PageShell>
      <PageHero
        eyebrow="1:1 COACHING · CAPACITY-CAPPED"
        title={<>One coach. One gap. <em>Full focus.</em></>}
        body="Founder-led coaching for engineers who have done the groundwork, practised repeatedly, and can point to the part of the interview loop that still is not moving."
      >
        <div className="availability-panel">
          <span className="availability-light" aria-hidden="true" />
          <div><strong>Live availability is not connected yet</strong><p>No slot count will be shown until it comes from the real calendar. Working package price: ₹9,999.</p></div>
        </div>
        <div className="hero-actions">
          <CtaLink href="#scope">Review the coaching scope</CtaLink>
          <Link className="text-link" href="/about">Verify the founder standard <span aria-hidden="true">→</span></Link>
        </div>
      </PageHero>

      <section className="content-section" id="scope" aria-labelledby="scope-title">
        <div className="container">
          <SectionHeading
            eyebrow="WHO THIS IS FOR"
            title="Coaching after diagnosis—not before it."
            body="The premium tier should solve a named problem. If the best next step is more fundamentals or another AI mock, that is what the product should tell you."
            id="scope-title"
          />
          <div className="content-grid">
            <article className="content-card">
              <p className="module-kicker">GOOD FIT</p>
              <h3>You can show the sticking point</h3>
              <ul><li>Repeated mock scores expose the same weakness</li><li>A real interview is approaching</li><li>You need calibration on level, communication, or trade-offs</li><li>You are ready to act on direct feedback</li></ul>
            </article>
            <article className="content-card">
              <p className="module-kicker">NOT YET</p>
              <h3>The foundation still needs reps</h3>
              <ul><li>You have not completed core prep</li><li>You want a placement or referral guarantee</li><li>You cannot yet name the interview stage causing trouble</li><li>You need unlimited on-demand support</li></ul>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section method-section" aria-labelledby="package-title">
        <div className="container method-layout">
          <SectionHeading
            eyebrow="WORKING LAUNCH PACKAGE"
            title="The scope gets explicit before the calendar opens."
            body="₹9,999 is the current working price. Final session count, duration, preparation, rescheduling, EMI eligibility, and deliverables must be published together before bookings are accepted."
            id="package-title"
          />
          <article className="content-card">
            <h3>Required package details</h3>
            <ul>
              <li>Pre-session diagnostic and target outcome</li>
              <li>Exact live-session count and duration</li>
              <li>Written action plan or feedback deliverable</li>
              <li>Calendar-backed availability timestamp</li>
              <li>EMI, rescheduling, cancellation, and refund terms</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section-pad final-cta" aria-labelledby="premium-cta-title">
        <div className="container final-cta-inner">
          <p className="eyebrow">TRUST BEFORE SCARCITY</p>
          <h2 id="premium-cta-title">No fake slot counter.</h2>
          <p>The booking path will open only after the founder profile, package scope, and live calendar are connected and verified.</p>
          <CtaLink href="/checkout/premium">Preview the ₹9,999 order summary</CtaLink>
        </div>
      </section>
    </PageShell>
  );
}
