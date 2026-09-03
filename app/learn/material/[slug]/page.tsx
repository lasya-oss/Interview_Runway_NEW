import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { canAccessMaterial, LEARNING_MATERIALS, type DemoTier, type LearningMaterial } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { roadmapPlanForWeeks } from "@/app/lib/learner-progress";
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
      { time: "00:00", title: "Read for the key idea", detail: "Spot contiguous ranges, repeated recalculation, and a condition that changes at the boundary." },
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
  "remote-offer-matrix": {
    decision: "Compare a remote offer by total package, operating risk, and career value before negotiating the headline number.",
    chapters: [
      { time: "00:00", title: "Separate the package", detail: "Record cash, equity, leave, insurance, equipment, notice, and payment timing as separate variables." },
      { time: "04:00", title: "Expose uncertainty", detail: "Mark tax, currency, jurisdiction, employment classification, and termination assumptions that need qualified confirmation." },
      { time: "09:00", title: "Compare the trade-offs", detail: "Use the same fictional inputs for each offer so the decision reflects total risk and value rather than a single salary figure." },
      { time: "14:00", title: "Prepare the question set", detail: "Turn every unresolved term into a specific employer or qualified-adviser question before treating the offer as comparable." },
    ],
    principle: "This preview is educational and not an approved tax, legal, or contract decision tool; current India-specific terms require qualified review before publication.",
    exercise: "Complete the matrix for two fictional offers, highlight every unresolved India-specific term, and write the questions needed before negotiation.",
    related: "Return to the Foundation roadmap",
  },
  "cache-consistency": {
    decision: "Choose cache freshness and invalidation from the product promise, then make stale reads and recovery explicit.",
    chapters: [
      { time: "00:00", title: "Name the freshness contract", detail: "Decide what may be stale, for how long, and which user action requires a fresh read." },
      { time: "03:00", title: "Compare write paths", detail: "Contrast cache-aside, write-through, and event-driven invalidation against the read and failure pattern." },
      { time: "06:10", title: "Handle failure", detail: "Explain stampedes, hot keys, stale-if-error behaviour, and what happens when the cache or invalidation stream is unavailable." },
      { time: "08:00", title: "Close with evidence", detail: "Choose hit rate, freshness age, invalidation lag, and origin pressure as metrics for the design." },
    ],
    principle: "A cache is correct when its freshness behaviour matches the product promise, not when its hit rate is high.",
    exercise: "Choose a cache strategy for a user-profile read path and explain the stale-read, invalidation, and origin-failure behaviour.",
    related: "Complete the rate-limit decision lab",
  },
  "graph-traversal": {
    decision: "Choose BFS or DFS from the question the graph asks, then keep traversal state separate from the answer being built.",
    chapters: [
      { time: "00:00", title: "Read the graph cue", detail: "Separate layers and shortest unweighted distance from reachability, components, dependencies, and path exploration." },
      { time: "06:00", title: "State the invariant", detail: "Say what visited, parent, distance, or indegree means after each node is processed." },
      { time: "13:30", title: "Trace the boundary", detail: "Dry-run an isolated node, a cycle, a duplicate edge, and a target found at the first or last layer." },
      { time: "20:00", title: "Explain the bound", detail: "Account for each vertex and edge once, then identify the memory needed for the frontier and saved state." },
    ],
    principle: "The traversal is only half the solution; the state you carry determines whether the result answers the prompt.",
    exercise: "Classify four graph prompts as BFS or DFS and write the invariant for one prompt before describing its implementation.",
    related: "Explain hash-map invariants aloud",
  },
  "binary-search-boundaries": {
    decision: "Use binary search only when a monotonic predicate lets each comparison permanently discard one side of the search space.",
    chapters: [
      { time: "00:00", title: "Find the predicate", detail: "Rewrite the prompt as a yes/no question whose answer changes at one boundary." },
      { time: "03:00", title: "Choose the interval", detail: "Declare inclusive or exclusive ends and what left, right, and mid each represent." },
      { time: "07:00", title: "Preserve the invariant", detail: "After every move, keep the desired boundary inside the remaining interval and avoid overflow in midpoint calculation." },
      { time: "10:00", title: "Verify the answer", detail: "Check the returned boundary against its neighbour and handle empty, one-item, and all-false inputs explicitly." },
    ],
    principle: "Binary search is a proof about a monotonic boundary; the loop is merely the shortest way to find it.",
    exercise: "State the predicate and interval invariant for the first index whose value is at least a target, including empty and missing-target cases.",
    related: "Compare BFS and DFS decision cues",
  },
  "outage-story": {
    decision: "Turn an outage into evidence of ownership by connecting the trigger, your decision, communication, prevention, and measured change.",
    chapters: [
      { time: "00:00", title: "Set the operating context", detail: "Describe the users, service, and impact without inflating the incident or hiding the constraint." },
      { time: "05:00", title: "Own the decision", detail: "Separate what you observed, what you chose, what alternatives you rejected, and who needed alignment." },
      { time: "11:00", title: "Show the recovery", detail: "Explain mitigation, communication cadence, rollback or repair, and the metric used to declare recovery." },
      { time: "16:00", title: "Prove the learning", detail: "Close with a durable change and the metric, behaviour, or follow-up that shows the system improved." },
    ],
    principle: "A strong incident story is not a hero narrative; it is a clear explanation of decisions, trade-offs, and changed operating behaviour.",
    exercise: "Draft a 90-second outage story with context, your decision, communication, recovery, and one measurable prevention outcome.",
    related: "Apply the ATS resume pass",
  },
  "us-ats-resume": {
    decision: "Make the resume legible to a US recruiter by pairing technical context with a specific action, scope, and measurable consequence.",
    chapters: [
      { time: "00:00", title: "Lead with the target", detail: "Choose a role-aligned summary and put the strongest relevant technical surface where it can be assessed quickly." },
      { time: "04:00", title: "Rewrite the bullet", detail: "Use action, system or product context, scale or constraint, decision, and result; remove responsibility-only phrasing." },
      { time: "10:00", title: "Translate the scope", detail: "Replace local title shorthand with plain language while preserving team size, ownership boundary, and technical depth." },
      { time: "14:00", title: "Run the evidence check", detail: "Verify that every quantified claim, tool, and leadership statement can survive an interviewer follow-up." },
    ],
    principle: "An ATS-friendly resume is not keyword stuffing; it is a compact evidence index for the conversation that follows.",
    exercise: "Rewrite one bullet in the template and annotate the action, constraint, scope, decision, result, and evidence source.",
    related: "Rewrite headline and About section",
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

function materialState(
  profileIsLive: boolean,
  material: LearningMaterial,
) {
  if (!profileIsLive) return "Demo preview";
  if (material.tier === "foundation") {
    return material.availability === "included"
      ? "Included in Vault QA"
      : "Preview · review pending";
  }
  return `${tierLabel(material.tier)} sample`;
}

export default async function MaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const material = LEARNING_MATERIALS.find((entry) => entry.slug === slug);
  if (!material) notFound();

  const profile = await requireDemoProfile(`/learn/material/${slug}`);
  const unlocked = canAccessMaterial(profile, material);

  if (!unlocked) {
    return (
      <div className="member-page">
        <LockedMemberPanel
          tier={tierLabel(material.tier)}
          title={`${material.title} belongs to the next layer.`}
          body={`This representative ${material.format.toLowerCase()} is visible in the demo catalogue so you can understand the product progression, but it is not included with ${profile.planShort}.`}
        />
      </div>
    );
  }

  const detail: MaterialDetail = MATERIAL_DETAILS[slug] ?? {
    decision: material.description,
    chapters: [
      { time: "00:00", title: "Recognise the key idea", detail: `Locate the interview cue that makes ${material.tags[0] ?? "this pattern"} relevant.` },
      { time: "05:00", title: "Name the decision", detail: "Separate the constraint, choice, and consequence before reaching for a memorised answer." },
      { time: "10:00", title: "Test the failure case", detail: "Explain what changes when scale, ambiguity, or an operational failure enters the prompt." },
      { time: "15:00", title: "Rehearse the explanation", detail: "Close with one explicit trade-off and the metric you would monitor next." },
    ],
    principle: `The sample workbench is organised around ${material.tags.join(", ").toLowerCase()} so the material remains connected to an interview decision, not an isolated file.`,
    exercise: `Explain the central decision in “${material.title}” in under two minutes, then name the assumption most likely to change your answer.`,
    related: material.tier === "premium" ? "Return to the private coach room" : material.tier === "practice" ? "Apply it in the practice loop" : "Place it in this week’s roadmap",
  };

  const destination = material.tier === "premium" ? "/learn/coaching" : material.tier === "practice" ? "/learn/practice" : "/learn/roadmap";
  const linkedTask = roadmapPlanForWeeks(profile.roadmapWeeks)
    .flatMap((week) => week.tasks)
    .find((task) => task.learning.kind === "material" && task.learning.slug === material.slug);
  const hasCompletionAction = profile.isLive === true && material.availability === "included" && linkedTask;

  const liveMaterialKicker = material.tier === "foundation"
    ? material.availability === "included"
      ? "Foundation lesson"
      : "Foundation preview"
    : `${tierLabel(material.tier)} sample`;
  const liveMaterialState = material.tier === "foundation"
    ? material.availability === "included"
      ? "Included with paid Foundation"
      : "Vault preview · review pending"
    : `Sample in ${tierLabel(material.tier)}`;
  const contentUnavailable = profile.isLive === true && material.availability === "preview" && !material.demoAsset;

  return (
      <article className="member-page material-workspace">
        <nav className="material-breadcrumb" aria-label="Breadcrumb">
          <Link className="material-breadcrumb__link" href="/learn/library">Library</Link><span>/</span><span>{material.category}</span><span>/</span><strong>{material.number}</strong>
        </nav>

        <header className="material-header">
          <div>
            <p className="member-kicker">{profile.isLive ? `${liveMaterialKicker} · ${material.format}` : `Representative ${material.format} · sample progress`}</p>
            <h1>{material.title}</h1>
            <p>{material.description}</p>
          </div>
          <dl>
            <div><dt>Access</dt><dd>{tierLabel(material.tier)}</dd></div>
            <div><dt>Working time</dt><dd>{material.duration}</dd></div>
            <div><dt>State</dt><dd>{materialState(profile.isLive === true, material)}</dd></div>
          </dl>
        </header>

        <div className="material-layout">
          <section className={`material-stage${contentUnavailable ? " material-stage--unavailable" : ""}`} aria-labelledby="material-stage-title">
            <div className="material-stage-top"><span>{contentUnavailable ? "Material status / " : "Decision lab / "}{material.number}</span><b>{contentUnavailable ? "Source material not supplied" : profile.isLive ? liveMaterialState : "Sample, not a published lesson"}</b></div>
            {contentUnavailable ? (
              <div className="material-content-unavailable" role="status">
                <p>Preview unavailable</p>
                <h2 id="material-stage-title">The source material for this preview has not been supplied yet.</h2>
                <span>InterviewRunway is not showing placeholder content in its place. Return to the Library after the source file is provided.</span>
                <Link className="member-primary-button" href="/learn/library">Back to Library <span aria-hidden="true">↗</span></Link>
              </div>
            ) : (
              <>
                <div className="material-stage-visual" aria-hidden="true"><i /><i /><i /><span /></div>
                <p>Decision to make</p>
                <h2 id="material-stage-title">{detail.decision}</h2>
                <div className="material-stage-controls"><span>00:00</span><i><b /></i><span>{material.duration}</span></div>
                {hasCompletionAction && linkedTask ? <StudyProgressButton profileId={profile.id} taskId={linkedTask.id} initiallyCompleted={profile.completedTaskIds?.includes(linkedTask.id) === true} /> : null}
              </>
            )}
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
                    <span>{profile.isLive ? "Vault QA supporting material" : "Built sample material"}</span>
                <strong>{material.demoAsset.label}</strong>
                    <small className="material-review-link__action">{profile.isLive ? "Open the first-party QA reference" : "Human editorial review pending"} <span aria-hidden="true">↗</span></small>
              </a>
            ) : null}
          </aside>
        </div>

        <section className="material-chapters" aria-labelledby="material-chapters-title">
          <div className="member-section-heading">
            <div><p className="member-kicker">Lesson structure</p><h2 id="material-chapters-title">Move through the decision.</h2></div>
            <span>{detail.chapters.length} {profile.isLive ? "lesson segments" : "sample segments"}</span>
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
          <div><p className="member-kicker">Continue learning</p><h2>{detail.related}</h2><p>{hasCompletionAction ? "Use the button above to mark this study step complete, then continue through the roadmap." : profile.isLive ? "Use this material as a reference while you continue through the roadmap." : "This action opens another representative demo surface; it does not mark completion or invoke an AI service."}</p></div>
          <Link className="member-primary-button" href={destination}>Continue <span aria-hidden="true">↗</span></Link>
        </footer>
      </article>
  );
}
