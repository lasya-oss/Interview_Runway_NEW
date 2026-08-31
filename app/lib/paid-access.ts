import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { entitlements, learnerProgress } from "@/db/schema";
import type { ChatGPTUser } from "@/app/chatgpt-auth";
import { TWELVE_WEEK_PLAN } from "@/app/lib/roadmap-data";

const DEFAULT_DOMAIN = "vividlabsai.com";

export type LearnerProgress = {
  completedTaskIds: string[];
  progressPercent: number;
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

export async function getLearnerProgress(email: string): Promise<LearnerProgress> {
  const [record] = await (await getDb())
    .select({
      completedTaskIds: learnerProgress.completedTaskIds,
      progressPercent: learnerProgress.progressPercent,
    })
    .from(learnerProgress)
    .where(eq(learnerProgress.userEmail, normalizeEmail(email)))
    .limit(1);

  if (!record) return { completedTaskIds: [], progressPercent: 0 };

  const validTaskIds = validFoundationTaskIds();
  let parsed: unknown;
  try {
    parsed = JSON.parse(record.completedTaskIds);
  } catch {
    parsed = [];
  }
  const completedTaskIds = Array.isArray(parsed)
    ? [
        ...new Set(
          parsed.filter(
            (taskId): taskId is string =>
              typeof taskId === "string" && validTaskIds.has(taskId),
          ),
        ),
      ]
    : [];

  return {
    completedTaskIds,
    progressPercent: progressFor(completedTaskIds),
  };
}

export async function saveLearnerProgress(
  email: string,
  completedTaskIds: readonly string[],
): Promise<LearnerProgress> {
  const validTaskIds = validFoundationTaskIds();
  const uniqueTaskIds = [...new Set(completedTaskIds)].filter((taskId) =>
    validTaskIds.has(taskId),
  );
  const progressPercent = progressFor(uniqueTaskIds);
  const updatedAt = new Date().toISOString();

  await (await getDb())
    .insert(learnerProgress)
    .values({
      userEmail: normalizeEmail(email),
      completedTaskIds: JSON.stringify(uniqueTaskIds),
      progressPercent,
      updatedAt,
    })
    .onConflictDoUpdate({
      target: learnerProgress.userEmail,
      set: {
        completedTaskIds: JSON.stringify(uniqueTaskIds),
        progressPercent,
        updatedAt,
      },
    });

  return { completedTaskIds: uniqueTaskIds, progressPercent };
}

export function createFoundationProfile(
  user: ChatGPTUser,
  progress: LearnerProgress,
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
    nextAction: nextTask?.title || "Review your completed Foundation roadmap",
    nextActionMeta: nextTask?.meta || "Foundation · complete",
    nextActionHref: nextTask
      ? nextTask.learning.kind === "material"
        ? `/learn/material/${nextTask.learning.slug}`
        : `/learn/roadmap/task/${nextTask.id}`
      : "/learn/roadmap",
    focus: "Build repeatable technical patterns before adding timed mocks.",
    access: { library: true, practice: false, feedback: false, coaching: false },
  };
}

function validFoundationTaskIds() {
  return new Set(
    TWELVE_WEEK_PLAN.flatMap((week) => week.tasks.map((task) => task.id)),
  );
}

export function currentFoundationWeek(completedTaskIds: readonly string[]) {
  const completed = new Set(completedTaskIds);
  return (
    TWELVE_WEEK_PLAN.find((week) =>
      week.tasks.some((task) => !completed.has(task.id)),
    )?.week ?? TWELVE_WEEK_PLAN.at(-1)?.week ?? 1
  );
}

function progressFor(completedTaskIds: readonly string[]) {
  const totalTasks = TWELVE_WEEK_PLAN.reduce(
    (count, week) => count + week.tasks.length,
    0,
  );
  return Math.round((completedTaskIds.length / totalTasks) * 100);
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
