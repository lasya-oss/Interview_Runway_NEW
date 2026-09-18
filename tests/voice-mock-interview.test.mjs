import assert from "node:assert/strict";
import test from "node:test";

import { diagnoseVoiceSession, interviewAnswers, VOICE_RUBRIC_VERSION } from "../app/lib/voice-diagnosis.ts";
import { createVoiceReportMessage } from "../app/lib/voice-report-gmail.ts";
import { createVoiceReportPdf } from "../app/lib/voice-report-pdf.ts";
import {
  createGeminiVoiceToken,
  createVoiceLiveConfig,
  GEMINI_LIVE_MODEL,
  GEMINI_LIVE_WEBSOCKET_URL,
} from "../app/lib/voice-token.ts";

const NOW = new Date("2026-09-17T12:00:00.000Z");

function session(overrides = {}) {
  return {
    id: "voice-session-test-1",
    interviewType: "behavioral",
    persona: "hiring_manager",
    language: "en",
    jobDescription: "Senior platform engineer owning distributed systems.",
    candidateProfile: {
      profileId: "profile-1",
      profileRevision: 1,
      name: "Senior platform role",
      targetRole: "Senior Platform Engineer",
      focus: "Reliability and technical leadership",
      customGuidance: "Ask about trade-offs.",
      resumeText: "Reduced incident recovery time by 30 percent.",
      jobDescriptionText: "Own availability and cross-team design.",
      updatedAt: NOW.toISOString(),
    },
    status: "in_progress",
    consentAt: NOW.toISOString(),
    audioRetentionApproved: false,
    audioRetained: false,
    createdAt: NOW.toISOString(),
    startedAt: NOW.toISOString(),
    endedAt: null,
    updatedAt: NOW.toISOString(),
    ...overrides,
  };
}

const turns = [
  {
    id: "turn-1",
    speaker: "interviewer",
    text: "Tell me about a reliability incident you led.",
    startedAt: NOW.toISOString(),
    endedAt: NOW.toISOString(),
    toolCalls: [],
  },
  {
    id: "turn-2",
    speaker: "candidate",
    text: "The situation was a queue backlog. My task was recovery. I changed retry limits, and the result was 30% faster recovery.",
    startedAt: NOW.toISOString(),
    endedAt: NOW.toISOString(),
    toolCalls: [],
  },
];

test("Gemini credential is short-lived, constrained, and never returns the server API key", async () => {
  let request;
  const credential = await createGeminiVoiceToken(session(), {
    apiKey: "server-only-gemini-key",
    now: () => NOW,
    fetchImpl: async (url, init) => {
      request = { url, init, body: JSON.parse(init.body) };
      return Response.json({ name: `auth_tokens/${"a".repeat(48)}` });
    },
  });

  assert.equal(request.url, "https://generativelanguage.googleapis.com/v1beta/auth_tokens");
  assert.equal(request.init.headers.get("x-goog-api-key"), "server-only-gemini-key");
  assert.equal(request.body.uses, 1);
  assert.equal(request.body.liveConnectConstraints.model, `models/${GEMINI_LIVE_MODEL}`);
  assert.deepEqual(request.body.liveConnectConstraints.config.sessionResumption, {});
  assert.deepEqual(request.body.liveConnectConstraints.config.contextWindowCompression, { slidingWindow: {} });
  assert.deepEqual(request.body.liveConnectConstraints.config.responseModalities, ["AUDIO"]);
  assert.equal(request.body.liveConnectConstraints.config.generationConfig, undefined);
  assert.equal(Date.parse(credential.newSessionExpireTime) - NOW.getTime(), 60_000);
  assert.equal(Date.parse(credential.expireTime) - NOW.getTime(), 31 * 60_000);
  assert.equal(credential.websocketUrl, GEMINI_LIVE_WEBSOCKET_URL);
  assert.equal(credential.resumeFromTranscript, false);
  assert.equal(JSON.stringify(credential).includes("server-only-gemini-key"), false);
});

test("Gemini credential failures distinguish invalid keys from request configuration", async () => {
  await assert.rejects(
    createGeminiVoiceToken(session(), {
      apiKey: "invalid-test-key",
      fetchImpl: async () => Response.json({
        error: { details: [{ reason: "API_KEY_INVALID" }] },
      }, { status: 400 }),
    }),
    (error) => error?.code === "authorization" && error?.providerStatus === 400,
  );
  await assert.rejects(
    createGeminiVoiceToken(session(), {
      apiKey: "valid-test-key",
      fetchImpl: async () => Response.json({ error: {} }, { status: 400 }),
    }),
    (error) => error?.code === "request" && error?.providerStatus === 400,
  );
  await assert.rejects(
    createGeminiVoiceToken(session(), {
      apiKey: "test-key",
      fetchImpl: async () => { throw new TypeError("diagnostic transport failure"); },
    }),
    (error) => error?.code === "transport" && error?.providerStatus === undefined,
  );
});

