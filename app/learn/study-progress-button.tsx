"use client";

import { useState } from "react";
import { emitRoadmapProgressUpdated } from "@/app/lib/learner-progress";

export function StudyProgressButton({
  profileId,
  taskId,
  roadmapWeeks = 12,
  initiallyCompleted = false,
}: {
  profileId: string;
  taskId: string;
  roadmapWeeks?: number;
  initiallyCompleted?: boolean;
}) {
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markComplete = async () => {
    setSaving(true);
    setError(null);
    try {
      const currentResponse = await fetch(`/api/learner/progress?roadmapWeeks=${roadmapWeeks}`, {
        cache: "no-store",
      });
      if (!currentResponse.ok) throw new Error("Progress could not be loaded");
      const current = (await currentResponse.json()) as { completedTaskIds?: unknown };
      const currentIds = Array.isArray(current.completedTaskIds)
        ? current.completedTaskIds.filter((value): value is string => typeof value === "string")
        : [];
      const response = await fetch("/api/learner/progress", {
        body: JSON.stringify({
          completedTaskIds: [...new Set([...currentIds, taskId])],
          roadmapWeeks,
        }),
        headers: { "content-type": "application/json" },
        method: "PUT",
      });
      if (!response.ok) throw new Error("Progress could not be saved");
      emitRoadmapProgressUpdated(profileId, [...new Set([...currentIds, taskId])]);
      setCompleted(true);
    } catch {
      setError("Progress could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <button className="member-primary-button" type="button" onClick={markComplete} disabled={completed || saving}>
        {completed ? "Recorded in your roadmap" : saving ? "Saving…" : "Mark lesson complete"}
        <span aria-hidden="true">{completed ? "✓" : "↗"}</span>
      </button>
      {error ? <p role="alert">{error}</p> : null}
    </div>
  );
}
