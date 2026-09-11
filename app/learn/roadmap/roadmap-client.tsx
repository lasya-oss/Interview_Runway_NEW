"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  dateKeyForTimeZone,
  emitRoadmapProgressUpdated,
  parseStoredRoadmapProgress,
  roadmapProgressFor,
  roadmapStorageKey,
  serializeStoredRoadmapProgress,
  type CompletionActivity,
} from "@/app/lib/learner-progress";
import { libraryHrefForRoadmapTask, type RoadmapWeek } from "@/app/lib/roadmap-data";
import { useRoadmapProgress } from "./learner-progress-client";

export type { RoadmapTask, RoadmapWeek } from "@/app/lib/roadmap-data";

type RoadmapWeekStatus = "completed" | "in-progress" | "upcoming";

type AccountProgressOverride = {
  completedTaskIds: string[];
  completionActivity: CompletionActivity;
};

export function RoadmapChecklist({
  profileId,
  roadmapWeeks,
  currentWeek,
  weeks,
  initialCompleted,
  persistMode = "demo",
}: {
  profileId: string;
  roadmapWeeks: number;
  currentWeek: number;
  weeks: readonly RoadmapWeek[];
  initialCompleted: readonly string[];
  persistMode?: "demo" | "account";
}) {
  const isAccount = persistMode === "account";
  const planLabel = roadmapWeeks === 12 ? "Foundation" : "Second Seat";
  const storageKey = roadmapStorageKey(profileId);
  const roadmap = useRoadmapProgress();
  const [initialProgress] = useState(() => {
    if (isAccount) return roadmap;
    const stored = readDemoProgress(storageKey, initialCompleted);
    return roadmapProgressFor(
      weeks,
      stored?.completedTaskIds ?? initialCompleted,
      stored?.completionActivity,
    );
  });
  const [demoCompleted, setDemoCompleted] = useState<Set<string>>(() =>
    new Set(initialProgress.completedTaskIds),
  );
  const [demoCompletionActivity, setDemoCompletionActivity] = useState<CompletionActivity>(initialProgress.completionActivity);
  const [accountOverride, setAccountOverride] = useState<AccountProgressOverride | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const allTasks = useMemo(() => weeks.flatMap((week) => week.tasks), [weeks]);
  const completed = useMemo(
    () => new Set(isAccount ? accountOverride?.completedTaskIds ?? roadmap.completedTaskIds : demoCompleted),
    [accountOverride?.completedTaskIds, demoCompleted, isAccount, roadmap.completedTaskIds],
  );
  const completionActivity = isAccount
    ? accountOverride?.completionActivity ?? roadmap.completionActivity
    : demoCompletionActivity;

  const completedCount = allTasks.filter((task) => completed.has(task.id)).length;
  const completion = Math.round((completedCount / allTasks.length) * 100);
  const activeWeek = useMemo(() => {
    return weeks.find((week) =>
      week.tasks.some((task) => !completed.has(task.id)),
    )?.week ?? weeks.at(-1)?.week ?? currentWeek;
  }, [completed, currentWeek, weeks]);

  const persist = async (
    next: Set<string>,
    nextCompletionActivity: CompletionActivity,
    previous: Set<string>,
    previousCompletionActivity: CompletionActivity,
  ) => {
    if (!isAccount) {
      try {
        window.localStorage.setItem(
          storageKey,
          serializeStoredRoadmapProgress([...next], nextCompletionActivity),
        );
        emitRoadmapProgressUpdated(profileId, [...next], nextCompletionActivity);
      } catch {
        // This checklist is an optional device-local demo enhancement.
      }
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/learner/progress", {
        body: JSON.stringify({ completedTaskIds: [...next], roadmapWeeks }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) throw new Error("Progress could not be saved");
      const saved = (await response.json()) as {
        completedTaskIds?: unknown;
        completionActivity?: unknown;
      };
      emitRoadmapProgressUpdated(
        profileId,
        Array.isArray(saved.completedTaskIds)
          ? saved.completedTaskIds.filter((taskId): taskId is string => typeof taskId === "string")
          : [...next],
        readCompletionActivity(saved.completionActivity),
      );
      if (isAccount) setAccountOverride(null);
    } catch {
      if (isAccount) {
        setAccountOverride(null);
      } else {
        setDemoCompleted(previous);
        setDemoCompletionActivity(previousCompletionActivity);
      }
      setSaveError("Progress could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (taskId: string) => {
    const previous = new Set(completed);
    const next = new Set(completed);
    const nextCompletionActivity = { ...completionActivity };
    if (next.has(taskId)) next.delete(taskId);
    else {
      next.add(taskId);
      if (!nextCompletionActivity[taskId]) {
        nextCompletionActivity[taskId] = dateKeyForTimeZone(new Date());
      }
    }
    if (!next.has(taskId)) delete nextCompletionActivity[taskId];
    if (isAccount) {
      setAccountOverride({ completedTaskIds: [...next], completionActivity: nextCompletionActivity });
    } else {
      setDemoCompleted(next);
      setDemoCompletionActivity(nextCompletionActivity);
    }
    void persist(next, nextCompletionActivity, previous, completionActivity);
  };

  const reset = () => {
    const previous = new Set(completed);
    const next = new Set(
      roadmapProgressFor(weeks, isAccount ? [] : initialCompleted).completedTaskIds,
    );
    const nextCompletionActivity: CompletionActivity = {};
    if (isAccount) {
      setAccountOverride({ completedTaskIds: [...next], completionActivity: nextCompletionActivity });
    } else {
      setDemoCompleted(next);
      setDemoCompletionActivity(nextCompletionActivity);
    }
    void persist(next, nextCompletionActivity, previous, completionActivity);
  };

  return (
    <div className="roadmap-workspace">
      <section className="roadmap-overview" aria-labelledby="roadmap-overview-title">
        <div>
          <p className="member-kicker">{isAccount ? "Account roadmap" : "Device-local demo checklist"}</p>
          <h1 id="roadmap-overview-title">Your learning plan.</h1>
          <p>{isAccount ? `Check off work as you study. Your ${planLabel} progress is stored with your account and follows you across sessions.` : "Check off sample work to see this browser-only plan respond. No progress is saved or synced."}</p>
        </div>
        <div className="roadmap-completion" aria-label={`${completion}% of ${isAccount ? "your" : "sample"} plan complete`}>
          <strong>{completion}<small>%</small></strong>
          <span>{completedCount} of {allTasks.length}<br />{isAccount ? "tracked tasks" : "sample tasks"}</span>
          <i><b style={{ width: `${completion}%` }} /></i>
        </div>
      </section>

      <div className="roadmap-toolbar">
        <span><i /> Current week · Week {activeWeek}</span>
        <button className="roadmap-toolbar__reset" type="button" onClick={reset} disabled={saving}>{isAccount ? "Reset progress" : "Reset sample progress"}</button>
        {saving ? <small>Saving…</small> : null}
      </div>
      {saveError ? <p role="alert">{saveError}</p> : null}

      <div className="roadmap-week-list">
        {weeks.map((week) => {
          const weekCompleted = week.tasks.filter((task) => completed.has(task.id)).length;
          const status = getWeekStatus(week, weekCompleted, activeWeek);
          const isCurrent = status === "in-progress" && week.week === activeWeek;
          return (
            <section className={`roadmap-week roadmap-week--${status} ${isCurrent ? "is-current" : ""}`} key={week.week} aria-labelledby={`roadmap-week-${week.week}`}>
              <div className="roadmap-week-index">
                <span>{String(week.week).padStart(2, "0")}</span>
                <i />
              </div>
              <div className="roadmap-week-content">
                <div className="roadmap-week-heading">
                  <div>
                    <div className="roadmap-week-label-row">
                      <p>Week {week.week}</p>
                      <span className={`roadmap-week-status roadmap-week-status--${status}`}>
                        <i aria-hidden="true" />
                        {formatWeekStatus(status)}
                      </span>
                    </div>
                    <h2 id={`roadmap-week-${week.week}`}>{week.title}</h2>
                    <span className="roadmap-week-description">{week.detail}</span>
                  </div>
                  <div className="roadmap-week-progress">
                    <b>{weekCompleted} / {week.tasks.length}</b>
                    <span>tasks</span>
                  </div>
                </div>
                <div className="roadmap-week-outcome">
                  <div>
                    <span>Outcome</span>
                    <p>{week.outcome}</p>
                  </div>
                  <div className="roadmap-week-time">
                    <span>Estimated time</span>
                    <b>{formatEstimatedTime(week.estimatedMinutes)}</b>
                  </div>
                </div>
                <div className="roadmap-task-list">
                  {week.tasks.map((task) => {
                    const isComplete = completed.has(task.id);
                    const libraryHref = libraryHrefForRoadmapTask(task);
                    const taskCopy = (
                      <span className="roadmap-task-copy">
                        <strong>{task.title}</strong>
                        <small>{task.meta}</small>
                      </span>
                    );
                    return (
                      <div
                        className={`roadmap-task-row ${isComplete ? "is-complete" : ""}`}
                        id={`roadmap-task-${task.id}`}
                        key={task.id}
                      >
                        <label className="roadmap-task-check">
                          <input
                            type="checkbox"
                            checked={isComplete}
                            aria-label={`Mark ${task.title} complete`}
                            onChange={() => toggle(task.id)}
                          />
                          <span aria-hidden="true" />
                        </label>
                        {libraryHref ? (
                          <Link className="roadmap-task-learning" href={libraryHref} prefetch={true}>
                            {taskCopy}
                            <span className="roadmap-task-library-button">View in Library <span aria-hidden="true">↗</span></span>
                          </Link>
                        ) : (
                          <div className="roadmap-task-learning roadmap-task-learning--unmatched">
                            {taskCopy}
                            <span className="roadmap-task-link-label roadmap-task-link-label--unavailable">No matching material</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function readCompletionActivity(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      ([taskId, date]) => typeof taskId === "string" && typeof date === "string",
    ),
  );
}

function getWeekStatus(
  week: RoadmapWeek,
  weekCompleted: number,
  activeWeek: number,
): RoadmapWeekStatus {
  if (weekCompleted === week.tasks.length) return "completed";
  if (week.week === activeWeek) return "in-progress";
  return "upcoming";
}

function formatWeekStatus(status: RoadmapWeekStatus) {
  return status === "completed" ? "Completed" : status === "in-progress" ? "In Progress" : "Upcoming";
}

function formatEstimatedTime(minutes: number) {
  if (minutes < 60) return `~${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `~${hours}h ${remainingMinutes}m` : `~${hours}h`;
}

function readDemoProgress(storageKey: string, fallback: readonly string[]) {
  if (typeof window === "undefined") return { completedTaskIds: [...fallback], completionActivity: {} };

  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return { completedTaskIds: [...fallback], completionActivity: {} };
    return parseStoredRoadmapProgress(value);
  } catch {
    // Device-local demo state may be cleared or malformed; fall back safely.
  }
  return { completedTaskIds: [...fallback], completionActivity: {} };
}
