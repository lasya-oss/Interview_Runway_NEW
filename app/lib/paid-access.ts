import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { entitlements, learnerProgress } from "@/db/schema";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import type { DemoTier } from "@/app/lib/demo-data";
import { isInternalFullAccessEmail } from "@/app/lib/internal-access";
import { ROADMAP_PLANS, TWELVE_WEEK_PLAN } from "@/app/lib/roadmap-data";
import {
  dateKeyForTimeZone,
  nextIncompleteRoadmapTask,
  roadmapPlanForWeeks,
  roadmapProgressFor,
  type CompletionActivity,
} from "@/app/lib/learner-progress";

const DEFAULT_DOMAIN = "vividlabsai.com";
export type RoadmapWeeks = 4 | 12;

export type LearnerProgress = {
  completedTaskIds: string[];
  completionActivity: CompletionActivity;
  focusedSeconds: number;
  progressPercent: number;
};

export type LearnerAccess = {
  vault: boolean;
  secondSeat: boolean;
  humanCalibration: boolean;
};

export function isLearnerPlan(value: unknown): value is DemoTier {
  return value === "foundation" || value === "practice" || value === "premium";
}

export function learnerPlansForAccess(access: LearnerAccess): DemoTier[] {
  return [
    access.vault ? "foundation" : null,
    access.secondSeat ? "practice" : null,
    access.humanCalibration ? "premium" : null,
  ].filter((plan): plan is DemoTier => plan !== null);
}

export function canAccessLearnerPlan(
  access: LearnerAccess,
  plan: DemoTier,
): boolean {
  return plan === "foundation"
    ? access.vault
    : plan === "practice"
      ? access.secondSeat
      : access.humanCalibration;
}

/**
 * The authenticated Vivid Labs workspace is the internal customer-preview
 * cohort. Every account on the explicitly configured internal domain receives
 * the complete product stack without requiring seeded purchase records.
 */
export { isInternalFullAccessEmail };

export function isConfiguredTestFoundationEmail(email: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedEmailDomain(normalizedEmail)) return false;
  return configuredTestEmails("TEST_FOUNDATION_EMAILS").includes(normalizedEmail);
}

/**
 * Explicit, server-only allowlist for paid-flow QA. It grants the real Second
 * Seat path to the named authenticated account; it does not create sessions,
 * answers, scores, or feedback records.
 */
export function isConfiguredTestSecondSeatEmail(email: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  if (!isAllowedEmailDomain(normalizedEmail)) return false;
  return configuredTestEmails("TEST_SECOND_SEAT_EMAILS").includes(normalizedEmail);
}

export async function hasVaultAccess(email: string): Promise<boolean> {
  if (
    isInternalFullAccessEmail(email) ||
    isConfiguredTestFoundationEmail(email) ||
    isConfiguredTestSecondSeatEmail(email)
  ) {
    return true;
  }

  const [entitlement] = await (await getDb())
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userEmail, normalizeEmail(email)),
        eq(entitlements.offer, "vault"),
        eq(entitlements.status, "active"),
      ),
    )
    .limit(1);

  return Boolean(entitlement);
}

export async function hasSecondSeatAccess(email: string): Promise<boolean> {
  if (isInternalFullAccessEmail(email)) return true;
  if (isConfiguredTestSecondSeatEmail(email)) return true;
  if (!(await hasVaultAccess(email))) return false;

  const [entitlement] = await (await getDb())
    .select({ id: entitlements.id })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userEmail, normalizeEmail(email)),
        eq(entitlements.offer, "ai-prep"),
        eq(entitlements.status, "active"),
      ),
    )
    .limit(1);

  return Boolean(entitlement);
}

/**
 * Resolve the access stack for the learner shell with one entitlement lookup.
 * The shell is rendered for every learner section, so keeping these related
 * checks together avoids issuing the Vault query twice on each navigation.
 */
export async function getLearnerAccess(email: string): Promise<LearnerAccess> {
  const normalizedEmail = normalizeEmail(email);
  if (isInternalFullAccessEmail(normalizedEmail)) {
    return { vault: true, secondSeat: true, humanCalibration: true };
  }
  const foundationTestEmail = isConfiguredTestFoundationEmail(normalizedEmail);
  const secondSeatTestEmail = isConfiguredTestSecondSeatEmail(normalizedEmail);
  if (secondSeatTestEmail) {
    return { vault: true, secondSeat: true, humanCalibration: false };
  }
  const offers = foundationTestEmail ? ["ai-prep"] : ["vault", "ai-prep"];
  const records = await (await getDb())
    .select({ offer: entitlements.offer })
    .from(entitlements)
    .where(
      and(
        eq(entitlements.userEmail, normalizedEmail),
        eq(entitlements.status, "active"),
        inArray(entitlements.offer, offers),
      ),
    );
  const secondSeat = records.some((record) => record.offer === "ai-prep");
  const vault = foundationTestEmail || records.some((record) => record.offer === "vault");

  return {
    vault,
    secondSeat: vault && secondSeat,
    humanCalibration: false,
  };
}

