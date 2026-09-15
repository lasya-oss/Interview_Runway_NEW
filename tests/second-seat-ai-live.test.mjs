import assert from "node:assert/strict";
import test from "node:test";
import { evaluateSecondSeatAssessment } from "../app/lib/second-seat-ai-evaluator.ts";
import {
  SECOND_SEAT_MOCKS,
  validateSecondSeatAnswer,
} from "../app/lib/second-seat-engine.ts";

const runLive = process.env.RUN_LIVE_AI_EVALUATION === "1";

test("live Groq/Cerebras quality matrix returns grounded educational feedback", { skip: !runLive }, async () => {
  const technicalMock = SECOND_SEAT_MOCKS[0];
  const behaviouralMock = SECOND_SEAT_MOCKS[2];
  const scenarios = [
    {
      name: "strong and correct",
      mock: technicalMock,
      answers: [
        "I would clarify peak volume, channel preferences, ordering, and latency first. I would separate transactional traffic with a 30-second SLO from marketing traffic because their priority and retry policies differ.",
        "I would choose at-least-once delivery and make the provider adapter idempotent with an event-and-channel key. A timeout is ambiguous, so I would record each attempt in a delivery ledger and retry without claiming exactly-once delivery.",
        "I would apply admission control and backpressure, use bounded exponential retries with jitter, prioritise transactional jobs, and shed marketing work first. Queue age by priority and recovery throughput show whether the system is recovering without another retry storm.",
      ],
    },
    {
      name: "partial, short, and incomplete",
      mock: technicalMock,
      answers: [
        "I would clarify latency and volume because those requirements affect the architecture, then use a queue for delivery.",
        "I would retry failed provider calls and store an idempotency key so duplicate messages are less likely to reach users.",
        "I would add workers and monitor queue length because the service needs more capacity during an outage and recovery.",
      ],
    },
    {
      name: "incorrect, misconception, and poorly structured",
      mock: technicalMock,
      answers: [
        "I would use one FIFO queue for every channel and guarantee exactly-once delivery because a queue automatically prevents all duplicates and ordering problems.",
        "Exactly-once delivery means duplicate processing cannot happen, so a provider timeout can always be retried immediately without an idempotency key or delivery record.",
        `${"I would retry every failed request immediately with no backoff and give every message highest priority because more retries always improve recovery. ".repeat(8)}Queue age and backpressure are unnecessary.`,
      ],
    },
    {
      name: "behavioural answer without invented personal evidence",
      mock: behaviouralMock,
      answers: [
        "I faced a risky delivery decision and personally chose to pause the release because an unresolved dependency could affect customers. I explained the constraint and accepted the schedule impact, but I have not included a measured outcome here.",
        "I aligned stakeholders by explaining the competing incentives and presenting the evidence behind my decision. I asked for objections and resolved the disagreement, but I have not supplied names or a measured result.",
        "I changed the review process after the outcome and kept a written risk check before releases. I do not have a measurable result in this answer, so that proof is still missing.",
      ],
    },
  ];

  const results = [];
  for (const scenario of scenarios) {
    assert.ok(scenario.answers.every((answer, index) => validateSecondSeatAnswer(scenario.mock.turns[index], answer).ok), scenario.name);
    const evaluation = await evaluateSecondSeatAssessment(scenario.mock, scenario.answers);
    assert.equal(evaluation.evaluationSource, "ai", scenario.name);
    assert.equal(evaluation.answerFeedback?.length, 3, scenario.name);
    assert.ok(evaluation.answerFeedback?.every((answer) => answer.scoreReason.length > 20), scenario.name);
    assert.ok(evaluation.answerFeedback?.every((answer) => answer.improvementActions.length > 0), scenario.name);
    assert.ok(evaluation.answerFeedback?.every((answer) => answer.improvedAnswer.length > 30), scenario.name);
    assert.ok(evaluation.answerFeedback?.every((answer) => answer.whyImprovedAnswerIsBetter.length > 20), scenario.name);
    results.push(evaluation);
  }

  assert.ok(results[0].overall > results[1].overall, "strong answers should outscore partial answers");
  assert.ok(results[1].overall > results[2].overall, "partial answers should outscore misconception-heavy answers");
  assert.ok(results[2].answerFeedback?.some((answer) => answer.verdict === "incorrect" || answer.verdict === "misconception"));
  const behaviouralImprovement = results[3].answerFeedback?.map((answer) => answer.improvedAnswer).join(" ") ?? "";
  assert.doesNotMatch(behaviouralImprovement, /\bGoogle\b|\bAmazon\b|\bMicrosoft\b|\bMeta\b/);
  assert.equal(JSON.stringify(results).includes(process.env.CEREBRAS_API_KEY ?? "never-present-secret"), false);
  assert.equal(JSON.stringify(results).includes(process.env.GROQ_API_KEY ?? "never-present-secret"), false);
});

test("empty and invalid answers are rejected before any provider call", () => {
  const turn = SECOND_SEAT_MOCKS[0].turns[0];
  assert.equal(validateSecondSeatAnswer(turn, "").ok, false);
  assert.equal(validateSecondSeatAnswer(turn, "I would retry it.").ok, false);
  assert.equal(validateSecondSeatAnswer(turn, turn.prompt).ok, false);
});
