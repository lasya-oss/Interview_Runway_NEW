"use client";

import { useEffect, useRef } from "react";
import { emitLearnerActivityUpdated } from "@/app/lib/learner-progress";

const FLUSH_INTERVAL_MS = 30_000;

export function FocusTimeTracker({ profileId }: { profileId: string }) {
  const activeSince = useRef<number | null>(null);

  useEffect(() => {
    const start = () => {
      if (document.visibilityState === "visible" && document.hasFocus()) {
        activeSince.current ??= performance.now();
      }
    };
    const flush = () => {
      if (activeSince.current === null) return;
      const elapsedSeconds = Math.floor((performance.now() - activeSince.current) / 1000);
      activeSince.current = performance.now();
      if (elapsedSeconds < 1) return;

      void fetch("/api/learner/focus", {
        body: JSON.stringify({ seconds: Math.min(elapsedSeconds, 300) }),
        headers: { "content-type": "application/json" },
        keepalive: true,
        method: "POST",
      })
        .then(async (response) => {
          if (!response.ok) return null;
          return (await response.json()) as { focusedSeconds?: unknown };
        })
        .then((value) => {
          if (typeof value?.focusedSeconds !== "number") return;
          emitLearnerActivityUpdated(profileId, value.focusedSeconds);
        })
        .catch(() => {
          // Focus tracking is best-effort and never blocks the lesson.
        });
    };
    const pause = () => {
      flush();
      activeSince.current = null;
    };
    const resume = () => {
      activeSince.current = null;
      start();
    };

    start();
    const interval = window.setInterval(flush, FLUSH_INTERVAL_MS);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") resume();
      else pause();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", pause);
    window.addEventListener("focus", resume);
    window.addEventListener("pagehide", pause);

    return () => {
      window.clearInterval(interval);
      pause();
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", pause);
      window.removeEventListener("focus", resume);
      window.removeEventListener("pagehide", pause);
    };
  }, [profileId]);

  return null;
}
