import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";

export const metadata: Metadata = {
  title: "AI Prep — private practice layer for Vault owners",
  description: "Text-based AI mock interviews, structured feedback, and adaptive study plans for InterviewRunway Vault owners.",
  robots: { index: false, follow: false },
};

const features = [
  ["DSA mock", "Reason through a coding problem, run code against tests, and answer follow-ups instead of completing a scripted quiz."],
  ["System design mock", "Defend requirements, capacity assumptions, architecture choices, and trade-offs in a discussion-style round."],
  ["Behavioural mock", "Practise concise STAR stories and receive follow-ups when the evidence or ownership is unclear."],
  ["Structured scoring", "Receive category scores, named strengths, named weaknesses, and specific next topics—not generic praise."],
  ["Adaptive plan", "Merge your Vault roadmap, target companies, timeline, and recent scores into a plan that updates as you practise."],
  ["Progress signal", "See trend lines and get a restrained coaching prompt only after repeated low scores or a genuine plateau."],
] as const;

export default function AiPrepPage() {
  return (
    <PageShell>
      <PageHero
        motif="turbine"
        eyebrow="AI PREP · VAULT OWNERS ONLY"
        title={<>Mock. Score. Adjust. <em>Repeat.</em></>}
        body="A text-first interview practice loop that responds to your answers, shows the evidence behind your score, and changes what you study next."
      >
        <div className="lock-panel">
          <span>PRIVATE UPGRADE · NOINDEX</span>
          <p>AI Prep is offered only after a verified Vault purchase. The working launch price is ₹2,499; usage limits and access duration must be final before checkout is enabled.</p>
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
            title="Specific feedback without pretending AI is a hiring committee."
            body="Scores are practice signals, not predictions of an offer. Voice mode stays out of launch so text quality, latency, and costs can be validated first."
            id="guardrails-title"
          />
          <article className="content-card">
            <h3>Before this goes live</h3>
            <ul>
              <li>Vault ownership and authentication must be connected</li>
              <li>Transcripts, uploads, retention, and deletion need clear controls</li>
              <li>LLM and code-sandbox credentials require server-side storage</li>
              <li>Session limits and the final ₹ price must appear before payment</li>
            </ul>
          </article>
        </div>
      </section>

      <section className="section-pad final-cta" aria-labelledby="ai-preview-cta-title">
        <div className="container final-cta-inner">
          <p className="eyebrow">INSPECT THE PRACTICE PRODUCT</p>
          <h2 id="ai-preview-cta-title">Enter the loop before it asks for money.</h2>
          <p>Use the AI Prep sample learner to run the fixed mock interaction and inspect evidence-backed feedback. The checkout route is a ₹0 simulation until access duration, usage limits, and merchant details are final.</p>
          <div className="section-actions">
            <CtaLink href="/demo-login">Enter the AI Prep demo <span aria-hidden="true">↗</span></CtaLink>
            <Link className="text-link" href="/checkout/ai-prep">Preview the ₹2,499 checkout <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
