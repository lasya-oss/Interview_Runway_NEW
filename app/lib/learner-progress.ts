import {
  FOUR_WEEK_PLAN,
  TWELVE_WEEK_PLAN,
  type RoadmapTask,
  type RoadmapWeek,
} from "@/app/lib/roadmap-data";

export type RoadmapProgressSnapshot = {
  completedTaskIds: string[];
  completionActivity: CompletionActivity;
  weeklyActivity: number[];
  focusedSeconds: number;
  completedCount: number;
  totalTaskCount: number;
  progressPercent: number;
  currentWeek: number;
  nextTask: RoadmapTask | null;
};

export type CompletionActivity = Record<string, string>;

export const LEARNER_TIME_ZONE = "Asia/Kolkata";

export function roadmapPlanForWeeks(roadmapWeeks: number): readonly RoadmapWeek[] {
  return roadmapWeeks === 12 ? TWELVE_WEEK_PLAN : FOUR_WEEK_PLAN;
}

export function roadmapStorageKey(profileId: string) {
  return `interviewrunway-demo-roadmap:v2:${profileId}`;
}

export function roadmapProgressFor(
  weeks: readonly RoadmapWeek[],
  completedTaskIds: readonly string[],
  completionActivity: Readonly<Record<string, string>> = {},
  focusedSeconds = 0,
): RoadmapProgressSnapshot {
  const tasks = weeks.flatMap((week) => week.tasks);
  const validTaskIds = new Set(tasks.map((task) => task.id));
  const completedTaskIdsInOrder: string[] = [];
  const seen = new Set<string>();

  for (const taskId of completedTaskIds) {
    if (validTaskIds.has(taskId) && !seen.has(taskId)) {
      seen.add(taskId);
      completedTaskIdsInOrder.push(taskId);
    }
  }

  const completed = new Set(completedTaskIdsInOrder);
  const normalizedCompletionActivity: CompletionActivity = {};
  for (const taskId of completedTaskIdsInOrder) {
    const date = completionActivity[taskId];
    if (isDateKey(date)) normalizedCompletionActivity[taskId] = date;
  }
  const nextTask = tasks.find((task) => !completed.has(task.id)) ?? null;
  const currentWeek =
    weeks.find((week) => week.tasks.some((task) => !completed.has(task.id)))?.week ??
    weeks.at(-1)?.week ??
    1;

  return {
    completedTaskIds: completedTaskIdsInOrder,
    completionActivity: normalizedCompletionActivity,
    weeklyActivity: weeklyActivityCounts(normalizedCompletionActivity),
    focusedSeconds: normalizeFocusedSeconds(focusedSeconds),
    completedCount: completedTaskIdsInOrder.length,
    totalTaskCount: tasks.length,
    progressPercent: tasks.length
      ? Math.round((completedTaskIdsInOrder.length / tasks.length) * 100)
      : 0,
    currentWeek,
    nextTask,
  };
}

function normalizeFocusedSeconds(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

export function weeklyActivityCounts(
  completionActivity: Readonly<Record<string, string>>,
  now = new Date(),
  timeZone = LEARNER_TIME_ZONE,
): number[] {
  const today = dateKeyForTimeZone(now, timeZone);
  const [year, month, day] = today.split("-").map(Number);
  const currentDate = new Date(Date.UTC(year, month - 1, day));
  const mondayOffset = (currentDate.getUTCDay() + 6) % 7;
  const monday = new Date(currentDate);
  monday.setUTCDate(monday.getUTCDate() - mondayOffset);
  const weekKeys = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);
    return formatDateKey(date);
  });

  return weekKeys.map((date) =>
    Object.values(completionActivity).filter((activityDate) => activityDate === date).length,
  );
}

export function dateKeyForTimeZone(
  value: Date,
  timeZone = LEARNER_TIME_ZONE,
): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(value);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function formatDateKey(value: Date): string {
  return [
    String(value.getUTCFullYear()).padStart(4, "0"),
    String(value.getUTCMonth() + 1).padStart(2, "0"),
    String(value.getUTCDate()).padStart(2, "0"),
  ].join("-");
}

function isDateKey(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export const ROADMAP_PROGRESS_EVENT = "interviewrunway:roadmap-progress-updated";

export type RoadmapProgressEventDetail = {
  profileId: string;
  completedTaskIds: readonly string[];
  completionActivity?: Readonly<Record<string, string>>;
};

export const LEARNER_ACTIVITY_EVENT = "interviewrunway:learner-activity-updated";

export type LearnerActivityEventDetail = {
  profileId: string;
  focusedSeconds: number;
};

export function emitLearnerActivityUpdated(profileId: string, focusedSeconds: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<LearnerActivityEventDetail>(LEARNER_ACTIVITY_EVENT, {
      detail: { profileId, focusedSeconds: normalizeFocusedSeconds(focusedSeconds) },
    }),
  );
}

export function emitRoadmapProgressUpdated(
  profileId: string,
  completedTaskIds: readonly string[],
  completionActivity: Readonly<Record<string, string>> = {},
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<RoadmapProgressEventDetail>(ROADMAP_PROGRESS_EVENT, {
      detail: { profileId, completedTaskIds, completionActivity },
    }),
  );
}
