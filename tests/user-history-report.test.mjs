import assert from "node:assert/strict";
import test from "node:test";
import {
  SECOND_SEAT_MOCKS,
} from "../app/lib/second-seat-engine.ts";
import {
  buildUserHistoryReportFromRows,
  isReportTargetEmail,
} from "../app/lib/user-history-report.ts";
import { TWELVE_WEEK_PLAN } from "../app/lib/roadmap-data.ts";

const learnerEmail = "learner@vividlabsai.com";
const mock = SECOND_SEAT_MOCKS[0];

test("user history reports normalize the selected learner and preserve stored journey evidence", () => {
  const task = TWELVE_WEEK_PLAN[0].tasks[0];
  const report = buildUserHistoryReportFromRows(
    learnerEmail.toUpperCase(),
    {
      entitlements: [
        {
          id: "entitlement-vault",
          userEmail: learnerEmail,
          offer: "vault",
          status: "active",
          paddleTransactionId: "txn-vault",
          createdAt: "2026-08-01T10:00:00.000Z",
          updatedAt: "2026-08-01T10:00:00.000Z",
          lastEventAt: "2026-08-01T10:00:00.000Z",
        },
        {
          id: "entitlement-second-seat",
          userEmail: learnerEmail,
          offer: "ai-prep",
          status: "active",
          paddleTransactionId: "txn-second-seat",
          createdAt: "2026-08-03T10:00:00.000Z",
          updatedAt: "2026-08-03T10:00:00.000Z",
          lastEventAt: "2026-08-03T10:00:00.000Z",
        },
      ],
      progress: {
        userEmail: learnerEmail,
        completedTaskIds: JSON.stringify([task.id]),
        completionActivity: JSON.stringify({ [task.id]: "2026-08-04" }),
        focusedSeconds: 3661,
        progressPercent: 1,
        updatedAt: "2026-08-04T10:00:00.000Z",
      },
      sessions: [
        {
          id: "session-1",
          userEmail: learnerEmail,
          mockId: mock.id,
          status: "completed",
          answers: JSON.stringify([
            "I would clarify latency and volume first because transactional messages need a 30-second SLO while marketing traffic can wait. I would then separate priority and ordering.",
            "I would choose at-least-once delivery, store an idempotency key in a ledger, and record a provider timeout so retries do not create duplicate sends.",
            "I would apply backpressure, bound retries with jitter, shed marketing work, and monitor queue age and recovery throughput.",
          ]),
          evaluation: null,
          startedAt: "2026-08-05T10:00:00.000Z",
          completedAt: "2026-08-05T10:30:00.000Z",
          updatedAt: "2026-08-05T10:30:00.000Z",
        },
      ],
      qualifications: [
        {
          id: "qualification-1",
          accountEmail: learnerEmail,
          phaseOneStatus: "complete",
          phaseTwoStatus: "pending",
          whatsappSupportPerson: "Support",
          targetRole: "Staff engineer",
          visibleGap: "Make influence evidence measurable.",
          additionalContext: "Bring two cross-team examples.",
          consent: true,
          status: "submitted",
          notificationStatus: "pending",
          notificationAttempts: 0,
          notificationLastError: null,
          notifiedAt: null,
          createdAt: "2026-08-06T10:00:00.000Z",
          updatedAt: "2026-08-06T10:00:00.000Z",
        },
      ],
    },
    { generatedAt: new Date("2026-08-07T10:00:00.000Z") },
  );

  assert.equal(report.learner.email, learnerEmail);
  assert.equal(report.learner.joinedAt, "2026-08-01T10:00:00.000Z");
  assert.equal(report.access.currentPlan, "The Second Seat");
  assert.equal(report.vault.completedTaskCount, 1);
  assert.equal(report.vault.completedTasks[0].completedAt, "2026-08-04");
  assert.equal(report.vault.focusedSeconds, 3661);
  assert.equal(report.secondSeat.completedSessionCount, 1);
  assert.equal(report.secondSeat.sessions[0].score !== null, true);
  assert.equal(report.feedback.length, 2);
  const timelineTime = (date) => new Date(date.length === 10 ? `${date}T12:00:00.000Z` : date).getTime();
  assert.equal(report.timeline.every((event, index, events) => index === 0 || timelineTime(event.date) >= timelineTime(events[index - 1].date)), true);
  assert.match(new TextDecoder().decode(report.pdf.bytes), /learner@vividlabsai\.com/);
  assert.match(new TextDecoder().decode(report.pdf.bytes), /not-recorded/i);
  assert.match(report.pdf.filename, /^interviewrunway-user-history-learner-vividlabsai-com\.pdf$/);
});

test("user history target validation is limited to the configured learner domain", () => {
  assert.equal(isReportTargetEmail(" Learner@VividLabsAI.com "), true);
  assert.equal(isReportTargetEmail("learner@example.com"), false);
  assert.equal(isReportTargetEmail("learner@vividlabsai.com.attacker.example"), false);
  assert.equal(isReportTargetEmail("not-an-email"), false);
});
