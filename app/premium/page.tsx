import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsView } from "@/app/components/analytics-view";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "Human Calibration — focused interview guidance",
  description: "Evidence-led, capacity-capped Human Calibration for InterviewRunway learners with one specific, persistent interview gap.",
  alternates: { canonical: "/premium" },
};

export default function PremiumPage() {
  return (
    <PageShell>
      <PageHero
        motif="calibrator"
        eyebrow="HUMAN CALIBRATION · EVIDENCE-LED"
        title={<>When the remaining gap becomes personal, <em>a person steps in.</em></>}
        body="Your practice evidence becomes a focused mentor packet, so the conversation begins with your actual gap—not a generic coaching script."
      >
        <AnalyticsView event="human_calibration_viewed" payload={{ surface: "human_calibration_page" }} />
        <div className="availability-panel">
          <span className="availability-light" aria-hidden="true" />
          <div><strong>Evidence-led · capacity capped</strong><p>Package scope, real availability, and final terms are confirmed before booking. Price: ₹9,999.</p></div>
        </div>
        <div className="hero-actions">
          <CtaLink href="#scope">Review Human Calibration</CtaLink>
          <Link className="text-link" href="/diagnostic">Check your interview signal <span aria-hidden="true">→</span></Link>
        </div>
      </PageHero>

      <section className="content-section" id="scope" aria-labelledby="scope-title">
        <div className="container">
          <SectionHeading
            eyebrow="WHO THIS IS FOR"
            title="Human judgment after evidence—not before it."
            body="Human Calibration solves a named problem. If the next step is more Foundation work or another Second Seat practice loop, that is what the system should tell you."
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
              <h3>The flight plan still needs reps</h3>
              <ul><li>You have not completed core prep</li><li>You want a placement or referral guarantee</li><li>You cannot yet name the interview stage causing trouble</li><li>You need unlimited on-demand support</li></ul>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section method-section" aria-labelledby="package-title">
        <div className="container method-layout">
          <SectionHeading
            eyebrow="FOCUSED CALIBRATION PACKAGE"
            title="The scope gets explicit before the calendar opens."
            body="₹9,999 is the package price. Session count, duration, preparation, rescheduling, payment options, and deliverables are confirmed together before a booking is accepted."
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
          <p className="eyebrow">THE FINAL APPROACH</p>
          <h2 id="premium-cta-title">Bring a person in when the evidence is ready.</h2>
          <p>Start with the signal check. Human Calibration becomes useful only when a repeated gap is specific enough to focus the engagement.</p>
          <CtaLink href="/diagnostic">Check your interview signal</CtaLink>
        </div>
      </section>
    </PageShell>
  );
}
