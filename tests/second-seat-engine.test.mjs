import assert from "node:assert/strict";
import test from "node:test";
import {
  SECOND_SEAT_MOCKS,
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
});
