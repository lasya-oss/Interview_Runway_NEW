export type SecondSeatDimensionKey =
  | "problemFraming"
  | "technicalDepth"
  | "tradeoffClarity"
  | "communication";

export type SecondSeatTurn = {
  id: string;
  label: string;
  prompt: string;
  probe: string;
  dimensions: readonly SecondSeatDimensionKey[];
  signals: readonly string[];
};

export type SecondSeatMock = {
  id: string;
  title: string;
  category: "System design" | "Coding" | "Behavioural";
  description: string;
  objective: string;
  estimatedMinutes: number;
  turns: readonly SecondSeatTurn[];
};

export type SecondSeatEvidence = {
  turn: string;
  signal: string;
  excerpt: string;
  observation: string;
  correction: string;
};

export type SecondSeatEvaluation = {
  overall: number;
  dimensions: readonly {
    key: SecondSeatDimensionKey;
    label: string;
    score: number;
    delta: string;
    note: string;
  }[];
  evidence: readonly SecondSeatEvidence[];
  insightTitle: string;
  insightBody: string;
  nextActions: readonly {
    number: string;
    title: string;
    body: string;
    meta: string;
    href: string;
  }[];
};

export const SECOND_SEAT_MOCKS: readonly SecondSeatMock[] = [
  {
    id: "notification-service",
    title: "Design a notification service",
    category: "System design",
    description: "Clarify delivery requirements, choose semantics, and operate through provider failure.",
    objective: "Show how a clear requirement becomes a defensible design decision under pressure.",
    estimatedMinutes: 35,
    turns: [
      {
        id: "frame",
        label: "Frame the problem",
        prompt: "Design a multi-channel notification service. Before naming components, which requirements would you clarify and which two would most change the architecture?",
        probe: "The product requires email, push, and SMS. Transactional notifications should arrive within 30 seconds; marketing messages may take 15 minutes. How does that change your first design commitment?",
        dimensions: ["problemFraming", "communication"],
        signals: ["latency", "volume", "preference", "transactional", "marketing", "ordering"],
      },
      {
        id: "semantics",
        label: "Commit to semantics",
        prompt: "Choose the delivery guarantee for provider jobs. Explain what the user experiences when the same event is processed twice.",
        probe: "Assume one SMS provider times out after accepting a request. You cannot know whether it sent the message. Where does idempotency live, and what do you record?",
        dimensions: ["technicalDepth", "tradeoffClarity"],
        signals: ["at-least-once", "idempot", "ledger", "timeout", "duplicate", "provider", "retry"],
      },
      {
        id: "failure",
        label: "Operate under failure",
        prompt: "A provider outage causes the queue to grow twenty-fold. Describe backpressure, retry bounds, prioritisation, and the signal that tells operations the system is recovering.",
        probe: "Final follow-up: which lower-priority work would you shed first, and how would you prevent recovery traffic from causing another collapse?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["backpressure", "retry", "jitter", "priority", "dead-letter", "queue age", "recovery", "marketing"],
      },
    ],
  },
  {
    id: "rate-limiter",
    title: "Design a rate limiter",
    category: "System design",
    description: "Make a capacity decision, explain distributed enforcement, and recover when the dependency is degraded.",
    objective: "Make the limit, consistency, and failure behaviour explicit before choosing an implementation.",
    estimatedMinutes: 30,
    turns: [
      {
        id: "policy",
        label: "Set the policy",
        prompt: "Design a rate limiter for a public API. Which client identity, quota window, burst behaviour, and response contract would you clarify first?",
        probe: "A single customer has interactive requests and batch traffic. What policy separates those workloads without allowing a noisy batch job to starve the interactive path?",
        dimensions: ["problemFraming", "communication"],
        signals: ["identity", "quota", "window", "burst", "interactive", "batch", "priority", "429"],
      },
      {
        id: "enforcement",
        label: "Choose enforcement",
        prompt: "Choose a token-bucket, fixed-window, or sliding-window approach and explain where the counter lives when requests are handled by many application instances.",
        probe: "The counter store is briefly unavailable. Do you fail open, fail closed, or use a bounded local fallback? State the user and business consequence.",
        dimensions: ["technicalDepth", "tradeoffClarity"],
        signals: ["token bucket", "sliding", "counter", "redis", "distributed", "atomic", "fail open", "fail closed", "fallback"],
      },
      {
        id: "operations",
        label: "Prove it in operation",
        prompt: "Traffic doubles unexpectedly and some regions show elevated rejection rates. Describe the telemetry, rollout guardrails, and recovery plan you would use.",
        probe: "Which metric distinguishes a correct limit from a broken dependency, and how would you prevent a configuration change from causing a global incident?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["rejection", "latency", "error", "region", "canary", "rollback", "saturation", "alert", "dependency"],
      },
    ],
  },
  {
    id: "ownership-story",
    title: "Own a difficult delivery decision",
    category: "Behavioural",
    description: "Build a concise evidence-led story and handle follow-ups on ownership, influence, and learning.",
    objective: "Make your judgment, actions, and measurable consequence visible without hiding behind team language.",
    estimatedMinutes: 25,
    turns: [
      {
        id: "story",
        label: "Choose the evidence",
        prompt: "Tell me about a delivery decision that carried real risk. Set the context briefly, name the constraint, and explain what you personally decided.",
        probe: "What would have happened if you had made the opposite decision, and why was the trade-off worth taking?",
        dimensions: ["problemFraming", "communication"],
        signals: ["context", "constraint", "decision", "risk", "personally", "impact", "outcome"],
      },
      {
        id: "influence",
        label: "Show influence",
        prompt: "Describe how you aligned people who did not report to you. What disagreement or competing incentive did you have to resolve?",
        probe: "Who changed their mind, what evidence moved the discussion, and what did you do when alignment did not arrive immediately?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["stakeholder", "alignment", "disagreement", "evidence", "influence", "trade-off", "decision", "changed"],
      },
      {
        id: "learning",
        label: "Make the learning concrete",
        prompt: "What changed in your behaviour or operating system after the outcome? Give one measurable result or observable proof that the change lasted.",
        probe: "What would your teammate say you now do differently, and what part of the original approach would you keep?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["changed", "measurable", "metric", "result", "feedback", "process", "kept", "learning", "proof"],
      },
    ],
  },
] as const;

