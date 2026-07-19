import type { Metadata } from "next";
import Link from "next/link";
import { CtaLink, PageHero, PageShell, SectionHeading } from "@/app/components/site-chrome";
import { VAULT_MODULES } from "@/app/lib/site-data";

export const metadata: Metadata = {
  title: "Curriculum — explore the InterviewRunway system",
  description: "Explore the InterviewRunway curriculum map, roadmap structure, and review-gated pilot material records.",
  alternates: { canonical: "/curriculum" },
};

const PILOT_RECORDS = [
  {
    number: "01",
    category: "DSA / VIDEO",
    title: "Sliding Window: pattern recognition and reusable templates",
    specification: "8 min 25 sec · diagram-led explainer",
    description: "A no-face pilot lesson that moves from recognition cues to invariants, boundary choices, and a reusable solution shape.",
  },
  {
    number: "02",
    category: "DSA / HANDOUT",
    title: "Sliding Window reference sheet",
    specification: "9 pages · PDF pilot",
    description: "Recognition cues, invariants, code templates, and referenced practice problems designed to sit beside the lesson.",
  },
  {
    number: "03",
    category: "ROADMAP / ACCELERATED",
    title: "Four-week interview roadmap",
    specification: "7 pages · checklist-led PDF pilot",
    description: "A compressed sequence of learning, practice, and self-checks for an interview already on the calendar.",
  },
  {
    number: "04",
    category: "ROADMAP / STANDARD",
    title: "Twelve-week interview roadmap",
    specification: "15 pages · week-by-week PDF pilot",
    description: "A steadier progression with repetition, practice targets, and checkpoints for deciding whether another layer is useful.",
  },
  {
    number: "05",
    category: "CAREER / TEMPLATE",
    title: "US ATS resume template",
    specification: "2 pages · editable DOCX pilot",
    description: "A single-column, table-free template designed for editing rather than a locked document buyers cannot use.",
  },
] as const;

const REVIEW_GATES = [
  ["01", "Source and technical review", "Technical, company-specific, legal, financial, and remote-work claims require an attributable human review."],
  ["02", "Editorial and learning review", "The explanation must be useful in the roadmap, not merely correct in isolation or added to inflate an asset count."],
  ["03", "Final-format visual review", "The shipped video, PDF, or editable document is checked in its final form for pacing, readability, and layout."],
  ["04", "Deliberate publication", "Only records that clear every gate become learner-accessible material. Planned inventory is never presented as delivered inventory."],
] as const;

