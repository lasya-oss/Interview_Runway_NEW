import assert from "node:assert/strict";
import test from "node:test";
import { findSecondSeatMock } from "../app/lib/second-seat-engine.ts";
import {
  buildUserHistoryReport,
  normalizeLearnerSearchQuery,
} from "../app/lib/user-history.ts";
import { isAuthorizedUserHistoryOperator } from "../app/lib/user-history-access.ts";
import { createUserHistoryPdf } from "../app/lib/user-history-pdf.ts";
import { createLearnerSearchHandler } from "../app/api/admin/user-history/learners/route.ts";
import { createUserHistoryReportHandler } from "../app/api/admin/user-history/report/route.ts";

const generatedAt = "2026-09-05T10:15:30.000Z";

test("user-history authorization reuses the exact configured internal domain", () => {
  assert.equal(isAuthorizedUserHistoryOperator("admin@vividlabsai.com", "vividlabsai.com"), true);
  assert.equal(isAuthorizedUserHistoryOperator("ADMIN@VIVIDLABSAI.COM", "vividlabsai.com"), true);
  assert.equal(isAuthorizedUserHistoryOperator("learner@example.com", "vividlabsai.com"), false);
  assert.equal(isAuthorizedUserHistoryOperator("admin@team.vividlabsai.com", "vividlabsai.com"), false);
  assert.equal(isAuthorizedUserHistoryOperator("admin@vividlabsai.com", ""), false);
  assert.equal(normalizeLearnerSearchQuery(" First_Last@Example.com "), "first_last@example.com");
});

test("authorized route handlers search and return a private server-generated PDF", async () => {
  const operator = {
    displayName: "Internal reviewer",
    email: "reviewer@vividlabsai.com",
    fullName: "Internal Reviewer",
  };
  const authorize = async () => ({ ok: true, user: operator });
  let capturedQuery = "";
  const search = createLearnerSearchHandler({
    authorize,
    search: async (query) => {
      capturedQuery = query;
      return [{ email: "learner@vividlabsai.com" }];
    },
  });
  const searchResponse = await search(new Request("https://interviewrunway.com/api/admin/user-history/learners", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://interviewrunway.com" },
    body: JSON.stringify({ query: "learner@" }),
  }));
  assert.equal(searchResponse.status, 200);
  assert.equal(capturedQuery, "learner@");
  assert.deepEqual(await searchResponse.json(), { learners: [{ email: "learner@vividlabsai.com" }] });

  let loadedRequest;
  const generate = createUserHistoryReportHandler({
    authorize,
    loadSources: async (request) => {
      loadedRequest = request;
      return fixture({
        learnerEmail: request.learnerEmail,
        learnerName: request.learnerName,
        generatedByEmail: request.generatedByEmail,
      });
    },
  });
  const reportResponse = await generate(new Request("https://interviewrunway.com/api/admin/user-history/report", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://interviewrunway.com" },
    body: JSON.stringify({ learnerEmail: "learner@vividlabsai.com" }),
  }));
  assert.equal(reportResponse.status, 200);
  assert.deepEqual(loadedRequest, {
    learnerEmail: "learner@vividlabsai.com",
    learnerName: null,
    generatedByEmail: operator.email,
  });
  assert.equal(reportResponse.headers.get("content-type"), "application/pdf");
  assert.equal(reportResponse.headers.get("cache-control"), "private, no-store");
  assert.equal(reportResponse.headers.get("x-content-type-options"), "nosniff");
  assert.match(reportResponse.headers.get("content-disposition") ?? "", /attachment; filename="interviewrunway-user-history-report\.pdf"/i);
  const bytes = Buffer.from(await reportResponse.arrayBuffer());
  assert.ok(bytes.length > 2_000);
  assert.equal(bytes.subarray(0, 8).toString("latin1"), "%PDF-1.4");
});

