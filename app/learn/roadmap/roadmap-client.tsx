"use client";

import Link from "next/link";
import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { RoadmapTask, RoadmapWeek } from "@/app/lib/roadmap-data";

export type { RoadmapTask, RoadmapWeek } from "@/app/lib/roadmap-data";

function parseCompleted(value: string, fallback: readonly string[]) {
  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === "string")) return parsed;
  } catch {
    // Device-local demo state may be cleared or malformed; fall back safely.
  }
  return [...fallback];
}

export function RoadmapChecklist({
  profileId,
  currentWeek,
  weeks,
  initialCompleted,
}: {
  profileId: string;
  currentWeek: number;
  weeks: readonly RoadmapWeek[];
  initialCompleted: readonly string[];
}) {
  const storageKey = `interviewrunway-demo-roadmap:${profileId}`;
  const eventName = `interviewrunway-roadmap-change:${profileId}`;
  const fallbackSnapshot = useMemo(() => JSON.stringify(initialCompleted), [initialCompleted]);

  const subscribe = useCallback((onChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === storageKey) onChange();
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener(eventName, onChange);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(eventName, onChange);
    };
  }, [eventName, storageKey]);

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) ?? fallbackSnapshot;
    } catch {
      return fallbackSnapshot;
    }
  }, [fallbackSnapshot, storageKey]);

  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => fallbackSnapshot);
  const completed = useMemo(() => new Set(parseCompleted(snapshot, initialCompleted)), [initialCompleted, snapshot]);
  const allTasks = useMemo(() => weeks.flatMap((week) => week.tasks), [weeks]);
  const completedCount = allTasks.filter((task) => completed.has(task.id)).length;
  const completion = Math.round((completedCount / allTasks.length) * 100);

  const persist = (next: Set<string>) => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify([...next]));
    } catch {
      // This checklist is an optional device-local demo enhancement.
    }
    window.dispatchEvent(new Event(eventName));
  };

  const toggle = (taskId: string) => {
    const next = new Set(completed);
    if (next.has(taskId)) next.delete(taskId);
    else next.add(taskId);
    persist(next);
  };

  const reset = () => persist(new Set(initialCompleted));

  const learningHref = (task: RoadmapTask) =>
    task.learning.kind === "material"
      ? `/learn/material/${task.learning.slug}`
      : `/learn/roadmap/task/${task.id}`;

  return (
    <div className="roadmap-workspace">
      <section className="roadmap-overview" aria-labelledby="roadmap-overview-title">
        <div>
          <p className="member-kicker">Device-local demo checklist</p>
          <h1 id="roadmap-overview-title">A plan with a finish line.</h1>
          <p>Check off sample work to see this browser-only plan respond. No learner record is created or synced.</p>
        </div>
        <div className="roadmap-completion" aria-label={`${completion}% of sample plan complete`}>
          <strong>{completion}<small>%</small></strong>
          <span>{completedCount} of {allTasks.length}<br />sample tasks</span>
          <i><b style={{ width: `${completion}%` }} /></i>
        </div>
      </section>

      <div className="roadmap-toolbar">
        <span><i /> Current position · week {currentWeek}</span>
        <button type="button" onClick={reset}>Reset sample progress</button>
      </div>

      <div className="roadmap-week-list">
        {weeks.map((week) => {
          const weekCompleted = week.tasks.filter((task) => completed.has(task.id)).length;
          const isCurrent = week.week === currentWeek;
          return (
            <section className={`roadmap-week ${isCurrent ? "is-current" : ""}`} key={week.week} aria-labelledby={`roadmap-week-${week.week}`}>
              <div className="roadmap-week-index">
                <span>{String(week.week).padStart(2, "0")}</span>
                <i />
              </div>
              <div className="roadmap-week-content">
                <div className="roadmap-week-heading">
                  <div>
                    <p>{isCurrent ? "Current week" : week.week < currentWeek ? "Previous phase" : "Upcoming phase"}</p>
                    <h2 id={`roadmap-week-${week.week}`}>{week.title}</h2>
                    <span>{week.detail}</span>
                  </div>
                  <b>{weekCompleted} / {week.tasks.length}</b>
                </div>
                <div className="roadmap-task-list">
                  {week.tasks.map((task) => {
                    const isComplete = completed.has(task.id);
                    const contentLabel = task.learning.kind === "material" ? "Open learning content" : "View learning brief";
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