const DIMENSIONS: readonly {
  key: SecondSeatDimensionKey;
  label: string;
}[] = [
  { key: "problemFraming", label: "Problem framing" },
  { key: "technicalDepth", label: "Technical depth" },
  { key: "tradeoffClarity", label: "Trade-off clarity" },
  { key: "communication", label: "Communication" },
];

export function findSecondSeatMock(mockId: string) {
  return SECOND_SEAT_MOCKS.find((mock) => mock.id === mockId) ?? null;
}

export function evaluateSecondSeatSession(
  mock: SecondSeatMock,
  answers: readonly string[],
): SecondSeatEvaluation {
  const totals = new Map<SecondSeatDimensionKey, { score: number; count: number }>();
  for (const dimension of DIMENSIONS) totals.set(dimension.key, { score: 38, count: 1 });

  const evidence = mock.turns.map((turn, index) => {
    const answer = answers[index]?.trim() ?? "";
    const normalized = answer.toLowerCase();
    const matchedSignals = turn.signals.filter((signal) => normalized.includes(signal));
    const completeness = answer.length >= 80 ? 14 : answer.length >= 35 ? 8 : answer.length > 0 ? 3 : 0;
    const coverage = Math.min(35, matchedSignals.length * 6);
    const structure = /because|so that|however|trade-?off|first|then|finally|measure/i.test(answer) ? 10 : 0;
    const turnScore = Math.min(96, 35 + completeness + coverage + structure);

    for (const key of turn.dimensions) {
      const current = totals.get(key);
      if (current) {
        current.score += turnScore;
        current.count += 1;
      }
    }

    const isStrong = turnScore >= 70;
    const signal = isStrong ? `${turn.label} · evidence present` : `${turn.label} · strengthen next time`;
    const observation = answer
      ? isStrong
        ? `Your response made ${matchedSignals.slice(0, 3).join(", ") || "the decision"} visible before moving on.`
        : "The response started the decision, but the constraint, consequence, or operating proof stayed implicit."
      : "No response was recorded for this turn, so there is no evidence to score yet.";
    const correction = isStrong
      ? "Keep the same order: constraint, decision, consequence, then the signal you would watch."
      : `Name one concrete ${turn.dimensions.includes("tradeoffClarity") ? "trade-off and its user consequence" : "constraint and observable result"} before adding more detail.`;

    return {
      turn: turn.label,
      signal,
      excerpt: answer ? answer.slice(0, 280) : "No answer recorded.",
      observation,
      correction,
    };
  });

  const dimensions = DIMENSIONS.map(({ key, label }) => {
    const total = totals.get(key) ?? { score: 38, count: 1 };
    const score = Math.round(total.score / total.count);
    return {
      key,
      label,
      score,
      delta: score >= 70 ? "+evidence" : "focus next",
      note: dimensionNote(key, score),
    };
  });
  const lowest = [...dimensions].sort((left, right) => left.score - right.score)[0];
  const overall = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length);
  const mockAction = mock.category === "Behavioural" ? "/learn/material/scope-stories" : "/learn/material/notification-mock";

  return {
    overall,
    dimensions,
    evidence,
    insightTitle: lowest ? `Make ${lowest.label.toLowerCase()} visible earlier.` : "Make the decision easy to follow.",
    insightBody: lowest
      ? `${lowest.label} is the next useful correction from this transcript. Rehearse the same decision once more, then test whether the evidence appears without an interviewer prompt.`
      : "Your transcript has enough evidence to choose a focused next rehearsal.",
    nextActions: [
      {
        number: "01",
        title: `Rehearse ${lowest?.label.toLowerCase() ?? "the opening decision"}`,
        body: "Answer the opening turn again in 90 seconds. State the constraint, decision, consequence, and the signal you would use to verify it.",
        meta: "15 min · targeted rehearsal",
        href: mockAction,
      },
      {
        number: "02",
        title: "Annotate the decisive moment",
        body: "Review your transcript and mark the sentence where your own judgment becomes visible. Rewrite only that sentence if it is still team-level or abstract.",
        meta: "10 min · transcript review",
        href: "/learn/feedback",
      },
      {
        number: "03",
        title: "Run a new prompt",
        body: "Change the scenario while keeping the decision order. Improvement means the pattern transfers beyond one memorised answer.",
        meta: `${mock.estimatedMinutes} min · next mock`,
        href: "/learn/practice",
      },
    ],
  };
}

function dimensionNote(key: SecondSeatDimensionKey, score: number) {
  if (score >= 70) {
    return key === "communication"
      ? "The response stayed direct and made the next decision easy to follow."
      : "The response connected a concrete decision to a consequence or operating signal.";
  }
  return key === "problemFraming"
    ? "Start with the constraint that changes the shape of the answer."
    : key === "technicalDepth"
      ? "Add one implementation detail and the failure behaviour it creates."
      : key === "tradeoffClarity"
        ? "Name what the choice gives up and who sees that consequence."
        : "Use shorter sentences with one decision and one proof point each.";
}
