"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  LEARNER_ACTIVITY_EVENT,
  ROADMAP_PROGRESS_EVENT,
  type LearnerActivityEventDetail,
  parseStoredRoadmapProgress,
  roadmapPlanForWeeks,
  roadmapWeekProgressFor,
  roadmapProgressFor,
  roadmapStorageKey,
  type RoadmapProgressEventDetail,
  type RoadmapProgressSnapshot,
} from "@/app/lib/learner-progress";

type RoadmapProgressContextValue = RoadmapProgressSnapshot & {
  synchronized: boolean;
};

const RoadmapProgressContext = createContext<RoadmapProgressContextValue | null>(null);

export function RoadmapProgressProvider({
  profileId,
  roadmapWeeks,
  isLive,
  initialCompleted,
  initialCompletionActivity,
  initialFocusedSeconds,
  initialProgress,
  initialWeek,
  children,
}: {
  profileId: string;
  roadmapWeeks: number;
  isLive: boolean;
  initialCompleted?: readonly string[];
  initialCompletionActivity?: Readonly<Record<string, string>>;
  initialFocusedSeconds?: number;
  initialProgress: number;
  initialWeek: number;
  children: ReactNode;
}) {
  const weeks = useMemo(() => roadmapPlanForWeeks(roadmapWeeks), [roadmapWeeks]);
  const synchronized = isLive || initialCompleted !== undefined;
  const pathname = usePathname();
  const initialSnapshot = useMemo(
    () =>
      synchronized
        ? roadmapProgressFor(weeks, initialCompleted ?? [], initialCompletionActivity, initialFocusedSeconds)
        : createStaticSnapshot(weeks, initialProgress, initialWeek),
    [initialCompleted, initialCompletionActivity, initialFocusedSeconds, initialProgress, initialWeek, synchronized, weeks],
  );
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const storageKey = roadmapStorageKey(profileId);

  useEffect(() => {
    if (!synchronized) return;

    const apply = (
      completedTaskIds: readonly string[],
      completionActivity?: Readonly<Record<string, string>>,
      focusedSeconds?: number,
    ) => {
      setSnapshot((previous) => {
        const effectiveCompletionActivity = {
          ...previousActivityForCompletedTasks(previous, completedTaskIds),
          ...(completionActivity ?? {}),
        };
        return roadmapProgressFor(
          weeks,
          completedTaskIds,
          effectiveCompletionActivity,
          focusedSeconds ?? previous.focusedSeconds,
        );
      });
    };
    const handleProgressEvent = (event: Event) => {
      const detail = (event as CustomEvent<RoadmapProgressEventDetail>).detail;
      if (!detail || detail.profileId !== profileId) return;
      apply(detail.completedTaskIds, detail.completionActivity);
    };
    const handleActivity = (event: Event) => {
      const detail = (event as CustomEvent<LearnerActivityEventDetail>).detail;
      if (!detail || detail.profileId !== profileId) return;
      setSnapshot((previous) => ({ ...previous, focusedSeconds: detail.focusedSeconds }));
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      const stored = parseStoredRoadmapProgress(event.newValue);
      apply(stored.completedTaskIds, stored.completionActivity);
    };

    window.addEventListener(ROADMAP_PROGRESS_EVENT, handleProgressEvent);
    window.addEventListener(LEARNER_ACTIVITY_EVENT, handleActivity);
    window.addEventListener("storage", handleStorage);

    if (!isLive) {
      const stored = parseStoredRoadmapProgress(window.localStorage.getItem(storageKey));
      apply(stored.completedTaskIds, stored.completionActivity);
      return () => {
        window.removeEventListener(ROADMAP_PROGRESS_EVENT, handleProgressEvent);
        window.removeEventListener(LEARNER_ACTIVITY_EVENT, handleActivity);
        window.removeEventListener("storage", handleStorage);
      };
    }

    const controller = new AbortController();
    const refreshLiveProgress = () => {
      void fetch(`/api/learner/progress?roadmapWeeks=${roadmapWeeks}`, {
        cache: "no-store",
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as {
            completedTaskIds?: unknown;
            completionActivity?: unknown;
            focusedSeconds?: unknown;
          };
        })
        .then((value) => {
          if (!value || controller.signal.aborted) return;
          apply(
            Array.isArray(value.completedTaskIds)
              ? value.completedTaskIds.filter((taskId): taskId is string => typeof taskId === "string")
              : [],
            Object.prototype.hasOwnProperty.call(value, "completionActivity")
              ? readCompletionActivity(value.completionActivity)
              : undefined,
            typeof value.focusedSeconds === "number" ? value.focusedSeconds : undefined,
          );
        })
        .catch(() => {
          // The server-rendered account snapshot remains authoritative if refresh fails.
        });
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") refreshLiveProgress();
    };
    window.addEventListener("focus", refreshLiveProgress);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    refreshLiveProgress();

    return () => {
      controller.abort();
      window.removeEventListener(ROADMAP_PROGRESS_EVENT, handleProgressEvent);
      window.removeEventListener(LEARNER_ACTIVITY_EVENT, handleActivity);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshLiveProgress);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [isLive, pathname, profileId, roadmapWeeks, storageKey, synchronized, weeks]);

  const value = useMemo(
    () => ({ ...snapshot, synchronized }),
    [snapshot, synchronized],
  );

  return <RoadmapProgressContext.Provider value={value}>{children}</RoadmapProgressContext.Provider>;
}

export function useRoadmapProgress() {
  const value = useContext(RoadmapProgressContext);
  if (!value) throw new Error("useRoadmapProgress must be used inside RoadmapProgressProvider");
  return value;
}

export function RoadmapTrackLabel({
  fallbackWeek,
  roadmapWeeks,
}: {
  fallbackWeek: number;
  roadmapWeeks: number;
}) {
  const progress = useRoadmapProgress();
  const week = progress.synchronized ? progress.currentWeek : fallbackWeek;
  return <>{roadmapWeeks}-week · W{week}</>;
}

function createStaticSnapshot(
  weeks: ReturnType<typeof roadmapPlanForWeeks>,
  progressPercent: number,
  currentWeek: number,
): RoadmapProgressSnapshot {
  const totalTaskCount = weeks.reduce((count, week) => count + week.tasks.length, 0);
  const completedTaskCount = Math.round((totalTaskCount * progressPercent) / 100);
  const completedTaskIds = weeks
    .flatMap((week) => week.tasks)
    .slice(0, completedTaskCount)
    .map((task) => task.id);
  return {
    completedTaskIds: [],
    completionActivity: {},
    weeklyActivity: [0, 0, 0, 0, 0, 0, 0],
    weekProgress: roadmapWeekProgressFor(weeks, completedTaskIds, currentWeek),
    focusedSeconds: 0,
    completedCount: completedTaskCount,
    totalTaskCount,
    progressPercent,
    currentWeek,
    nextTask: null,
  };
}

function readCompletionActivity(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([taskId, date]) => typeof taskId === "string" && typeof date === "string",
    ),
  );
}

function previousActivityForCompletedTasks(
  snapshot: RoadmapProgressSnapshot,
  completedTaskIds: readonly string[],
) {
  const completed = new Set(completedTaskIds);
  return Object.fromEntries(
    Object.entries(snapshot.completionActivity).filter(([taskId]) => completed.has(taskId)),
  );
}
