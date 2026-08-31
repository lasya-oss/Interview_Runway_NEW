"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ROADMAP_PROGRESS_EVENT,
  roadmapPlanForWeeks,
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
  initialProgress,
  initialWeek,
  children,
}: {
  profileId: string;
  roadmapWeeks: number;
  isLive: boolean;
  initialCompleted?: readonly string[];
  initialProgress: number;
  initialWeek: number;
  children: ReactNode;
}) {
  const weeks = useMemo(() => roadmapPlanForWeeks(roadmapWeeks), [roadmapWeeks]);
  const synchronized = isLive || initialCompleted !== undefined;
  const initialSnapshot = useMemo(
    () =>
      synchronized
        ? roadmapProgressFor(weeks, initialCompleted ?? [])
        : createStaticSnapshot(weeks, initialProgress, initialWeek),
    [initialCompleted, initialProgress, initialWeek, synchronized, weeks],
  );
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const storageKey = roadmapStorageKey(profileId);

  useEffect(() => {
    if (!synchronized) return;

    const apply = (completedTaskIds: readonly string[]) => {
      setSnapshot(roadmapProgressFor(weeks, completedTaskIds));
    };
    const handleProgressEvent = (event: Event) => {
      const detail = (event as CustomEvent<RoadmapProgressEventDetail>).detail;
      if (!detail || detail.profileId !== profileId) return;
      apply(detail.completedTaskIds);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      apply(readStoredTaskIds(event.newValue));
    };

    window.addEventListener(ROADMAP_PROGRESS_EVENT, handleProgressEvent);
    window.addEventListener("storage", handleStorage);

    if (!isLive) {
      apply(readStoredTaskIds(window.localStorage.getItem(storageKey)));
      return () => {
        window.removeEventListener(ROADMAP_PROGRESS_EVENT, handleProgressEvent);
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
          return (await response.json()) as { completedTaskIds?: unknown };
        })
        .then((value) => {
          if (!value || controller.signal.aborted) return;
          apply(
            Array.isArray(value.completedTaskIds)
              ? value.completedTaskIds.filter((taskId): taskId is string => typeof taskId === "string")
              : [],
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
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", refreshLiveProgress);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [isLive, profileId, roadmapWeeks, storageKey, synchronized, weeks]);

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
  return {
    completedTaskIds: [],
    completedCount: Math.round((totalTaskCount * progressPercent) / 100),
    totalTaskCount,
    progressPercent,
    currentWeek,
    nextTask: null,
  };
}

function readStoredTaskIds(value: string | null): string[] {
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
