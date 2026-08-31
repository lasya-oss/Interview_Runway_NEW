import {
  FOUR_WEEK_PLAN,
  TWELVE_WEEK_PLAN,
  type RoadmapTask,
  type RoadmapWeek,
} from "@/app/lib/roadmap-data";

export type RoadmapProgressSnapshot = {
  completedTaskIds: string[];
  completedCount: number;
  totalTaskCount: number;
  progressPercent: number;
  currentWeek: number;
  nextTask: RoadmapTask | null;
};

export function roadmapPlanForWeeks(roadmapWeeks: number): readonly RoadmapWeek[] {
  return roadmapWeeks === 12 ? TWELVE_WEEK_PLAN : FOUR_WEEK_PLAN;
}

export function roadmapStorageKey(profileId: string) {
  return `interviewrunway-demo-roadmap:v2:${profileId}`;
}

export function roadmapProgressFor(
  weeks: readonly RoadmapWeek[],
  completedTaskIds: readonly string[],
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
  const nextTask = tasks.find((task) => !completed.has(task.id)) ?? null;
  const currentWeek =
    weeks.find((week) => week.tasks.some((task) => !completed.has(task.id)))?.week ??
    weeks.at(-1)?.week ??
    1;

  return {
    completedTaskIds: completedTaskIdsInOrder,
    completedCount: completedTaskIdsInOrder.length,
    totalTaskCount: tasks.length,
    progressPercent: tasks.length
      ? Math.round((completedTaskIdsInOrder.length / tasks.length) * 100)
      : 0,
    currentWeek,
    nextTask,
  };
}

export const ROADMAP_PROGRESS_EVENT = "interviewrunway:roadmap-progress-updated";

export type RoadmapProgressEventDetail = {
  profileId: string;
  completedTaskIds: readonly string[];
};

export function emitRoadmapProgressUpdated(
  profileId: string,
  completedTaskIds: readonly string[],
) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<RoadmapProgressEventDetail>(ROADMAP_PROGRESS_EVENT, {
      detail: { profileId, completedTaskIds },
    }),
  );
}
