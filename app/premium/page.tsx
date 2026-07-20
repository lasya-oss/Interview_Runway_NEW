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
        motif="calibrator"
        eyebrow="1:1 COACHING · CAPACITY-CAPPED"
        title={<>One coach. One gap. <em>Full focus.</em></>}
        body="Founder-led coaching for engineers who have done the groundwork, practised repeatedly, and can point to the part of the interview loop that still is not moving."
      >
        <div className="availability-panel">
          <span className="availability-light" aria-hidden="true" />
          <div><strong>Admission follows an evidence review</strong><p>There is no public checkout. Complete Foundation and the Second Seat, then apply with the recurring gap your practice exposed.</p></div>
        </div>
        <div className="hero-actions">
          <CtaLink href="/qualify">Check if you qualify</CtaLink>
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
            eyebrow="QUALIFICATION BEFORE A QUOTE"
            title="The scope gets explicit before the calendar opens."
            body="A reviewer first confirms that Foundation and the Second Seat are complete, that the gap is supported by evidence, and that human judgment is the right intervention. The proposed scope and private quote arrive together."
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
          <p className="eyebrow">EVIDENCE BEFORE HUMAN TIME</p>
          <h2 id="premium-cta-title">Show the gap that still remains.</h2>
          <p>Connect your account, confirm the first two phases, and submit the pattern that repeated practice could not correct.</p>
          <CtaLink href="/qualify">Check if you qualify</CtaLink>
        </div>
      </section>
    </PageShell>
  );
}
