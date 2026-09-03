export type DemoTier = "foundation" | "practice" | "premium";

export type DemoProfile = {
  id: DemoTier;
  isLive?: boolean;
  isSecondSeatLive?: boolean;
  /** Plans the authenticated account may select for QA; demo profiles omit this. */
  availablePlans?: readonly DemoTier[];
  name: string;
  firstName: string;
  initials: string;
  email: string;
  password?: string;
  role: string;
  target: string;
  plan: string;
  planShort: string;
  /** Plan completion is not an assessed readiness score. */
  progress: number;
  streak: number;
  week: number;
  roadmapWeeks: number;
  completedTaskIds?: readonly string[];
  completionActivity?: Readonly<Record<string, string>>;
  nextActionHref?: string;
  nextAction: string;
  nextActionMeta: string;
  focus: string;
  access: {
    library: boolean;
    practice: boolean;
    feedback: boolean;
    coaching: boolean;
  };
};

export const DEMO_PROFILES: readonly DemoProfile[] = [
  {
    id: "foundation",
    name: "Ananya Rao",
    firstName: "Ananya",
    initials: "AR",
    email: "foundation@demo.interviewrunway.com",
    password: "Vault799!",
    role: "Backend Engineer · 2.5 years",
    target: "Remote backend roles",
    plan: "The Vault · Foundation",
    planShort: "Vault",
    progress: 0,
    streak: 0,
    week: 1,
    roadmapWeeks: 12,
    completedTaskIds: [],
    nextAction: "Create the target-role map",
    nextActionMeta: "Plan · 20 min",
    nextActionHref: "/learn/roadmap/task/12w-1-map",
    focus: "Start by defining the role, level, timeline, and evidence bar.",
    access: { library: true, practice: false, feedback: false, coaching: false },
  },
  {
    id: "practice",
    name: "Rohan Mehta",
    firstName: "Rohan",
    initials: "RM",
    email: "practice@demo.interviewrunway.com",
    password: "AI2499!",
    role: "Platform Engineer · 4 years",
    target: "US infrastructure teams",
    plan: "The Second Seat · Practice",
    planShort: "The Second Seat",
    progress: 0,
    streak: 0,
    week: 1,
    roadmapWeeks: 4,
    completedTaskIds: [],
    nextAction: "Choose your first practice round",
    nextActionMeta: "Practice · 30 min",
    nextActionHref: "/learn/practice",
    focus: "Start with one interview-shaped round and use the transcript to choose the next correction.",
    access: { library: true, practice: true, feedback: true, coaching: false },
  },
  {
    id: "premium",
    name: "Meera Iyer",
    firstName: "Meera",
    initials: "MI",
    email: "premium@demo.interviewrunway.com",
    password: "Premium9999!",
    role: "Senior Software Engineer · 7 years",
    target: "Staff-track AI infrastructure",
    plan: "Human Calibration · Qualified",
    planShort: "Human Calibration",
    progress: 76,
    streak: 12,
    week: 4,
    roadmapWeeks: 4,
    nextAction: "Prepare evidence for Thursday’s calibration",
    nextActionMeta: "Coach review · 25 min",
    focus: "Make staff-level scope explicit: decisions, influence, and measurable trade-offs.",
    access: { library: true, practice: true, feedback: true, coaching: true },
  },
] as const;

export type DemoReviewMaterial = {
  title: string;
  category: string;
  detail: string;
  format: string;
  href: string;
  preview?: string;
  profiles: readonly DemoTier[];
};

