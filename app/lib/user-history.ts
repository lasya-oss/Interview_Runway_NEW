import { getD1 } from "@/db";
import { isInternalFullAccessEmail } from "@/app/lib/internal-access";
import {
  isConfiguredTestFoundationEmail,
  isConfiguredTestSecondSeatEmail,
} from "@/app/lib/paid-access";
import {
  evaluateSecondSeatSession,
  findSecondSeatMock,
  type SecondSeatDimensionKey,
  type SecondSeatEvaluation,
} from "@/app/lib/second-seat-engine";
import { parseStoredSecondSeatEvaluation } from "@/app/lib/second-seat-ai-evaluator";
import {
  FOUR_WEEK_PLAN,
  SECOND_SEAT_PLAN,
  TWELVE_WEEK_PLAN,
  type RoadmapWeek,
} from "@/app/lib/roadmap-data";
import { roadmapProgressFor } from "@/app/lib/learner-progress";

export type LearnerSearchResult = {
  email: string;
};

export type UserHistorySourceRecords = {
  learnerEmail: string;
  learnerName: string | null;
  generatedByEmail: string;
  generatedAt: string;
  internalFullAccess: boolean;
  entitlements: EntitlementRecord[];
  checkouts: CheckoutRecord[];
  progress: ProgressRecord | null;
  practiceSessions: PracticeSessionRecord[];
  qualificationApplications: QualificationRecord[];
};

export type EntitlementRecord = {
  id: string;
  offer: string;
  status: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
  lastEventAt: string;
};

export type CheckoutRecord = {
  id: string;
  offer: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
  lastEventAt: string | null;
};

export type ProgressRecord = {
  completedTaskIds: string;
  completionActivity: string;
  focusedSeconds: number;
  updatedAt: string;
};

export type PracticeSessionRecord = {
  id: string;
  mockId: string;
  status: string;
  answers: string;
  evaluation: string | null;
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
};

