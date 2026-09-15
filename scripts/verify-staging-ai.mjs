import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { SignJWT } from "jose";

const baseUrl = new URL(required("SECOND_SEAT_E2E_BASE_URL"));
const sessionSecret = required("AUTH_SESSION_SECRET");
const expectedProvider = required("EXPECTED_AI_PROVIDER");
const expectedModel = required("EXPECTED_AI_MODEL");

assert.ok(sessionSecret.length >= 32, "AUTH_SESSION_SECRET is too short");
assert.ok(expectedProvider === "cerebras" || expectedProvider === "groq");

const answers = [
  "I would clarify latency, peak volume, ordering, and channel preferences, then separate transactional from marketing traffic because they have different priority and delivery promises.",
  "I would choose at-least-once delivery, use an idempotency key and durable ledger for each provider attempt, and treat a timeout as ambiguous before a bounded retry.",
  "I would apply backpressure, bounded exponential retries with jitter, prioritise transactional work, shed marketing traffic first, and monitor queue age and recovery throughput.",
];

const token = await new SignJWT({
  email: "staging-ai-verification@vividlabsai.com",
  hd: "vividlabsai.com",
  name: "Staging AI verification",
})
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(`staging-ai-verification-${process.env.GITHUB_RUN_ID ?? Date.now()}`)
  .setIssuer("interviewrunway")
  .setAudience("interviewrunway-web")
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(new TextEncoder().encode(sessionSecret));

const cookie = `interviewrunway_session=${token}; ir_active_learner_plan=practice`;

const created = await api("/api/second-seat/sessions", {
  method: "POST",
  body: JSON.stringify({ mockId: "notification-service" }),
});
assert.equal(created.response.status, 201, requestFailure("create session", created));
assert.ok(created.body?.session?.id, "create session response did not include a session id");

const sessionId = created.body.session.id;
let completed;
for (let index = 0; index < answers.length; index += 1) {
  completed = await api(`/api/second-seat/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PUT",
    body: JSON.stringify({ answers: answers.slice(0, index + 1) }),
  });
  assert.equal(completed.response.status, 200, requestFailure(`save answer ${index + 1}`, completed));
}

const evaluation = completed?.body?.session?.evaluation;
assert.equal(completed?.body?.session?.status, "completed");
assert.equal(evaluation?.evaluationSource, "ai");
assert.equal(evaluation?.schemaVersion, 2);
assert.equal(evaluation?.provider?.name, expectedProvider);
assert.equal(evaluation?.provider?.model, expectedModel);
assert.equal(evaluation?.answerFeedback?.length, answers.length);
assert.deepEqual(evaluation.answerFeedback.map((item) => item.originalAnswer), answers);
assert.ok(evaluation.scoreReason?.length > 40);
assert.ok(evaluation.answerFeedback.every((item) => item.improvedAnswer?.length > 80));
assert.ok(evaluation.answerFeedback.every((item) => item.scoreReason?.length > 30));

const evidence = {
  provider: evaluation.provider.name,
  model: evaluation.provider.model,
  promptVersion: evaluation.provider.promptVersion,
  generatedAt: evaluation.provider.generatedAt,
  overallScore: evaluation.overall,
  responseSha256: createHash("sha256").update(JSON.stringify(evaluation)).digest("hex"),
  summary: evaluation.scoreReason.slice(0, 600),
  firstImprovedAnswer: evaluation.answerFeedback[0].improvedAnswer.slice(0, 600),
};

console.log(`AI_VERIFY_RESULT=${JSON.stringify(evidence)}`);

async function api(pathname, init) {
  const response = await fetch(new URL(pathname, baseUrl), {
    ...init,
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      cookie,
      origin: baseUrl.origin,
    },
  });
  const text = await response.text();
  let body = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { nonJsonResponse: text.slice(0, 500) };
  }
  return { response, body };
}

function requestFailure(label, result) {
  return `${label} failed with HTTP ${result.response.status}: ${JSON.stringify(result.body).slice(0, 1_000)}`;
}

function required(name) {
  const value = process.env[name]?.trim();
  assert.ok(value, `${name} is required`);
  return value;
}