export const DEMO_REVIEW_MATERIALS: readonly DemoReviewMaterial[] = [
  {
    title: "12-Week Foundation Roadmap",
    category: "Plan",
    detail: "Full Foundation sequence with learning steps and account-backed progress",
    format: "PDF · 15 pages",
    href: "/pdf-guides/roadmap_12week.pdf",
    profiles: ["foundation"],
  },
  {
    title: "Sliding Window Pattern Reference",
    category: "DSA",
    detail: "Foundation QA reference for recognition cues, invariants, and practice",
    format: "PDF · 9 pages",
    href: "/pdf-guides/dsa_sliding-window.pdf",
    profiles: ["foundation"],
  },
  {
    title: "Rate Limiting Decision Guide",
    category: "System design",
    detail: "Algorithms, counters, failure modes and interview flow",
    format: "PDF · 3 pages",
    href: "/demo-materials/sysdesign_rate-limiting.pdf",
    preview: "/demo-materials/previews/sysdesign_rate-limiting.png",
    profiles: ["practice"],
  },
  {
    title: "Design a Notification System",
    category: "Second Seat guide",
    detail: "Requirements-to-architecture walkthrough used by a mock",
    format: "PDF · 3 pages",
    href: "/demo-materials/sysdesign_notification-system-walkthrough.pdf",
    preview: "/demo-materials/previews/sysdesign_notification-system-walkthrough.png",
    profiles: ["practice"],
  },
  {
    title: "System Design Mock Rubric",
    category: "Evidence",
    detail: "Baseline, decision, evidence, result and re-test loop",
    format: "PDF · 2 pages",
    href: "/demo-materials/operations_sysdesign-mock-rubric.pdf",
    preview: "/demo-materials/previews/operations_sysdesign-mock-rubric.png",
    profiles: ["practice", "premium"],
  },
  {
    title: "Behavioral Answer Rubric",
    category: "Coach review",
    detail: "Evidence-first STAR structure and reviewer questions",
    format: "PDF · 2 pages",
    href: "/demo-materials/behavioral_scoring-rubric.pdf",
    preview: "/demo-materials/previews/behavioral_scoring-rubric.png",
    profiles: ["premium"],
  },
] as const;

export type LearningMaterial = {
  slug: string;
  number: string;
  category: string;
  title: string;
  description: string;
  format: string;
  duration: string;
  tier: DemoTier;
  tags: readonly string[];
  availability: "included" | "sample" | "preview";
  reviewed: string;
  level: string;
  roadmap: string;
  progress: number;
  demoAsset?: {
    href: string;
    label: string;
  };
};