export type QualificationRecord = {
  id: string;
  phaseOneStatus: string;
  phaseTwoStatus: string;
  targetRole: string;
  visibleGap: string;
  additionalContext: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type UserHistoryReport = {
  learner: {
    email: string;
    name: string | null;
  };
  generatedAt: string;
  generatedByEmail: string;
  executiveSummary: {
    currentPlan: string;
    currentStatus: string;
    earliestRecordedAt: string | null;
    latestRecordedAt: string | null;
    vaultProgressPercent: number;
    secondSeatProgressPercent: number;
    completedRoadmapTasks: number;
    attemptedPracticeSessions: number;
    completedPracticeSessions: number;
    latestPracticeScore: number | null;
    bestPracticeScore: number | null;
    focusedSeconds: number;
  };
  accessHistory: {
    internalFullAccess: boolean;
    entitlements: Array<{
      id: string;
      plan: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      lastEventAt: string;
    }>;
    checkouts: Array<{
      id: string;
      plan: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      expiresAt: string;
      lastEventAt: string | null;
    }>;
  };
  roadmap: {
    focusedSeconds: number;
    focusAttribution: string;
    vault: RoadmapHistory;
    secondSeat: RoadmapHistory;
    unmappedCompletedTasks: Array<{
      id: string;
      title: string;
      week: number | null;
      completedAt: string | null;
    }>;
  };
  practiceSessions: PracticeHistory[];
  humanCalibration: {
    accessStatus: string;
    applications: Array<{
      id: string;
      status: string;
      phaseOneStatus: string;
      phaseTwoStatus: string;
      targetRole: string;
      visibleGap: string;
      additionalContext: string | null;
      createdAt: string;
      updatedAt: string;
    }>;
    sessionHistoryStatus: string;
    feedbackHistoryStatus: string;
  };
  meetingCopilot: {
    status: string;
  };
  apiAndShowcase: {
    status: string;
  };
  feedbackHistory: FeedbackHistory[];
  timeline: TimelineEvent[];
  currentState: {
    latestRecordedActivity: TimelineEvent | null;
    latestFeedback: string;
    nextStep: string;
  };
};

export type RoadmapHistory = {
  label: string;
  totalTaskCount: number;
  completedTaskCount: number;
  progressPercent: number;
  completedTasks: Array<{
    id: string;
    title: string;
    meta: string;
    week: number;
    completedAt: string | null;
  }>;
  attemptTrackingStatus: string;
};

export type PracticeHistory = {
  id: string;
  mockId: string;
  title: string;
  category: string;
  status: "attempted" | "completed";
  startedAt: string;
  completedAt: string | null;
  updatedAt: string;
  answerCount: number;
  overallScore: number | null;
  scoreChange: number | null;
  dimensions: ReadonlyArray<{
    key: SecondSeatDimensionKey;
    label: string;
    score: number;
    note: string;
  }>;
  evidence: SecondSeatEvaluation["evidence"];
  strengths: string[];
  improvements: string[];
  recommendations: string[];
};

export type FeedbackHistory = {
  id: string;
  date: string;
  source: string;
  relatedActivity: string;
  score: number;
  strengths: string[];
  improvements: string[];
  recommendations: string[];
  scoreChange: number | null;
};

export type TimelineEvent = {
  id: string;
  timestamp: string;
  precision: "timestamp" | "date";
  area: string;
  state: "started" | "attempted" | "completed" | "feedback" | "access" | "status";
  title: string;
  detail: string;
  source: string;
};

type EntitlementRow = {
  id: string;
  offer: string;
  status: string;
  paddle_transaction_id: string;
  created_at: string;
  updated_at: string;
  last_event_at: string;
};

type CheckoutRow = {
  id: string;
  offer: string;
  status: string;
  paddle_transaction_id: string | null;
  created_at: string;
  updated_at: string;
  expires_at: string;
  last_event_at: string | null;
};

type ProgressRow = {
  completed_task_ids: string;
  completion_activity: string;
  focused_seconds: number;
  updated_at: string;
};

type PracticeRow = {
  id: string;
  mock_id: string;
  status: string;
  answers: string;
  evaluation: string | null;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
};

type QualificationRow = {
  id: string;
  phase_one_status: string;
  phase_two_status: string;
  target_role: string;
  visible_gap: string;
  additional_context: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export class UserHistoryNotFoundError extends Error {
  constructor() {
    super("Learner record not found");
    this.name = "UserHistoryNotFoundError";
  }
}

export async function searchStoredLearners(query: string): Promise<LearnerSearchResult[]> {
  const normalizedQuery = normalizeLearnerSearchQuery(query);
  const database = await getD1();
  const result = await database
    .prepare(
      `SELECT email FROM (
        SELECT lower(user_email) AS email FROM checkout_sessions
        UNION
        SELECT lower(user_email) AS email FROM entitlements
        UNION
        SELECT lower(user_email) AS email FROM learner_progress
        UNION
        SELECT lower(user_email) AS email FROM second_seat_sessions
        UNION
        SELECT lower(account_email) AS email FROM qualification_applications
      )
      WHERE instr(email, ?) > 0
      ORDER BY email
      LIMIT 20`,
    )
    .bind(normalizedQuery)
    .all() as { results?: Array<{ email: string }> };

  return (result.results ?? [])
    .map((record) => ({ email: normalizeEmail(record.email) }))
    .filter((record) => isEmail(record.email));
}

export async function loadUserHistorySources({
  learnerEmail,
  learnerName,
  generatedByEmail,
  generatedAt = new Date().toISOString(),
}: {
  learnerEmail: string;
  learnerName?: string | null;
  generatedByEmail: string;
  generatedAt?: string;
}): Promise<UserHistorySourceRecords> {
  const email = normalizeEmail(learnerEmail);
  if (!isEmail(email)) throw new UserHistoryNotFoundError();

  const database = await getD1();
  const batchResults = await database.batch([
    database
      .prepare(
        `SELECT id, offer, status, paddle_transaction_id, created_at, updated_at, last_event_at
         FROM entitlements WHERE lower(user_email) = ? ORDER BY created_at ASC`,
      )
      .bind(email),
    database
      .prepare(
        `SELECT id, offer, status, paddle_transaction_id, created_at, updated_at, expires_at, last_event_at
         FROM checkout_sessions WHERE lower(user_email) = ? ORDER BY created_at ASC`,
      )
      .bind(email),
    database
      .prepare(
        `SELECT completed_task_ids, completion_activity, focused_seconds, updated_at
         FROM learner_progress WHERE lower(user_email) = ? LIMIT 1`,
      )
      .bind(email),
    database
      .prepare(
        `SELECT id, mock_id, status, answers, evaluation, started_at, completed_at, updated_at
         FROM second_seat_sessions WHERE lower(user_email) = ? ORDER BY started_at ASC`,
      )
      .bind(email),
    database
      .prepare(
        `SELECT id, phase_one_status, phase_two_status, target_role, visible_gap,
                additional_context, status, created_at, updated_at
         FROM qualification_applications WHERE lower(account_email) = ? ORDER BY created_at ASC`,
      )
      .bind(email),
  ]);
  const entitlementResult = batchResults[0] as { results?: EntitlementRow[] };
  const checkoutResult = batchResults[1] as { results?: CheckoutRow[] };
  const progressResult = batchResults[2] as { results?: ProgressRow[] };
  const practiceResult = batchResults[3] as { results?: PracticeRow[] };
  const qualificationResult = batchResults[4] as { results?: QualificationRow[] };

  const entitlements = (entitlementResult.results ?? []).map((record) => ({
    id: record.id,
    offer: record.offer,
    status: record.status,
    transactionId: record.paddle_transaction_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    lastEventAt: record.last_event_at,
  }));
  const checkouts = (checkoutResult.results ?? []).map((record) => ({
    id: record.id,
    offer: record.offer,
    status: record.status,
    transactionId: record.paddle_transaction_id,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
    expiresAt: record.expires_at,
    lastEventAt: record.last_event_at,
  }));
  const progressRow = progressResult.results?.[0];
  const progress = progressRow
    ? {
        completedTaskIds: progressRow.completed_task_ids,
        completionActivity: progressRow.completion_activity,
        focusedSeconds: Number(progressRow.focused_seconds) || 0,
        updatedAt: progressRow.updated_at,
      }
    : null;
  const practiceSessions = (practiceResult.results ?? []).map((record) => ({
    id: record.id,
    mockId: record.mock_id,
    status: record.status,
    answers: record.answers,
    evaluation: record.evaluation,
    startedAt: record.started_at,
    completedAt: record.completed_at,
    updatedAt: record.updated_at,
  }));
  const qualificationApplications = (qualificationResult.results ?? []).map((record) => ({
    id: record.id,
    phaseOneStatus: record.phase_one_status,
    phaseTwoStatus: record.phase_two_status,
    targetRole: record.target_role,
    visibleGap: record.visible_gap,
    additionalContext: record.additional_context,
    status: record.status,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  }));

  if (!entitlements.length && !checkouts.length && !progress && !practiceSessions.length && !qualificationApplications.length) {
    throw new UserHistoryNotFoundError();
  }

  return {
    learnerEmail: email,
    learnerName: learnerName?.trim() || null,
    generatedByEmail: normalizeEmail(generatedByEmail),
    generatedAt,
    internalFullAccess: isInternalFullAccessEmail(email),
    entitlements,
    checkouts,
    progress,
    practiceSessions,
    qualificationApplications,
  };
}

export function buildUserHistoryReport(source: UserHistorySourceRecords): UserHistoryReport {
  const completedTaskIds = [...new Set(parseStringArray(source.progress?.completedTaskIds))];
  const completionActivity = parseCompletionActivity(source.progress?.completionActivity);
  const vault = buildRoadmapHistory("Vault / Foundation", TWELVE_WEEK_PLAN, completedTaskIds, completionActivity);
  const secondSeatRoadmap = buildRoadmapHistory("Second Seat", SECOND_SEAT_PLAN, completedTaskIds, completionActivity);
  const unmappedCompletedTasks = buildUnmappedRoadmapTasks(completedTaskIds, completionActivity);
  const practiceSessions = buildPracticeHistory(source.practiceSessions);
  const feedbackHistory: FeedbackHistory[] = practiceSessions
    .filter((session): session is PracticeHistory & { overallScore: number; completedAt: string } => (
      session.overallScore !== null && session.completedAt !== null
    ))
    .map((session) => ({
      id: `feedback:${session.id}`,
      date: session.completedAt,
      source: "Second Seat stored assessment evaluation",
      relatedActivity: session.title,
      score: session.overallScore,
      strengths: session.strengths,
      improvements: session.improvements,
      recommendations: session.recommendations,
      scoreChange: session.scoreChange,
    }))
    .sort((left, right) => compareRecordedTimes(left.date, right.date) || left.id.localeCompare(right.id));

  const activeOffers = new Set(
    source.entitlements
      .filter((record) => record.status === "active")
      .map((record) => record.offer),
  );
  const foundationQaAccess = isConfiguredTestFoundationEmail(source.learnerEmail);
  const secondSeatQaAccess = isConfiguredTestSecondSeatEmail(source.learnerEmail);
  const vaultAccess = source.internalFullAccess
    || foundationQaAccess
    || secondSeatQaAccess
    || activeOffers.has("vault");
  const secondSeatAccess = source.internalFullAccess
    || secondSeatQaAccess
    || (vaultAccess && activeOffers.has("ai-prep"));
  const currentPlan = source.internalFullAccess
    ? "Not recorded (access includes Vault, Second Seat, and Human Calibration)"
    : secondSeatAccess
      ? "Second Seat"
      : vaultAccess
        ? "Vault"
        : "No active paid plan recorded";
  const currentStatus = source.internalFullAccess
    ? "Active Vivid Labs internal access"
    : secondSeatQaAccess
      ? "Active configured Second Seat QA access"
      : foundationQaAccess && secondSeatAccess
        ? "Active paid Second Seat access with configured Vault QA prerequisite"
        : foundationQaAccess
          ? "Active configured Vault QA access"
          : secondSeatAccess || vaultAccess
            ? "Active paid access"
            : activeOffers.size
              ? "Stored entitlement does not satisfy production access prerequisites"
              : "No active paid entitlement recorded";

  const accessHistory = {
    internalFullAccess: source.internalFullAccess,
    entitlements: source.entitlements.map((record) => ({
      id: record.id,
      plan: planLabel(record.offer),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      lastEventAt: record.lastEventAt,
    })),
    checkouts: source.checkouts.map((record) => ({
      id: record.id,
      plan: planLabel(record.offer),
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      expiresAt: record.expiresAt,
      lastEventAt: record.lastEventAt,
    })),
  };

  const humanCalibrationApplications = source.qualificationApplications.map((record) => ({
    id: record.id,
    status: record.status,
    phaseOneStatus: record.phaseOneStatus,
    phaseTwoStatus: record.phaseTwoStatus,
    targetRole: record.targetRole,
    visibleGap: record.visibleGap,
    additionalContext: record.additionalContext,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }));

  const timeline = buildTimeline({
    source,
    vault,
    secondSeatRoadmap,
    unmappedCompletedTasks,
    practiceSessions,
  });
  const timestamps = timeline.map((event) => event.timestamp).filter(isDateLike);
  const completedPractice = practiceSessions.filter((session) => session.status === "completed");
  const scoredPractice = completedPractice.filter(
    (session): session is PracticeHistory & { overallScore: number } => session.overallScore !== null,
  );
  const scoredPracticeByCompletion = [...scoredPractice].sort((left, right) => (
    compareRecordedTimes(left.completedAt ?? left.updatedAt, right.completedAt ?? right.updatedAt)
      || left.id.localeCompare(right.id)
  ));
  const latestScoredPractice = scoredPracticeByCompletion.at(-1) ?? null;
  const latestFeedback = feedbackHistory.at(-1);
  const nextRoadmapTask = nextIncompleteTask(
    secondSeatAccess ? SECOND_SEAT_PLAN : TWELVE_WEEK_PLAN,
    completedTaskIds,
  );

  return {
    learner: {
      email: normalizeEmail(source.learnerEmail),
      name: source.learnerName?.trim() || null,
    },
    generatedAt: source.generatedAt,
    generatedByEmail: normalizeEmail(source.generatedByEmail),
    executiveSummary: {
      currentPlan,
      currentStatus,
      earliestRecordedAt: timestamps.at(0) ?? null,
      latestRecordedAt: timestamps.at(-1) ?? null,
      vaultProgressPercent: vault.progressPercent,
      secondSeatProgressPercent: secondSeatRoadmap.progressPercent,
      completedRoadmapTasks: completedTaskIds.length,
      attemptedPracticeSessions: practiceSessions.length,
      completedPracticeSessions: completedPractice.length,
      latestPracticeScore: latestScoredPractice?.overallScore ?? null,
      bestPracticeScore: scoredPractice.length
        ? Math.max(...scoredPractice.map((session) => session.overallScore))
        : null,
      focusedSeconds: source.progress?.focusedSeconds ?? 0,
    },
    accessHistory,
    roadmap: {
      focusedSeconds: source.progress?.focusedSeconds ?? 0,
      focusAttribution: "Focused time is stored as one account-wide total and cannot be attributed to a specific plan or material.",
      vault,
      secondSeat: secondSeatRoadmap,
      unmappedCompletedTasks,
    },
    practiceSessions,
    humanCalibration: {
      accessStatus: source.internalFullAccess
        ? "Human Calibration access is active through the configured Vivid Labs internal-access policy; no separate activation timestamp is stored."
        : humanCalibrationApplications.length
          ? "A Human Calibration qualification application is recorded; approval or access activation is not stored."
          : "No Human Calibration access or qualification activity is recorded.",
      applications: humanCalibrationApplications,
      sessionHistoryStatus: "No recorded activity. Human Calibration session records are not stored in the current production data model.",
      feedbackHistoryStatus: "No recorded activity. Human coaching feedback is not stored in the current production data model.",
    },
    meetingCopilot: {
      status: "No recorded activity. Meeting Copilot does not currently persist session history in the Interview Runway production data store.",
    },
    apiAndShowcase: {
      status: "No recorded activity. API and showcase events are not currently stored as user history in the Interview Runway production data store.",
    },
    feedbackHistory,
    timeline,
    currentState: {
      latestRecordedActivity: timeline.at(-1) ?? null,
      latestFeedback: latestFeedback
        ? `${latestFeedback.relatedActivity}: ${latestFeedback.score}/100. ${latestFeedback.improvements[0] ?? "No improvement note recorded."}`
        : "No recorded feedback.",
      nextStep: latestFeedback?.recommendations[0]
        ?? (nextRoadmapTask ? `Continue with ${nextRoadmapTask.title}.` : "No product-recorded next step is available."),
    },
  };
}

function buildRoadmapHistory(
  label: string,
  weeks: readonly RoadmapWeek[],
  completedTaskIds: readonly string[],
  completionActivity: Readonly<Record<string, string>>,
): RoadmapHistory {
  const snapshot = roadmapProgressFor(weeks, completedTaskIds, completionActivity);
  const completed = new Set(snapshot.completedTaskIds);
  const completedTasks = weeks.flatMap((week) => week.tasks
    .filter((task) => completed.has(task.id))
    .map((task) => ({
      id: task.id,
      title: task.title,
      meta: task.meta,
      week: week.week,
      completedAt: completionActivity[task.id] ?? null,
    })));

  return {
    label,
    totalTaskCount: snapshot.totalTaskCount,
    completedTaskCount: snapshot.completedCount,
    progressPercent: snapshot.progressPercent,
    completedTasks,
    attemptTrackingStatus: "Roadmap task attempts and material opens are not stored. Only the current completed-task set is available.",
  };
}

function buildUnmappedRoadmapTasks(
  completedTaskIds: readonly string[],
  completionActivity: Readonly<Record<string, string>>,
) {
  const publishedTaskIds = new Set(
    [...TWELVE_WEEK_PLAN, ...SECOND_SEAT_PLAN].flatMap((week) => week.tasks.map((task) => task.id)),
  );
  const knownLegacyTasks = new Map(
    FOUR_WEEK_PLAN.flatMap((week) => week.tasks.map((task) => [task.id, { task, week: week.week }] as const)),
  );

  return completedTaskIds
    .filter((id) => !publishedTaskIds.has(id))
    .map((id) => {
      const known = knownLegacyTasks.get(id);
      return {
        id,
        title: known?.task.title ?? "Legacy or unpublished roadmap task",
        week: known?.week ?? null,
        completedAt: completionActivity[id] ?? null,
      };
    });
}

function buildPracticeHistory(records: readonly PracticeSessionRecord[]): PracticeHistory[] {
  const sessions: PracticeHistory[] = records.map((record) => {
    const answers = parseStringArray(record.answers);
    const mock = findSecondSeatMock(record.mockId);
    const completed = record.status === "completed" && Boolean(record.completedAt);
    const evaluation = completed && mock && answers.length === mock.turns.length
      ? parseStoredSecondSeatEvaluation(record.evaluation, mock, answers)
        ?? evaluateSecondSeatSession(mock, answers)
      : null;
    const sortedDimensions = evaluation
      ? [...evaluation.dimensions].sort((left, right) => right.score - left.score)
      : [];
    const strengths = sortedDimensions
      .filter((dimension) => dimension.score >= 70)
      .map((dimension) => `${dimension.label} ${dimension.score}/100 - ${dimension.note}`);
    const improvements = evaluation
      ? [...evaluation.dimensions]
          .sort((left, right) => left.score - right.score)
          .slice(0, 2)
          .map((dimension) => `${dimension.label} ${dimension.score}/100 - ${dimension.note}`)
      : [];

    return {
      id: record.id,
      mockId: record.mockId,
      title: mock?.title ?? `Recorded practice (${record.mockId})`,
      category: mock?.category ?? "Practice",
      status: completed ? "completed" as const : "attempted" as const,
      startedAt: record.startedAt,
      completedAt: completed ? record.completedAt : null,
      updatedAt: record.updatedAt,
      answerCount: answers.length,
      overallScore: evaluation?.overall ?? null,
      scoreChange: null,
      dimensions: evaluation?.dimensions.map(({ key, label, score, note }) => ({ key, label, score, note })) ?? [],
      evidence: evaluation?.evidence ?? [],
      strengths,
      improvements,
      recommendations: evaluation?.nextActions.map((action) => `${action.title} - ${action.body}`) ?? [],
    };
  });

  const scoreChanges = new Map<string, number | null>();
  let previousScore: number | null = null;
  const scoredByCompletion = sessions
    .filter((session): session is PracticeHistory & { overallScore: number; completedAt: string } => (
      session.overallScore !== null && session.completedAt !== null
    ))
    .sort((left, right) => compareRecordedTimes(left.completedAt, right.completedAt) || left.id.localeCompare(right.id));
  for (const session of scoredByCompletion) {
    scoreChanges.set(session.id, previousScore === null ? null : session.overallScore - previousScore);
    previousScore = session.overallScore;
  }

  return sessions.map((session) => ({
    ...session,
    scoreChange: scoreChanges.get(session.id) ?? null,
  }));
}

function buildTimeline({
  source,
  vault,
  secondSeatRoadmap,
  unmappedCompletedTasks,
  practiceSessions,
}: {
  source: UserHistorySourceRecords;
  vault: RoadmapHistory;
  secondSeatRoadmap: RoadmapHistory;
  unmappedCompletedTasks: UserHistoryReport["roadmap"]["unmappedCompletedTasks"];
  practiceSessions: PracticeHistory[];
}): TimelineEvent[] {
  const events = new Map<string, TimelineEvent>();
  const add = (key: string, event: TimelineEvent) => {
    if (!isDateLike(event.timestamp) || events.has(key)) return;
    events.set(key, event);
  };

  const entitlementTransactions = new Map(
    source.entitlements
      .filter((record) => Boolean(record.transactionId))
      .map((record) => [record.transactionId, record.status]),
  );
  for (const entitlement of source.entitlements) {
    const active = entitlement.status === "active";
    const timestamp = entitlement.lastEventAt || (active ? entitlement.createdAt : entitlement.updatedAt);
    add(`entitlement:${entitlement.id}:${entitlement.status}`, {
      id: `entitlement:${entitlement.id}:${entitlement.status}`,
      timestamp,
      precision: "timestamp",
      area: planLabel(entitlement.offer),
      state: "access",
      title: active ? `${planLabel(entitlement.offer)} access activated` : `${planLabel(entitlement.offer)} access ${entitlement.status}`,
      detail: `Entitlement status: ${entitlement.status}.`,
      source: "entitlements",
    });
  }

  for (const checkout of source.checkouts) {
    add(`checkout:${checkout.id}:started`, {
      id: `checkout:${checkout.id}:started`,
      timestamp: checkout.createdAt,
      precision: "timestamp",
      area: planLabel(checkout.offer),
      state: "started",
      title: `${planLabel(checkout.offer)} checkout started`,
      detail: `Latest recorded checkout status: ${checkout.status}.`,
      source: "checkout_sessions",
    });
    if (checkout.status === "pending") continue;
    const matchingEntitlementStatus = checkout.transactionId
      ? entitlementTransactions.get(checkout.transactionId)
      : null;
    const representedByEntitlement = matchingEntitlementStatus === checkout.status
      || (checkout.status === "completed" && matchingEntitlementStatus === "active");
    if (representedByEntitlement) continue;
    add(`checkout:${checkout.id}:${checkout.status}`, {
      id: `checkout:${checkout.id}:${checkout.status}`,
      timestamp: checkout.lastEventAt || checkout.updatedAt,
      precision: "timestamp",
      area: planLabel(checkout.offer),
      state: checkout.status === "completed" ? "access" : "status",
      title: `${planLabel(checkout.offer)} checkout ${checkout.status}`,
      detail: `Recorded checkout status: ${checkout.status}.`,
      source: "checkout_sessions",
    });
  }

  for (const [roadmap, area] of [[vault, "Vault / Foundation"], [secondSeatRoadmap, "Second Seat"]] as const) {
    for (const task of roadmap.completedTasks) {
      if (!task.completedAt) continue;
      add(`roadmap:${task.id}:${task.completedAt}`, {
        id: `roadmap:${task.id}:${task.completedAt}`,
        timestamp: task.completedAt,
        precision: "date",
        area,
        state: "completed",
        title: task.title,
        detail: `Week ${task.week} roadmap task marked complete. Time of day is not recorded.`,
        source: "learner_progress.completion_activity",
      });
    }
  }

  for (const task of unmappedCompletedTasks) {
    if (!task.completedAt) continue;
    add(`roadmap:${task.id}:${task.completedAt}`, {
      id: `roadmap:${task.id}:${task.completedAt}`,
      timestamp: task.completedAt,
      precision: "date",
      area: "Roadmap",
      state: "completed",
      title: task.title,
      detail: `Legacy or unpublished roadmap task ${task.id} is in the stored completion set. Time of day is not recorded.`,
      source: "learner_progress.completion_activity",
    });
  }

  if (source.progress) {
    add(`progress:${source.progress.updatedAt}`, {
      id: `progress:${source.progress.updatedAt}`,
      timestamp: source.progress.updatedAt,
      precision: "timestamp",
      area: "Roadmap and learning",
      state: "status",
      title: "Learning progress record updated",
      detail: `${new Set(parseStringArray(source.progress.completedTaskIds)).size} current completed task records; ${source.progress.focusedSeconds} account-wide focused seconds. This is a stored snapshot timestamp, not an individual learning-session time.`,
      source: "learner_progress.updated_at",
    });
  }

  for (const session of practiceSessions) {
    add(`practice:${session.id}:started`, {
      id: `practice:${session.id}:started`,
      timestamp: session.startedAt,
      precision: "timestamp",
      area: "Second Seat",
      state: "attempted",
      title: `${session.title} started`,
      detail: `${session.answerCount} response${session.answerCount === 1 ? "" : "s"} recorded; current state: ${session.status}.`,
      source: "second_seat_sessions",
    });
    if (session.completedAt) {
      const improvement = session.improvements[0];
      const recommendation = session.recommendations[0];
      add(`practice:${session.id}:completed`, {
        id: `practice:${session.id}:completed`,
        timestamp: session.completedAt,
        precision: "timestamp",
        area: "Second Seat",
        state: session.overallScore === null ? "completed" : "feedback",
        title: session.overallScore === null ? `${session.title} completed` : `${session.title} completed with feedback`,
        detail: session.overallScore === null
          ? "Completed without a reproducible score."
          : [
              `Feedback generated from the recorded transcript: ${session.overallScore}/100.`,
              improvement ? `Primary improvement: ${improvement}` : null,
              recommendation ? `Recommended next action: ${recommendation}` : null,
            ].filter(Boolean).join(" "),
        source: "second_seat_sessions + stored assessment evaluation",
      });
    }
  }

  for (const application of source.qualificationApplications) {
    add(`qualification:${application.id}`, {
      id: `qualification:${application.id}`,
      timestamp: application.createdAt,
      precision: "timestamp",
      area: "Human Calibration",
      state: "attempted",
      title: "Human Calibration qualification submitted",
      detail: `Application status: ${application.status}; target role: ${application.targetRole}.`,
      source: "qualification_applications",
    });
  }

  return [...events.values()].sort((left, right) => {
    const byDate = Date.parse(left.timestamp) - Date.parse(right.timestamp);
    return byDate || left.id.localeCompare(right.id);
  });
}

function nextIncompleteTask(weeks: readonly RoadmapWeek[], completedTaskIds: readonly string[]) {
  const completed = new Set(completedTaskIds);
  return weeks.flatMap((week) => week.tasks).find((task) => !completed.has(task.id)) ?? null;
}

function planLabel(offer: string) {
  return offer === "vault" ? "Vault" : offer === "ai-prep" ? "Second Seat" : offer.replaceAll("-", " ");
}

function parseStringArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function parseCompletionActivity(value: string | null | undefined): Record<string, string> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([taskId, timestamp]) => Boolean(taskId) && typeof timestamp === "string" && /^\d{4}-\d{2}-\d{2}$/.test(timestamp),
      ),
    );
  } catch {
    return {};
  }
}

export function normalizeLearnerSearchQuery(value: string) {
  const normalized = value.trim().toLowerCase();
  if (normalized.length < 2 || normalized.length > 254) {
    throw new Error("Enter at least two characters from the learner account email.");
  }
  return normalized;
}

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function compareRecordedTimes(left: string, right: string) {
  const leftTime = Date.parse(left);
  const rightTime = Date.parse(right);
  if (Number.isNaN(leftTime)) return Number.isNaN(rightTime) ? 0 : 1;
  if (Number.isNaN(rightTime)) return -1;
  return leftTime - rightTime;
}

function isDateLike(value: string) {
  return Boolean(value) && !Number.isNaN(Date.parse(value));
}
