import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockedMemberPanel, MemberShell } from "@/app/components/member-shell";
import { canAccessMaterial, LEARNING_MATERIALS, type DemoTier } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { TWELVE_WEEK_PLAN } from "@/app/lib/roadmap-data";
import { StudyProgressButton } from "../../study-progress-button";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Material | Learner workspace",
  robots: { index: false, follow: false },
};

type MaterialDetail = {
  decision: string;
  chapters: readonly { time: string; title: string; detail: string }[];
  principle: string;
  exercise: string;
  related: string;
};

const MATERIAL_DETAILS: Record<string, MaterialDetail> = {
  "rate-limiter": {
    decision: "Choose an algorithm only after naming the abuse model, burst tolerance, and failure behaviour.",
    chapters: [
      { time: "00:00", title: "Start with the constraint", detail: "Translate a vague scale prompt into a measurable protection goal." },
      { time: "04:20", title: "Compare the mechanisms", detail: "Token bucket, fixed window, and sliding window each preserve a different product behaviour." },
      { time: "10:45", title: "Distribute the counter", detail: "Reason about key choice, clock drift, hot partitions, and degraded operation." },
      { time: "15:30", title: "Defend the trade-off", detail: "Close with monitoring, bypass policy, and the failure mode you intentionally accepted." },
    ],
    principle: "The strongest answer is not the most sophisticated limiter. It is the limiter whose failure behaviour matches the product risk.",
    exercise: "Explain why a token bucket is or is not appropriate for a public inference API with bursty enterprise traffic.",
    related: "Map cache failure modes next",
  },
  "sliding-window": {
    decision: "Recognise when a contiguous range can be updated incrementally instead of recomputed.",
    chapters: [
      { time: "00:00", title: "Read for the signal", detail: "Spot contiguous ranges, repeated recalculation, and a condition that changes at the boundary." },
      { time: "05:10", title: "Name the invariant", detail: "State what remains true before moving either pointer." },
      { time: "11:25", title: "Choose fixed or variable", detail: "Separate known-width aggregation from constraint-driven expansion and contraction." },
      { time: "17:40", title: "Explain complexity", detail: "Show why each element enters and leaves the window at most once." },
    ],
    principle: "A template is useful only after the invariant is explicit. Otherwise pointer movement becomes memorised choreography.",
    exercise: "Describe the invariant for the longest substring containing at most two distinct characters before writing code.",
    related: "Return to the DSA pattern index",
  },
  "scope-stories": {
    decision: "Make ownership legible without assuming the interviewer understands the company, title, or local context.",
    chapters: [
      { time: "00:00", title: "Remove company dependence", detail: "Describe the product, users, and operating constraint in one sentence." },
      { time: "04:50", title: "Separate team work from your work", detail: "Name the decision you owned and the input you influenced." },
      { time: "09:30", title: "Quantify the consequence", detail: "Use operational or customer evidence rather than prestige language." },
      { time: "13:20", title: "Prepare the follow-up", detail: "Anticipate challenge, conflict, alternatives, and what you would change." },
    ],
    principle: "The interviewer should understand the size of your decision even if they have never heard of your employer.",
    exercise: "Rewrite one project opening in 75 words: product context, constraint, your decision, and measurable consequence.",
    related: "Draft the six-story evidence bank",
  },
  "remote-compensation": {
    decision: "Compare total risk and value across employment and contracting instead of converting one USD number to INR.",
    chapters: [
      { time: "00:00", title: "Identify the engagement", detail: "Separate employee-of-record, direct employment, and independent contracting." },
      { time: "03:40", title: "Normalise the package", detail: "Account for paid leave, insurance, notice, equipment, and currency exposure." },
      { time: "08:15", title: "Inspect the contract", detail: "Flag payment timing, intellectual property, termination, and jurisdiction for qualified review." },
      { time: "12:10", title: "Build the negotiation frame", detail: "Anchor on role scope and total package, not geography alone." },
    ],
    principle: "This sample is educational, not tax or legal advice. Current terms require qualified India-specific review before launch.",
    exercise: "Compare two fictional offers after normalising leave, insurance, payment risk, and termination terms.",
    related: "Open the remote contract checklist",
  },
  "notification-mock": {
    decision: "Commit to delivery semantics, retry bounds, and user preference handling before optimising throughput.",
    chapters: [
      { time: "00:00", title: "Clarify the product", detail: "Identify channels, priority classes, latency targets, and compliance needs." },
      { time: "06:30", title: "Define the event contract", detail: "Separate domain events from provider-specific delivery work." },
      { time: "14:20", title: "Control retries", detail: "Bound exponential backoff, idempotency, dead letters, and replay." },
      { time: "25:40", title: "Handle preference and failure", detail: "Resolve quiet hours, unsubscribes, provider outages, and observability." },
    ],
    principle: "At-least-once delivery is only a useful statement when the duplicate and failure experience is also defined.",
    exercise: "Run the scripted notification-service mock and defend what happens during a 20× queue spike.",
    related: "Start the deterministic mock preview",
  },
  "staff-scope-calibration": {
    decision: "Lead with the decisions whose cost, reversibility, and organisational reach demonstrate the target level.",
    chapters: [
      { time: "01", title: "Diagnostic evidence", detail: "Review the repeated moments where strong technical depth still sounded team-local." },
      { time: "02", title: "Narrative spine", detail: "Choose one constraint, one irreversible decision, and one cross-team consequence." },
      { time: "03", title: "Influence map", detail: "Distinguish authority, alignment, escalation, and durable mechanisms." },
      { time: "04", title: "Live calibration", detail: "Use the private session to compress the story without losing evidence." },
    ],
    principle: "Human Calibration should correct a named, repeated gap—not add more generic preparation.",
    exercise: "Bring two examples showing how your decision changed another team’s plan, risk, or operating model.",
    related: "Open the private coaching room",
  },
};