function configuredTestEmails(key: "TEST_FOUNDATION_EMAILS" | "TEST_SECOND_SEAT_EMAILS") {
  return (process.env[key] ?? "")
    .split(/[\s,]+/)
    .map(normalizeEmail)
    .filter(Boolean);
}

function isAllowedEmailDomain(email: string) {
  const domain =
    process.env.AUTH_ALLOWED_DOMAIN?.trim().toLowerCase() || DEFAULT_DOMAIN;
  return email.endsWith(`@${domain}`);
}

export async function getLearnerProgress(
  email: string,
  roadmapWeeks: RoadmapWeeks = 12,
): Promise<LearnerProgress> {
  const db = await getDb();
  const [record] = await db
    .select({
      completedTaskIds: learnerProgress.completedTaskIds,
      completionActivity: learnerProgress.completionActivity,
      focusedSeconds: learnerProgress.focusedSeconds,
      updatedAt: learnerProgress.updatedAt,
      progressPercent: learnerProgress.progressPercent,
    })
    .from(learnerProgress)
    .where(eq(learnerProgress.userEmail, normalizeEmail(email)))
    .limit(1);

  if (!record) return { completedTaskIds: [], completionActivity: {}, focusedSeconds: 0, progressPercent: 0 };

  const completedTaskIds = parseCompletedTaskIds(record.completedTaskIds);
  const storedCompletionActivity = parseCompletionActivity(record.completionActivity);
  const completionActivity = repairLegacyCompletionActivity(
    completedTaskIds,
    storedCompletionActivity,
    record.updatedAt,
    roadmapWeeks,
  );
  if (hasNewCompletionActivity(storedCompletionActivity, completionActivity)) {
    // Legacy rows predate per-task activity. Keep the repair idempotent and
    // conditional so a concurrent completion cannot be overwritten. The row
    // timestamp is part of the compare-and-set guard because focus updates
    // may otherwise leave the activity JSON unchanged while the row changes.
    await db
      .update(learnerProgress)
      .set({ completionActivity: JSON.stringify(completionActivity) })
      .where(
        and(
          eq(learnerProgress.userEmail, normalizeEmail(email)),
          eq(learnerProgress.updatedAt, record.updatedAt),
          eq(learnerProgress.completionActivity, record.completionActivity),
        ),
      );
  }
  const roadmapProgress = roadmapProgressFor(
    roadmapPlanForWeeks(roadmapWeeks),
    completedTaskIds,
    completionActivity,
  );

  return {
    completedTaskIds: roadmapProgress.completedTaskIds,
    completionActivity: roadmapProgress.completionActivity,
    focusedSeconds: record.focusedSeconds,
    progressPercent: roadmapProgress.progressPercent,
  };
}

export async function recordFocusedTime(
  email: string,
  seconds: number,
): Promise<LearnerProgress> {
  const db = await getDb();
  const normalizedEmail = normalizeEmail(email);
  const now = new Date().toISOString();
  await db
    .insert(learnerProgress)
    .values({
      userEmail: normalizedEmail,
      focusedSeconds: seconds,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: learnerProgress.userEmail,
      set: {
        focusedSeconds: sql`${learnerProgress.focusedSeconds} + ${seconds}`,
      },
    });

  return getLearnerProgress(normalizedEmail);
}

