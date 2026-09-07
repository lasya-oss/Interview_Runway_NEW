import assert from "node:assert/strict";
import test from "node:test";
import {
  evaluateSecondSeatAssessment,
  parseStoredSecondSeatEvaluation,
  SECOND_SEAT_AI_PROMPT_VERSION,
} from "../app/lib/second-seat-ai-evaluator.ts";
import { SECOND_SEAT_MOCKS } from "../app/lib/second-seat-engine.ts";

const mock = SECOND_SEAT_MOCKS[0];
const answers = [
  "I would clarify latency and volume, separate transactional from marketing traffic, and define priority and ordering before selecting the architecture.",
  "I would choose at-least-once delivery with an idempotency ledger, record provider request keys, and retry a timeout without promising exactly-once delivery.",
  "I would apply backpressure, bound retries with jitter, prioritise transactional work, shed marketing jobs, and watch queue age and recovery throughput.",
];

function answerFeedback(turn, index, score = 8) {
  return {
    turn_id: turn.id,
    verdict: score >= 9 ? "strong" : score >= 7 ? "sound" : score >= 5 ? "partial" : "incorrect",
    scores: {
      correctness: { score, reason: `Correctness evidence for turn ${index + 1}.` },
      relevance: { score, reason: `Relevance evidence for turn ${index + 1}.` },
      completeness: { score: Math.max(0, score - 1), reason: `Completeness evidence for turn ${index + 1}.` },
      technicalAccuracy: { score, reason: `Technical evidence for turn ${index + 1}.` },
      clarity: { score: Math.min(10, score + 1), reason: `Clarity evidence for turn ${index + 1}.` },
      interviewQuality: { score, reason: `Interview evidence for turn ${index + 1}.` },
    },
    score_reason: `This answer scored ${score} because its decisions were mostly explicit.`,
    strengths: ["It states a concrete decision."],
    correct_points: ["The core technical direction is correct."],
    weaknesses: ["The consequence could be more explicit."],
    incorrect_points: ["No major factual errors were identified."],
    missing_points: ["Add the user-visible consequence."],
    relevance_feedback: "The response directly addresses the question.",
    clarity_feedback: "The sequence is easy to follow.",
    technical_accuracy_feedback: "The terms are used accurately.",
    interview_quality_feedback: "The answer is concise and defensible.",
    improvement_actions: ["Add one explicit consequence and the signal used to verify it."],
    improved_answer: `${answers[index]} I would make the consequence and verification signal explicit.`,
    why_improved_answer_is_better: "It preserves the correct decision while making the missing consequence observable.",
  };
}

function providerPayload(score = 8) {
  return {
    choices: [{
      message: {
        content: JSON.stringify({
          overall_summary: "The round is technically sound; the clearest improvement is to make consequences visible sooner.",
          answer_feedback: mock.turns.map((turn, index) => answerFeedback(turn, index, score)),
        }),
      },
    }],
  };
}

function okResponse(payload = providerPayload()) {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

test("uses Cerebras first, sends a deterministic structured request, and preserves original answers", async () => {
  const calls = [];
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { CEREBRAS_API_KEY: "test-cerebras", GROQ_API_KEY: "test-groq" },
    fetchImpl: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return okResponse();
    },
    now: () => new Date("2026-09-07T10:00:00.000Z"),
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /cerebras\.ai/);
  assert.equal(calls[0].body.temperature, 0);
  assert.equal(calls[0].body.seed, 7);
  assert.equal(calls[0].body.response_format.type, "json_schema");
  assert.match(calls[0].body.messages[0].content, /untrusted quoted data/i);
  assert.match(calls[0].body.messages[0].content, /never invent employers/i);
  assert.equal(calls[0].body.messages[0].content.includes("test-cerebras"), false);
  assert.equal(evaluation.evaluationSource, "ai");
  assert.equal(evaluation.schemaVersion, 2);
  assert.equal(evaluation.provider?.name, "cerebras");
  assert.equal(evaluation.provider?.promptVersion, SECOND_SEAT_AI_PROMPT_VERSION);
  assert.equal(evaluation.answerFeedback?.length, mock.turns.length);
  assert.deepEqual(evaluation.answerFeedback?.map((item) => item.originalAnswer), answers);
  assert.equal(evaluation.rubricScores?.length, 6);
  assert.ok(evaluation.overall >= 0 && evaluation.overall <= 100);
});