export const LEARNING_MATERIALS: readonly LearningMaterial[] = [
  {
    slug: "rate-limiter",
    number: "01",
    category: "System design",
    title: "Rate limiting without hand-waving",
    description: "A decision-led walkthrough of token bucket, sliding windows, distributed counters, and failure modes.",
    format: "Interactive lesson",
    duration: "18 min",
    tier: "foundation",
    tags: ["Caching", "Redis", "Trade-offs"],
    availability: "included",
    reviewed: "Vault QA · built asset",
    level: "Intermediate",
    roadmap: "Week 2",
    progress: 42,
    demoAsset: { href: "/pdf-guides/sysdesign_rate-limiter-walkthrough.pdf", label: "Open the Vault review edition" },
  },
  {
    slug: "sliding-window",
    number: "02",
    category: "DSA patterns",
    title: "Recognise the sliding-window pattern",
    description: "Move from problem wording to invariant, boundary choice, and complexity explanation.",
    format: "Pattern lab",
    duration: "22 min",
    tier: "foundation",
    tags: ["Arrays", "Strings", "Invariants"],
    availability: "included",
    reviewed: "Vault QA · built asset",
    level: "Foundation",
    roadmap: "Week 1",
    progress: 68,
    demoAsset: { href: "/pdf-guides/dsa_sliding-window.pdf", label: "Open the Vault review edition" },
  },
  {
    slug: "scope-stories",
    number: "03",
    category: "Behavioural",
    title: "Make India-based scope travel well",
    description: "Translate team context, ownership, and outcomes without over-explaining the company behind them.",
    format: "Story workshop",
    duration: "16 min",
    tier: "foundation",
    tags: ["STAR", "Ownership", "Impact"],
    availability: "included",
    reviewed: "Vault QA · lesson content",
    level: "All levels",
    roadmap: "Week 2",
    progress: 0,
    demoAsset: { href: "/pdf-guides/behavioral_star-template.pdf", label: "Open the Vault story template" },
  },
  {
    slug: "remote-compensation",
    number: "04",
    category: "Remote career",
    title: "Reason about USD compensation",
    description: "Compare employment, contracting, benefits, currency risk, and negotiation as one decision.",
    format: "Decision guide",
    duration: "14 min",
    tier: "foundation",
    tags: ["Contracts", "USD", "Negotiation"],
    availability: "preview",
    reviewed: "Qualified review required",
    level: "All levels",
    roadmap: "Week 4",
    progress: 0,
  },
  {
    slug: "notification-mock",
    number: "05",
    category: "AI practice",
    title: "Design a notification service",
    description: "A timed adaptive mock with probes for fan-out, prioritisation, retry policy, and user preferences.",
    format: "Responsive mock",
    duration: "35 min",
    tier: "practice",
    tags: ["Queues", "Delivery", "Scale"],
    availability: "sample",
    reviewed: "Scripted demo · Jul 2026",
    level: "Intermediate",
    roadmap: "Practice loop",
    progress: 0,
    demoAsset: { href: "/demo-materials/sysdesign_notification-system-walkthrough.pdf", label: "Open 3-page mock guide" },
  },
  {
    slug: "staff-scope-calibration",
    number: "06",
    category: "Coach room",
    title: "Staff-level scope calibration",
    description: "A private preparation packet built from repeated mock evidence and the target role’s expectations.",
    format: "Coach packet",
    duration: "Private",
    tier: "premium",
    tags: ["Level", "Influence", "Narrative"],
    availability: "preview",
    reviewed: "Example engagement",
    level: "Senior → Staff",
    roadmap: "Coach assigned",
    progress: 25,
    demoAsset: { href: "/demo-materials/behavioral_scoring-rubric.pdf", label: "Open 2-page review rubric" },
  },
  {
    slug: "cache-consistency",
    number: "07",
    category: "System design",
    title: "Choose cache consistency deliberately",
    description: "Connect freshness requirements to invalidation, write strategy, observability, and recovery.",
    format: "Decision field sheet",
    duration: "9 pages",
    tier: "foundation",
    tags: ["Caching", "Consistency", "Failure modes"],
    availability: "included",
    reviewed: "Vault QA · built asset",
    level: "Intermediate",
    roadmap: "Week 2",
    progress: 0,
    demoAsset: { href: "/pdf-guides/sysdesign_caching.pdf", label: "Open the Vault caching guide" },
  },
  {
    slug: "graph-traversal",
    number: "08",
    category: "DSA patterns",
    title: "Separate traversal from state",
    description: "Recognise when BFS, DFS, visited state, and reconstruction should be explained as separate decisions.",
    format: "Pattern lab",
    duration: "24 min",
    tier: "foundation",
    tags: ["Graphs", "BFS", "State"],
    availability: "included",
    reviewed: "Vault QA · built asset",
    level: "Foundation",
    roadmap: "Week 1",
    progress: 0,
    demoAsset: { href: "/pdf-guides/dsa_bfs.pdf", label: "Open the Vault traversal guide" },
  },
  {
    slug: "binary-search-boundaries",
    number: "09",
    category: "DSA patterns",
    title: "Make binary-search boundaries audible",
    description: "A verbal model for invariants, monotonic predicates, and the final boundary check.",
    format: "Audio drill",
    duration: "12 min",
    tier: "foundation",
    tags: ["Binary search", "Invariants", "Communication"],
    availability: "included",
    reviewed: "Vault QA · built asset",
    level: "Foundation",
    roadmap: "Week 1",
    progress: 100,
    demoAsset: { href: "/pdf-guides/dsa_binary-search.pdf", label: "Open the Vault boundary guide" },
  },
  {
    slug: "outage-story",
    number: "10",
    category: "Behavioural",
    title: "Turn an outage into an ownership story",
    description: "Extract decisions, communication, prevention, and measurable change without dramatizing the incident.",
    format: "Story workshop",
    duration: "20 min",
    tier: "foundation",
    tags: ["Incident", "Ownership", "Impact"],
    availability: "included",
    reviewed: "Vault QA · lesson content",
    level: "All levels",
    roadmap: "Week 3",
    progress: 20,
    demoAsset: { href: "/pdf-guides/behavioral_failure-answer-lab.pdf", label: "Open the Vault ownership lab" },
  },
  {
    slug: "us-ats-resume",
    number: "11",
    category: "Career profile",
    title: "US ATS engineering resume",
    description: "An editable structure for impact-first bullets, technical context, and internationally legible scope.",
    format: "Editable template",
    duration: "DOCX preview",
    tier: "foundation",
    tags: ["Resume", "ATS", "US roles"],
    availability: "included",
    reviewed: "Vault QA · built template",
    level: "All levels",
    roadmap: "Setup",
    progress: 0,
    demoAsset: { href: "/pdf-guides/career_ats-resume.pdf", label: "Open the Vault resume template" },
  },
  {
    slug: "remote-offer-matrix",
    number: "12",
    category: "Remote career",
    title: "Compare remote offers as systems",
    description: "Model cash, benefits, time zones, tax uncertainty, currency risk, and career value in one view.",
    format: "Decision template",
    duration: "18 min",
    tier: "foundation",
    tags: ["Offers", "Remote", "Negotiation"],
    availability: "preview",
    reviewed: "Qualified review required",
    level: "All levels",
    roadmap: "Week 4",
    progress: 0,
  },
  {
    slug: "metrics-pipeline-mock",
    number: "13",
    category: "AI practice",
    title: "Design a metrics pipeline",
    description: "Reopen the latest mock, transcript evidence, rubric movement, and precise correction tasks.",
    format: "Scored mock replay",
    duration: "38 min",
    tier: "practice",
    tags: ["Metrics", "Streaming", "Trade-offs"],
    availability: "sample",
    reviewed: "Scripted demo · Jul 2026",
    level: "Intermediate",
    roadmap: "Practice loop",
    progress: 100,
  },
  {
    slug: "queue-backlog-mock",
    number: "14",
    category: "AI practice",
    title: "Debug a queue backlog",
    description: "A production-style debugging conversation that probes retry bounds, dead letters, and observability.",
    format: "Mock replay",
    duration: "31 min",
    tier: "practice",
    tags: ["Queues", "Debugging", "Reliability"],
    availability: "preview",
    reviewed: "Scripted demo · Jul 2026",
    level: "Intermediate",
    roadmap: "Practice loop",
    progress: 100,
  },
  {
    slug: "resume-signal-lab",
    number: "15",
    category: "Career profile",
    title: "Resume profile lab",
    description: "Compare bullet revisions against a deterministic role-alignment rubric and save stronger evidence.",
    format: "Guided lab",
    duration: "25 min",
    tier: "practice",
    tags: ["Resume", "Evidence", "Role fit"],
    availability: "preview",
    reviewed: "Scripted demo · Jul 2026",
    level: "All levels",
    roadmap: "Practice loop",
    progress: 35,
  },
  {
    slug: "negotiation-rehearsal",
    number: "16",
    category: "AI practice",
    title: "Rehearse the compensation conversation",
    description: "Practise anchoring, clarification, package comparison, and a calm response to location-based pushback.",
    format: "Conversation rehearsal",
    duration: "20 min",
    tier: "practice",
    tags: ["Negotiation", "USD", "Communication"],
    availability: "preview",
    reviewed: "Scripted demo · Jul 2026",
    level: "All levels",
    roadmap: "Practice loop",
    progress: 0,
  },
  {
    slug: "architecture-narrative",
    number: "17",
    category: "Coach room",
    title: "Architecture narrative worksheet",
    description: "A private example packet for making system decisions, organizational influence, and outcomes legible.",
    format: "Coach worksheet",
    duration: "Private",
    tier: "premium",
    tags: ["Architecture", "Influence", "Staff"],
    availability: "preview",
    reviewed: "Example engagement",
    level: "Senior → Staff",
    roadmap: "Coach assigned",
    progress: 60,
  },
  {
    slug: "target-company-brief",
    number: "18",
    category: "Coach room",
    title: "Target-company preparation guide",
    description: "An example private guide connecting the role loop, likely evidence bar, rehearsals, and open risks.",
    format: "Private guide",
    duration: "Coach prepared",
    tier: "premium",
    tags: ["Company", "Calibration", "Plan"],
    availability: "preview",
    reviewed: "Example engagement",
    level: "Senior → Staff",
    roadmap: "Interview week",
    progress: 80,
  },
  {
    slug: "interview-day-run-sheet",
    number: "19",
    category: "Coach room",
    title: "Interview-day run sheet",
    description: "A quiet, one-page operating plan for energy, story retrieval, technical resets, and between-round notes.",
    format: "Private run sheet",
    duration: "1 page",
    tier: "premium",
    tags: ["Interview day", "Focus", "Recovery"],
    availability: "preview",
    reviewed: "Example engagement",
    level: "All levels",
    roadmap: "Interview day",
    progress: 0,
  },
] as const;

