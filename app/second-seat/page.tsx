import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "The Second Seat — private practice layer for Vault owners",
  description: "Text-based mock interviews, structured feedback, and adaptive study plans for InterviewRunway Vault owners.",
  alternates: { canonical: "/second-seat" },
};

const features = [
  ["DSA mock", "Reason through a coding problem, run code against tests, and answer follow-ups instead of completing a scripted quiz."],
  ["System design mock", "Defend requirements, capacity assumptions, architecture choices, and trade-offs in a discussion-style round."],
  ["Behavioural mock", "Practise concise STAR stories and receive follow-ups when the evidence or ownership is unclear."],
  ["Structured scoring", "Receive category scores, named strengths, named weaknesses, and specific next topics—not generic praise."],
  ["Adaptive plan", "Merge your Vault roadmap, target companies, timeline, and recent scores into a plan that updates as you practise."],
  ["Progress signal", "See trend lines and get a restrained coaching prompt only after repeated low scores or a genuine plateau."],
] as const;

export default function SecondSeatPage() {
  return (
    <PageShell>
      <PageHero
        motif="turbine"
        eyebrow="THE SECOND SEAT · VAULT OWNERS ONLY"
        title={<>Mock. Score. Adjust. <em>Repeat.</em></>}
        body="A text-first interview practice loop that responds to your answers, shows the evidence behind your score, and changes what you study next."
      >
          <div className="lock-panel">
          <span>PRIVATE UPGRADE · VAULT CLEARANCE REQUIRED</span>
          <p>The Second Seat is a separate entitlement for verified Vault owners. Access is activated after the purchase is confirmed; the price is ₹2,499 and the included practice allowance is shown before any unlock.</p>
        </div>
        <div className="hero-actions">
          <CtaLink href="/vault">Start with the ₹799 Vault</CtaLink>
          <Link className="text-link" href="#loop">Preview the practice loop <span aria-hidden="true">↓</span></Link>
        </div>
      </PageHero>

      <section className="content-section" id="loop" aria-labelledby="loop-title">
        <div className="container">
          <SectionHeading
            eyebrow="THE CORE LOOP"
            title="Every session changes the next one."
            body="The product is built around improvement over time—not a novelty chatbot or a single opaque score."
            id="loop-title"
          />
          <div className="flow-loop">
            <div><span>01</span><h3>Mock</h3><p>Complete a realistic 30–45 minute text interview.</p></div>
            <div><span>02</span><h3>Score</h3><p>Receive structured, category-level feedback tied to the transcript.</p></div>
            <div><span>03</span><h3>Adjust</h3><p>Regenerate the weekly plan around the gaps that actually appeared.</p></div>
            <div><span>04</span><h3>Repeat</h3><p>Track whether problem-solving and communication are moving together.</p></div>
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="features-title">
        <div className="container">
          <SectionHeading eyebrow="WHAT IT DOES" title="Interactive where static prep stops." id="features-title" />
          <div className="content-grid content-grid-three">
            {features.map(([title, body], index) => (
              <article className="content-card" key={title}>
                <p className="module-kicker">0{index + 1} · TEXT-FIRST</p>
                <h3>{title}</h3>
                <p>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section method-section" aria-labelledby="guardrails-title">
        <div className="container method-layout">
          <SectionHeading
            eyebrow="PRODUCT GUARDRAILS"
            title="Specific feedback without pretending technology is a hiring committee."
            body="Scores are practice signals, not predictions of an offer. Text transcripts, deletion controls, and clear practice limits keep the loop useful and accountable."
            id="guardrails-title"
          />
          <article className="content-card">
            <h3>What stays protected</h3>
            <ul>
              <li>Vault ownership and the Second Seat entitlement are checked server-side</li>
              <li>Every response belongs to the signed-in learner’s private transcript</li>
              <li>Scores explain evidence and next practice; they never predict hiring</li>
              <li>Human Calibration remains separately qualified and intentionally gated</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section-pad final-cta" aria-labelledby="second-seat-preview-cta-title">
        <div className="container final-cta-inner">
          <p className="eyebrow">INSPECT THE PRACTICE PRODUCT</p>
          <h2 id="second-seat-preview-cta-title">Inspect the practice room before you decide.</h2>
          <p>Use the preview workspace to understand the round shape and evidence model. A verified Second Seat entitlement unlocks account-backed sessions, saved transcripts, structured scoring, and adaptive next actions.</p>
          <div className="section-actions">
            <CtaLink href="/demo-login">Inspect a practice preview <span aria-hidden="true">↗</span></CtaLink>
            <Link className="text-link" href="/pricing">Review Second Seat terms <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
