import { asc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import {
  entitlements,
  learnerProgress,
  qualificationApplications,
  secondSeatSessions,
} from "@/db/schema";
import { evaluateSecondSeatSession, findSecondSeatMock, type SecondSeatEvaluation } from "@/app/lib/second-seat-engine";
import { isInternalFullAccessEmail } from "@/app/lib/internal-access";
import { roadmapPlanForWeeks, roadmapProgressFor, type RoadmapProgressSnapshot } from "@/app/lib/learner-progress";
import { createTextPdf } from "@/app/lib/text-pdf";

const DEFAULT_ALLOWED_DOMAIN = "vividlabsai.com";
const MAX_LEARNER_RESULTS = 50;

type EntitlementRecord = typeof entitlements.$inferSelect;
type LearnerProgressRecord = typeof learnerProgress.$inferSelect;
type SecondSeatSessionRecord = typeof secondSeatSessions.$inferSelect;
type QualificationRecord = typeof qualificationApplications.$inferSelect;

type ReportRows = {
  entitlements: EntitlementRecord[];
  progress: LearnerProgressRecord | null;
  sessions: SecondSeatSessionRecord[];
  qualifications: QualificationRecord[];
};

export type UserHistoryLearner = {
  email: string;
  name: null;
  firstRecordedAt: string | null;
  lastActivityAt: string | null;
  activityCount: number;
  sourceCount: number;
  access: string[];
};

export type UserHistoryReport = {
  generatedAt: string;
  learner: {
    email: string;
    name: string | null;
    joinedAt: string | null;
    firstRecordedAt: string | null;
    lastActivityAt: string | null;
  };
  access: {
    vault: boolean;
    secondSeat: boolean;
    humanCalibration: boolean;
    currentPlan: string;
    currentStatus: string;
  };
  planTransitions: readonly {
    plan: string;
    status: string;
    startedAt: string | null;
    updatedAt: string | null;
  }[];
  vault: {
    status: string;
    startedAt: string | null;
    roadmapWeeks: number;
    progressPercent: number;
    currentWeek: number;
    completedTaskCount: number;
    totalTaskCount: number;
    attemptedTaskCount: number | null;
    focusedSeconds: number;
    lastUpdatedAt: string | null;
    completedTasks: readonly {
      week: number;
      title: string;
      completedAt: string | null;
    }[];
  };
  secondSeat: {
    status: string;
    startedAt: string | null;
    sessionCount: number;
    completedSessionCount: number;
    inProgressSessionCount: number;
    sessions: readonly {
      id: string;
      title: string;
      category: string;
      status: "completed" | "in_progress";
      startedAt: string;
      completedAt: string | null;
      answerCount: number;
      turnCount: number;
      score: number | null;
      dimensions: readonly { label: string; score: number }[];
    }[];
  };
  humanCalibration: {
    status: string;
    applications: readonly {
      date: string;
      phaseOneStatus: string;
      phaseTwoStatus: string;
      targetRole: string;
      visibleGap: string;
      additionalContext: string | null;
      status: string;
    }[];
    sessionsStatus: "not-recorded";
    feedbackStatus: "not-recorded";
  };
  meetingCopilot: {
    status: "not-recorded";
    detail: string;
  };
  apiShowcase: {
    status: "not-recorded";
    detail: string;
  };
  feedback: readonly {
    date: string;
    source: string;
    relatedActivity: string;
    score: number | null;
    scoreDelta: number | null;
    whatWentWell: readonly string[];
    needsImprovement: readonly string[];
    recommendations: readonly string[];
  }[];
  timeline: readonly {
    date: string;
    kind: "completed" | "attempted" | "feedback" | "plan" | "status";
    title: string;
    detail: string;
  }[];
  dataNotes: readonly string[];
  pdf: {
    filename: string;
    bytes: Uint8Array;
  };
};

export async function listUserHistoryLearners(
  query = "",
  currentUserEmail?: string,
): Promise<UserHistoryLearner[]> {
  const db = await getDb();
  const [entitlementRows, progressRows, sessionRows, qualificationRows] = await Promise.all([
    db.select().from(entitlements).orderBy(asc(entitlements.createdAt)),
    db.select({ email: learnerProgress.userEmail, updatedAt: learnerProgress.updatedAt }).from(learnerProgress),
    db.select({ email: secondSeatSessions.userEmail, startedAt: secondSeatSessions.startedAt, updatedAt: secondSeatSessions.updatedAt, status: secondSeatSessions.status }).from(secondSeatSessions),
    db.select({ email: qualificationApplications.accountEmail, createdAt: qualificationApplications.createdAt, updatedAt: qualificationApplications.updatedAt }).from(qualificationApplications),
  ]);

  const candidates = new Map<string, {
    firstRecordedAt: string | null;
    lastActivityAt: string | null;
    activityCount: number;
    sources: Set<string>;
    offers: Set<string>;
  }>();

  const addActivity = (email: string, source: string, first: string | null, last: string | null) => {
    const normalized = normalizeEmail(email);
    if (!isReportTargetEmail(normalized)) return;
    const current = candidates.get(normalized) ?? {
      firstRecordedAt: null,
      lastActivityAt: null,
      activityCount: 0,
      sources: new Set<string>(),
      offers: new Set<string>(),
    };
    current.firstRecordedAt = earliestDate([current.firstRecordedAt, first]);
    current.lastActivityAt = latestDate(current.lastActivityAt, last ?? first);
    current.activityCount += 1;
    current.sources.add(source);
    candidates.set(normalized, current);
  };

  for (const row of entitlementRows) {
    addActivity(row.userEmail, "entitlements", row.createdAt, row.updatedAt);
    candidates.get(normalizeEmail(row.userEmail))?.offers.add(row.offer);
  }
  for (const row of progressRows) addActivity(row.email, "roadmap", row.updatedAt, row.updatedAt);
  for (const row of sessionRows) addActivity(row.email, "second-seat", row.startedAt, row.updatedAt);
  for (const row of qualificationRows) addActivity(row.email, "human-calibration", row.createdAt, row.updatedAt);
  if (currentUserEmail) addActivity(currentUserEmail, "current-account", null, null);

  const normalizedQuery = query.trim().toLowerCase();
  return [...candidates.entries()]
    .filter(([email]) => !normalizedQuery || email.includes(normalizedQuery))
    .sort(([, left], [, right]) => dateSort(right.lastActivityAt) - dateSort(left.lastActivityAt))
    .slice(0, MAX_LEARNER_RESULTS)
    .map(([email, summary]) => ({
      email,
      name: null,
      firstRecordedAt: summary.firstRecordedAt,
      lastActivityAt: summary.lastActivityAt,
      activityCount: summary.activityCount,
      sourceCount: summary.sources.size,
      access: accessLabels(summary.offers, email),
    }));
}

export async function buildUserHistoryReport(
  email: string,
  options: { generatedAt?: Date; learnerName?: string | null } = {},
): Promise<UserHistoryReport> {
  const normalizedEmail = normalizeEmail(email);
  if (!isReportTargetEmail(normalizedEmail)) {
    throw new Error("User history reports are limited to the configured learner domain");
  }

  const db = await getDb();
  const [entitlementRows, progressRows, sessionRows, qualificationRows] = await Promise.all([
    db.select().from(entitlements).where(eq(entitlements.userEmail, normalizedEmail)).orderBy(asc(entitlements.createdAt)),
    db.select().from(learnerProgress).where(eq(learnerProgress.userEmail, normalizedEmail)).limit(1),
    db.select().from(secondSeatSessions).where(eq(secondSeatSessions.userEmail, normalizedEmail)).orderBy(asc(secondSeatSessions.startedAt)),
    db.select().from(qualificationApplications).where(eq(qualificationApplications.accountEmail, normalizedEmail)).orderBy(asc(qualificationApplications.createdAt)),
  ]);

  return buildUserHistoryReportFromRows(
    normalizedEmail,
    {
      entitlements: entitlementRows,
      progress: progressRows[0] ?? null,
      sessions: sessionRows,
      qualifications: qualificationRows,
    },
    options,
  );
}

export function isReportTargetEmail(email: string) {
  const normalized = normalizeEmail(email);
  const domain = (process.env.AUTH_ALLOWED_DOMAIN?.trim().toLowerCase() || DEFAULT_ALLOWED_DOMAIN);
  return /^[^\s@]+@[^\s@]+$/.test(normalized) && normalized.endsWith(`@${domain}`);
}

export function buildUserHistoryReportFromRows(
  rawEmail: string,
  rows: ReportRows,
  options: { generatedAt?: Date; learnerName?: string | null },
): UserHistoryReport {
  const email = normalizeEmail(rawEmail);
  const generatedAt = (options.generatedAt ?? new Date()).toISOString();
  const internalAccess = isInternalFullAccessEmail(email);
  const activeOffers = new Set(rows.entitlements.filter((row) => row.status === "active").map((row) => row.offer));
  const vaultAccess = internalAccess || activeOffers.has("vault");
  const secondSeatAccess = internalAccess || activeOffers.has("ai-prep");
  const humanCalibrationAccess = internalAccess;
  const currentPlan = humanCalibrationAccess
    ? "Human Calibration"
    : secondSeatAccess
      ? "The Second Seat"
      : vaultAccess
        ? "Vault / Foundation"
        : "No active plan recorded";
  const currentStatus = currentPlan === "No active plan recorded"
    ? "No active entitlement was found in the account history."
    : `${currentPlan} access is active.`;

  const progressData = parseProgress(rows.progress);
  const foundationSnapshot = roadmapProgressFor(
    roadmapPlanForWeeks(12),
    progressData.completedTaskIds,
    progressData.completionActivity,
    progressData.focusedSeconds,
  );
  const sessions = rows.sessions.map((record) => sessionSummary(record));
  const feedback = feedbackHistory(sessions, rows.qualifications);
  const timeline = createTimeline(rows, foundationSnapshot, sessions, feedback);
  const firstRecordedAt = firstDate([
    ...rows.entitlements.flatMap((row) => [row.createdAt, row.updatedAt]),
    rows.progress?.updatedAt ?? null,
    ...rows.sessions.flatMap((row) => [row.startedAt, row.updatedAt]),
    ...rows.qualifications.flatMap((row) => [row.createdAt, row.updatedAt]),
  ]);
  const lastActivityAt = latestDate(
    null,
    [
      ...rows.entitlements.flatMap((row) => [row.createdAt, row.updatedAt]),
      rows.progress?.updatedAt ?? null,
      ...rows.sessions.flatMap((row) => [row.startedAt, row.completedAt, row.updatedAt]),
      ...rows.qualifications.flatMap((row) => [row.createdAt, row.updatedAt]),
    ].reduce<string | null>((latest, value) => latestDate(latest, value), null),
  );
  const joinedAt = firstDate([
    rows.entitlements.find((row) => row.offer === "vault")?.createdAt ?? null,
    firstRecordedAt,
  ]);
  const report: Omit<UserHistoryReport, "pdf"> = {
    generatedAt,
    learner: {
      email,
      name: options.learnerName?.trim() || null,
      joinedAt,
      firstRecordedAt,
      lastActivityAt,
    },
    access: {
      vault: vaultAccess,
      secondSeat: secondSeatAccess,
      humanCalibration: humanCalibrationAccess,
      currentPlan,
      currentStatus,
    },
    planTransitions: rows.entitlements.map((row) => ({
      plan: offerLabel(row.offer),
      status: row.status,
      startedAt: row.createdAt,
      updatedAt: row.updatedAt,
    })),
    vault: {
      status: vaultAccess ? "available" : rows.progress ? "history recorded" : "not-recorded",
      startedAt: rows.entitlements.find((row) => row.offer === "vault")?.createdAt ?? null,
      roadmapWeeks: 12,
      progressPercent: foundationSnapshot.progressPercent,
      currentWeek: foundationSnapshot.currentWeek,
      completedTaskCount: foundationSnapshot.completedCount,
      totalTaskCount: foundationSnapshot.totalTaskCount,
      attemptedTaskCount: null,
      focusedSeconds: progressData.focusedSeconds,
      lastUpdatedAt: rows.progress?.updatedAt ?? null,
      completedTasks: completedTaskSummaries(foundationSnapshot),
    },
    secondSeat: {
      status: secondSeatAccess ? "available" : sessions.length ? "history recorded" : "not-recorded",
      startedAt: rows.entitlements.find((row) => row.offer === "ai-prep")?.createdAt ?? null,
      sessionCount: sessions.length,
      completedSessionCount: sessions.filter((session) => session.status === "completed").length,
      inProgressSessionCount: sessions.filter((session) => session.status === "in_progress").length,
      sessions,
    },
    humanCalibration: {
      status: humanCalibrationAccess ? "available by internal access configuration" : rows.qualifications.length ? "qualification history recorded" : "not-recorded",
      applications: rows.qualifications.map((row) => ({
        date: row.createdAt,
        phaseOneStatus: row.phaseOneStatus,
        phaseTwoStatus: row.phaseTwoStatus,
        targetRole: row.targetRole,
        visibleGap: row.visibleGap,
        additionalContext: row.additionalContext,
        status: row.status,
      })),
      sessionsStatus: "not-recorded",
      feedbackStatus: "not-recorded",
    },
    meetingCopilot: {
      status: "not-recorded",
      detail: "No Meeting Copilot session or showcase table is present in the current InterviewRunway data model.",
    },
    apiShowcase: {
      status: "not-recorded",
      detail: "No API or Showcase activity table is present in the current InterviewRunway data model.",
    },
    feedback,
    timeline,
    dataNotes: [
      "Completed roadmap tasks have per-task dates only where the learner record stores completion activity.",
      "Roadmap attempts are not stored separately from completions, so attempted-task totals are reported as unavailable.",
      "Focused learning time is stored as one learner-level total and is not partitioned by plan.",
      "Second Seat feedback and scores are recomputed from the persisted transcript and its mock definition.",
      "Human Calibration applications are qualification records, not evidence that a live session or coach feedback was delivered.",
      "Meeting Copilot, API, and Showcase history is marked not-recorded because no corresponding records exist in the current system.",
    ],
  };

  const filename = `interviewrunway-user-history-${email.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "learner"}.pdf`;
  return {
    ...report,
    pdf: {
      filename,
      bytes: createTextPdf("User History Report", filename, reportText(report)),
    },
  };
}

function parseProgress(record: LearnerProgressRecord | null) {
  return {
    completedTaskIds: parseStringArray(record?.completedTaskIds),
    completionActivity: parseStringRecord(record?.completionActivity),
    focusedSeconds: Number.isFinite(record?.focusedSeconds) ? Math.max(0, record?.focusedSeconds ?? 0) : 0,
  };
}

function sessionSummary(record: SecondSeatSessionRecord): UserHistoryReport["secondSeat"]["sessions"][number] & { evaluation: SecondSeatEvaluation | null } {
  const mock = findSecondSeatMock(record.mockId);
  const answers = parseStringArray(record.answers);
  const evaluation = record.status === "completed" && mock && answers.length === mock.turns.length
    ? evaluateSecondSeatSession(mock, answers)
    : null;
  return {
    id: record.id,
    title: mock?.title ?? "Unrecognized practice track",
    category: mock?.category ?? "Unavailable",
    status: record.status === "completed" ? "completed" : "in_progress",
    startedAt: record.startedAt,
    completedAt: record.completedAt ?? null,
    answerCount: answers.length,
    turnCount: mock?.turns.length ?? answers.length,
    score: evaluation?.overall ?? null,
    dimensions: evaluation?.dimensions.map((dimension) => ({ label: dimension.label, score: dimension.score })) ?? [],
    evaluation,
  };
}

function feedbackHistory(
  sessions: readonly (UserHistoryReport["secondSeat"]["sessions"][number] & { evaluation: SecondSeatEvaluation | null })[],
  qualifications: readonly QualificationRecord[],
): UserHistoryReport["feedback"] {
  const completed = sessions
    .filter((session) => session.status === "completed")
    .sort((left, right) => dateSort(left.completedAt ?? left.startedAt) - dateSort(right.completedAt ?? right.startedAt));
  let previousScore: number | null = null;
  const entries: UserHistoryReport["feedback"][number][] = [];
  for (const session of completed) {
    const evaluation = session.evaluation;
    const score = evaluation?.overall ?? null;
    entries.push({
      date: session.completedAt ?? session.startedAt,
      source: "Second Seat transcript assessment",
      relatedActivity: session.title,
      score,
      scoreDelta: score !== null && previousScore !== null ? score - previousScore : null,
      whatWentWell: evaluation
        ? evaluation.evidence.filter((item) => item.relevance === "relevant").map((item) => item.observation)
        : ["No recomputable assessment was available for this completed session."],
      needsImprovement: evaluation
        ? evaluation.evidence.filter((item) => item.relevance !== "relevant").map((item) => item.correction)
        : ["Assessment details are unavailable for this session."],
      recommendations: evaluation?.nextActions.map((action) => `${action.title}: ${action.body}`) ?? ["Run another recorded practice session to create comparable feedback."],
    });
    if (score !== null) previousScore = score;
  }
  for (const application of qualifications) {
    entries.push({
      date: application.createdAt,
      source: "Human Calibration qualification record",
      relatedActivity: application.targetRole,
      score: null,
      scoreDelta: null,
      whatWentWell: ["No scored human feedback is stored in this qualification record."],
      needsImprovement: [application.visibleGap],
      recommendations: application.additionalContext
        ? [application.additionalContext]
        : ["No recommendation was recorded with this application."],
    });
  }
  return entries.sort((left, right) => dateSort(left.date) - dateSort(right.date));
}

function createTimeline(
  rows: ReportRows,
  foundationSnapshot: RoadmapProgressSnapshot,
  sessions: readonly (UserHistoryReport["secondSeat"]["sessions"][number] & { evaluation: SecondSeatEvaluation | null })[],
  feedback: UserHistoryReport["feedback"],
): UserHistoryReport["timeline"] {
  const events: UserHistoryReport["timeline"][number][] = [];
  for (const row of rows.entitlements) {
    events.push({
      date: row.createdAt,
      kind: row.status === "active" ? "plan" : "status",
      title: `${offerLabel(row.offer)} access recorded`,
      detail: `Status: ${row.status}.`,
    });
    if (row.updatedAt !== row.createdAt) {
      events.push({
        date: row.updatedAt,
        kind: "status",
        title: `${offerLabel(row.offer)} status updated`,
        detail: `Status: ${row.status}.`,
      });
    }
  }
  for (const task of completedTaskSummaries(foundationSnapshot)) {
    events.push({
      date: task.completedAt ?? rows.progress?.updatedAt ?? new Date(0).toISOString(),
      kind: "completed",
      title: `Foundation task completed: ${task.title}`,
      detail: `Roadmap week ${task.week}.`,
    });
  }
  if (rows.progress) {
    events.push({
      date: rows.progress.updatedAt,
      kind: "status",
      title: "Roadmap progress updated",
      detail: `${foundationSnapshot.progressPercent}% of the 12-week Foundation roadmap is complete; focused time recorded: ${formatDuration(parseProgress(rows.progress).focusedSeconds)}.`,
    });
  }
  for (const session of sessions) {
    events.push({
      date: session.startedAt,
      kind: session.answerCount > 0 ? "attempted" : "status",
      title: `Second Seat session started: ${session.title}`,
      detail: `${session.answerCount}/${session.turnCount} responses recorded.`,
    });
    if (session.completedAt) {
      events.push({
        date: session.completedAt,
        kind: "completed",
        title: `Second Seat session completed: ${session.title}`,
        detail: session.score === null ? "Completed activity; score is unavailable." : `Completed assessment score: ${session.score}/100.`,
      });
    }
  }
  for (const application of rows.qualifications) {
    events.push({
      date: application.createdAt,
      kind: "plan",
      title: "Human Calibration qualification submitted",
      detail: `${application.targetRole}; recurring gap recorded: ${application.visibleGap}`,
    });
  }
  for (const item of feedback) {
    events.push({
      date: item.date,
      kind: "feedback",
      title: `${item.source}: ${item.relatedActivity}`,
      detail: item.score === null ? "Feedback record has no score." : `Score: ${item.score}/100${item.scoreDelta === null ? "" : `; change from prior scored feedback: ${signed(item.scoreDelta)}.`}`,
    });
  }
  return events.sort((left, right) => dateSort(left.date) - dateSort(right.date));
}

function completedTaskSummaries(snapshot: RoadmapProgressSnapshot) {
  const completed = new Set(snapshot.completedTaskIds);
  return roadmapPlanForWeeks(12).flatMap((week) =>
    week.tasks.filter((task) => completed.has(task.id)).map((task) => ({
      week: week.week,
      title: task.title,
      completedAt: snapshot.completionActivity[task.id] ?? null,
    })),
  );
}

function reportText(report: Omit<UserHistoryReport, "pdf">) {
  const lines: string[] = [];
  const push = (...values: string[]) => lines.push(...values.map((value) => cleanPdfLine(value)));
  push(
    "# Learner identity",
    `- Name: ${report.learner.name ?? "Not recorded in product data"}`,
    `- Email: ${report.learner.email}`,
    `- Report generated: ${formatDate(report.generatedAt)}`,
    `- First recorded activity: ${formatDate(report.learner.firstRecordedAt)}`,
    `- Last recorded activity: ${formatDate(report.learner.lastActivityAt)}`,
    `- Joined / started: ${formatDate(report.learner.joinedAt)}`,
    "",
    "# Executive summary",
    `- Current plan: ${report.access.currentPlan}`,
    `- Current status: ${report.access.currentStatus}`,
    `- Vault / Foundation progress: ${report.vault.progressPercent}% (${report.vault.completedTaskCount}/${report.vault.totalTaskCount} tasks completed)` ,
    `- Second Seat: ${report.secondSeat.sessionCount} session(s), ${report.secondSeat.completedSessionCount} completed, ${report.secondSeat.inProgressSessionCount} in progress`,
    `- Feedback records: ${report.feedback.length}`,
    `- Key score: ${latestScore(report.feedback)}`,
    "",
    "# Plan and journey",
    "## Vault / Foundation",
    `- Access: ${report.vault.status}`,
    `- Started: ${formatDate(report.vault.startedAt)}`,
    `- Roadmap: ${report.vault.roadmapWeeks} weeks; current week ${report.vault.currentWeek}`,
    `- Focused learning time recorded across learner workspaces: ${formatDuration(report.vault.focusedSeconds)}`,
    `- Tasks attempted separately from completions: ${report.vault.attemptedTaskCount === null ? "Not recorded" : report.vault.attemptedTaskCount.toString()}`,
  );
  if (report.vault.completedTasks.length) {
    push("- Completed tasks:");
    for (const task of report.vault.completedTasks) push(`  - Week ${task.week}: ${task.title} (${formatDate(task.completedAt)})`);
  } else {
    push("- Completed tasks: None recorded.");
  }
  push(
    "",
    "## Second Seat",
    `- Access: ${report.secondSeat.status}`,
    `- Access started: ${formatDate(report.secondSeat.startedAt)}`,
    `- Practice activity: ${report.secondSeat.sessionCount} recorded session(s)`,
  );
  if (report.secondSeat.sessions.length) {
    for (const session of report.secondSeat.sessions) {
      push(`- ${session.title} [${session.status}] - ${session.answerCount}/${session.turnCount} responses - score ${session.score === null ? "not recorded" : `${session.score}/100`} - started ${formatDate(session.startedAt)} - completed ${formatDate(session.completedAt)}`);
      if (session.dimensions.length) {
        push(`  - Score dimensions: ${session.dimensions.map((dimension) => `${dimension.label} ${dimension.score}/100`).join("; ")}`);
      }
    }
  } else {
    push("- Practice sessions: None recorded.");
  }
  push(
    "",
    "## Human Calibration",
    `- Access/history status: ${report.humanCalibration.status}`,
    `- Delivered sessions: ${report.humanCalibration.sessionsStatus}`,
    `- Human feedback and scores: ${report.humanCalibration.feedbackStatus}`,
  );
  if (report.humanCalibration.applications.length) {
    for (const application of report.humanCalibration.applications) {
      push(`- Qualification ${formatDate(application.date)}: ${application.targetRole}; phase 1 ${application.phaseOneStatus}; phase 2 ${application.phaseTwoStatus}; status ${application.status}`);
      push(`  - Recurring gap: ${application.visibleGap}`);
      if (application.additionalContext) push(`  - Additional context: ${application.additionalContext}`);
    }
  } else {
    push("- Qualification applications: None recorded.");
  }
  push(
    "",
    "## Meeting Copilot",
    `- Status: ${report.meetingCopilot.status}`,
    `- ${report.meetingCopilot.detail}`,
    "",
    "## API / Showcase activity",
    `- Status: ${report.apiShowcase.status}`,
    `- ${report.apiShowcase.detail}`,
    "",
    "# Complete feedback and scoring history",
  );
  if (report.feedback.length) {
    report.feedback.forEach((item, index) => {
      push(
        `## Feedback ${String(index + 1).padStart(2, "0")} - ${formatDate(item.date)}`,
        `- Source/type: ${item.source}`,
        `- Related activity: ${item.relatedActivity}`,
        `- Score: ${item.score === null ? "Not recorded" : `${item.score}/100`}`,
        `- Change after prior scored feedback: ${item.scoreDelta === null ? "Not available" : signed(item.scoreDelta)}`,
        `- What was done well: ${item.whatWentWell.length ? item.whatWentWell.join(" ") : "None recorded"}`,
        `- Needs improvement: ${item.needsImprovement.length ? item.needsImprovement.join(" ") : "None recorded"}`,
        `- Recommendations: ${item.recommendations.length ? item.recommendations.join(" ") : "None recorded"}`,
        "",
      );
    });
  } else {
    push("- No feedback or score records are available.", "");
  }
  push("# Overall chronological timeline");
  if (report.timeline.length) {
    for (const event of report.timeline) push(`- ${formatDate(event.date)} | ${event.kind.toUpperCase()} | ${event.title} | ${event.detail}`);
  } else {
    push("- No activity is recorded for this learner.");
  }
  push("", "# Data coverage and interpretation");
  for (const note of report.dataNotes) push(`- ${note}`);
  return lines.join("\n");
}

function accessLabels(offers: Set<string>, email: string) {
  const labels: string[] = [];
  if (isInternalFullAccessEmail(email) || offers.has("vault")) labels.push("Vault");
  if (isInternalFullAccessEmail(email) || offers.has("ai-prep")) labels.push("Second Seat");
  if (isInternalFullAccessEmail(email)) labels.push("Human Calibration");
  return labels;
}

function offerLabel(offer: string) {
  if (offer === "vault") return "Vault / Foundation";
  if (offer === "ai-prep") return "The Second Seat";
  return offer || "Unknown plan";
}

function latestScore(feedback: UserHistoryReport["feedback"]) {
  const scored = [...feedback].reverse().find((item) => item.score !== null);
  return scored ? `${scored.score}/100 (${scored.relatedActivity})` : "Not recorded";
}

function parseStringArray(value: string | null | undefined) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

function parseStringRecord(value: string | null | undefined) {
  if (!value) return {} as Record<string, string>;
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {} as Record<string, string>;
    return Object.fromEntries(Object.entries(parsed).filter(([, item]) => typeof item === "string")) as Record<string, string>;
  } catch {
    return {} as Record<string, string>;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function earliestDate(values: readonly (string | null | undefined)[]) {
  return values.filter((value): value is string => Boolean(value)).sort((left, right) => dateSort(left) - dateSort(right))[0] ?? null;
}

function firstDate(values: readonly (string | null | undefined)[]) {
  return earliestDate(values);
}

function latestDate(left: string | null, right: string | null | undefined) {
  if (!left) return right ?? null;
  if (!right) return left;
  return dateSort(right) > dateSort(left) ? right : left;
}

function dateSort(value: string | null | undefined) {
  if (!value) return 0;
  const parsed = Date.parse(value.length === 10 ? `${value}T12:00:00Z` : value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00Z` : value);
  if (Number.isNaN(parsed.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(parsed);
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (!minutes) return `${Math.max(0, Math.floor(seconds))} seconds`;
  const hours = Math.floor(minutes / 60);
  return hours ? `${hours}h ${minutes % 60}m` : `${minutes}m`;
}

function signed(value: number) {
  return `${value >= 0 ? "+" : ""}${value}`;
}

function cleanPdfLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trimEnd();
}