export async function saveLearnerProgress(
  email: string,
  completedTaskIds: readonly string[],
  roadmapWeeks: RoadmapWeeks = 12,
): Promise<LearnerProgress> {
  const db = await getDb();
  const [record] = await db
    .select({
      completedTaskIds: learnerProgress.completedTaskIds,
      completionActivity: learnerProgress.completionActivity,
      focusedSeconds: learnerProgress.focusedSeconds,
      updatedAt: learnerProgress.updatedAt,
    })
    .from(learnerProgress)
    .where(eq(learnerProgress.userEmail, normalizeEmail(email)))
    .limit(1);
  const storedTaskIds = parseCompletedTaskIds(record?.completedTaskIds);
  const storedCompletionActivity = repairLegacyCompletionActivity(
    storedTaskIds,
    parseCompletionActivity(record?.completionActivity),
    record?.updatedAt,
    roadmapWeeks,
  );
  const selectedPlan = roadmapPlanForWeeks(roadmapWeeks);
  const selectedTaskIds = new Set(
    selectedPlan.flatMap((week) => week.tasks.map((task) => task.id)),
  );
  const allTaskIds = new Set(
    ROADMAP_PLANS.flatMap((plan) =>
      plan.flatMap((week) => week.tasks.map((task) => task.id)),
    ),
  );
  const selectedProgress = roadmapProgressFor(selectedPlan, completedTaskIds);
  const preservedTaskIds = storedTaskIds.filter(
    (taskId) => allTaskIds.has(taskId) && !selectedTaskIds.has(taskId),
  );
  const storedTaskIdsForAllPlans = [
    ...preservedTaskIds,
    ...selectedProgress.completedTaskIds,
  ];
  const nextCompletionActivity: CompletionActivity = {};
  for (const taskId of preservedTaskIds) {
    const date = storedCompletionActivity[taskId];
    if (date) nextCompletionActivity[taskId] = date;
  }
  for (const taskId of selectedProgress.completedTaskIds) {
    const date = storedCompletionActivity[taskId];
    if (date) {
      nextCompletionActivity[taskId] = date;
    } else if (!storedTaskIds.includes(taskId)) {
      nextCompletionActivity[taskId] = dateKeyForTimeZone(new Date());
    }
  }
  const progressPercent = selectedProgress.progressPercent;
  const updatedAt = new Date().toISOString();

  await db
    .insert(learnerProgress)
    .values({
      userEmail: normalizeEmail(email),
      completedTaskIds: JSON.stringify(storedTaskIdsForAllPlans),
      completionActivity: JSON.stringify(nextCompletionActivity),
      progressPercent,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: learnerProgress.userEmail,
      set: {
        completedTaskIds: JSON.stringify(storedTaskIdsForAllPlans),
        completionActivity: JSON.stringify(nextCompletionActivity),
        progressPercent,
        updatedAt,
      },
    });

  return {
    completedTaskIds: selectedProgress.completedTaskIds,
    completionActivity: roadmapProgressFor(
      selectedPlan,
      selectedProgress.completedTaskIds,
      nextCompletionActivity,
    ).completionActivity,
    focusedSeconds: record?.focusedSeconds ?? 0,
    progressPercent,
  };
}

function parseCompletedTaskIds(value: string | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    return Array.isArray(parsed)
      ? parsed.filter((taskId): taskId is string => typeof taskId === "string")
      : [];
  } catch {
    return [];
  }
}

function parseCompletionActivity(value: string | undefined): CompletionActivity {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        ([taskId, date]) => typeof taskId === "string" && typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date),
      ),
    );
  } catch {
    return {};
  }
}

function repairLegacyCompletionActivity(
  completedTaskIds: readonly string[],
  completionActivity: CompletionActivity,
  updatedAt: string | undefined,
  roadmapWeeks: RoadmapWeeks,
): CompletionActivity {
  // A row-level updated_at can stand in for a task date only when there is
  // exactly one legacy task. With multiple tasks it cannot identify their
  // individual completion dates without inventing history.
  if (roadmapWeeks !== 12 || completedTaskIds.length !== 1 || !updatedAt) {
    return completionActivity;
  }

  const savedDate = new Date(updatedAt);
  if (Number.isNaN(savedDate.getTime())) return completionActivity;

  const vaultTaskIds = new Set(
    TWELVE_WEEK_PLAN.flatMap((week) => week.tasks.map((task) => task.id)),
  );
  const fallbackDate = dateKeyForTimeZone(savedDate);
  const repaired = { ...completionActivity };

  for (const taskId of completedTaskIds) {
    if (vaultTaskIds.has(taskId) && !repaired[taskId]) repaired[taskId] = fallbackDate;
  }

  return repaired;
}

function hasNewCompletionActivity(
  storedCompletionActivity: CompletionActivity,
  repairedCompletionActivity: CompletionActivity,
) {
  return Object.entries(repairedCompletionActivity).some(
    ([taskId, date]) => storedCompletionActivity[taskId] !== date,
  );
}

