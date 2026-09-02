import { LEARNING_MATERIALS, type LearningMaterial } from "@/app/lib/demo-data";

export type RoadmapTaskContent =
  | { kind: "material"; slug: string }
  | {
      kind: "planned";
      objective: string;
      plannedFormat: string;
      requiredResources: readonly string[];
    }
  | {
      kind: "lesson";
      objective: string;
      plannedFormat: string;
      sections: readonly RoadmapLessonSection[];
      exercise: string;
      requiredResources: readonly string[];
    };

export type RoadmapLessonSection = {
  title: string;
  detail: string;
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
  outcome: string;
  estimatedMinutes: number;
  tasks: readonly RoadmapTask[];
};

const material = (slug: string): RoadmapTaskContent => ({ kind: "material", slug });

const planned = (
  objective: string,
  plannedFormat: string,
  requiredResources: readonly string[],
): RoadmapTaskContent => ({ kind: "planned", objective, plannedFormat, requiredResources });

const lesson = (
  objective: string,
  plannedFormat: string,
  sections: readonly RoadmapLessonSection[],
  exercise: string,
  requiredResources: readonly string[],
): RoadmapTaskContent => ({
  kind: "lesson",
  objective,
  plannedFormat,
  sections,
  exercise,
  requiredResources,
});

const task = (id: string, title: string, meta: string, learning: RoadmapTaskContent): RoadmapTask => ({
  id,
  title,
  meta,
  learning,
});

export const FOUR_WEEK_PLAN: readonly RoadmapWeek[] = [
  {
    week: 1,
    title: "Find your starting point",
    detail: "Surface the strongest patterns, the weakest explanations, and the target interview shape.",
    outcome: "Leave with a starting map of patterns, explanations, and ownership evidence.",
    estimatedMinutes: 80,
    tasks: [
      task("4w-1-patterns", "Map the eight highest-frequency DSA patterns", "Pattern lab · 35 min", planned(
        "Recognise the eight recurring problem shapes and record the cue, invariant, and first move for each one.",
        "Pattern map and guided practice set",
        ["Eight pattern reference notes", "Representative problem set", "Answer-explanation rubric"],
      )),
      task("4w-1-design", "Record a five-minute starting answer", "Self review · 15 min", planned(
        "Give a timed design opening that states requirements, scale assumptions, a first architecture, and one trade-off.",
        "Recorded starting answer prompt and self-review guide",
        ["System-design prompt", "Starting-point scoring rubric", "Recording or written response"],
      )),
      task("4w-1-stories", "Draft three ownership stories", "Behavioural · 30 min", material("scope-stories")),
    ],
  },
  {
    week: 2,
    title: "Make the reasoning visible",
    detail: "Move from arriving at an answer to explaining why it is the right answer under constraint.",
    outcome: "Make the cue, invariant, trade-off, and outcome visible in timed explanations.",
    estimatedMinutes: 82,
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
    outcome: "Use pressure and feedback evidence to target the next correction and role-specific gap.",
    estimatedMinutes: 90,
    tasks: [
      task("4w-3-mock", "Run the notification-service sample mock", "Adaptive practice · 35 min", material("notification-mock")),
      task("4w-3-correct", "Correct the lowest scoring dimension", "Feedback loop · 30 min", planned(
        "Use evidence from a scored attempt to select one correction, practise it, and define the measure that would show improvement.",
        "Scored feedback loop and re-test worksheet",
        ["Completed attempt", "Dimension-level rubric", "Correction exercise", "Re-test prompt"],
      )),
      task("4w-3-company", "Build a target-company interview map", "Role intelligence · 25 min", planned(
        "Turn a target role into a map of likely loop stages, evidence expectations, and the gaps that deserve practice time.",
        "Target-company research guide",
        ["Public role description", "Interview-loop research", "Evidence-gap worksheet"],
      )),
    ],
  },
  {
    week: 4,
    title: "Bring your preparation together",
    detail: "Rehearse the decisions and stories most likely to determine the final loop.",
    outcome: "Finish with a full-loop rehearsal, final resume profile check, and interview-day runbook.",
    estimatedMinutes: 80,
    tasks: [
      task("4w-4-rehearse", "Complete one full-loop rehearsal", "Mixed mock · 45 min", planned(
        "Run technical, behavioural, and follow-up segments in sequence, then identify the one recurring gap to correct before interview day.",
        "Full-loop rehearsal and evidence summary",
        ["Technical prompt", "Behavioural prompt", "Follow-up questions", "Scoring and review sheet"],
      )),
      task("4w-4-resume", "Apply the final resume profile check", "Career profile · 20 min", material("us-ats-resume")),
      task("4w-4-runbook", "Prepare the interview-day runbook", "Checklist · 15 min", material("interview-day-run-sheet")),
    ],
  },
] as const;