test("falls through from malformed Cerebras output to validated Groq JSON", async () => {
  const calls = [];
  const failures = [];
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { CEREBRAS_API_KEY: "test-cerebras", GROQ_API_KEY: "test-groq" },
    fetchImpl: async (url, init) => {
      const body = JSON.parse(init.body);
      calls.push({ url, body });
      return calls.length === 1
        ? okResponse({ choices: [{ message: { content: "not-json" } }] })
        : okResponse();
    },
    onProviderFailure: (provider, reason) => failures.push({ provider, reason }),
  });

  assert.equal(calls.length, 2);
  assert.match(calls[0].url, /cerebras\.ai/);
  assert.match(calls[1].url, /groq\.com/);
  assert.equal(calls[1].body.response_format.type, "json_object");
  assert.deepEqual(failures, [{ provider: "cerebras", reason: "invalid_json" }]);
  assert.equal(evaluation.evaluationSource, "ai");
  assert.equal(evaluation.provider?.name, "groq");
});

test("classifies provider timeouts safely and falls through to Groq", async () => {
  const failures = [];
  let calls = 0;
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { CEREBRAS_API_KEY: "test-cerebras", GROQ_API_KEY: "test-groq" },
    fetchImpl: async () => {
      calls += 1;
      if (calls === 1) throw new DOMException("timed out", "TimeoutError");
      return okResponse();
    },
    onProviderFailure: (provider, reason) => failures.push({ provider, reason }),
  });

  assert.deepEqual(failures, [{ provider: "cerebras", reason: "timeout" }]);
  assert.equal(evaluation.evaluationSource, "ai");
  assert.equal(evaluation.provider?.name, "groq");
});

test("supports Groq-only configuration and omits unsupported reasoning options", async () => {
  const calls = [];
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { GROQ_API_KEY: "test-groq", GROQ_BRAIN_MODEL: "custom-model" },
    fetchImpl: async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return okResponse();
    },
  });

  assert.equal(calls.length, 1);
  assert.match(calls[0].url, /groq\.com/);
  assert.equal(calls[0].body.response_format.type, "json_object");
  assert.equal("reasoning_effort" in calls[0].body, false);
  assert.equal(evaluation.provider?.name, "groq");
});

test("uses the original rubric without calling the network when no provider is configured", async () => {
  let called = false;
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: {},
    fetchImpl: async () => {
      called = true;
      return okResponse();
    },
    onProviderFailure: () => {},
  });
  assert.equal(called, false);
  assert.equal(evaluation.evaluationSource, "rubric_fallback");
});

test("keeps the saved assessment usable when both providers fail", async () => {
  const failures = [];
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { CEREBRAS_API_KEY: "test-cerebras", GROQ_API_KEY: "test-groq" },
    fetchImpl: async (_url, init) => {
      const body = JSON.parse(init.body);
      return body.response_format.type === "json_schema"
        ? new Response("temporarily unavailable", { status: 503 })
        : okResponse({ choices: [{ message: { content: "{}" } }] });
    },
    onProviderFailure: (provider, reason) => failures.push({ provider, reason }),
  });

  assert.deepEqual(failures, [
    { provider: "cerebras", reason: "http_503" },
    { provider: "groq", reason: "schema_mismatch" },
  ]);
  assert.equal(evaluation.evaluationSource, "rubric_fallback");
  assert.equal(evaluation.schemaVersion, 1);
  assert.match(evaluation.evaluationNotice, /standard rubric|original .*rubric/i);
  assert.ok(Number.isInteger(evaluation.overall));
});

