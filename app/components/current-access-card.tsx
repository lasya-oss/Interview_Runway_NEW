"use client";

import Link from "next/link";
import { useRoadmapProgress } from "@/app/learn/roadmap/learner-progress-client";

export function CurrentAccessCard({
  plan,
  fallbackProgress,
  fallbackWeek,
  inStatusPanel = false,
}: {
  plan: string;
  fallbackProgress: number;
  fallbackWeek: number;
  inStatusPanel?: boolean;
}) {
  const progress = useRoadmapProgress();
  const planProgress = progress.synchronized ? progress.progressPercent : fallbackProgress;
  const week = progress.synchronized ? progress.currentWeek : fallbackWeek;

  return (
    <div className={`member-plan-card${inStatusPanel ? " member-plan-card-status" : ""}`}>
      <span>Current access</span>
      <strong>{plan}</strong>
      <div><i style={{ width: `${planProgress}%` }} /></div>
      <small>{planProgress}% plan progress · Week {week}</small>
      <Link className="member-action-button" href="/pricing">Compare access <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