function tierLabel(tier: DemoTier) {
  if (tier === "practice") return "The Second Seat";
  if (tier === "premium") return "Human Calibration";
  return "The Vault";
}

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const material = LEARNING_MATERIALS.find((entry) => entry.slug === slug);
  if (!material) notFound();

  const profile = await requireDemoProfile(`/learn/material/${slug}`);
  const unlocked = canAccessMaterial(profile, material);

  if (!unlocked) {
    return (
      <MemberShell profile={profile} active="library">
        <div className="member-page">
          <LockedMemberPanel
            tier={tierLabel(material.tier)}
            title={`${material.title} belongs to the next layer.`}
            body={`This representative ${material.format.toLowerCase()} is visible in the demo catalogue so you can understand the product progression, but it is not included with ${profile.planShort}.`}
          />
        </div>
      </MemberShell>
    );
  }

  const detail: MaterialDetail = MATERIAL_DETAILS[slug] ?? {
    decision: material.description,
    chapters: [
      { time: "00:00", title: "Recognise the signal", detail: `Locate the interview cue that makes ${material.tags[0] ?? "this pattern"} relevant.` },
      { time: "05:00", title: "Name the decision", detail: "Separate the constraint, choice, and consequence before reaching for a memorised answer." },
      { time: "10:00", title: "Test the failure case", detail: "Explain what changes when scale, ambiguity, or an operational failure enters the prompt." },
      { time: "15:00", title: "Rehearse the explanation", detail: "Close with one explicit trade-off and the signal you would monitor next." },
    ],
    principle: `The sample workbench is organised around ${material.tags.join(", ").toLowerCase()} so the material remains connected to an interview decision, not an isolated file.`,
    exercise: `Explain the central decision in “${material.title}” in under two minutes, then name the assumption most likely to change your answer.`,
    related: material.tier === "premium" ? "Return to the private coach room" : material.tier === "practice" ? "Apply it in the practice loop" : "Place it in this week’s roadmap",
  };

  const destination = material.tier === "premium" ? "/learn/coaching" : material.tier === "practice" ? "/learn/practice" : "/learn/roadmap";
  const linkedTask = TWELVE_WEEK_PLAN
    .flatMap((week) => week.tasks)
    .find((task) => task.learning.kind === "material" && task.learning.slug === material.slug);

  return (
    <MemberShell profile={profile} active="library">
      <article className="member-page material-workspace">
        <nav className="material-breadcrumb" aria-label="Breadcrumb">
          <Link href="/learn/library">Library</Link><span>/</span><span>{material.category}</span><span>/</span><strong>{material.number}</strong>
        </nav>

        <header className="material-header">
          <div>
            <p className="member-kicker">{profile.isLive ? `Foundation lesson · ${material.format}` : `Representative ${material.format} · sample progress`}</p>
            <h1>{material.title}</h1>
            <p>{material.description}</p>
          </div>
          <dl>
            <div><dt>Access</dt><dd>{tierLabel(material.tier)}</dd></div>
            <div><dt>Working time</dt><dd>{material.duration}</dd></div>
            <div><dt>State</dt><dd>{profile.isLive ? "Included" : "Demo preview"}</dd></div>
          </dl>
        </header>

        <div className="material-layout">
          <section className="material-stage" aria-labelledby="material-stage-title">
            <div className="material-stage-top"><span>Decision lab / {material.number}</span><b>{profile.isLive ? "Included with paid Foundation" : "Sample, not a published lesson"}</b></div>
            <div className="material-stage-visual" aria-hidden="true"><i /><i /><i /><span /></div>
            <p>Decision to make</p>
            <h2 id="material-stage-title">{detail.decision}</h2>
            <div className="material-stage-controls"><span>00:00</span><i><b /></i><span>{material.duration}</span></div>
            {profile.isLive && linkedTask ? <StudyProgressButton taskId={linkedTask.id} initiallyCompleted={profile.completedTaskIds?.includes(linkedTask.id) === true} /> : null}
          </section>

          <aside className="material-notes">
            <p className="member-kicker">Working principle</p>
            <blockquote>{detail.principle}</blockquote>
            <div>
              <span>Practice prompt</span>
              <p>{detail.exercise}</p>
            </div>
            {material.demoAsset ? (
              <a className="material-review-link" href={material.demoAsset.href} target="_blank" rel="noreferrer">
                <span>Built sample material</span>
                <strong>{material.demoAsset.label}</strong>
                <small>Human editorial review pending ↗</small>
              </a>
            ) : null}
          </aside>
        </div>

        <section className="material-chapters" aria-labelledby="material-chapters-title">
          <div className="member-section-heading">
            <div><p className="member-kicker">Lesson structure</p><h2 id="material-chapters-title">Move through the decision.</h2></div>
            <span>{detail.chapters.length} sample segments</span>
          </div>
          <div>
            {detail.chapters.map((chapter, index) => (
              <article key={chapter.title}>
                <span>{chapter.time}</span>
                <b>{String(index + 1).padStart(2, "0")}</b>
                <div><h3>{chapter.title}</h3><p>{chapter.detail}</p></div>
              </article>
            ))}
          </div>
        </section>

        <footer className="material-next-step">
          <div><p className="member-kicker">Continue the loop</p><h2>{detail.related}</h2><p>{profile.isLive ? "Use the button above to record this study step, then continue through the roadmap." : "This action opens another representative demo surface; it does not record completion or invoke an AI service."}</p></div>
          <Link className="member-primary-button" href={destination}>Continue <span aria-hidden="true">↗</span></Link>
        </footer>
      </article>
    </MemberShell>
  );
}
