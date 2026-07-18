import type { Metadata } from "next";
import { MemberShell } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { RoadmapChecklist, type RoadmapWeek } from "./roadmap-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roadmap | Learner workspace",
  robots: { index: false, follow: false },
};

const FOUR_WEEK_PLAN: readonly RoadmapWeek[] = [
  {
    week: 1,
    title: "Establish the baseline",
    detail: "Surface the strongest patterns, the weakest explanations, and the target interview shape.",
    tasks: [
      { id: "4w-1-patterns", title: "Map the eight highest-frequency DSA patterns", meta: "Pattern lab · 35 min" },
      { id: "4w-1-design", title: "Record a five-minute system-design baseline", meta: "Self review · 15 min" },
      { id: "4w-1-stories", title: "Draft three ownership stories", meta: "Behavioural · 30 min" },
    ],
  },
  {
    week: 2,
    title: "Make the reasoning visible",
    detail: "Move from arriving at an answer to explaining why it is the right answer under constraint.",
    tasks: [
      { id: "4w-2-window", title: "Complete the sliding-window decision lab", meta: "DSA · 22 min" },
      { id: "4w-2-rate", title: "Defend a distributed rate-limit design", meta: "System design · 40 min" },
      { id: "4w-2-scope", title: "Rewrite one story around scope and outcome", meta: "Behavioural · 20 min" },
    ],
  },
  {
    week: 3,
    title: "Introduce pressure",
    detail: "Use timed attempts to expose the gap between knowledge and interview execution.",
    tasks: [
      { id: "4w-3-mock", title: "Run the notification-service sample mock", meta: "Adaptive practice · 35 min" },
      { id: "4w-3-correct", title: "Correct the lowest scoring dimension", meta: "Feedback loop · 30 min" },
      { id: "4w-3-company", title: "Build a target-company interview map", meta: "Role intelligence · 25 min" },
    ],
  },
  {
    week: 4,
    title: "Consolidate the signal",
    detail: "Rehearse the decisions and stories most likely to determine the final loop.",
    tasks: [
      { id: "4w-4-rehearse", title: "Complete one full-loop rehearsal", meta: "Mixed mock · 45 min" },
      { id: "4w-4-resume", title: "Apply the final resume signal check", meta: "Career signal · 20 min" },
      { id: "4w-4-runbook", title: "Prepare the interview-day runbook", meta: "Checklist · 15 min" },
    ],
  },
] as const;

const TWELVE_WEEK_PLAN: readonly RoadmapWeek[] = [
  { week: 1, title: "Choose the target", detail: "Define role, level, timeline, and the evidence needed to look credible.", tasks: [{ id: "12w-1-map", title: "Create the target-role map", meta: "Plan · 20 min" }, { id: "12w-1-base", title: "Capture a technical baseline", meta: "Self review · 25 min" }] },
  { week: 2, title: "Recognise core patterns", detail: "Build retrieval cues before accumulating more solved problems.", tasks: [{ id: "12w-2-window", title: "Complete sliding-window recognition", meta: "DSA · 22 min" }, { id: "12w-2-hash", title: "Explain hash-map invariants aloud", meta: "DSA · 18 min" }] },
  { week: 3, title: "Traverse deliberately", detail: "Turn trees and graphs into repeatable decisions rather than memorised code.", tasks: [{ id: "12w-3-graph", title: "Compare BFS and DFS decision cues", meta: "DSA · 30 min" }, { id: "12w-3-practice", title: "Solve four traversal problems", meta: "Practice · 75 min" }] },
  { week: 4, title: "Frame systems", detail: "Start every design with requirements, scale, and the irreversible decisions.", tasks: [{ id: "12w-4-frame", title: "Build the requirements frame", meta: "System design · 25 min" }, { id: "12w-4-capacity", title: "Estimate capacity without false precision", meta: "System design · 30 min" }] },
  { week: 5, title: "Reason about state", detail: "Connect caching, replication, and consistency to product consequences.", tasks: [{ id: "12w-5-cache", title: "Map cache failure modes", meta: "System design · 28 min" }, { id: "12w-5-consistency", title: "Defend one consistency model", meta: "System design · 25 min" }] },
  { week: 6, title: "Control flow and load", detail: "Make queues, backpressure, retries, and rate limits work as one system.", tasks: [{ id: "12w-6-rate", title: "Complete the rate-limit decision lab", meta: "System design · 40 min" }, { id: "12w-6-queue", title: "Diagnose a queue backlog", meta: "Scenario · 25 min" }] },
  { week: 7, title: "Build the story bank", detail: "Translate ownership and impact so unfamiliar company context travels well.", tasks: [{ id: "12w-7-stories", title: "Draft six evidence-led stories", meta: "Behavioural · 60 min" }, { id: "12w-7-followups", title: "Answer the ownership follow-ups", meta: "Behavioural · 25 min" }] },
  { week: 8, title: "Strengthen career signal", detail: "Make scope legible to a remote recruiter and a US hiring manager.", tasks: [{ id: "12w-8-resume", title: "Apply the ATS resume pass", meta: "Template · 45 min" }, { id: "12w-8-linkedin", title: "Rewrite headline and About section", meta: "Career signal · 30 min" }] },
  { week: 9, title: "Add company context", detail: "Prioritise public, recurring interview patterns without memorising leaked prompts.", tasks: [{ id: "12w-9-map", title: "Build the interview-loop map", meta: "Role intelligence · 30 min" }, { id: "12w-9-gaps", title: "Select three company-specific gaps", meta: "Plan · 20 min" }] },
  { week: 10, title: "Introduce timed practice", detail: "Test retrieval and explanation quality under an interview-shaped constraint.", tasks: [{ id: "12w-10-coding", title: "Run a timed coding rehearsal", meta: "Practice · 40 min" }, { id: "12w-10-design", title: "Run a timed design rehearsal", meta: "Practice · 40 min" }] },
  { week: 11, title: "Correct the persistent gap", detail: "Use evidence across attempts to choose the final correction, not a new syllabus.", tasks: [{ id: "12w-11-review", title: "Compare the last three attempts", meta: "Review · 25 min" }, { id: "12w-11-correct", title: "Repeat the lowest-signal scenario", meta: "Practice · 35 min" }] },
  { week: 12, title: "Prepare the final loop", detail: "Consolidate, taper the workload, and remove uncertainty from interview day.", tasks: [{ id: "12w-12-loop", title: "Complete the full-loop rehearsal", meta: "Rehearsal · 60 min" }, { id: "12w-12-runbook", title: "Finish the interview-day runbook", meta: "Checklist · 15 min" }] },
] as const;

export default async function RoadmapPage() {
  const profile = await requireDemoProfile("/learn/roadmap");
  const weeks = profile.roadmapWeeks === 12 ? TWELVE_WEEK_PLAN : FOUR_WEEK_PLAN;
  const orderedTaskIds = weeks.flatMap((week) => week.tasks.map((task) => task.id));
  const defaultCompletedCount = Math.round(orderedTaskIds.length * (profile.progress / 100));

  return (
    <MemberShell profile={profile} active="roadmap">
      <div className="member-page">
        <RoadmapChecklist
          profileId={profile.id}
          currentWeek={profile.week}
          weeks={weeks}
          initialCompleted={orderedTaskIds.slice(0, defaultCompletedCount)}
        />
      </div>
    </MemberShell>
  );
}
