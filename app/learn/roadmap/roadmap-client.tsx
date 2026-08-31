"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  emitRoadmapProgressUpdated,
  roadmapProgressFor,
  roadmapStorageKey,
} from "@/app/lib/learner-progress";
import type { RoadmapTask, RoadmapWeek } from "@/app/lib/roadmap-data";

export type { RoadmapTask, RoadmapWeek } from "@/app/lib/roadmap-data";

type RoadmapWeekStatus = "completed" | "in-progress" | "upcoming";

export function RoadmapChecklist({
  profileId,
  currentWeek,
  weeks,
  initialCompleted,
  persistMode = "demo",
}: {
  profileId: string;
  currentWeek: number;
  weeks: readonly RoadmapWeek[];
  initialCompleted: readonly string[];
  persistMode?: "demo" | "account";
}) {
  const isAccount = persistMode === "account";
  const storageKey = roadmapStorageKey(profileId);
  const [completed, setCompleted] = useState<Set<string>>(() =>
    new Set(
      roadmapProgressFor(
        weeks,
        isAccount ? initialCompleted : readDemoCompleted(storageKey, initialCompleted),
      ).completedTaskIds,
    ),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const allTasks = useMemo(() => weeks.flatMap((week) => week.tasks), [weeks]);
  const completedCount = allTasks.filter((task) => completed.has(task.id)).length;
  const completion = Math.round((completedCount / allTasks.length) * 100);
  const activeWeek = useMemo(() => {
    return weeks.find((week) =>
      week.tasks.some((task) => !completed.has(task.id)),
    )?.week ?? weeks.at(-1)?.week ?? currentWeek;
  }, [completed, currentWeek, weeks]);

  const persist = async (next: Set<string>, previous: Set<string>) => {
    if (!isAccount) {
      try {
        window.localStorage.setItem(storageKey, JSON.stringify([...next]));
        emitRoadmapProgressUpdated(profileId, [...next]);
      } catch {
        // This checklist is an optional device-local demo enhancement.
      }
      return;
    }

    setSaving(true);
    setSaveError(null);
    try {
      const response = await fetch("/api/learner/progress", {
        body: JSON.stringify({ completedTaskIds: [...next] }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) throw new Error("Progress could not be saved");
      emitRoadmapProgressUpdated(profileId, [...next]);
    } catch {
      setCompleted(previous);
      setSaveError("Progress could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const toggle = (taskId: string) => {
    const previous = new Set(completed);
    const next = new Set(completed);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    setCompleted(next);
    void persist(next, previous);
  };

  const reset = () => {
    const previous = new Set(completed);
    const next = new Set(
      roadmapProgressFor(weeks, isAccount ? [] : initialCompleted).completedTaskIds,
    );
    setCompleted(next);
    void persist(next, previous);
  };

  const learningHref = (task: RoadmapTask) =>
    task.learning.kind === "material"
      ? `/learn/material/${task.learning.slug}`
      : `/learn/roadmap/task/${task.id}`;

  return (
    <div className="roadmap-workspace">
      <section className="roadmap-overview" aria-labelledby="roadmap-overview-title">
        <div>
          <p className="member-kicker">{isAccount ? "Account roadmap" : "Device-local demo checklist"}</p>
          <h1 id="roadmap-overview-title">A plan with a finish line.</h1>
          <p>{isAccount ? "Check off work as you study. Your Foundation progress is stored with your account and follows you across sessions." : "Check off sample work to see this browser-only plan respond. No learner record is created or synced."}</p>
        </div>
        <div className="roadmap-completion" aria-label={`${completion}% of ${isAccount ? "your" : "sample"} plan complete`}>
          <strong>{completion}<small>%</small></strong>
          <span>{completedCount} of {allTasks.length}<br />{isAccount ? "tracked tasks" : "sample tasks"}</span>
          <i><b style={{ width: `${completion}%` }} /></i>
        </div>
      </section>

      <div className="roadmap-toolbar">
        <span><i /> Your position · Week {activeWeek}</span>
        <button type="button" onClick={reset} disabled={saving}>{isAccount ? "Reset progress" : "Reset sample progress"}</button>
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
                    const contentLabel = task.learning.kind === "material"
                      ? "Open learning content"
                      : task.learning.kind === "lesson"
                        ? "Open Foundation lesson"
                        : "View learning brief";
                    return (
                      <div className={`roadmap-task-row ${isComplete ? "is-complete" : ""}`} key={task.id}>
                        <label className="roadmap-task-check">
                          <input
                            type="checkbox"
                            checked={isComplete}
                            aria-label={`Mark ${task.title} complete`}
                            onChange={() => toggle(task.id)}
                          />
                          <span aria-hidden="true" />
                        </label>
                        <Link className="roadmap-task-learning" href={learningHref(task)}>
                          <span className="roadmap-task-copy">
                            <strong>{task.title}</strong>
                            <small>{task.meta}</small>
                          </span>
                          <span className="roadmap-task-link-label">{contentLabel} <span aria-hidden="true">↗</span></span>
                        </Link>
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

function readDemoCompleted(storageKey: string, fallback: readonly string[]) {
  if (typeof window === "undefined") return [...fallback];

  try {
    const value = window.localStorage.getItem(storageKey);
    if (!value) return [...fallback];
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed;
  } catch {
    // Device-local demo state may be cleared or malformed; fall back safely.
  }
  return [...fallback];
}
