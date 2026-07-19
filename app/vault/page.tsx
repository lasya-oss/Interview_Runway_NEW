import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";
import { VAULT_MODULES } from "@/app/lib/site-data";

export const metadata: Metadata = {
  title: "Foundation — structured interview prep for ₹799",
  description: "A one-time ₹799 interview-prep foundation for engineers in India targeting remote and AI-adjacent tech roles.",
  alternates: { canonical: "/vault" },
};

const inventory = [
  ["01", "DSA pattern explainers", "Pattern-recognition guides spanning two pointers, windows, trees, graphs, heaps, intervals, dynamic programming, greedy methods, and more."],
  ["02", "System design fundamentals", "Core trade-offs plus guided walkthroughs for rate limiting, chat, feeds, file storage, notifications, autocomplete, and other common systems."],
  ["03", "Behavioural interview kit", "STAR structure, a broad question bank, and guidance for making India-based roles and scope easy for a US interviewer to understand."],
  ["04", "Company prep banks", "Original, paraphrased patterns compiled only for companies with enough credible public information. No leaked or copied question sets."],
  ["05", "Resume and outreach templates", "Editable ATS-safe resume, LinkedIn, cover-letter, negotiation, and recruiter-outreach templates—never locked documents."],
  ["06", "Remote-career field guides", "Practical primers on USD payments, India tax basics, contract red flags, compensation, and visa misconceptions, reviewed before publication."],
  ["07", "Rapid-review handouts", "Concise references for technical patterns, design trade-offs, behavioural prompts, and remote-career decisions."],
  ["08", "4-week and 12-week roadmaps", "Two complete sequences that connect learning, practice targets, self-checks, responsive mock checkpoints, and optional Human Calibration at sensible moments."],
] as const;

export default function VaultPage() {
  return (
    <PageShell mobilePurchase>
      <PageHero
        motif="instruments"
        eyebrow="FOUNDATION / FLIGHT PLAN · START HERE"
        title={<>Build the flight plan for <em>₹799 once.</em></>}
        body="Create the baseline the Second Seat needs to test under pressure: DSA, system design, behavioural evidence, role context, mock demonstrations, and the reality of working remotely from India."
      >
        <div className="offer-summary">
          <div><strong>₹799</strong><p>One payment · INR pricing · no subscription</p></div>
          <CtaLink href="/checkout/vault" event="foundation_checkout_started">Start Foundation <span aria-hidden="true">↗</span></CtaLink>
        </div>
      </PageHero>

      <section className="content-section" aria-labelledby="outcome-title">
        <div className="container">
          <SectionHeading
            eyebrow="FOUNDATION SYSTEMS"
            title="Every system earns its place in the flight plan."
            body="Patterns, systems, behavioural evidence, role context, and mock demonstrations establish a usable baseline before responsive practice begins."
            id="outcome-title"
          />
          <div className="module-grid">
            {VAULT_MODULES.slice(0, 6).map((module, index) => (
              <article className="glass-card module-card" key={module.title}>
                <div className="module-index">0{index + 1}</div>
                <p className="module-kicker">{module.kicker}</p>
                <h3>{module.title}</h3>
                <p>{module.description}</p>
                <span className="module-meta">{module.meta}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" aria-labelledby="inventory-title">
        <div className="container">
          <SectionHeading
            eyebrow="LAUNCH INVENTORY"
            title="See what ₹799 unlocks now—and what it prepares next."
            body="This is the approved product scope. Exact asset counts and samples will be published only as reviewed files are ready—not projected as if they already exist."
            id="inventory-title"
          />
          <div className="inventory-list">
            {inventory.map(([number, title, body]) => (
              <details key={number}>
                <summary><span>{number}</span><strong>{title}</strong><span aria-hidden="true">+</span></summary>
                <p>{body}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" id="roadmaps" aria-labelledby="roadmap-title">
        <div className="container">
          <SectionHeading
            eyebrow="CHOOSE YOUR PACE"
            title="One goal. Two study plans."
            body="Every week has a learning target, a practice target, and a checkpoint—so preparation becomes a schedule rather than a permanent background task."
            id="roadmap-title"
          />
          <div className="content-grid">
            <article className="content-card">
              <p className="module-kicker">04 WEEKS · ACCELERATED</p>
              <h3>Interview already on the calendar</h3>
              <p>A compressed track for focused daily work across core patterns, design fundamentals, behavioural stories, and timed practice.</p>
              <ul><li>High-frequency topics first</li><li>Daily practice targets</li><li>Early mock-interview checkpoint</li></ul>
            </article>
            <article className="content-card">
              <p className="module-kicker">12 WEEKS · STANDARD</p>
              <h3>Build depth without burning out</h3>
              <p>A steadier progression with more repetition, company-context work, and time to close gaps between mock sessions.</p>
              <ul><li>Pattern-by-pattern progression</li><li>Weekly review and self-assessment</li><li>Second Seat and Human Calibration checkpoints</li></ul>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section method-section" aria-labelledby="quality-title">
        <div className="container method-layout">
          <SectionHeading
            eyebrow="QUALITY GATE"
            title="Founder-designed. Human-reviewed. Clearly sourced."
            body="Production tools may accelerate drafting, but anything technical, legal, financial, or company-specific must be reviewed before a learner sees it."
            id="quality-title"
          />
          <div className="content-card">
            <h3>What will not be generated</h3>
            <ul>
              <li>Fake mock-interview recordings</li>
              <li>Invented student debriefs or outcomes</li>
              <li>Copied proprietary question banks</li>
              <li>Tax, legal, or contract guidance shipped without review</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-pad final-cta" aria-labelledby="vault-cta-title">
        <div className="container final-cta-inner">
          <p className="eyebrow">ONE PAYMENT · NO UPSELL PRESELECTED</p>
          <h2 id="vault-cta-title">Build the flight plan before the cockpit comes alive.</h2>
          <p>Pay ₹799 once. Complete the measurable checkpoints, then unlock the Second Seat when the baseline is ready for pressure.</p>
          <CtaLink href="/checkout/vault" event="foundation_checkout_started">Start Foundation — ₹799 <span aria-hidden="true">↗</span></CtaLink>
          <Link className="text-link" href="/legal/refund">Read the refund terms</Link>
        </div>
      </section>
    </PageShell>
  );
}