export default function CurriculumPage() {
  return (
    <PageShell mobilePurchase>
      <PageHero
        motif="instruments"
        eyebrow="CURRICULUM / PRODUCT PREVIEW"
        title={<>See the preparation system before you <em>enter it.</em></>}
        body="InterviewRunway is organised around decisions learners must make—not an inflated pile of files. Explore the curriculum families, roadmap structure, and truthful pilot records below."
      >
        <div className="curriculum-hero-signals" aria-label="Curriculum summary">
          <span><b>08</b> curriculum families</span><span><b>02</b> roadmap speeds</span><span><b>05</b> built pilot records shown</span>
        </div>
        <div className="hero-actions">
          <CtaLink href="/demo-login">Enter the sample workspace <span aria-hidden="true">↗</span></CtaLink>
          <Link className="text-link" href="/pricing">Compare access <span aria-hidden="true">→</span></Link>
        </div>
      </PageHero>

      <section className="content-section curriculum-roadmaps" aria-labelledby="roadmap-preview-title">
        <div className="container">
          <SectionHeading
            eyebrow="CHOOSE YOUR OPERATING WINDOW"
            title="The same destination. A different rate of work."
            body="Both roadmaps combine learning, deliberate practice, and review. The difference is compression—not a different promise."
            id="roadmap-preview-title"
          />
          <div className="curriculum-roadmap-grid">
            <article className="curriculum-roadmap curriculum-roadmap-fast">
              <div><span>04</span><b>WEEKS</b></div>
              <h3>Accelerated track</h3>
              <p>For a real interview already approaching and enough weekly time to sustain focused daily work.</p>
              <ol><li>High-frequency patterns first</li><li>Daily explanation and practice targets</li><li>Early pressure-test checkpoint</li><li>Final correction and consolidation</li></ol>
            </article>
            <article className="curriculum-roadmap curriculum-roadmap-standard">
              <div><span>12</span><b>WEEKS</b></div>
              <h3>Standard track</h3>
              <p>For building depth steadily while working, with more repetition and time to close each gap.</p>
              <ol><li>Pattern-by-pattern progression</li><li>Weekly retrieval and review</li><li>Company-context preparation</li><li>Optional practice checkpoints</li></ol>
            </article>
          </div>
        </div>
      </section>

      <section className="content-section curriculum-atlas-section" aria-labelledby="curriculum-atlas-title">
        <div className="container curriculum-atlas-layout">
          <div className="curriculum-atlas-intro">
            <SectionHeading
              eyebrow="THE CURRICULUM ATLAS"
              title="Eight connected working systems."
              body="Each family earns its place by helping a learner recognise a pattern, explain a decision, or make their experience legible to the market they are targeting."
              id="curriculum-atlas-title"
            />
            <Link className="text-link" href="/vault">Review the complete Foundation offer <span aria-hidden="true">→</span></Link>
          </div>
          <div className="curriculum-index-list">
            {VAULT_MODULES.map((module, index) => (
              <article className="curriculum-index-row" key={module.title}>
                <span>0{index + 1}</span>
                <div><p>{module.kicker}</p><h3>{module.title}</h3><small>{module.description}</small></div>
                <b>{module.meta}</b>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section curriculum-pilots-section" aria-labelledby="pilot-records-title">
        <div className="container">
          <SectionHeading
            eyebrow="BUILT PILOT RECORDS"
            title="Examples that exist—not a pretend catalogue."
            body="The five records below have been built as pilot outputs and are used to demonstrate the product interface. They remain review-gated sample material, not a claim that the full library is published."
            id="pilot-records-title"
          />
          <div className="curriculum-pilot-ledger">
            {PILOT_RECORDS.map((record) => (
              <article className="curriculum-pilot-record" key={record.number}>
                <span>{record.number}</span>
                <div><p>{record.category}</p><h3>{record.title}</h3><small>{record.description}</small></div>
                <div><b>{record.specification}</b><em>Sample · human review required</em></div>
              </article>
            ))}
          </div>
          <div className="curriculum-pilot-action">
            <p>The learner demo uses fictional progress and sample access states. It does not represent these pilots as purchased or publishable downloads.</p>
            <Link className="primary-cta" href="/demo-login">Explore the learner demo <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section className="content-section curriculum-quality-section" aria-labelledby="quality-gates-title">
        <div className="container curriculum-quality-layout">
          <SectionHeading
            eyebrow="PUBLICATION STANDARD"
            title="A file is not a lesson until it clears the gate."
            body="Production status, review status, and learner availability remain separate so planned content cannot quietly become a marketing claim."
            id="quality-gates-title"
          />
          <ol className="curriculum-quality-gates">
            {REVIEW_GATES.map(([number, title, body]) => <li key={number}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}
          </ol>
        </div>
      </section>

      <section className="section-pad final-cta" aria-labelledby="curriculum-cta-title">
        <div className="container final-cta-inner">
          <p className="eyebrow">EXPLORE BEFORE YOU COMMIT</p>
          <h2 id="curriculum-cta-title">See the product from both sides.</h2>
          <p>Review the commercial offer, then enter the sample learner workspace to understand what access is meant to feel like.</p>
          <div className="section-actions">
            <CtaLink href="/checkout/vault" event="foundation_checkout_started">Start Foundation — ₹799 <span aria-hidden="true">↗</span></CtaLink>
            <Link className="text-link" href="/demo-login">Open the sample workspaces <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
