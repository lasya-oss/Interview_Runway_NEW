import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { entitlements, learnerProgress } from "@/db/schema";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { ROADMAP_PLANS, TWELVE_WEEK_PLAN } from "@/app/lib/roadmap-data";
import {
  dateKeyForTimeZone,
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
};

export function isConfiguredTestFoundationEmail(email: string): boolean {
  const normalizedEmail = normalizeEmail(email);
  const domain =
    process.env.AUTH_ALLOWED_DOMAIN?.trim().toLowerCase() || DEFAULT_DOMAIN;
  if (!normalizedEmail.endsWith(`@${domain}`)) return false;

  const configuredEmails = (process.env.TEST_FOUNDATION_EMAILS ?? "")
    .split(/[\s,]+/)
    .map(normalizeEmail)
    .filter(Boolean);

  return configuredEmails.includes(normalizedEmail);
}

export async function hasVaultAccess(email: string): Promise<boolean> {
  if (isConfiguredTestFoundationEmail(email)) return true;

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
  const foundationTestEmail = isConfiguredTestFoundationEmail(normalizedEmail);
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
  };
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
  options: { secondSeatAccess?: boolean } = {},
) {
  const displayName = user.fullName || user.displayName;
  const firstName = displayName.trim().split(/\s+/)[0] || user.email;
  const allTasks = TWELVE_WEEK_PLAN.flatMap((week) => week.tasks);
  const nextTask = allTasks.find(
    (task) => !progress.completedTaskIds.includes(task.id),
  );
  const currentWeek = currentFoundationWeek(progress.completedTaskIds);

  return {
    id: "foundation" as const,
    isLive: true,
    name: displayName,
    firstName,
    initials: initialsFor(displayName),
    email: user.email,
    role: "Vivid Labs · authenticated learner",
    target: "Remote engineering roles",
    plan: "The Vault · Foundation · ₹799 paid",
    planShort: "Vault",
    progress: progress.progressPercent,
    streak: 0,
    week: currentWeek,
    roadmapWeeks: 12,
    completedTaskIds: progress.completedTaskIds,
    completionActivity: progress.completionActivity,
    focusedSeconds: progress.focusedSeconds,
    isSecondSeatLive: options.secondSeatAccess === true,
    nextAction: nextTask?.title || "Review your completed Foundation roadmap",
    nextActionMeta: nextTask?.meta || "Foundation · complete",
    nextActionHref: nextTask
      ? nextTask.learning.kind === "material"
        ? `/learn/material/${nextTask.learning.slug}`
        : `/learn/roadmap/task/${nextTask.id}`
      : "/learn/roadmap",
    focus: "Build repeatable technical patterns before adding timed mocks.",
    access: {
      library: true,
      practice: options.secondSeatAccess === true,
      feedback: options.secondSeatAccess === true,
      coaching: false,
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