export function createFoundationProfile(
  user: ChatGPTUser,
  progress: LearnerProgress,
  availablePlans: readonly DemoTier[] = ["foundation"],
) {
  return createLiveLearnerProfile(user, progress, {
    id: "foundation",
    roadmapWeeks: 12,
    plan: "The Vault · Foundation · ₹799 paid",
    planShort: "Vault",
    fallbackNextAction: "Review your completed Foundation roadmap",
    fallbackNextActionMeta: "Foundation · complete",
    focus: "Build repeatable technical patterns before adding timed mocks.",
    practiceAccess: false,
    isSecondSeatLive: false,
    coachingAccess: false,
    availablePlans,
  });
}

export function createSecondSeatProfile(
  user: ChatGPTUser,
  progress: LearnerProgress,
  availablePlans: readonly DemoTier[] = ["practice"],
) {
  return createLiveLearnerProfile(user, progress, {
    id: "practice",
    roadmapWeeks: 4,
    plan: "The Second Seat · Practice · ₹2,499 paid",
    planShort: "The Second Seat",
    fallbackNextAction: "Choose your first practice round",
    fallbackNextActionMeta: "Practice · 30 min",
    fallbackNextActionHref: "/learn/practice",
    focus: "Start with one interview-shaped round and use the transcript to choose the next correction.",
    practiceAccess: true,
    isSecondSeatLive: true,
    coachingAccess: false,
    availablePlans,
  });
}

export function createHumanCalibrationProfile(
  user: ChatGPTUser,
  progress: LearnerProgress,
  availablePlans: readonly DemoTier[] = ["premium"],
) {
  return createLiveLearnerProfile(user, progress, {
    id: "premium",
    roadmapWeeks: 4,
    plan: "Human Calibration · Qualified",
    planShort: "Human Calibration",
    fallbackNextAction: "Open your calibration workspace",
    fallbackNextActionMeta: "Coach review · full access",
    fallbackNextActionHref: "/learn/coaching",
    focus: "Use the complete preparation, practice, feedback, and calibration system as one connected workflow.",
    practiceAccess: true,
    isSecondSeatLive: true,
    coachingAccess: true,
    availablePlans,
  });
}

function createLiveLearnerProfile(
  user: ChatGPTUser,
  progress: LearnerProgress,
  config: {
    id: "foundation" | "practice" | "premium";
    roadmapWeeks: RoadmapWeeks;
    plan: string;
    planShort: string;
    fallbackNextAction: string;
    fallbackNextActionMeta: string;
    fallbackNextActionHref?: string;
    focus: string;
    practiceAccess: boolean;
    isSecondSeatLive: boolean;
    coachingAccess: boolean;
    availablePlans: readonly DemoTier[];
  },
) {
  const displayName = user.fullName || user.displayName;
  const firstName = displayName.trim().split(/\s+/)[0] || user.email;
  const selectedPlan = roadmapPlanForWeeks(config.roadmapWeeks);
  const nextTask = nextIncompleteRoadmapTask(selectedPlan, progress.completedTaskIds);
  const currentWeek = roadmapProgressFor(selectedPlan, progress.completedTaskIds).currentWeek;

  return {
    id: config.id,
    isLive: true,
    name: displayName,
    firstName,
    initials: initialsFor(displayName),
    email: user.email,
    availablePlans: config.availablePlans,
    role: "Vivid Labs · authenticated learner",
    target: "Remote engineering roles",
    plan: config.plan,
    planShort: config.planShort,
    progress: progress.progressPercent,
    streak: 0,
    week: currentWeek,
    roadmapWeeks: config.roadmapWeeks,
    completedTaskIds: progress.completedTaskIds,
    completionActivity: progress.completionActivity,
    focusedSeconds: progress.focusedSeconds,
    isSecondSeatLive: config.isSecondSeatLive,
    nextAction: nextTask?.title || config.fallbackNextAction,
    nextActionMeta: nextTask?.meta || config.fallbackNextActionMeta,
    nextActionHref: nextTask
      ? nextTask.learning.kind === "material"
        ? `/learn/material/${nextTask.learning.slug}`
        : `/learn/roadmap/task/${nextTask.id}`
      : config.fallbackNextActionHref ?? "/learn/roadmap",
    focus: config.focus,
    access: {
      library: true,
      practice: config.practiceAccess,
      feedback: config.practiceAccess,
      coaching: config.coachingAccess,
    },
  };
}

export function currentFoundationWeek(completedTaskIds: readonly string[]) {
  return roadmapProgressFor(TWELVE_WEEK_PLAN, completedTaskIds).currentWeek;
}

function initialsFor(value: string) {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  return (parts.length > 1
    ? `${parts[0][0]}${parts.at(-1)?.[0]}`
    : value.slice(0, 2)
  ).toUpperCase();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}