test("the report consolidates real records, recomputes progress, and keeps missing sources explicit", () => {
  const report = buildUserHistoryReport(fixture());

  assert.equal(report.learner.email, "learner@vividlabsai.com");
  assert.match(report.executiveSummary.currentPlan, /Not recorded.*Vault.*Second Seat.*Human Calibration/i);
  assert.equal(report.roadmap.vault.completedTaskCount, 1);
  assert.equal(report.roadmap.secondSeat.completedTaskCount, 1);
  assert.equal(report.roadmap.unmappedCompletedTasks.length, 1);
  assert.equal(report.roadmap.unmappedCompletedTasks[0].id, "4w-3-correct");
  assert.equal(report.executiveSummary.completedRoadmapTasks, 3);
  assert.equal(report.practiceSessions.length, 2);
  assert.equal(report.feedbackHistory.length, 2);
  assert.equal(report.feedbackHistory[1].scoreChange, 0);
  assert.equal(report.feedbackHistory[0].date, "2026-07-04T09:30:00.000Z");
  assert.match(report.feedbackHistory[0].source, /deterministic transcript evaluation/i);
  assert.match(report.humanCalibration.sessionHistoryStatus, /^No recorded activity/i);
  assert.match(report.meetingCopilot.status, /^No recorded activity/i);
  assert.match(report.apiAndShowcase.status, /^No recorded activity/i);

  const timelineIds = report.timeline.map((event) => event.id);
  assert.equal(new Set(timelineIds).size, timelineIds.length);
  assert.equal(report.timeline.filter((event) => event.id === "checkout:checkout-1:started").length, 1);
  assert.equal(report.timeline.filter((event) => event.id === "entitlement:entitlement-1:active").length, 1);
  assert.equal(report.timeline.filter((event) => event.id === "checkout:checkout-1:completed").length, 0);
  assert.equal(report.timeline.filter((event) => event.state === "feedback").length, 2);
  assert.match(report.timeline.find((event) => event.id === "practice:practice-1:completed")?.detail ?? "", /Feedback generated.*\/100/i);
  assert.match(report.timeline.find((event) => event.id === "practice:practice-1:completed")?.detail ?? "", /Primary improvement|Recommended next action/i);
  assert.ok(report.timeline.some((event) => event.id === "progress:2026-07-03T10:00:00.000Z"));
  assert.equal(report.timeline[0].timestamp, "2026-07-01T07:55:00.000Z");
  assert.equal(report.timeline.at(-1).timestamp, "2026-07-06T11:00:00.000Z");
});