export const TWELVE_WEEK_PLAN: readonly RoadmapWeek[] = [
  {
    week: 1,
    title: "Choose the target",
    detail: "Define role, level, timeline, and the evidence needed to look credible.",
    outcome: "Leave with a target-role map, a technical baseline, and a first evidence gap to correct.",
    estimatedMinutes: 45,
    tasks: [
      task("12w-1-map", "Create the target-role map", "Plan · 20 min", lesson(
        "Define the target role, level, interview loop, and evidence bar before selecting a preparation sequence.",
        "Target-role mapping worksheet",
        [
          { title: "Set the target boundary", detail: "Write the role family, level, geography, company shape, and interview date. A narrow target makes the evidence bar testable." },
          { title: "Translate requirements into evidence", detail: "For each recurring requirement, name one observable proof: a solved problem, a design decision, an ownership story, or a measurable outcome." },
          { title: "Choose the first sequence", detail: "Order the work by risk and dependency. Establish the baseline before spending time on polished answers or timed repetition." },
        ],
        "Complete a one-page target map with three role requirements, the evidence that supports each one, and the gap that deserves the first week.",
        ["Target role description", "Level expectations", "Interview-loop outline"],
      )),
      task("12w-1-base", "Capture a technical baseline", "Self review · 25 min", lesson(
        "Record your current technical starting point across coding, system design, and trade-off communication.",
        "Technical starting-point prompt set",
        [
          { title: "Use the same starting conditions", detail: "Pick one coding prompt and one system-design prompt. Give each a fixed time limit and record the assumptions you make before solving." },
          { title: "Score observable behaviour", detail: "Check clarification, state or requirements, decision order, complexity, failure cases, and explanation quality. Do not convert this first pass into a vague readiness score." },
          { title: "Select one correction", detail: "Choose the earliest missing decision that affected the answer. The next study task should make that decision visible and repeatable." },
        ],
        "Record two baseline responses, mark the first point where the explanation became unclear, and write one correction that a reviewer could observe next time.",
        ["Coding prompt", "System-design prompt", "Starting-point rubric"],
      )),
    ],
  },
  {
    week: 2,
    title: "Recognise core patterns",
    detail: "Build retrieval cues before accumulating more solved problems.",
    outcome: "Recognise common DSA shapes and explain the invariant behind a chosen approach.",
    estimatedMinutes: 40,
    tasks: [
      task("12w-2-window", "Complete sliding-window recognition", "DSA · 22 min", material("sliding-window")),
      task("12w-2-hash", "Explain hash-map invariants aloud", "DSA · 18 min", lesson(
        "Explain what the map stores, what invariant it preserves, and when the lookup changes the answer.",
        "Hash-map invariant lesson and verbal drill",
        [
          { title: "Name the stored relationship", detail: "Say whether the map stores counts, last positions, complements, or grouped state. The value must explain what the next lookup can decide." },
          { title: "State the invariant", detail: "Describe what is true after each processed element. Keep the statement precise enough to verify before and after an update." },
          { title: "Expose the boundary", detail: "Explain duplicates, absent keys, zero values, and whether the current element is stored before or after the lookup." },
        ],
        "Explain a pair-sum or frequency-window solution without code: identify the map value, state the invariant, and dry-run a duplicate and a missing-key case.",
        ["Pattern notes", "Worked examples", "Complexity checklist"],
      )),
    ],
  },
  {
    week: 3,
    title: "Traverse deliberately",
    detail: "Turn trees and graphs into repeatable decisions rather than memorised code.",
    outcome: "Choose BFS or DFS from the prompt and defend the traversal, state, and edge cases.",
    estimatedMinutes: 105,
    tasks: [
      task("12w-3-graph", "Compare BFS and DFS decision cues", "DSA · 30 min", material("graph-traversal")),
      task("12w-3-practice", "Solve four traversal problems", "Practice · 75 min", lesson(
        "Apply traversal cues to four problems and annotate the decision that made each solution correct.",
        "Traversal practice set with answer review",
        [
          { title: "Classify the traversal", detail: "Use BFS for layer, shortest-unweighted-distance, or minimum-step questions; use DFS when exploring a component, path, or dependency structure is the central job." },
          { title: "Separate traversal from state", detail: "Write what the queue or recursion visits and what the visited, parent, distance, or answer state means. Do not hide the proof inside the loop." },
          { title: "Review the near miss", detail: "For every solution, name one prompt where the chosen traversal would be wrong and the cue that would force a different approach." },
        ],
        "Solve four prompts—one component, one shortest unweighted path, one cycle or dependency case, and one reconstruction case—then annotate the decisive cue for each.",
        ["Four representative problems", "Worked solutions", "Explanation rubric"],
      )),
    ],
  },
  {
    week: 4,
    title: "Frame systems",
    detail: "Start every design with requirements, scale, and the irreversible decisions.",
    outcome: "Open a system-design answer with explicit requirements, scale assumptions, and a defensible first bottleneck.",
    estimatedMinutes: 55,
    tasks: [
      task("12w-4-frame", "Build the requirements frame", "System design · 25 min", lesson(
        "Open a system-design prompt by separating functional requirements, quality attributes, scale, and explicit non-goals.",
        "Requirements-framing lesson and prompt",
        [
          { title: "Separate the requirement types", detail: "List what the system must do, then name latency, durability, availability, consistency, privacy, or cost expectations that change the design." },
          { title: "Make scale a model", detail: "Estimate users, requests, payloads, peaks, and retention at order-of-magnitude precision. Record which assumption is most likely to change." },
          { title: "Declare non-goals", detail: "Say what the first version will not solve. Explicit scope keeps the architecture explainable and creates a defensible reason for later extensions." },
        ],
        "Frame a URL-shortener or notification prompt in six lines: three functional requirements, two quality attributes, one scale assumption, and two non-goals.",
        ["System-design prompt", "Requirements checklist", "Scope decision examples"],
      )),
      task("12w-4-capacity", "Estimate capacity without false precision", "System design · 30 min", lesson(
        "Use order-of-magnitude estimates to expose bottlenecks and choose architecture, without presenting guesses as facts.",
        "Capacity-estimation field sheet",
        [
          { title: "State the inputs", detail: "Write active users, request rate, peak multiplier, average payload, retention, and read/write mix before multiplying numbers." },
          { title: "Convert to system pressure", detail: "Translate traffic into bandwidth, storage growth, concurrent work, or queue throughput. Round deliberately so the conclusion stays readable." },
          { title: "Tie the estimate to a decision", detail: "Use the result to choose a cache, partition, batch, queue, or storage boundary. Identify the assumption that could reverse the decision." },
        ],
        "Estimate peak writes, daily storage, and read throughput for a notification system, then name the first bottleneck and the assumption behind it.",
        ["Traffic assumptions", "Back-of-the-envelope model", "Bottleneck review"],
      )),
    ],
  },
  {
    week: 5,
    title: "Reason about state",
    detail: "Connect caching, replication, and consistency to product consequences.",
    outcome: "Choose cache and consistency behaviour that matches product freshness and recovery expectations.",
    estimatedMinutes: 53,
    tasks: [
      task("12w-5-cache", "Map cache failure modes", "System design · 28 min", material("cache-consistency")),
      task("12w-5-consistency", "Defend one consistency model", "System design · 25 min", lesson(
        "Choose a consistency model from product requirements and defend its stale-read, write, and recovery consequences.",
        "Consistency decision guide",
        [
          { title: "Start with the product promise", detail: "Ask what a user may observe after a write, failover, or retry. Consistency is a user-visible contract, not a database adjective." },
          { title: "Compare the trade-offs", detail: "Contrast read freshness, write availability, coordination cost, latency, and recovery behaviour. Choose the smallest guarantee that meets the requirement." },
          { title: "Describe degraded operation", detail: "Explain stale reads, conflicts, retries, and repair. A defensible answer says what happens when the preferred path is unavailable." },
        ],
        "Choose consistency for a profile update and a public feed, then explain what a user can observe during replication lag and after failover.",
        ["Product freshness requirements", "Consistency comparison", "Failure-case prompts"],
      )),
    ],
  },
  {
    week: 6,
    title: "Control flow and load",
    detail: "Make queues, backpressure, retries, and rate limits work as one system.",
    outcome: "Diagnose load and recovery pressure with rate limits, queues, retries, and backpressure.",
    estimatedMinutes: 65,
    tasks: [
      task("12w-6-rate", "Complete the rate-limit decision lab", "System design · 40 min", material("rate-limiter")),
      task("12w-6-queue", "Diagnose a queue backlog", "Scenario · 25 min", lesson(
        "Diagnose a queue backlog by separating arrival rate, service rate, retry amplification, and priority impact before adding workers.",
        "Queue-backlog diagnosis field guide",
        [
          { title: "Find the pressure source", detail: "Compare arrival rate, consumer throughput, queue age, partition balance, and provider latency. Queue length alone cannot show whether the oldest work is breaching its SLO." },
          { title: "Bound recovery", detail: "Stop retry amplification with idempotency, backoff, attempt limits, and dead letters. Protect transactional work before allowing optional fan-out to consume capacity." },
          { title: "Scale against evidence", detail: "Add workers only when the bottleneck is parallelisable and downstream capacity is available. Watch oldest-event age and recovery rate while the queue drains." },
        ],
        "Write the first five minutes of response to a 20× queue spike: name three metrics, one protection action, one retry change, and the condition for adding capacity.",
        ["Queue metrics", "Retry policy", "Priority and SLO notes"],
      )),
    ],
  },
  {
    week: 7,
    title: "Build the story bank",
    detail: "Translate ownership and impact so unfamiliar company context travels well.",
    outcome: "Produce evidence-led ownership stories and answer follow-ups with scope, decisions, and impact.",
    estimatedMinutes: 85,
    tasks: [
      task("12w-7-stories", "Draft six evidence-led stories", "Behavioural · 60 min", material("scope-stories")),
      task("12w-7-followups", "Answer the ownership follow-ups", "Behavioural · 25 min", material("outage-story")),
    ],
  },
  {
    week: 8,
    title: "Strengthen your career profile",
    detail: "Make scope legible to a remote recruiter and a US hiring manager.",
    outcome: "Turn experience into clear, evidence-backed resume and profile evidence for the target role.",
    estimatedMinutes: 75,
    tasks: [
      task("12w-8-resume", "Apply the ATS resume pass", "Template · 45 min", material("us-ats-resume")),
      task("12w-8-linkedin", "Rewrite headline and About section", "Career profile · 30 min", lesson(
        "Align headline and About copy to the target role without making claims the evidence cannot support.",
        "Career profile writing guide",
        [
          { title: "Lead with the target", detail: "Use the target role, technical surface, and level in the headline. Avoid generic tool lists that do not reveal the decisions you make." },
          { title: "Turn work into evidence", detail: "In the About section, connect context, ownership, scale, and outcome. Keep claims proportional to what the resume, projects, or references can support." },
          { title: "Remove translation burden", detail: "Replace local title or product shorthand with plain language a US recruiter can assess without guessing at your scope." },
        ],
        "Rewrite one headline and a 120-word About section for the target role, then underline every claim that needs evidence elsewhere in the profile.",
        ["Target-role map", "Current profile", "Evidence-led copy checklist"],
      )),
    ],
  },
  {
    week: 9,
    title: "Add company context",
    detail: "Prioritise public, recurring interview patterns without memorising leaked prompts.",
    outcome: "Translate public company evidence into a focused interview-loop map and three preparation gaps.",
    estimatedMinutes: 50,
    tasks: [
      task("12w-9-map", "Build the interview-loop map", "Role intelligence · 30 min", lesson(
        "Map public evidence about a company’s interview loop to preparation themes, not leaked or copied prompts.",
        "Company interview-loop research guide",
        [
          { title: "Use public evidence", detail: "Start with the role description, official material, candidate-reported patterns, and current public signals. Record source date and confidence instead of treating anecdotes as fact." },
          { title: "Map stages to capabilities", detail: "For each stage, name the likely capability, the evidence you can prepare, and the uncertainty that still needs verification." },
          { title: "Keep it ethical and useful", detail: "Prepare themes and decision patterns, never leaked questions or copied answers. The map should make practice more targeted without pretending to predict the loop." },
        ],
        "Build a four-row loop map for one target company with stage, public evidence, likely capability, preparation action, and confidence level.",
        ["Public interview information", "Role description", "Preparation-theme matrix"],
      )),
      task("12w-9-gaps", "Select three company-specific gaps", "Plan · 20 min", lesson(
        "Choose three gaps where company context changes the evidence bar, then assign each a practice or learning action.",
        "Gap-prioritisation worksheet",
        [
          { title: "Separate general from contextual gaps", detail: "A general gap appears across roles; a contextual gap matters because this company, level, or loop expects a different kind of evidence." },
          { title: "Rank by consequence", detail: "Prioritise gaps by likelihood, interview impact, and correction effort. Do not create a new syllabus for every uncertain detail." },
          { title: "Assign a proof action", detail: "Each selected gap gets one material, rehearsal, story, or question to answer and a visible completion condition." },
        ],
        "Select three gaps from the loop map, rank them by consequence, and assign each one action plus the evidence that will show the gap has narrowed.",
        ["Interview-loop map", "Existing evidence", "Practice inventory"],
      )),
    ],
  },
  {
    week: 10,
    title: "Introduce timed practice",
    detail: "Test retrieval and explanation quality under an interview-shaped constraint.",
    outcome: "Deliver coding and system-design answers inside interview-shaped time boxes, including tests and trade-offs.",
    estimatedMinutes: 80,
    tasks: [
      task("12w-10-coding", "Run a timed coding rehearsal", "Practice · 40 min", lesson(
        "Solve and explain a coding prompt within a fixed interview window, including clarification, approach, complexity, and testing.",
        "Timed coding rehearsal",
        [
          { title: "Open with a contract", detail: "Clarify inputs, outputs, constraints, and examples before selecting a pattern. Say what the algorithm must preserve." },
          { title: "Explain while solving", detail: "Name the state and invariant, then implement the simplest correct path. Keep complexity and boundary choices attached to the decisions that cause them." },
          { title: "Test the edges", detail: "Reserve time for an empty case, minimum case, duplicate or boundary case, and one input that forces the main state transition." },
        ],
        "Run one 30-minute coding rehearsal with five minutes for clarification and five for testing; save the prompt, approach, invariant, complexity, and first missed edge case.",
        ["Coding prompt", "Interview timer", "Explanation and testing rubric"],
      )),
      task("12w-10-design", "Run a timed design rehearsal", "Practice · 40 min", lesson(
        "Take a system-design prompt from requirements to trade-offs under time pressure and record the assumptions that changed the design.",
        "Timed system-design rehearsal",
        [
          { title: "Time-box the stages", detail: "Give requirements and scale a clear opening, then move through data flow, bottlenecks, failure modes, and one deliberate trade-off." },
          { title: "Make assumptions reversible", detail: "State which estimate or product requirement drives each component. When a prompt changes, show exactly which design choice changes with it." },
          { title: "Close with operations", detail: "Finish with observability, recovery, capacity limits, and the next question you would ask before production." },
        ],
        "Complete a 35-minute design rehearsal and record three assumptions, the decision each caused, and the trade-off you would revisit with more information.",
        ["System-design prompt", "Time-boxed stages", "Trade-off rubric"],
      )),
    ],
  },
  {
    week: 11,
    title: "Correct the persistent gap",
    detail: "Use evidence across attempts to choose the final correction, not a new syllabus.",
    outcome: "Use comparable attempts to isolate one persistent gap and prove a targeted correction.",
    estimatedMinutes: 60,
    tasks: [
      task("12w-11-review", "Compare the last three attempts", "Review · 25 min", lesson(
        "Compare recent attempts by the same dimensions and distinguish a persistent gap from one-off performance noise.",
        "Evidence comparison review",
        [
          { title: "Use one rubric", detail: "Compare the same dimensions across three attempts: framing, technical reasoning, trade-off clarity, communication, and boundary handling." },
          { title: "Look for repeated moments", detail: "A persistent gap appears in similar prompts or follow-ups. One awkward answer without recurrence is a hypothesis, not a diagnosis." },
          { title: "Choose the smallest correction", detail: "Select the one behaviour that would improve multiple attempts. Define the next test before adding more content." },
        ],
        "Place three attempts beside the same rubric, quote one repeated weak moment, one stable strength, and the correction that should be tested next.",
        ["Three scored attempts", "Shared rubric", "Evidence-change worksheet"],
      )),
      task("12w-11-correct", "Repeat the lowest-score scenario", "Practice · 35 min", lesson(
        "Repeat the scenario that exposed the weakest area, applying one deliberate correction and checking the result against the same rubric.",
        "Targeted re-test scenario",
        [
          { title: "Change one variable", detail: "Keep the prompt shape and rubric stable so a stronger result can be attributed to the correction rather than a new task." },
          { title: "Front-load the correction", detail: "Place the intended behaviour where the old gap appeared: state the consistency model, quantify the bottleneck, or make ownership explicit." },
          { title: "Check for transfer", detail: "After the retest, use a nearby prompt to see whether the behaviour generalises without becoming a memorised script." },
        ],
        "Repeat the lowest-score scenario, mark the moment where the correction was applied, and test the same decision on one adjacent prompt.",
        ["Lowest-score attempt", "Correction instruction", "Same scoring rubric"],
      )),
    ],
  },
  {
    week: 12,
    title: "Prepare the final loop",
    detail: "Consolidate, taper the workload, and remove uncertainty from interview day.",
    outcome: "Enter the final loop with rehearsed skills, a practical runbook, and one clear remaining risk.",
    estimatedMinutes: 75,
    tasks: [
      task("12w-12-loop", "Complete the full-loop rehearsal", "Rehearsal · 60 min", lesson(
        "Complete the final interview-shaped sequence and leave with a short list of rehearsed skills, not a new syllabus.",
        "Final full-loop rehearsal",
        [
          { title: "Assemble the loop", detail: "Choose one coding, one design, one behavioural, and one follow-up segment that reflect the target role and the corrected gap." },
          { title: "Protect the transitions", detail: "Practise resetting between segments: restate the new contract, ask the next clarification, and carry forward only evidence that remains relevant." },
          { title: "Taper with evidence", detail: "End with three strengths, one remaining risk, and the exact sentence or decision you will rehearse once more before interview day." },
        ],
        "Run the complete sequence under interview timing, then write a three-line final summary: strongest skill, remaining risk, and the next action before the loop.",
        ["Final loop outline", "Selected prompts", "Evidence summary"],
      )),
      task("12w-12-runbook", "Finish the interview-day runbook", "Checklist · 15 min", lesson(
        "Prepare a practical interview-day runbook for energy, logistics, story retrieval, technical resets, and between-round notes.",
        "Interview-day operating checklist",
        [
          { title: "Remove avoidable friction", detail: "Confirm timezone, links, device, quiet space, backup connection, water, notes, and the contact path for a genuine interruption." },
          { title: "Use a reset ritual", detail: "Between rounds, record one fact, one question, and one adjustment. Do not rewrite the entire preparation plan while the loop is running." },
          { title: "Carry only useful evidence", detail: "Keep a compact role map, story index, technical decision cues, and questions. The runbook should lower cognitive load rather than add another document to manage." },
        ],
        "Write a one-page runbook with the pre-loop checklist, a three-minute between-round reset, and the two evidence cues you most need to remember.",
        ["Interview schedule", "Role map", "Personal logistics checklist"],
      )),
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

export function libraryMaterialForRoadmapTask(task: RoadmapTask): LearningMaterial | null {
  if (task.learning.kind !== "material") return null;
  return LEARNING_MATERIALS.find((material) => material.slug === task.learning.slug) ?? null;
}

export function libraryHrefForRoadmapTask(task: RoadmapTask): string | null {
  const material = libraryMaterialForRoadmapTask(task);
  return material ? `/learn/material/${material.slug}` : null;
}
