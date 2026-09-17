import assert from "node:assert/strict";
import { SignJWT } from "jose";

const baseUrl = new URL(required("VOICE_E2E_BASE_URL"));
const sessionSecret = required("AUTH_SESSION_SECRET");
assert.ok(sessionSecret.length >= 32, "AUTH_SESSION_SECRET is too short");

const runId = (process.env.GITHUB_RUN_ID ?? Date.now().toString()).replace(/[^0-9]/g, "");
const email = `staging-voice-${runId}@vividlabsai.com`;
const token = await new SignJWT({ email, hd: "vividlabsai.com", name: "Staging Voice verification" })
  .setProtectedHeader({ alg: "HS256", typ: "JWT" })
  .setSubject(`staging-voice-verification-${runId}`)
  .setIssuer("interviewrunway")
  .setAudience("interviewrunway-web")
  .setIssuedAt()
  .setExpirationTime("15m")
  .sign(new TextEncoder().encode(sessionSecret));
const cookie = `interviewrunway_session=${token}; ir_active_learner_plan=practice`;

const unauthenticated = await fetch(new URL("/api/voice/sessions", baseUrl), {
  headers: { accept: "application/json" },
});
assert.equal(unauthenticated.status, 401, "voice API must reject unauthenticated requests");
assert.match(unauthenticated.headers.get("cache-control") ?? "", /no-store/);

const learnerPage = await fetch(new URL("/learn/voice", baseUrl), {
  headers: { accept: "text/html", cookie },
  redirect: "manual",
});
assert.equal(learnerPage.status, 200, `voice learner page failed with HTTP ${learnerPage.status}`);

const created = await api("/api/voice/sessions", {
  method: "POST",
  body: JSON.stringify({
    interviewType: "behavioral",
    persona: "hiring_manager",
    language: "en",
    jobDescription: "Staging verification only: senior platform engineer.",
  }),
});
assert.equal(created.response.status, 201, requestFailure("create", created));
assert.ok(created.body?.session?.id, "create response did not include a voice session id");
const sessionId = created.body.session.id;

try {
  const consent = await api(`/api/voice/sessions/${encodeURIComponent(sessionId)}`, {
    method: "PATCH",
    body: JSON.stringify({ microphoneConsent: true, retainAudio: true }),
  });
  assert.equal(consent.response.status, 200, requestFailure("consent", consent));
  assert.equal(consent.body?.session?.audioRetentionApproved, true);

  const credentialResult = await api("/api/voice/token", {
    method: "POST",
    body: JSON.stringify({ sessionId }),
  });
  assert.equal(credentialResult.response.status, 201, requestFailure("credential", credentialResult));
  const credential = credentialResult.body?.credential;
  assert.equal(credential?.model, "gemini-3.8-live");
  assert.equal(
    credential?.websocketUrl,
    "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContentConstrained",
  );
  assert.ok(typeof credential?.token === "string" && credential.token.length >= 16, "ephemeral token is missing");
  assert.equal(JSON.stringify(credential).includes("GEMINI_API_KEY"), false);

  const timestamp = new Date().toISOString();
  const savedTurns = await api(`/api/voice/sessions/${encodeURIComponent(sessionId)}/turns`, {
    method: "POST",
    body: JSON.stringify({ turns: [
      { id: crypto.randomUUID(), speaker: "interviewer", text: "Tell me about an incident you led.", startedAt: timestamp, endedAt: timestamp },
      { id: crypto.randomUUID(), speaker: "candidate", text: "I led recovery, changed retry policy, and reduced recovery time by 30 percent.", startedAt: timestamp, endedAt: timestamp, latencyMs: 420 },
    ] }),
  });
  assert.equal(savedTurns.response.status, 200, requestFailure("turn checkpoint", savedTurns));

  const audio = await api(`/api/voice/sessions/${encodeURIComponent(sessionId)}/audio?sequence=0`, {
    method: "PUT",
    headers: { "content-type": "audio/webm" },
    body: new Uint8Array([0x1a, 0x45, 0xdf, 0xa3]),
  });
  assert.equal(audio.response.status, 200, requestFailure("approved R2 audio", audio));

  const detail = await api(`/api/voice/sessions/${encodeURIComponent(sessionId)}`);
  assert.equal(detail.response.status, 200, requestFailure("detail", detail));
  assert.equal(detail.body?.session?.status, "in_progress");
  assert.equal(detail.body?.session?.turns?.length, 2);
  assert.equal(detail.body?.session?.audioRetentionApproved, true);
} finally {
  const deleted = await api(`/api/voice/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
  assert.equal(deleted.response.status, 200, requestFailure("delete", deleted));
}

const missing = await api(`/api/voice/sessions/${encodeURIComponent(sessionId)}`);
assert.equal(missing.response.status, 404, "deleted voice session must no longer be readable");

console.log("VOICE_VERIFY_RESULT=" + JSON.stringify({
  route: "ok",
  authentication: "ok",
  d1: "ok",
  geminiCredential: "ok",
  r2ApprovedAudio: "put-and-delete-ok",
  transcriptDelete: "ok",
}));

async function api(pathname, init = {}) {
  const response = await fetch(new URL(pathname, baseUrl), {
    ...init,
    headers: {
      accept: "application/json",
      cookie,
      origin: baseUrl.origin,
      ...init.headers,
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
