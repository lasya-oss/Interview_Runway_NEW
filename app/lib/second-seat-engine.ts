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
  relevance: SecondSeatRelevanceRule;
};

export type SecondSeatRelevance = "irrelevant" | "partial" | "relevant";

export type SecondSeatRelevanceRule = {
  concepts: readonly {
    label: string;
    signals: readonly string[];
  }[];
  minimumConcepts: number;
  minimumSignals: number;
  /**
   * Verbs that make the answer's connection to this particular question
   * explicit. Generic prose may contain the right nouns without answering the
   * question, so concept coverage alone must not unlock normal scoring.
   */
  answerCues: readonly string[];
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
  question: string;
  relevance: SecondSeatRelevance;
  signal: string;
  excerpt: string;
  observation: string;
  correction: string;
};

export type SecondSeatRubricKey =
  | "correctness"
  | "relevance"
  | "completeness"
  | "technicalAccuracy"
  | "clarity"
  | "interviewQuality";

export type SecondSeatRubricScore = {
  key: SecondSeatRubricKey;
  label: string;
  score: number;
  reason: string;
};

export type SecondSeatAnswerVerdict =
  | "strong"
  | "sound"
  | "partial"
  | "incorrect"
  | "misconception"
  | "off-topic";

export type SecondSeatAnswerFeedback = {
  turnId: string;
  question: string;
  originalAnswer: string;
  score: number;
  scoreReason: string;
  verdict: SecondSeatAnswerVerdict;
  rubricScores: readonly SecondSeatRubricScore[];
  strengths: readonly string[];
  correctPoints: readonly string[];
  weaknesses: readonly string[];
  incorrectPoints: readonly string[];
  missingPoints: readonly string[];
  relevanceFeedback: string;
  clarityFeedback: string;
  technicalAccuracyFeedback: string;
  interviewQualityFeedback: string;
  improvementActions: readonly string[];
  improvedAnswer: string;
  whyImprovedAnswerIsBetter: string;
};

export type SecondSeatEvaluationProvider = {
  name: "cerebras" | "groq";
  model: string;
  promptVersion: string;
  generatedAt: string;
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
  /** Version 1 is the original deterministic rubric; version 2 is AI-enriched. */
  schemaVersion?: 1 | 2;
  evaluationSource?: "ai" | "rubric_fallback";
  scoreReason?: string;
  rubricScores?: readonly SecondSeatRubricScore[];
  answerFeedback?: readonly SecondSeatAnswerFeedback[];
  provider?: SecondSeatEvaluationProvider;
  evaluationNotice?: string;
  assessmentFingerprint?: string;
  /** Server-managed provider attempts for a fallback evaluation. */
  aiEvaluationAttempts?: number;
  /** True only while another bounded provider attempt may be requested. */
  aiEvaluationRetryAvailable?: boolean;
};

export const MINIMUM_SECOND_SEAT_ANSWER_CHARACTERS = 40;
export const MAXIMUM_SECOND_SEAT_ANSWER_CHARACTERS = 5000;

