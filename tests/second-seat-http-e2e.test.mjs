import assert from "node:assert/strict";
import test from "node:test";
import { SignJWT } from "jose";

const runE2e = process.env.RUN_SECOND_SEAT_HTTP_E2E === "1";
const baseUrl = process.env.SECOND_SEAT_E2E_BASE_URL ?? "http://localhost:3000";
const sessionSecret = process.env.AUTH_SESSION_SECRET ?? "";

async function cookieFor(email) {
  const token = await new SignJWT({ email, hd: "vividlabsai.com", name: "Second Seat E2E" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(`e2e-${email}`)
    .setIssuer("interviewrunway")
    .setAudience("interviewrunway-web")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(new TextEncoder().encode(sessionSecret));
  return `interviewrunway_session=${token}; ir_active_learner_plan=practice`;
}

async function api(path, cookie, init = {}) {
  const headers = new Headers(init.headers);
  headers.set("accept", "application/json");
  headers.set("cookie", cookie);
  if (init.body) headers.set("content-type", "application/json");
  return fetch(new URL(path, baseUrl), { ...init, headers });
}

test("Second Seat HTTP flow persists the transcript and renders structured feedback", { skip: !runE2e }, async () => {
  assert.ok(sessionSecret.length >= 24, "AUTH_SESSION_SECRET must be configured for the local E2E run");
  const learnerCookie = await cookieFor("second-seat-e2e@vividlabsai.com");
  const otherAuthorizedCookie = await cookieFor("security-check@vividlabsai.com");
  const nonEntitledCookie = await cookieFor("no-second-seat@vividlabsai.com");
  const answers = [
    "I would clarify latency, peak volume, ordering, and preferences, then separate transactional from marketing traffic because they have different priority and delivery promises.",
    "I would choose at-least-once delivery, use an idempotency key and ledger for each provider attempt, and treat a timeout as ambiguous before a bounded retry.",
    "I would apply backpressure, bounded exponential retries with jitter, prioritise transactional work, shed marketing traffic first, and monitor queue age and recovery throughput.",
  ];

  const unauthenticated = await fetch(new URL("/api/second-seat/sessions/not-a-session", baseUrl), {
    method: "PUT",
    headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify({ answers: [answers[0]] }),
  });
  assert.equal(unauthenticated.status, 401);

  const nonEntitled = await api("/api/second-seat/sessions/not-a-session", nonEntitledCookie, {
    method: "PUT",
    headers: { origin: baseUrl },
    body: JSON.stringify({ answers: [answers[0]] }),
  });
  assert.equal(nonEntitled.status, 403);

  const createdResponse = await api("/api/second-seat/sessions", learnerCookie, {
    method: "POST",
    headers: { origin: baseUrl },
    body: JSON.stringify({ mockId: "notification-service" }),
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.ok(created.session?.id);
  const sessionId = created.session.id;

  const wrongOrigin = await api(`/api/second-seat/sessions/${sessionId}`, learnerCookie, {
    method: "PUT",
    headers: { origin: "https://invalid.example" },
    body: JSON.stringify({ answers: [answers[0]] }),
  });
  assert.equal(wrongOrigin.status, 403);

  for (let index = 0; index < answers.length; index += 1) {
    const response = await api(`/api/second-seat/sessions/${sessionId}`, learnerCookie, {
      method: "PUT",
      headers: { origin: baseUrl },
      body: JSON.stringify({ answers: answers.slice(0, index + 1) }),
    });
    assert.equal(response.status, 200);
    const result = await response.json();
    assert.deepEqual(result.session.answers, answers.slice(0, index + 1));
    if (index < answers.length - 1) {
      assert.equal(result.session.status, "in_progress");
      assert.equal(result.session.evaluation, null);
    } else {
      assert.equal(result.session.status, "completed");
      assert.equal(result.session.evaluation?.evaluationSource, "ai");
      assert.equal(result.session.evaluation?.answerFeedback?.length, 3);
      assert.deepEqual(result.session.evaluation?.answerFeedback?.map((item) => item.originalAnswer), answers);
      assert.ok(result.session.evaluation?.answerFeedback?.every((item) => item.improvedAnswer.length > 30));
      assert.equal(JSON.stringify(result).includes(process.env.CEREBRAS_API_KEY ?? "never-present-secret"), false);
      assert.equal(JSON.stringify(result).includes(process.env.GROQ_API_KEY ?? "never-present-secret"), false);
    }
  }

  const directGet = await api(`/api/second-seat/sessions/${sessionId}`, learnerCookie);
  assert.equal(directGet.status, 200);
  const persisted = await directGet.json();
  assert.equal(persisted.session.evaluation?.evaluationSource, "ai");

  const foreignGet = await api(`/api/second-seat/sessions/${sessionId}`, otherAuthorizedCookie);
  assert.equal(foreignGet.status, 404);

  const feedbackResponse = await fetch(new URL(`/learn/feedback?sessionId=${encodeURIComponent(sessionId)}`, baseUrl), {
    headers: { cookie: learnerCookie, accept: "text/html" },
  });
  assert.equal(feedbackResponse.status, 200);
  const feedbackHtml = await feedbackResponse.text();
  assert.match(feedbackHtml, /Answer review/);
  assert.match(feedbackHtml, /Evaluation rubric/);
  assert.match(feedbackHtml, /Why this score/);
  assert.match(feedbackHtml, /originalAnswer/);
  assert.match(feedbackHtml, /improvedAnswer/);
});

test("concurrent final submissions keep one transcript paired with one AI evaluation", { skip: !runE2e }, async () => {
  assert.ok(sessionSecret.length >= 24, "AUTH_SESSION_SECRET must be configured for the local E2E run");
  const learnerCookie = await cookieFor("second-seat-e2e@vividlabsai.com");
  const firstTwo = [
    "I would clarify latency, peak volume, channel preferences, and ordering, then separate transactional from marketing traffic because their delivery promises differ.",
    "I would choose at-least-once delivery, use an idempotency key and durable ledger, and treat a provider timeout as ambiguous before retrying.",
  ];
  const competingFinalAnswers = [
    `${firstTwo[0]}`,
    `${firstTwo[1]}`,
    "I would use backpressure, bounded retries with jitter, prioritise transactional work, shed marketing traffic first, and monitor queue age during recovery.",
  ];
  const alternativeFinalAnswers = [
    `${firstTwo[0]}`,
    `${firstTwo[1]}`,
    "I would cap retries, isolate recovery capacity, preserve transactional priority, pause marketing work, and watch oldest queue age plus successful drain throughput.",
  ];

  const createdResponse = await api("/api/second-seat/sessions", learnerCookie, {
    method: "POST",
    headers: { origin: baseUrl },
    body: JSON.stringify({ mockId: "notification-service" }),
  });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  const sessionId = created.session.id;
  for (let index = 0; index < firstTwo.length; index += 1) {
    const response = await api(`/api/second-seat/sessions/${sessionId}`, learnerCookie, {
      method: "PUT",
      headers: { origin: baseUrl },
      body: JSON.stringify({ answers: firstTwo.slice(0, index + 1) }),
    });
    assert.equal(response.status, 200);
  }

  const responses = await Promise.all([
    api(`/api/second-seat/sessions/${sessionId}`, learnerCookie, {
      method: "PUT",
      headers: { origin: baseUrl },
      body: JSON.stringify({ answers: competingFinalAnswers }),
    }),
    api(`/api/second-seat/sessions/${sessionId}`, learnerCookie, {
      method: "PUT",
      headers: { origin: baseUrl },
      body: JSON.stringify({ answers: alternativeFinalAnswers }),
    }),
  ]);
  assert.ok(responses.every((response) => response.status === 200));

  const directGet = await api(`/api/second-seat/sessions/${sessionId}`, learnerCookie);
  assert.equal(directGet.status, 200);
  const persisted = (await directGet.json()).session;
  assert.equal(persisted.evaluation?.evaluationSource, "ai");
  assert.deepEqual(
    persisted.evaluation.answerFeedback.map((item) => item.originalAnswer),
    persisted.answers,
  );
  assert.ok(
    JSON.stringify(persisted.answers) === JSON.stringify(competingFinalAnswers)
      || JSON.stringify(persisted.answers) === JSON.stringify(alternativeFinalAnswers),
  );
});
