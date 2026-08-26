export type RoadmapTaskContent =
  | { kind: "material"; slug: string }
  | {
      kind: "planned";
      objective: string;
      plannedFormat: string;
      requiredResources: readonly string[];
    };

export type RoadmapTask = {
  id: string;
  title: string;
  meta: string;
  learning: RoadmapTaskContent;
};

export type RoadmapWeek = {
  week: number;
  title: string;
  detail: string;
  tasks: readonly RoadmapTask[];
};

const material = (slug: string): RoadmapTaskContent => ({ kind: "material", slug });

const planned = (
  objective: string,
  plannedFormat: string,
  requiredResources: readonly string[],
): RoadmapTaskContent => ({ kind: "planned", objective, plannedFormat, requiredResources });

const task = (id: string, title: string, meta: string, learning: RoadmapTaskContent): RoadmapTask => ({
  id,
  title,
  meta,
  learning,
});

export const FOUR_WEEK_PLAN: readonly RoadmapWeek[] = [
  {
    week: 1,
    title: "Establish the baseline",
    detail: "Surface the strongest patterns, the weakest explanations, and the target interview shape.",
    tasks: [
      task("4w-1-patterns", "Map the eight highest-frequency DSA patterns", "Pattern lab · 35 min", planned(
        "Recognise the eight recurring problem shapes and record the cue, invariant, and first move for each one.",
        "Pattern map and guided practice set",
        ["Eight pattern reference notes", "Representative problem set", "Answer-explanation rubric"],
      )),
      task("4w-1-design", "Record a five-minute system-design baseline", "Self review · 15 min", planned(
        "Give a timed design opening that states requirements, scale assumptions, a first architecture, and one trade-off.",
        "Recorded baseline prompt and self-review guide",
        ["System-design prompt", "Baseline scoring rubric", "Recording or written response"],
      )),
      task("4w-1-stories", "Draft three ownership stories", "Behavioural · 30 min", material("scope-stories")),
    ],
  },
  {
    week: 2,
    title: "Make the reasoning visible",
    detail: "Move from arriving at an answer to explaining why it is the right answer under constraint.",
    tasks: [
      task("4w-2-window", "Complete the sliding-window decision lab", "DSA · 22 min", material("sliding-window")),
      task("4w-2-rate", "Defend a distributed rate-limit design", "System design · 40 min", material("rate-limiter")),
      task("4w-2-scope", "Rewrite one story around scope and outcome", "Behavioural · 20 min", material("scope-stories")),
    ],
  },
  {
    week: 3,
    title: "Introduce pressure",
    detail: "Use timed attempts to expose the gap between knowledge and interview execution.",
    tasks: [
      task("4w-3-mock", "Run the notification-service sample mock", "Adaptive practice · 35 min", material("notification-mock")),
      task("4w-3-correct", "Correct the lowest scoring dimension", "Feedback loop · 30 min", planned(
        "Use evidence from a scored attempt to select one correction, practise it, and define the signal that would show improvement.",
        "Scored feedback loop and re-test worksheet",
        ["Completed attempt", "Dimension-level rubric", "Correction exercise", "Re-test prompt"],
      )),
      task("4w-3-company", "Build a target-company interview map", "Role intelligence · 25 min", planned(
        "Turn a target role into a map of likely loop stages, evidence expectations, and the gaps that deserve practice time.",
        "Target-company research brief",
        ["Public role description", "Interview-loop research", "Evidence-gap worksheet"],
      )),
    ],
  },
  {
    week: 4,
    title: "Consolidate the signal",
    detail: "Rehearse the decisions and stories most likely to determine the final loop.",
    tasks: [
      task("4w-4-rehearse", "Complete one full-loop rehearsal", "Mixed mock · 45 min", planned(
        "Run technical, behavioural, and follow-up segments in sequence, then identify the one recurring signal to correct before interview day.",
        "Full-loop rehearsal and evidence summary",
        ["Technical prompt", "Behavioural prompt", "Follow-up questions", "Scoring and review sheet"],
      )),
      task("4w-4-resume", "Apply the final resume signal check", "Career signal · 20 min", material("us-ats-resume")),
      task("4w-4-runbook", "Prepare the interview-day runbook", "Checklist · 15 min", material("interview-day-run-sheet")),
    ],
  },
] as const;