export type SecondSeatAnswerValidation =
  | { ok: true; matchedSignals: readonly string[] }
  | { ok: false; error: string; matchedSignals: readonly string[] };

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
        relevance: {
          concepts: [
            { label: "requirements and workload constraints", signals: ["latency", "volume", "preference", "transactional", "marketing"] },
            { label: "architecture-changing decision", signals: ["clarify", "architecture", "ordering", "priority", "channel", "provider", "separate"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["clarify", "identify", "separate", "prioritise", "prioritize", "choose", "define", "set"],
        },
      },
      {
        id: "semantics",
        label: "Commit to semantics",
        prompt: "Choose the delivery guarantee for provider jobs. Explain what the user experiences when the same event is processed twice.",
        probe: "Assume one SMS provider times out after accepting a request. You cannot know whether it sent the message. Where does idempotency live, and what do you record?",
        dimensions: ["technicalDepth", "tradeoffClarity"],
        signals: ["at-least-once", "idempot", "ledger", "timeout", "duplicate", "provider", "retry"],
        relevance: {
          concepts: [
            { label: "delivery semantics", signals: ["at-least-once", "exactly-once", "delivery", "guarantee", "process", "event", "retry"] },
            { label: "duplicate and provider failure handling", signals: ["idempot", "ledger", "timeout", "duplicate", "provider", "dedupe", "record"] },
            { label: "user-visible consequence", signals: ["user", "experience", "sent", "send"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["choose", "guarantee", "deliver", "process", "record", "store", "dedupe", "retry", "handle", "prevent", "avoid"],
        },
      },
      {
        id: "failure",
        label: "Operate under failure",
        prompt: "A provider outage causes the queue to grow twenty-fold. Describe backpressure, retry bounds, prioritisation, and the signal that tells operations the system is recovering.",
        probe: "Final follow-up: which lower-priority work would you shed first, and how would you prevent recovery traffic from causing another collapse?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["backpressure", "retry", "jitter", "priority", "dead-letter", "queue age", "recovery", "marketing"],
        relevance: {
          concepts: [
            { label: "overload control", signals: ["backpressure", "queue", "grow", "lag", "priority", "shed"] },
            { label: "bounded retry behaviour", signals: ["retry", "jitter", "dead-letter", "bound", "provider"] },
            { label: "recovery signal", signals: ["queue age", "recovery", "metric", "throughput", "oldest", "signal", "monitor"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["apply", "bound", "limit", "prioritise", "prioritize", "shed", "retry", "monitor", "measure", "alert", "recover", "scale"],
        },
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
        relevance: {
          concepts: [
            { label: "identity and quota", signals: ["identity", "client", "customer", "quota", "limit"] },
            { label: "window and burst policy", signals: ["window", "burst", "token", "request"] },
            { label: "workload separation", signals: ["interactive", "batch", "priority", "starve", "429"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["clarify", "define", "set", "limit", "separate", "prioritise", "prioritize", "choose"],
        },
      },
      {
        id: "enforcement",
        label: "Choose enforcement",
        prompt: "Choose a token-bucket, fixed-window, or sliding-window approach and explain where the counter lives when requests are handled by many application instances.",
        probe: "The counter store is briefly unavailable. Do you fail open, fail closed, or use a bounded local fallback? State the user and business consequence.",
        dimensions: ["technicalDepth", "tradeoffClarity"],
        signals: ["token bucket", "sliding", "counter", "redis", "distributed", "atomic", "fail open", "fail closed", "fallback"],
        relevance: {
          concepts: [
            { label: "limiting algorithm and counter", signals: ["token bucket", "fixed-window", "sliding-window", "sliding", "counter"] },
            { label: "distributed enforcement", signals: ["redis", "distributed", "instance", "atomic", "shared", "many"] },
            { label: "dependency failure policy", signals: ["fail open", "fail closed", "fallback", "unavailable", "dependency"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["choose", "use", "store", "keep", "enforce", "allow", "fail", "fallback", "place", "locate", "count", "increment"],
        },
      },
      {
        id: "operations",
        label: "Prove it in operation",
        prompt: "Traffic doubles unexpectedly and some regions show elevated rejection rates. Describe the telemetry, rollout guardrails, and recovery plan you would use.",
        probe: "Which metric distinguishes a correct limit from a broken dependency, and how would you prevent a configuration change from causing a global incident?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["rejection", "latency", "error", "region", "canary", "rollback", "saturation", "alert", "dependency"],
        relevance: {
          concepts: [
            { label: "incident symptoms and telemetry", signals: ["traffic", "rejection", "latency", "error", "region", "saturation", "metric", "alert"] },
            { label: "recovery plan", signals: ["recovery", "recover", "rollback", "canary", "throughput"] },
            { label: "rollout and dependency guardrails", signals: ["canary", "rollback", "guardrail", "configuration", "global", "dependency"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["measure", "monitor", "alert", "canary", "rollback", "recover", "track", "compare", "distinguish", "prevent", "configure"],
        },
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
        relevance: {
          concepts: [
            { label: "delivery context and risk", signals: ["context", "constraint", "risk", "delivery", "incident"] },
            { label: "personal decision", signals: ["personally", "decision", "decided", "chose", "owned", "action"] },
            { label: "consequence and outcome", signals: ["impact", "outcome", "result", "metric", "consequence"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["tell", "describe", "decide", "choose", "own", "lead", "pause", "ship", "explain", "risk"],
        },
      },
      {
        id: "influence",
        label: "Show influence",
        prompt: "Describe how you aligned people who did not report to you. What disagreement or competing incentive did you have to resolve?",
        probe: "Who changed their mind, what evidence moved the discussion, and what did you do when alignment did not arrive immediately?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["stakeholder", "alignment", "disagreement", "evidence", "influence", "trade-off", "decision", "changed"],
        relevance: {
          concepts: [
            { label: "people and competing incentives", signals: ["stakeholder", "alignment", "disagreement", "incentive", "influence", "team"] },
            { label: "evidence and decision", signals: ["evidence", "data", "metric", "trade-off", "decision", "changed"] },
            { label: "alignment action", signals: ["resolve", "aligned", "changed", "mind", "persuade"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["align", "persuade", "resolve", "influence", "explain", "present", "change", "ask", "negotiate"],
        },
      },
      {
        id: "learning",
        label: "Make the learning concrete",
        prompt: "What changed in your behaviour or operating system after the outcome? Give one measurable result or observable proof that the change lasted.",
        probe: "What would your teammate say you now do differently, and what part of the original approach would you keep?",
        dimensions: ["technicalDepth", "tradeoffClarity", "communication"],
        signals: ["changed", "measurable", "metric", "result", "feedback", "process", "kept", "learning", "proof"],
        relevance: {
          concepts: [
            { label: "behaviour or process change", signals: ["changed", "behaviour", "process", "learning", "feedback", "different"] },
            { label: "measurable proof", signals: ["measurable", "metric", "result", "proof", "observable", "lasted"] },
            { label: "retained practice", signals: ["kept", "keep", "teammate", "now", "approach"] },
          ],
          minimumConcepts: 2,
          minimumSignals: 3,
          answerCues: ["change", "improve", "introduce", "adopt", "measure", "track", "keep", "apply", "review", "learn"],
        },
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

export function validateSecondSeatAnswer(
  turn: SecondSeatTurn,
  answer: string,
): SecondSeatAnswerValidation {
  const trimmed = answer.trim();
  if (trimmed.length < MINIMUM_SECOND_SEAT_ANSWER_CHARACTERS) {
    return {
      ok: false,
      error: `Please answer in at least ${MINIMUM_SECOND_SEAT_ANSWER_CHARACTERS} characters.`,
      matchedSignals: [],
    };
  }
  if (trimmed.length > MAXIMUM_SECOND_SEAT_ANSWER_CHARACTERS) {
    return {
      ok: false,
      error: `Keep each response under ${MAXIMUM_SECOND_SEAT_ANSWER_CHARACTERS} characters.`,
      matchedSignals: [],
    };
  }

  if (isQuestionEcho(turn.prompt, trimmed)) {
    return {
      ok: false,
      error: "Please write your own response; repeating the interview question is not enough to score.",
      matchedSignals: [],
    };
  }

  const normalized = trimmed.toLowerCase();
  const wordCount = normalized.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  if (wordCount < 5) {
    return {
      ok: false,
      error: "Please write a complete answer with enough detail to evaluate.",
      matchedSignals: [],
    };
  }

  const matchedSignals = turn.signals.filter((signal) =>
    answerContainsSignal(normalized, signal),
  );
  // Relevance is intentionally evaluated after submission, not used as a
  // keyword-only input gate. A long unrelated answer must reach the debrief so
  // the learner sees a zero/low score and answer-specific correction.
  return { ok: true, matchedSignals };
}

export type SecondSeatRelevanceAssessment = {
  level: SecondSeatRelevance;
  matchedSignals: readonly string[];
  matchedConcepts: readonly string[];
  missingConcepts: readonly string[];
  hasAnswerConnection: boolean;
  hasQuestionConnection: boolean;
};

export function assessSecondSeatAnswer(
  turn: SecondSeatTurn,
  answer: string,
): SecondSeatRelevanceAssessment {
  const trimmed = answer.trim();
  const matchedSignals = turn.signals.filter((signal) =>
    answerContainsSignal(trimmed, signal),
  );
  const matchedConcepts = turn.relevance.concepts
    .filter((concept) => concept.signals.some((signal) => answerContainsSignal(trimmed, signal)))
    .map((concept) => concept.label);
  const missingConcepts = turn.relevance.concepts
    .filter((concept) => !concept.signals.some((signal) => answerContainsSignal(trimmed, signal)))
    .map((concept) => concept.label);
  const hasAnswerConnection = hasDecisionConnection(trimmed);
  const hasQuestionConnection = hasQuestionDirectedConnection(turn, trimmed);
  const isEcho = isQuestionEcho(turn.prompt, trimmed);

  if (!trimmed || isEcho || matchedConcepts.length === 0 || !hasAnswerConnection) {
    return {
      level: "irrelevant",
      matchedSignals,
      matchedConcepts,
      missingConcepts,
      hasAnswerConnection,
      hasQuestionConnection,
    };
  }

  const isRelevant =
    matchedConcepts.length >= turn.relevance.minimumConcepts &&
    matchedSignals.length >= turn.relevance.minimumSignals &&
    hasQuestionConnection;

  return {
    level: isRelevant ? "relevant" : "partial",
    matchedSignals,
    matchedConcepts,
    missingConcepts,
    hasAnswerConnection,
    hasQuestionConnection,
  };
}

export function evaluateSecondSeatSession(
  mock: SecondSeatMock,
  answers: readonly string[],
): SecondSeatEvaluation {
  const totals = new Map<SecondSeatDimensionKey, { score: number; count: number }>();
  for (const dimension of DIMENSIONS) totals.set(dimension.key, { score: 0, count: 0 });

  const evidence = mock.turns.map((turn, index) => {
    const answer = answers[index]?.trim() ?? "";
    const relevance = assessSecondSeatAnswer(turn, answer);
    const validation = validateSecondSeatAnswer(turn, answer);
    const isEcho = isQuestionEcho(turn.prompt, answer);
    const matchedSignals = relevance.matchedSignals;
    let turnScore = 0;
    if (validation.ok && relevance.level !== "irrelevant") {
      const completeness = answer.length >= 80 ? 14 : answer.length >= 60 ? 8 : 3;
      const coverage = Math.min(35, matchedSignals.length * 6);
      const structure = /because|so that|however|trade-?off|first|then|finally|measure/i.test(answer) ? 10 : 0;
      const qualityScore = Math.min(96, 35 + completeness + coverage + structure);
      turnScore = relevance.level === "relevant"
        ? qualityScore
        : Math.min(49, 10 + Math.min(16, matchedSignals.length * 4) + structure);
    }

    for (const key of turn.dimensions) {
      const current = totals.get(key);
      if (current) {
        current.score += turnScore;
        current.count += 1;
      }
    }

    const isStrong = relevance.level === "relevant" && turnScore >= 70;
    const signal = relevance.level === "irrelevant"
      ? `${turn.label} · irrelevant response`
      : relevance.level === "partial"
        ? `${turn.label} · partially relevant`
        : isStrong
      ? `${turn.label} · evidence present`
      : validation.ok
        ? `${turn.label} · strengthen next time`
        : `${turn.label} · no relevant evidence`;
    const observation = answer
      ? !validation.ok
        ? "This response could not be evaluated because it did not meet the response requirements."
        : relevance.level === "irrelevant"
          ? `Your submitted answer did not answer this question: “${turn.prompt}” It was not used for positive quality scoring because it ${isEcho ? "repeated the question instead of answering it" : "did not connect a decision to the question's required concepts"}.`
          : relevance.level === "partial"
            ? `Your submitted answer addressed ${matchedSignals.slice(0, 3).join(", ") || "one part of the topic"}, but only partially answered “${turn.prompt}” Missing focus: ${relevance.missingConcepts.slice(0, 2).join(" and ") || "a complete decision and consequence"}.`
            : isStrong
          ? `Your response made ${matchedSignals.slice(0, 3).join(", ") || "the decision"} visible before moving on.`
          : "The response started the decision, but the constraint, consequence, or operating proof stayed implicit."
      : "No response was recorded for this turn, so there is no evidence to score yet.";
    const correction = !validation.ok
      ? validation.error
      : relevance.level === "irrelevant"
        ? `Answer the question directly—“${turn.prompt}” Then name one concrete decision and its consequence. Unrelated writing will remain at zero.`
        : relevance.level === "partial"
          ? `Keep the part of your submitted answer that addressed ${matchedSignals.slice(0, 2).join(" and ") || "the question"}, then add ${relevance.missingConcepts.slice(0, 2).join(" and ") || "the missing decision and consequence"}.`
      : isStrong
        ? "Keep the same order: constraint, decision, consequence, then the signal you would watch."
        : `Name one concrete ${turn.dimensions.includes("tradeoffClarity") ? "trade-off and its user consequence" : "constraint and observable result"} before adding more detail.`;

    return {
      turn: turn.label,
      question: turn.prompt,
      relevance: relevance.level,
      signal,
      excerpt: answer ? answer.slice(0, 280) : "No answer recorded.",
      observation,
      correction,
    };
  });

  const dimensions = DIMENSIONS.map(({ key, label }) => {
    const total = totals.get(key) ?? { score: 0, count: 0 };
    const score = total.count > 0 ? Math.round(total.score / total.count) : 0;
    return {
      key,
      label,
      score,
      delta: score >= 70 ? "+evidence" : score > 0 ? "focus next" : "no evidence",
      note: dimensionNote(key, score),
    };
  });
  const lowest = [...dimensions].sort((left, right) => left.score - right.score)[0];
  const overall = Math.round(dimensions.reduce((sum, dimension) => sum + dimension.score, 0) / dimensions.length);
  const mockAction = mock.category === "Behavioural" ? "/learn/material/scope-stories" : "/learn/material/notification-mock";
  const hasIrrelevantAnswer = evidence.some((item) => item.signal.includes("irrelevant response"));
  const hasPartialAnswer = evidence.some((item) => item.signal.includes("partially relevant"));

  return {
    overall,
    dimensions,
    evidence,
    schemaVersion: 1,
    evaluationSource: "rubric_fallback",
    scoreReason: "This score uses the original Interview Runway signal-coverage rubric across the completed transcript.",
    evaluationNotice: "Detailed AI coaching was unavailable for this assessment, so your saved answers were evaluated with the original Interview Runway rubric.",
    insightTitle: lowest ? `Make ${lowest.label.toLowerCase()} visible earlier.` : "Make the decision easy to follow.",
    insightBody: hasIrrelevantAnswer
      ? "At least one submitted answer did not address its actual question, so unrelated writing received no positive quality score. Rehearse each question as a direct decision before adding supporting detail."
      : hasPartialAnswer
        ? "At least one submitted answer addressed only part of its question. Keep the relevant point, then add the missing decision, consequence, or operating proof before the next rehearsal."
        : lowest
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

function answerContainsSignal(normalizedAnswer: string, signal: string) {
  const answer = normalizedAnswer.toLowerCase();
  const normalizedSignal = signal.toLowerCase().trim();
  if (!normalizedSignal) return false;
  if (normalizedSignal.includes(" ")) {
    const words = normalizedSignal.split(/\s+/u).map(escapeRegExp);
    return new RegExp(`\\b${words.join("[\\s-]+\\b")}\\b`, "i").test(answer);
  }
  const stem = STEM_SIGNALS.has(normalizedSignal);
  const suffix = stem ? "[a-z]*" : "(?:s|es|ed|ing)?";
  return new RegExp(`\\b${escapeRegExp(normalizedSignal)}${suffix}\\b`, "i").test(answer);
}

// These entries are deliberately truncated because the rubric wants common
// forms such as "idempotency", "clarified", and "prioritised". All other
// signals use a bounded set of ordinary English inflections, so a word such as
// "user" cannot accidentally match the answer cue "use".
const STEM_SIGNALS = new Set([
  "adopt",
  "alert",
  "bound",
  "choos",
  "clarif",
  "decid",
  "defin",
  "describ",
  "idempot",
  "improv",
  "introduc",
  "measur",
  "persuad",
  "priorit",
  "recover",
  "record",
  "resolv",
  "retr",
  "scale",
  "separat",
  "stor",
]);

function hasDecisionConnection(answer: string) {
  return splitAnswerSentences(answer).some((sentence) =>
    /\b(?:clarif\w*|choos\w*|use|select\w*|defin\w*|set\w*|separat\w*|priorit\w*|explain\w*|describ\w*|decid\w*|record\w*|stor\w*|prevent\w*|avoid\w*|bound\w*|limit\w*|shed\w*|retr\w*|monitor\w*|measur\w*|alert\w*|recover\w*|scale\w*|align\w*|persuad\w*|resolv\w*|introduc\w*|adopt\w*|improv\w*|own\w*|lead\w*|paus\w*|ship\w*|track\w*|rollback|fallback|because|therefore|however|trade-?off|consequence)\b/i.test(sentence),
  );
}

function hasQuestionDirectedConnection(turn: SecondSeatTurn, answer: string) {
  return splitAnswerSentences(answer).some((sentence) => {
    const hasSignal = turn.relevance.concepts.some((concept) =>
      concept.signals.some((signal) => answerContainsSignal(sentence, signal)),
    );
    const hasCue = turn.relevance.answerCues.some((cue) => answerContainsSignal(sentence, cue));
    return hasSignal && hasCue;
  });
}

function splitAnswerSentences(answer: string) {
  return answer.split(/[.!?;\n]+/u).map((sentence) => sentence.trim()).filter(Boolean);
}

function isQuestionEcho(prompt: string, answer: string) {
  const promptWords = comparableWords(prompt);
  const answerWords = comparableWords(answer);
  if (promptWords.length < 6 || answerWords.length < 6) return false;

  const promptText = promptWords.join(" ");
  const answerText = answerWords.join(" ");
  if (answerText === promptText) return true;

  const promptSet = new Set(promptWords);
  const answerSet = new Set(answerWords);
  const uniquePromptWords = [...promptSet];
  const sharedUniqueWords = uniquePromptWords.filter((word) => answerSet.has(word));
  const promptCoverage = sharedUniqueWords.length / uniquePromptWords.length;
  const answerCoverage = sharedUniqueWords.length / answerSet.size;

  // A copied question may carry a short label such as "Question:" or a brief
  // acknowledgement. Treat it as an echo while leaving room for a real answer
  // that naturally reuses a few words from the prompt.
  return (
    answerWords.length <= promptWords.length + 8 &&
    promptCoverage >= 0.9 &&
    answerCoverage >= 0.8
  );
}

function comparableWords(value: string) {
  return value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