test("rejects malformed scores and duplicate turn records instead of rendering them", async () => {
  const malformed = providerPayload();
  const parsed = JSON.parse(malformed.choices[0].message.content);
  parsed.answer_feedback[0].scores.correctness.score = 14;
  parsed.answer_feedback[1].turn_id = parsed.answer_feedback[0].turn_id;
  malformed.choices[0].message.content = JSON.stringify(parsed);

  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { CEREBRAS_API_KEY: "test-cerebras" },
    fetchImpl: async () => okResponse(malformed),
    onProviderFailure: () => {},
  });
  assert.equal(evaluation.evaluationSource, "rubric_fallback");
});

test("rejects an unrelated improved answer even when the JSON schema is valid", async () => {
  const payload = providerPayload();
  const parsed = JSON.parse(payload.choices[0].message.content);
  parsed.answer_feedback[0].improved_answer = "Photosynthesis converts light into chemical energy inside plant chloroplasts.";
  payload.choices[0].message.content = JSON.stringify(parsed);

  const failures = [];
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { CEREBRAS_API_KEY: "test-cerebras" },
    fetchImpl: async () => okResponse(payload),
    onProviderFailure: (provider, reason) => failures.push({ provider, reason }),
  });
  assert.deepEqual(failures, [{ provider: "cerebras", reason: "unrelated_improved_answer" }]);
  assert.equal(evaluation.evaluationSource, "rubric_fallback");
});

test("replaces fabricated numeric evidence in behavioural improved answers with a grounded prompt", async () => {
  const behaviouralMock = SECOND_SEAT_MOCKS[2];
  const behaviouralAnswers = [
    "I paused a risky release after finding an unresolved dependency, explained the constraint, and accepted the schedule impact, but I did not record a measured result.",
    "I aligned stakeholders by presenting evidence about the competing incentives and asking for objections, but I did not include names or a measurable outcome.",
    "I changed the release review process by keeping a written risk check, although this answer does not yet include measurable proof that the change lasted.",
  ];
  const content = {
    overall_summary: "The story is grounded but needs measurable evidence and clearer consequences.",
    answer_feedback: behaviouralMock.turns.map((turn, index) => ({
      ...answerFeedback(turn, index, 7),
      improved_answer: `${behaviouralAnswers[index]} This reduced incidents by 47%.`,
    })),
  };
  const evaluation = await evaluateSecondSeatAssessment(behaviouralMock, behaviouralAnswers, {
    env: { CEREBRAS_API_KEY: "test-cerebras" },
    fetchImpl: async () => okResponse({ choices: [{ message: { content: JSON.stringify(content) } }] }),
  });
  assert.equal(evaluation.evaluationSource, "ai");
  assert.doesNotMatch(evaluation.answerFeedback[0].improvedAnswer, /47%/);
  assert.match(evaluation.answerFeedback[0].improvedAnswer, /\[add your measured result\]/);
});

test("stored AI evaluations are immutable, rebound to server transcript data, and rejected on transcript mismatch", async () => {
  const evaluation = await evaluateSecondSeatAssessment(mock, answers, {
    env: { CEREBRAS_API_KEY: "test-cerebras" },
    fetchImpl: async () => okResponse(),
    now: () => new Date("2026-09-07T10:00:00.000Z"),
  });
  const stored = JSON.parse(JSON.stringify(evaluation));
  stored.answerFeedback[0].originalAnswer = "tampered display answer";
  stored.answerFeedback[0].question = "tampered display question";

  const restored = parseStoredSecondSeatEvaluation(JSON.stringify(stored), mock, answers);
  assert.equal(restored?.answerFeedback?.[0].originalAnswer, answers[0]);
  assert.equal(restored?.answerFeedback?.[0].question, mock.turns[0].prompt);

  const changedAnswers = [...answers];
  changedAnswers[0] = `${changedAnswers[0]} This transcript has changed.`;
  assert.equal(parseStoredSecondSeatEvaluation(JSON.stringify(stored), mock, changedAnswers), null);
});