export const TWELVE_WEEK_PLAN: readonly RoadmapWeek[] = [
  {
    week: 1,
    title: "Choose the target",
    detail: "Define role, level, timeline, and the evidence needed to look credible.",
    tasks: [
      task("12w-1-map", "Create the target-role map", "Plan · 20 min", planned(
        "Define the target role, level, interview loop, and evidence bar before selecting a preparation sequence.",
        "Target-role mapping worksheet",
        ["Target role description", "Level expectations", "Interview-loop outline"],
      )),
      task("12w-1-base", "Capture a technical baseline", "Self review · 25 min", planned(
        "Record the current technical explanation baseline across coding, system design, and trade-off communication.",
        "Technical baseline prompt set",
        ["Coding prompt", "System-design prompt", "Baseline rubric"],
      )),
    ],
  },
  {
    week: 2,
    title: "Recognise core patterns",
    detail: "Build retrieval cues before accumulating more solved problems.",
    tasks: [
      task("12w-2-window", "Complete sliding-window recognition", "DSA · 22 min", material("sliding-window")),
      task("12w-2-hash", "Explain hash-map invariants aloud", "DSA · 18 min", planned(
        "Explain what the map stores, what invariant it preserves, and when the lookup changes the answer.",
        "Hash-map invariant lesson and verbal drill",
        ["Pattern notes", "Worked examples", "Complexity checklist"],
      )),
    ],
  },
  {
    week: 3,
    title: "Traverse deliberately",
    detail: "Turn trees and graphs into repeatable decisions rather than memorised code.",
    tasks: [
      task("12w-3-graph", "Compare BFS and DFS decision cues", "DSA · 30 min", material("graph-traversal")),
      task("12w-3-practice", "Solve four traversal problems", "Practice · 75 min", planned(
        "Apply traversal cues to four problems and annotate the decision that made each solution correct.",
        "Traversal practice set with answer review",
        ["Four representative problems", "Worked solutions", "Explanation rubric"],
      )),
    ],
  },
  {
    week: 4,
    title: "Frame systems",
    detail: "Start every design with requirements, scale, and the irreversible decisions.",
    tasks: [
      task("12w-4-frame", "Build the requirements frame", "System design · 25 min", planned(
        "Open a system-design prompt by separating functional requirements, quality attributes, scale, and explicit non-goals.",
        "Requirements-framing lesson and prompt",
        ["System-design prompt", "Requirements checklist", "Scope decision examples"],
      )),
      task("12w-4-capacity", "Estimate capacity without false precision", "System design · 30 min", planned(
        "Use order-of-magnitude estimates to expose bottlenecks and choose architecture, without presenting guesses as facts.",
        "Capacity-estimation field sheet",
        ["Traffic assumptions", "Back-of-the-envelope model", "Bottleneck review"],
      )),
    ],
  },
  {
    week: 5,
    title: "Reason about state",
    detail: "Connect caching, replication, and consistency to product consequences.",
    tasks: [
      task("12w-5-cache", "Map cache failure modes", "System design · 28 min", material("cache-consistency")),
      task("12w-5-consistency", "Defend one consistency model", "System design · 25 min", planned(
        "Choose a consistency model from product requirements and defend its stale-read, write, and recovery consequences.",
        "Consistency decision guide",
        ["Product freshness requirements", "Consistency comparison", "Failure-case prompts"],
      )),
    ],
  },
  {
    week: 6,
    title: "Control flow and load",
    detail: "Make queues, backpressure, retries, and rate limits work as one system.",
    tasks: [
      task("12w-6-rate", "Complete the rate-limit decision lab", "System design · 40 min", material("rate-limiter")),
      task("12w-6-queue", "Diagnose a queue backlog", "Scenario · 25 min", material("queue-backlog-mock")),
    ],
  },
  {
    week: 7,
    title: "Build the story bank",
    detail: "Translate ownership and impact so unfamiliar company context travels well.",
    tasks: [
      task("12w-7-stories", "Draft six evidence-led stories", "Behavioural · 60 min", material("scope-stories")),
      task("12w-7-followups", "Answer the ownership follow-ups", "Behavioural · 25 min", material("outage-story")),
    ],
  },
  {
    week: 8,
    title: "Strengthen career signal",
    detail: "Make scope legible to a remote recruiter and a US hiring manager.",
    tasks: [
      task("12w-8-resume", "Apply the ATS resume pass", "Template · 45 min", material("us-ats-resume")),
      task("12w-8-linkedin", "Rewrite headline and About section", "Career signal · 30 min", planned(
        "Align headline and About copy to the target role without making claims the evidence cannot support.",
        "Career-signal writing guide",
        ["Target-role map", "Current profile", "Evidence-led copy checklist"],
      )),
    ],
  },
  {
    week: 9,
    title: "Add company context",
    detail: "Prioritise public, recurring interview patterns without memorising leaked prompts.",
    tasks: [
      task("12w-9-map", "Build the interview-loop map", "Role intelligence · 30 min", planned(
        "Map public signals about a company’s interview loop to preparation themes, not leaked or copied prompts.",
        "Company interview-loop research brief",
        ["Public interview information", "Role description", "Preparation-theme matrix"],
      )),
      task("12w-9-gaps", "Select three company-specific gaps", "Plan · 20 min", planned(
        "Choose three gaps where company context changes the evidence bar, then assign each a practice or learning action.",
        "Gap-prioritisation worksheet",
        ["Interview-loop map", "Existing evidence", "Practice inventory"],
      )),
    ],
  },
  {
    week: 10,
    title: "Introduce timed practice",
    detail: "Test retrieval and explanation quality under an interview-shaped constraint.",
    tasks: [
      task("12w-10-coding", "Run a timed coding rehearsal", "Practice · 40 min", planned(
        "Solve and explain a coding prompt within a fixed interview window, including clarification, approach, complexity, and testing.",
        "Timed coding rehearsal",
        ["Coding prompt", "Interview timer", "Explanation and testing rubric"],
      )),
      task("12w-10-design", "Run a timed design rehearsal", "Practice · 40 min", planned(
        "Take a system-design prompt from requirements to trade-offs under time pressure and record the assumptions that changed the design.",
        "Timed system-design rehearsal",
        ["System-design prompt", "Time-boxed stages", "Trade-off rubric"],
      )),
    ],
  },
  {
    week: 11,
    title: "Correct the persistent gap",
    detail: "Use evidence across attempts to choose the final correction, not a new syllabus.",
    tasks: [
      task("12w-11-review", "Compare the last three attempts", "Review · 25 min", planned(
        "Compare recent attempts by the same dimensions and distinguish a persistent gap from one-off performance noise.",
        "Evidence comparison review",
        ["Three scored attempts", "Shared rubric", "Signal-change worksheet"],
      )),
      task("12w-11-correct", "Repeat the lowest-signal scenario", "Practice · 35 min", planned(
        "Repeat the scenario that exposed the weakest signal, applying one deliberate correction and checking the result against the same rubric.",
        "Targeted re-test scenario",
        ["Lowest-signal attempt", "Correction instruction", "Same scoring rubric"],
      )),
    ],
  },
  {
    week: 12,
    title: "Prepare the final loop",
    detail: "Consolidate, taper the workload, and remove uncertainty from interview day.",
    tasks: [
      task("12w-12-loop", "Complete the full-loop rehearsal", "Rehearsal · 60 min", planned(
        "Complete the final interview-shaped sequence and leave with a short list of rehearsed signals, not a new syllabus.",
        "Final full-loop rehearsal",
        ["Final loop outline", "Selected prompts", "Evidence summary"],
      )),
      task("12w-12-runbook", "Finish the interview-day runbook", "Checklist · 15 min", material("interview-day-run-sheet")),
    ],
  },
] as const;

export const ROADMAP_PLANS: readonly (readonly RoadmapWeek[])[] = [FOUR_WEEK_PLAN, TWELVE_WEEK_PLAN];

export function findRoadmapTask(id: string): RoadmapTask | null {
  for (const plan of ROADMAP_PLANS) {
    for (const week of plan) {
      const task = week.tasks.find((entry) => entry.id === id);
      if (task) return task;
    }
  }
  return null;
}