export const ROADMAP_WEEKS = [
  { week: 1, title: "Recognise the patterns", detail: "Core DSA patterns, answer structure, and starting system trade-offs.", tasks: 8 },
  { week: 2, title: "Build reliable explanations", detail: "Rate limits, caching, queues, behavioural scope, and verbal walkthroughs.", tasks: 10 },
  { week: 3, title: "Introduce interview pressure", detail: "Timed problem solving, design prompts, and story retrieval under constraint.", tasks: 9 },
  { week: 4, title: "Correct and consolidate", detail: "Review the recurring gaps, rehearse target-company patterns, and plan the next loop.", tasks: 7 },
] as const;

export const MOCK_HISTORY = [
  { id: "MOCK-07", title: "Design a metrics pipeline", date: "14 Jul", score: 78, signal: "Stronger trade-off framing" },
  { id: "MOCK-06", title: "Debug a queue backlog", date: "11 Jul", score: 71, signal: "Retries need clearer bounds" },
  { id: "MOCK-05", title: "Design a chat service", date: "08 Jul", score: 68, signal: "State the consistency model earlier" },
] as const;

export const SCORE_DIMENSIONS = [
  { label: "Problem framing", foundation: 46, practice: 76, premium: 84 },
  { label: "Technical depth", foundation: 52, practice: 72, premium: 86 },
  { label: "Trade-off clarity", foundation: 39, practice: 64, premium: 79 },
  { label: "Communication", foundation: 58, practice: 81, premium: 88 },
] as const;

export function findDemoByCredentials(email: string, password: string) {
  return DEMO_PROFILES.find(
    (profile) => profile.email.toLowerCase() === email.trim().toLowerCase() && profile.password === password,
  ) ?? null;
}

export function findDemoById(id: DemoTier | undefined) {
  return DEMO_PROFILES.find((profile) => profile.id === id) ?? null;
}

export type DemoProfileView = Omit<DemoProfile, "password">;

export function toDemoProfileView(profile: DemoProfile): DemoProfileView {
  const view = { ...profile };
  Reflect.deleteProperty(view, "password");
  return view;
}

export function canAccessMaterial(profile: DemoProfile, material: LearningMaterial) {
  const order: Record<DemoTier, number> = { foundation: 0, practice: 1, premium: 2 };
  return order[profile.id] >= order[material.tier];
}
