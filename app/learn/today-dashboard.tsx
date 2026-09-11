"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  DEMO_REVIEW_MATERIALS,
  LEARNING_MATERIALS,
  MOCK_HISTORY,
  type DemoProfileView,
  type DemoReviewMaterial,
} from "@/app/lib/demo-data";
import type { RoadmapTask } from "@/app/lib/roadmap-data";
import { useRoadmapProgress } from "./roadmap/learner-progress-client";

export function TodayDashboard({ profile }: { profile: DemoProfileView }) {
  const roadmap = useRoadmapProgress();
  const isTracked = roadmap.synchronized;
  const progress = isTracked ? roadmap.progressPercent : profile.progress;
  const currentWeek = isTracked ? roadmap.currentWeek : profile.week;
  const isFreshLearner = progress === 0 && (isTracked ? roadmap.completedCount === 0 : (profile.completedTaskIds?.length ?? 0) === 0);
  const totalPlanTasks = roadmap.totalTaskCount;
  const weekProgress = roadmap.weekProgress;
  const completedWeeks = weekProgress.filter((week) => week.status === "completed").length;
  const activeWeek = weekProgress.find((week) => week.status === "in-progress") ?? weekProgress.at(-1);
  const todayKicker = isFreshLearner
    ? `Start here · Week 1 of ${profile.roadmapWeeks}`
    : `Week ${currentWeek} of ${profile.roadmapWeeks} · ${profile.id === "foundation" ? "Foundation" : profile.id === "practice" ? "Second Seat" : "Human Calibration"} plan`;
  const planStatus = activeWeek?.status === "completed" ? "Plan complete" : activeWeek ? `Week ${activeWeek.week} active` : "Plan active";
  const weeklyProgressStatus = activeWeek?.status === "completed"
    ? `${completedWeeks} of ${profile.roadmapWeeks} weeks complete`
    : activeWeek
      ? `${completedWeeks} of ${profile.roadmapWeeks} weeks complete · W${activeWeek.week} active · ${activeWeek.progressPercent}% this week`
      : "Plan progress not available";
  const reviewMaterials = DEMO_REVIEW_MATERIALS
    .filter((material) => material.profiles.includes(profile.id))
    .slice(0, 3);
  const nextRoadmapTask = roadmap.nextTask;
  const nextTask = !isFreshLearner ? nextRoadmapTask : null;
  const nextAction = nextTask?.title ?? profile.nextAction;
  const nextActionMeta = nextTask?.meta ?? profile.nextActionMeta;
  const nextActionHref = nextRoadmapTask
    ? roadmapTaskHref(nextRoadmapTask)
    : "/learn/roadmap";
  const nextActionDescription = describeNextAction(profile, nextTask, isFreshLearner);
  const readinessLabel = profile.id === "foundation"
    ? progress === 100 ? <>Plan<br />complete</> : <>Plan<br />progress</>
    : profile.id === "practice" ? <>Readiness<br />score</> : <>Calibration<br />status</>;
  const completedLabel = isTracked
    ? `${roadmap.completedCount} / ${totalPlanTasks}`
    : profile.id === "practice" ? "8 / 11" : "9 / 10";
  const focusedTimeLabel = isTracked
    ? isFreshLearner ? "Starts at 0m" : roadmap.focusedSeconds > 0 ? formatFocusedTime(roadmap.focusedSeconds) : "Not tracked yet"
    : profile.id === "practice" ? "4h 38m" : "5h 06m";
  const nextReviewLabel = isTracked
      ? isFreshLearner
        ? profile.id === "premium" ? "After first calibration step" : "After first study step"
      : roadmap.nextTask ? "After next study step" : "Roadmap complete"
    : "Thu 18:30";

  return (
    <div className="member-page member-page-vault-today member-dashboard">
      <section className="member-hero-grid">
        <div className="member-hero-copy">
          <p className="member-kicker">{todayKicker}</p>
          <h1>{isFreshLearner ? <>Welcome, {profile.firstName}. <em>Start with the first decision.</em></> : <>Keep going, {profile.firstName}. <em>Keep your preparation focused.</em></>}</h1>
          <p>{profile.focus}</p>
        </div>
        <div className="readiness-dial" style={{ "--readiness": `${progress * 3.6}deg` } as CSSProperties}>
          <div><strong>{progress}</strong><span>{readinessLabel}</span></div>
          <i /><i /><i />
        </div>
      </section>

      <section className="member-command-grid">
        <article className="next-action-panel">
          <div className="member-panel-label"><span>Next action</span><b>{nextActionMeta}</b></div>
          <div className="next-action-visual" aria-hidden="true"><i /><i /><i /><span /></div>
          <h2>{nextAction}</h2>
          <p>{nextActionDescription}</p>
          <Link className="member-primary-button" href={nextActionHref}>Continue <span aria-hidden="true">↗</span></Link>
        </article>

        <article className="weekly-plan-panel">
          <div className="member-panel-label"><span>Plan progress</span><b>{isFreshLearner ? "Start here" : planStatus}</b></div>
          <ol className={`week-strip week-strip--${profile.roadmapWeeks}`} aria-label={`Plan progress across ${profile.roadmapWeeks} weeks`}>
            {weekProgress.map((week) => (
              <li
                className={`week-progress-item week-progress-item--${week.status}`}
                key={week.week}
                title={`Week ${week.week}: ${formatWeekStatus(week.status)} · ${week.completedTaskCount} of ${week.totalTaskCount} tasks · ${week.progressPercent}% complete`}
              >
                <span className="week-progress-track" aria-hidden="true"><i style={{ height: `${week.progressPercent}%` }} /></span>
                <b>W{week.week}</b>
              </li>
            ))}
          </ol>
          <p className="week-strip-status" aria-live="polite">{weeklyProgressStatus}</p>
          <dl className="weekly-stats">
            <div><dt>Completed</dt><dd>{completedLabel}</dd></div>
            <div><dt>Focused time</dt><dd>{focusedTimeLabel}</dd></div>
            <div><dt>Next review</dt><dd>{nextReviewLabel}</dd></div>
          </dl>
        </article>
      </section>

      <ReviewMaterials profile={profile} materials={reviewMaterials} />

      {profile.access.practice && !profile.isLive && !isFreshLearner ? (
        <section className="member-section">
          <div className="member-section-heading"><div><p className="member-kicker">Recent practice</p><h2>Every attempt leaves evidence.</h2></div><Link className="member-section-action" href="/learn/practice">Start another mock <span aria-hidden="true">↗</span></Link></div>
          <div className="mock-history-table">
            {MOCK_HISTORY.map((mock) => <div key={mock.id}><span>{mock.id}</span><strong>{mock.title}</strong><small>{mock.signal}</small><b>{mock.score}</b><time>{mock.date}</time></div>)}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function formatWeekStatus(status: "completed" | "in-progress" | "upcoming") {
  return status === "completed" ? "Completed" : status === "in-progress" ? "Current week" : "Upcoming";
}

function formatFocusedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function roadmapTaskHref(task: RoadmapTask) {
  return `/learn/roadmap#roadmap-task-${task.id}`;
}

function describeNextAction(
  profile: DemoProfileView,
  nextTask: RoadmapTask | null,
  isFreshLearner: boolean,
) {
  const isLearnerPlan = profile.id === "foundation" || profile.id === "practice";

  if (nextTask) {
    if (nextTask.learning.kind === "material") {
      const materialDescription = LEARNING_MATERIALS.find((material) => material.slug === nextTask.learning.slug)?.description;
      return materialDescription
        ? isLearnerPlan
          ? `${materialDescription} Use it to practise the decision cues this roadmap step is building, then carry one clear explanation into your next interview-style response.`
          : materialDescription
        : "Open the matching Library material to build the next interview skill.";
    }
    return isLearnerPlan
      ? `${nextTask.learning.objective} Finish by capturing one concrete takeaway you can reuse in the next practice step.`
      : nextTask.learning.objective;
  }

  if (isFreshLearner) {
    return profile.id === "foundation"
      ? "Define your target role, interview loop, and evidence bar so the rest of the Foundation plan stays focused. This gives every later study step a clear target and evidence to build on."
      : profile.id === "practice"
        ? "Choose an interview-shaped round, then use the transcript and rubric to identify the first correction worth practising. The result gives your next correction a clear starting point instead of a generic score."
        : "Bring two examples that show cross-team influence so the coach can calibrate your scope and decision evidence.";
  }

  return profile.id === "foundation"
    ? "Continue the lesson, then explain the decision aloud so the reasoning is ready for interview pressure. Capture the reasoning in your own words so it is ready for the next roadmap step."
    : profile.id === "practice"
      ? "Use the next practice round to turn the previous gap into a repeatable interview decision. Focus on one observable improvement so the next review shows what actually changed."
      : "Bring two examples that show cross-team influence so the coach can calibrate your scope and decision evidence.";
}

function ReviewMaterials({
  profile,
  materials,
}: {
  profile: DemoProfileView;
  materials: readonly DemoReviewMaterial[];
}) {
  const planLabel = profile.id === "foundation"
    ? "Foundation"
    : profile.id === "practice"
      ? "Second Seat"
      : "Human Calibration";
  const liveAccessLabel = profile.id === "foundation"
    ? "₹799 Foundation"
    : profile.id === "practice"
      ? "₹2,499 Second Seat"
      : "Human Calibration";

  return (
    <section className="member-section member-review-materials">
      <div className="member-section-heading">
        <div><p className="member-kicker">{profile.isLive ? `Inside your ${planLabel} plan` : "Inside this demo"}</p><h2>Open the material—not a placeholder.</h2></div>
        <span>{profile.isLive ? `Included with ${liveAccessLabel} access` : "Review editions · human approval pending"}</span>
      </div>
      <div className="member-review-material-grid">
        {materials.map((material) => (
          <a href={material.href} target="_blank" rel="noreferrer" key={material.href}>
            <span className="member-review-cover">
              {material.preview ? (
                <Image src={material.preview} alt={`${material.title} cover`} width={993} height={1403} sizes="180px" />
              ) : (
                <span className="member-review-cover-fallback" aria-label={`${material.title} supporting material`}>
                  <strong>{material.category}</strong>
                  <b>VAULT<br />ASSET</b>
                </span>
              )}
            </span>
            <span className="member-review-copy"><small>{material.category} · {material.format}</small><strong>{material.title}</strong><p>{material.detail}</p><b className="member-card-action">{profile.isLive ? `Open ${planLabel} material` : "Open review edition"} <span aria-hidden="true">↗</span></b></span>
          </a>
        ))}
      </div>
    </section>
  );
}
