import type { Metadata } from "next";
import Link from "next/link";
import { AnalyticsView } from "@/app/components/analytics-view";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "The Second Seat — live practice after Foundation",
  description: "Live intelligence for responsive practice, several expert perspectives, guidance, included practice time, and permitted interview support.",
  alternates: { canonical: "/second-seat" },
};

const perspectives = [
  ["INTERVIEWER", "What constraint is still missing?"],
  ["SYSTEM DESIGNER", "State the trade-off before choosing the algorithm."],
  ["COMMUNICATION", "Explain why the choice fits the traffic pattern."],
] as const;

const systems = [
  ["01", "Perspective practice", "See the question from every seat that matters."],
  ["02", "Responsive mock interviews", "The next question changes because your last answer changed."],
  ["03", "Agent guidance", "Preparation and next actions stay connected through WhatsApp."],
  ["04", "Specialist training systems", "Dock DSA, system design, backend, data, and AI-adjacent practice into one flight plan."],
  ["05", "Included practice time", "See the included allowance, used time, remaining time, and operating cost before adding more."],
] as const;

const clearance = [
  "Complete the required Foundation systems",
  "Finish the baseline signal diagnostic",
  "Complete the pattern and systems checkpoints",
  "Complete the behavioural evidence checkpoint",
  "Finish the required mock demonstration",
  "Generate the initial learner signal profile",
] as const;

export default function SecondSeatPage() {
  return (
    <PageShell>
      <PageHero
        motif="turbine"
        eyebrow="THE SECOND SEAT · FOUNDATION CLEARANCE REQUIRED"
        title={<>Meet the <em>Second Seat.</em></>}
        body="Live intelligence for practice, guidance, and permitted interview support. You remain in command; the Second Seat helps you see what pressure makes easy to miss."
      >
        <AnalyticsView event="second_seat_teaser_viewed" payload={{ surface: "second_seat_page" }} />
        <div className="lock-panel">
          <span>ACCESS LOCKED · FOUNDATION CLEARANCE REQUIRED</span>
          <p>Preview the complete interaction now. Foundation learners unlock the full system only after the measurable clearance sequence is complete.</p>
        </div>
        <div className="hero-actions">
          <CtaLink href="/demo-login" event="second_seat_preview_started">Preview the Second Seat</CtaLink>
          <Link className="text-link" href="/checkout/vault" data-analytics-event="foundation_checkout_started">Start Foundation — ₹799 <span aria-hidden="true">→</span></Link>
        </div>
      </PageHero>

      <section className="content-section" aria-labelledby="second-seat-question-title">
        <div className="container">
          <SectionHeading
            eyebrow="ONE QUESTION · THREE PERSPECTIVES"
            title="One clearer response under pressure."
            body="The controlled preview shows how several expert perspectives sharpen the same answer without taking command away from you."
            id="second-seat-question-title"
          />
          <div className="content-card second-seat-page-question">
            <p className="module-kicker">SAMPLE QUESTION</p>
            <h3>How would you design a rate limiter?</h3>
            <div className="content-grid content-grid-three">
              {perspectives.map(([name, prompt], index) => (
                <article className="content-card" key={name}><p className="module-kicker">0{index + 1} · {name}</p><p>{prompt}</p></article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="content-section method-section" aria-labelledby="second-seat-systems-title">
        <div className="container">
          <SectionHeading
            eyebrow="THE SYSTEM COMES ALIVE"
            title="Five systems. One responsive cockpit."
            body="Practice dynamically, inspect the question from several expert perspectives, stay connected to guidance, and keep the operating envelope visible."
            id="second-seat-systems-title"
          />
          <div className="content-grid content-grid-three">
            {systems.map(([code, title, body]) => (
              <article className="content-card" key={code}><p className="module-kicker">{code} · LIVE SYSTEM</p><h3>{title}</h3><p>{body}</p></article>
            ))}
          </div>
          <div className="content-card second-seat-page-boundary">
            <p className="module-kicker">PERMITTED LIVE INTERVIEW SUPPORT</p>
            <p>Designed for mock interviews, preparation sessions, open-tool or explicitly permitted interview settings, approved accessibility use, and post-interview analysis. The learner remains responsible for the reasoning and response.</p>
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="second-seat-clearance-title">
        <div className="container">
          <SectionHeading
            eyebrow="FOUNDATION CLEARANCE"
            title="The flight plan powers the live system."
            body="The exact production clearance policy will be confirmed before unlocks go live. This transparent sample sequence shows how eligibility is measured—never assigned arbitrarily."
            id="second-seat-clearance-title"
          />
          <ol className="flow-loop second-seat-page-clearance">
            {clearance.map((item, index) => <li key={item}><span>0{index + 1}</span><p>{item}</p></li>)}
          </ol>
          <div className="section-actions">
            <CtaLink href="/checkout/vault" event="foundation_checkout_started">Start Foundation — ₹799 <span aria-hidden="true">↗</span></CtaLink>
            <Link className="text-link" href="/demo-login">Enter the controlled demo <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