test("live configuration covers both interview modes and keeps grounding server-authored", () => {
  const behavioral = createVoiceLiveConfig(session());
  const roleSpecific = createVoiceLiveConfig(session({ interviewType: "role_specific", persona: "peer_engineer", turns }));
  const behavioralPrompt = behavioral.systemInstruction.parts[0].text;
  const rolePrompt = roleSpecific.systemInstruction.parts[0].text;

  assert.match(behavioralPrompt, /behavioral interview/i);
  assert.match(behavioralPrompt, /STAR evidence/i);
  assert.match(rolePrompt, /role-specific engineering interview/i);
  assert.match(rolePrompt, /peer engineer/i);
  assert.match(rolePrompt, /30 minutes/);
  assert.match(rolePrompt, /Previous transcript from this same session/);
  assert.deepEqual(
    behavioral.tools[0].functionDeclarations.map((tool) => tool.name),
    ["getCandidateProfile", "getJobDescription", "getPrepMaterial", "saveInterviewerNote"],
  );
  assert.ok(behavioral.tools[0].functionDeclarations.every((tool) => tool.behavior === "NON_BLOCKING"));
});

test("offline diagnosis scores exact transcript evidence and resolves product drills", async () => {
  assert.deepEqual(interviewAnswers(turns), [{
    question: turns[0].text,
    answer: turns[1].text,
  }]);

  const score = await diagnoseVoiceSession(session({ turns }), {
    env: { CEREBRAS_API_KEY: "test-key" },
    now: () => NOW,
    fetchImpl: async () => Response.json({
      choices: [{ message: { content: JSON.stringify({
        per_answer: [{
          question: "Invented model question",
          answer: "Invented model answer",
          structure: 4,
          specificity: 4,
          relevance: 5,
          communication: 4,
          feedback: "Lead with the result, then make the trade-off explicit.",
        }],
        session_verdict: "Strong evidence with one clarity pass remaining.",
        strengths: ["Concrete operational result"],
        gaps: ["Clarify the trade-off"],
        drill_topics: ["behavioral STAR evidence"],
      }) } }],
    }),
  });

  assert.equal(score.rubricVersion, VOICE_RUBRIC_VERSION);
  assert.equal(score.provider, "cerebras");
  assert.equal(score.perAnswer[0].question, turns[0].text);
  assert.equal(score.perAnswer[0].answer, turns[1].text);
  assert.equal(score.recommendedDrills.length > 0, true);
  assert.match(score.recommendedDrills[0].slug, /^[a-z0-9-]+$/);
});

test("report PDF and Gmail MIME bind the completed score to the learner", () => {
  const completed = session({
    status: "completed",
    endedAt: NOW.toISOString(),
    turns: [...turns, {
      id: "tool-note-1",
      speaker: "interviewer",
      text: "",
      startedAt: NOW.toISOString(),
      endedAt: NOW.toISOString(),
      toolCalls: [{
        name: "saveInterviewerNote",
        arguments: { note: "Candidate quantified recovery impact." },
        result: { saved: true, note: "Candidate quantified recovery impact." },
        createdAt: NOW.toISOString(),
      }],
    }],
    score: {
      rubricVersion: VOICE_RUBRIC_VERSION,
      perAnswer: [{
        question: turns[0].text,
        answer: turns[1].text,
        structure: 4,
        specificity: 4,
        relevance: 5,
        communication: 4,
        feedback: "Make the decision trade-off explicit.",
      }],
      sessionVerdict: "Strong evidence with one clarity pass remaining.",
      strengths: ["Concrete result"],
      gaps: ["Explicit trade-off"],
      recommendedDrills: [{ slug: "behavioral-story-bank", title: "Behavioral story bank", reason: "Build reusable evidence." }],
      provider: "cerebras",
      model: "gpt-oss-120b",
      createdAt: NOW.toISOString(),
    },
  });
  const pdf = createVoiceReportPdf(completed);
  assert.equal(new TextDecoder().decode(pdf.slice(0, 8)), "%PDF-1.4");
  assert.ok(pdf.byteLength > 1_000);
  assert.match(new TextDecoder().decode(pdf), /Candidate quantified recovery impact/);

  const message = createVoiceReportMessage({
    senderEmail: "reports@interviewrunway.com",
    recipient: "candidate@example.com",
    session: completed,
    pdf,
    sentAt: NOW,
  });
  assert.match(message, /To: candidate@example\.com/);
  assert.match(message, /Content-Type: application\/pdf/);
  assert.match(message, /voice-mock-interview-report\.pdf/);
  const encodedText = message
    .split('Content-Transfer-Encoding: base64\r\n\r\n', 2)[1]
    .split("\r\n\r\n--", 1)[0]
    .replaceAll("\r\n", "");
  assert.match(Buffer.from(encodedText, "base64").toString("utf8"), /Strong evidence with one clarity pass remaining/);
});
