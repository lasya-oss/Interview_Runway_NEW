import assert from "node:assert/strict";
import test from "node:test";
import {
  SECOND_SEAT_MOCKS,
  assessSecondSeatAnswer,
  evaluateSecondSeatSession,
  validateSecondSeatAnswer,
} from "../app/lib/second-seat-engine.ts";

test("rejects a copied interview question instead of treating its keywords as evidence", () => {
  for (const mock of SECOND_SEAT_MOCKS) {
    const copiedAnswers = mock.turns.map((turn) => turn.prompt);
    const evaluation = evaluateSecondSeatSession(mock, copiedAnswers);

    assert.equal(evaluation.overall, 0, mock.id);
    assert.ok(evaluation.dimensions.every((dimension) => dimension.score === 0), mock.id);
    assert.ok(mock.turns.every((turn) => !validateSecondSeatAnswer(turn, turn.prompt).ok), mock.id);
  }
});

test("still accepts an original answer with relevant evidence", () => {
  const turn = SECOND_SEAT_MOCKS[0].turns[0];
  const answer = "I would clarify latency and volume first because transactional messages need a 30-second SLO while marketing traffic can wait. I would then separate priority and ordering.";
  const validation = validateSecondSeatAnswer(turn, answer);

  assert.equal(validation.ok, true);
  assert.ok(validation.matchedSignals.includes("latency"));
  assert.ok(validation.matchedSignals.includes("transactional"));
  assert.equal(assessSecondSeatAnswer(turn, answer).level, "relevant");
  assert.ok(evaluateSecondSeatSession(SECOND_SEAT_MOCKS[0], [answer, answer, answer]).overall > 0);
});

test("does not give normal quality credit to a well-written paragraph with incidental overlap", () => {
  const turn = SECOND_SEAT_MOCKS[0].turns[0];
  const answer = "I would tune database indexes and add read replicas because query latency matters. The cache should expire keys to improve throughput across regions.";
  const evaluation = evaluateSecondSeatSession(SECOND_SEAT_MOCKS[0], [answer, answer, answer]);
  const assessment = assessSecondSeatAnswer(turn, answer);

  assert.equal(assessment.level, "partial");
  assert.ok(evaluation.overall < 50);
  assert.ok(evaluation.evidence[0].observation.includes("did not answer") === false);
  assert.match(evaluation.evidence[0].observation, /partially answered/i);
});

test("scores a completely unrelated submission at zero and explains the actual question", () => {
  const mock = SECOND_SEAT_MOCKS[0];
  const answer = "I like reading novels on weekends and cooking dinner with friends after work. This paragraph has no interview answer or system decision.";
  const evaluation = evaluateSecondSeatSession(mock, mock.turns.map(() => answer));

  assert.equal(evaluation.overall, 0);
  assert.ok(evaluation.dimensions.every((dimension) => dimension.score === 0));
  assert.ok(evaluation.evidence.every((item) => item.signal.includes("irrelevant response")));
  assert.ok(evaluation.evidence.every((item) => item.observation.includes("did not answer this question")));
  assert.ok(evaluation.evidence.every((item) => item.observation.includes(mock.turns[0].prompt) || item.observation.includes("question")));
});