test("the server PDF is branded, structured, A4, deterministic, and script-free", () => {
  const report = buildUserHistoryReport(fixture());
  const first = createUserHistoryPdf(report);
  const second = createUserHistoryPdf(report);
  assert.deepEqual(first, second);

  const raw = Buffer.from(first).toString("latin1");
  assert.ok(raw.startsWith("%PDF-1.4"));
  assert.match(raw, /\/MediaBox \[0 0 595\.28 841\.89\]/);
  assert.match(raw, /\/Title \(Interview Runway User History Report - learner@vividlabsai\.com\)/);
  assert.match(raw, /Executive summary/i);
  assert.match(raw, /Activity timeline/i);
  assert.match(raw, /Assessments and scores/i);
  assert.match(raw, /Feedback history/i);
  assert.match(raw, /Human Calibration/i);
  assert.match(raw, /Meeting Copilot and showcase history/i);
  assert.match(raw, /Current status and next steps/i);
  assert.match(raw, /BEST PRACTICE SCORE/i);
  assert.match(raw, /COMPLETED ROADMAP TASKS/i);
  assert.match(raw, /LEGACY OR UNPUBLISHED COMPLETIONS/i);
  assert.match(raw, /xref\n0 \d+/);
  assert.match(raw, /startxref\n\d+/);
  const xrefOffset = Number(raw.match(/startxref\n(\d+)/)?.[1]);
  assert.equal(raw.slice(xrefOffset, xrefOffset + 4), "xref");
  assert.doesNotMatch(raw, /\/JavaScript|\/JS\b|\/OpenAction/);
  assert.ok((raw.match(/\/Type \/Page /g) ?? []).length >= 6);

  const streams = [...raw.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((match) => match[1]);
  assert.ok(streams.length >= 6);
  for (const stream of streams) {
    assert.ok(meaningfulTextCommands(stream) >= 1, "Every PDF page should contain meaningful visible text");
  }
});

test("sparse and dense histories paginate without blank pages or unsafe text", () => {
  const sparse = fixture({
    entitlements: [],
    checkouts: [],
    progress: {
      completedTaskIds: "[]",
      completionActivity: "{}",
      focusedSeconds: 0,
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    practiceSessions: [],
    qualificationApplications: [],
  });
  const sparseReport = buildUserHistoryReport(sparse);
  assert.equal(sparseReport.timeline.length, 1);
  assert.equal(sparseReport.timeline[0].source, "learner_progress.updated_at");
  assert.match(sparseReport.currentState.latestFeedback, /No recorded feedback/i);
  const sparseRaw = Buffer.from(createUserHistoryPdf(sparseReport)).toString("latin1");
  assert.match(sparseRaw, /No recorded activity/);

  const denseQualifications = Array.from({ length: 28 }, (_, index) => ({
    id: `qualification-${index}`,
    phaseOneStatus: "completed",
    phaseTwoStatus: "in_progress",
    targetRole: `Senior platform engineer ${index}`,
    visibleGap: `Needs stronger evidence for incident ownership (round ${index}) \\ and clearer follow-up decisions.\nNo invented data.`,
    additionalContext: `Recorded context ${index}: compare the constraint, decision, consequence, and measurable outcome without repeating filler.`,
    status: "submitted",
    createdAt: new Date(Date.UTC(2026, 6, 7 + index, 8, 0, 0)).toISOString(),
    updatedAt: new Date(Date.UTC(2026, 6, 7 + index, 8, 0, 0)).toISOString(),
  }));
  denseQualifications[0].visibleGap = "V".repeat(1_200);
  denseQualifications[0].additionalContext = "C".repeat(1_500);
  const denseReport = buildUserHistoryReport(fixture({ qualificationApplications: denseQualifications }));
  const denseRaw = Buffer.from(createUserHistoryPdf(denseReport)).toString("latin1");
  const pageCount = (denseRaw.match(/\/Type \/Page /g) ?? []).length;
  assert.ok(pageCount > 10, `Expected a dense multipage report, received ${pageCount} pages`);
  assert.doesNotMatch(denseRaw, /\x00|\x01|\x02/);
  for (const stream of [...denseRaw.matchAll(/stream\n([\s\S]*?)\nendstream/g)].map((match) => match[1])) {
    assert.ok(meaningfulTextCommands(stream) >= 1, "Dense report must not contain blank content pages");
  }
});

test("access resolution and score progression follow production prerequisites and completion order", () => {
  const mock = findSecondSeatMock("notification-service");
  assert.ok(mock);
  const answers = mock.turns.map((turn) => `I would ${turn.signals.join(" and ")} and measure the result.`);
  const source = fixture({
    internalFullAccess: false,
    entitlements: [{
      id: "second-seat-only",
      offer: "ai-prep",
      status: "active",
      transactionId: "second-seat-only",
      createdAt: "2026-07-01T08:00:00.000Z",
      updatedAt: "2026-07-01T08:00:00.000Z",
      lastEventAt: "2026-07-01T08:00:00.000Z",
    }],
    checkouts: [],
    practiceSessions: [
      {
        id: "started-first-completed-last",
        mockId: mock.id,
        status: "completed",
        answers: JSON.stringify(answers),
        startedAt: "2026-07-04T09:00:00.000Z",
        completedAt: "2026-07-04T11:00:00.000Z",
        updatedAt: "2026-07-04T11:00:00.000Z",
      },
      {
        id: "started-last-completed-first",
        mockId: mock.id,
        status: "completed",
        answers: JSON.stringify(answers),
        startedAt: "2026-07-04T09:30:00.000Z",
        completedAt: "2026-07-04T10:00:00.000Z",
        updatedAt: "2026-07-04T10:00:00.000Z",
      },
    ],
  });
  const report = buildUserHistoryReport(source);
  assert.equal(report.executiveSummary.currentPlan, "No active paid plan recorded");
  assert.match(report.executiveSummary.currentStatus, /does not satisfy production access prerequisites/i);
  assert.equal(report.feedbackHistory[0].id, "feedback:started-last-completed-first");
  assert.equal(report.feedbackHistory[1].id, "feedback:started-first-completed-last");
  assert.equal(report.currentState.latestRecordedActivity?.id, "qualification:qualification-1");
});

test("timeline uses source event time and consolidates mirrored terminal checkout records", () => {
  const report = buildUserHistoryReport(fixture({
    internalFullAccess: false,
    progress: null,
    practiceSessions: [],
    qualificationApplications: [],
    entitlements: [{
      id: "revoked-entitlement",
      offer: "vault",
      status: "revoked",
      transactionId: "revoked-transaction",
      createdAt: "2026-07-01T08:00:03.000Z",
      updatedAt: "2026-07-08T08:00:03.000Z",
      lastEventAt: "2026-07-08T08:00:00.000Z",
    }],
    checkouts: [{
      id: "revoked-checkout",
      offer: "vault",
      status: "revoked",
      transactionId: "revoked-transaction",
      createdAt: "2026-07-01T07:55:00.000Z",
      updatedAt: "2026-07-08T08:00:03.000Z",
      expiresAt: "2026-07-01T08:15:00.000Z",
      lastEventAt: "2026-07-08T08:00:00.000Z",
    }],
  }));
  assert.equal(report.timeline.filter((event) => event.id === "checkout:revoked-checkout:revoked").length, 0);
  assert.equal(report.timeline.find((event) => event.id === "entitlement:revoked-entitlement:revoked")?.timestamp, "2026-07-08T08:00:00.000Z");
});

function meaningfulTextCommands(stream) {
  return [...stream.matchAll(/1 0 0 1 [-\d.]+ ([-\d.]+) Tm \([\s\S]*?\) Tj ET/g)]
    .filter((match) => Number(match[1]) >= 48 && Number(match[1]) <= 790)
    .length;
}

function fixture(overrides = {}) {
  const mock = findSecondSeatMock("notification-service");
  assert.ok(mock);
  const answers = mock.turns.map((turn) => (
    `I would first ${turn.relevance.answerCues[0] ?? "choose the operating boundary"} because ${turn.signals.slice(0, 4).join(", ")}. Then I would measure the user consequence and revisit the trade-off.`
  ));

  const source = {
    learnerEmail: "learner@vividlabsai.com",
    learnerName: "Learner (Verified)",
    generatedByEmail: "admin@vividlabsai.com",
    generatedAt,
    internalFullAccess: true,
    entitlements: [{
      id: "entitlement-1",
      offer: "vault",
      status: "active",
      transactionId: "transaction-1",
      createdAt: "2026-07-01T08:00:00.000Z",
      updatedAt: "2026-07-01T08:00:00.000Z",
      lastEventAt: "2026-07-01T08:00:00.000Z",
    }],
    checkouts: [{
      id: "checkout-1",
      offer: "vault",
      status: "completed",
      transactionId: "transaction-1",
      createdAt: "2026-07-01T07:55:00.000Z",
      updatedAt: "2026-07-01T08:00:00.000Z",
      expiresAt: "2026-07-01T08:15:00.000Z",
      lastEventAt: "2026-07-01T08:00:00.000Z",
    }],
    progress: {
      completedTaskIds: JSON.stringify(["12w-1-map", "4w-2-window", "4w-3-correct"]),
      completionActivity: JSON.stringify({ "12w-1-map": "2026-07-02", "4w-2-window": "2026-07-03", "4w-3-correct": "2026-07-03" }),
      focusedSeconds: 7_620,
      updatedAt: "2026-07-03T10:00:00.000Z",
    },
    practiceSessions: [
      {
        id: "practice-1",
        mockId: mock.id,
        status: "completed",
        answers: JSON.stringify(answers),
        startedAt: "2026-07-04T09:00:00.000Z",
        completedAt: "2026-07-04T09:30:00.000Z",
        updatedAt: "2026-07-04T09:30:00.000Z",
      },
      {
        id: "practice-2",
        mockId: mock.id,
        status: "completed",
        answers: JSON.stringify(answers),
        startedAt: "2026-07-05T09:00:00.000Z",
        completedAt: "2026-07-05T09:30:00.000Z",
        updatedAt: "2026-07-05T09:30:00.000Z",
      },
    ],
    qualificationApplications: [{
      id: "qualification-1",
      phaseOneStatus: "completed",
      phaseTwoStatus: "completed",
      targetRole: "Senior platform engineer",
      visibleGap: "Make cross-team influence and the measurable operating consequence easier to assess.",
      additionalContext: "The learner requested targeted scope calibration.",
      status: "submitted",
      createdAt: "2026-07-06T11:00:00.000Z",
      updatedAt: "2026-07-06T11:00:00.000Z",
    }],
    ...overrides,
  };
  return source;
}
