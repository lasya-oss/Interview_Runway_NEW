"use client";

import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import {
  DEMO_REVIEW_MATERIALS,
  LEARNING_MATERIALS,
  MOCK_HISTORY,
  SCORE_DIMENSIONS,
  type DemoProfileView,
  type DemoReviewMaterial,
} from "@/app/lib/demo-data";
import { useRoadmapProgress } from "./roadmap/learner-progress-client";

export function TodayDashboard({ profile }: { profile: DemoProfileView }) {
  const roadmap = useRoadmapProgress();
  const isTracked = roadmap.synchronized;
  const progress = isTracked ? roadmap.progressPercent : profile.progress;
  const currentWeek = isTracked ? roadmap.currentWeek : profile.week;
  const isFreshLearner = progress === 0 && (isTracked ? roadmap.completedCount === 0 : (profile.completedTaskIds?.length ?? 0) === 0);
  const totalPlanTasks = roadmap.totalTaskCount;
  const todayKicker = isFreshLearner
    ? `Start here · Week 1 of ${profile.roadmapWeeks}`
    : `Week ${currentWeek} of ${profile.roadmapWeeks} · ${profile.id === "foundation" ? "Foundation" : profile.id === "practice" ? "Second Seat" : "Calibration"} path`;
  const weeklyActivity = isTracked ? roadmap.weeklyActivity : [72, 100, 48, 86, 34, 0, 0];
  const maxWeeklyActivity = Math.max(...weeklyActivity, 0);
  const weeklyActivityTotal = weeklyActivity.reduce((total, value) => total + value, 0);
  const scoreKey = profile.id;
  const continuedMaterials = profile.id === "foundation"
    ? LEARNING_MATERIALS.filter((material) => material.tier === "foundation").slice(0, 3)
    : profile.id === "practice"
      ? [
          ...LEARNING_MATERIALS.filter((material) => material.tier === "practice"),
          ...LEARNING_MATERIALS.filter((material) => material.tier === "foundation"),
        ].slice(0, 4)
      : [
          ...LEARNING_MATERIALS.filter((material) => material.tier === "premium"),
          ...LEARNING_MATERIALS.filter((material) => material.tier === "practice"),
        ].slice(0, 4);
  const reviewMaterials = DEMO_REVIEW_MATERIALS
    .filter((material) => material.profiles.includes(profile.id))
    .slice(0, 3);
  const emptySignalTitle = profile.id === "foundation"
    ? "Build the first signal from your own work."
    : "Your first practice signal is waiting.";
  const emptySignalBody = profile.id === "foundation"
    ? "Complete the next Foundation checkpoint to turn your study work into a reviewable learning signal."
    : "Complete one practice round to turn your own transcript into a reviewable signal. Until then, this workspace keeps readiness separate from sample data.";
  const emptySignalLink = profile.id === "foundation" ? "/pricing" : "/learn/practice";
  const emptySignalLinkLabel = profile.id === "foundation" ? "See how AI practice establishes it" : "Start your first practice round";
  const signalLabel = profile.id === "foundation" ? "Foundation next signal" : "Second Seat next signal";
  const nextTask = isTracked && !isFreshLearner ? roadmap.nextTask : null;
  const nextAction = nextTask?.title ?? profile.nextAction;
  const nextActionMeta = nextTask?.meta ?? profile.nextActionMeta;
  const nextActionHref = nextTask
    ? nextTask.learning.kind === "material"
      ? `/learn/material/${nextTask.learning.slug}`
      : `/learn/roadmap/task/${nextTask.id}`
    : profile.nextActionHref ?? (profile.id === "premium" ? "/learn/coaching" : profile.id === "practice" ? "/learn/practice" : "/learn/roadmap");
  const completedLabel = isTracked
    ? `${roadmap.completedCount} / ${totalPlanTasks}`
    : profile.id === "practice" ? "8 / 11" : "9 / 10";
  const focusedTimeLabel = isTracked
    ? isFreshLearner ? "Starts at 0m" : roadmap.focusedSeconds > 0 ? formatFocusedTime(roadmap.focusedSeconds) : "Not tracked yet"
    : profile.id === "practice" ? "4h 38m" : "5h 06m";
  const nextReviewLabel = isTracked
    ? isFreshLearner
      ? "After first study step"
      : roadmap.nextTask ? "After next study step" : "Roadmap complete"
    : "Thu 18:30";
  const weeklyActivityStatus = weeklyActivityTotal
    ? `${weeklyActivityTotal} roadmap task${weeklyActivityTotal === 1 ? "" : "s"} completed this week`
    : "No roadmap completions recorded this week";

  return (
    <div className="member-page member-page-vault-today member-dashboard">
      <section className="member-hero-grid">
        <div className="member-hero-copy">
          <p className="member-kicker">{todayKicker}</p>
          <h1>{isFreshLearner ? <>Welcome, {profile.firstName}. <em>Start with the first decision.</em></> : <>Keep going, {profile.firstName}. <em>Keep the loop tight.</em></>}</h1>
          <p>{profile.focus}</p>
        </div>
        <div className="readiness-dial" style={{ "--readiness": `${progress * 3.6}deg` } as CSSProperties}>
          <div><strong>{progress}</strong><span>{profile.id === "foundation" ? <>Plan<br />complete</> : <>Readiness<br />signal</>}</span></div>
          <i /><i /><i />
        </div>
      </section>

      <section className="member-command-grid">
        <article className="next-action-panel">
          <div className="member-panel-label"><span>Next action</span><b>{nextActionMeta}</b></div>
          <div className="next-action-visual" aria-hidden="true"><i /><i /><i /><span /></div>
          <h2>{nextAction}</h2>
          <p>{isFreshLearner ? "Choose one round, answer in your own words, and use the transcript to decide what to practise next." : profile.id === "foundation" ? "Continue the lesson, then explain your choice aloud before viewing the worked decision tree." : profile.id === "practice" ? "The prompt adapts after each design commitment. Your previous gap is already loaded into the rubric." : "Bring two examples that show cross-team influence. The coach packet has the evidence prompts ready."}</p>
          <Link className="member-primary-button" href={nextActionHref}>Continue <span aria-hidden="true">↗</span></Link>
        </article>

        <article className="weekly-plan-panel">
          <div className="member-panel-label"><span>This week</span><b>{isFreshLearner ? "Start here" : profile.isLive || isTracked ? "Plan active" : profile.week === 4 ? "Final pass" : "Plan active"}</b></div>
          <div className="week-strip" aria-label={isTracked ? weeklyActivityStatus : "Weekly activity"}>
            {weeklyActivity.map((value, index) => <span className={value ? "has-activity" : ""} key={index} title={value ? `${value} task${value === 1 ? "" : "s"} completed` : "No tasks completed"}><i data-activity-count={value} style={{ height: value === 0 ? "0%" : `${Math.max(8, Math.round((value / maxWeeklyActivity) * 100))}%` }} /><b>{"MTWTFSS"[index]}</b></span>)}
          </div>
          {isTracked ? <p className="week-strip-status" aria-live="polite">{weeklyActivityStatus}</p> : null}
          <dl className="weekly-stats">
            <div><dt>Completed</dt><dd>{completedLabel}</dd></div>
            <div><dt>Focused time</dt><dd>{focusedTimeLabel}</dd></div>
            <div><dt>Next review</dt><dd>{nextReviewLabel}</dd></div>
          </dl>
        </article>
      </section>

      <ReviewMaterials profile={profile} materials={reviewMaterials} />

      <section className="member-section">
        <div className="member-section-heading"><div><p className="member-kicker">Skill signal</p><h2>Where the evidence points.</h2></div><Link href="/learn/feedback">Open full feedback <span>↗</span></Link></div>
        <div className="signal-grid">
          {profile.id === "foundation" || isFreshLearner || profile.isLive ? (
            <article className="foundation-baseline-panel">
              <span>BASELINE / NOT ESTABLISHED</span>
              <div className="baseline-radar" aria-hidden="true"><i /><i /><i /><b>?</b></div>
              <h3>{profile.id === "foundation" ? "No synthetic readiness score." : "No practice signal yet."}</h3>
              <p>{profile.id === "foundation" ? "Your lesson completion is tracked, but readiness only appears after a scored practice session. Until then, the product keeps those concepts separate." : "Your practice access is ready, but readiness only appears after a scored transcript. Until then, the product keeps your starting state clean."}</p>
              <Link href={emptySignalLink}>{emptySignalLinkLabel} ↗</Link>
            </article>
          ) : (
            <article className="signal-bars">
              {SCORE_DIMENSIONS.map((dimension) => (
                <div key={dimension.label}><span>{dimension.label}</span><div><i style={{ width: `${dimension[scoreKey]}%` }} /></div><b>{dimension[scoreKey]}</b></div>
              ))}
            </article>
          )}
          <article className={`tier-insight tier-insight-${profile.id}`}>
            <span>{isFreshLearner || profile.isLive ? signalLabel : profile.id === "foundation" ? "Foundation signal" : profile.id === "practice" ? "Adaptive plan change" : "Coach observation"}</span>
            <h3>{isFreshLearner || profile.isLive ? emptySignalTitle : profile.id === "foundation" ? "Explanation quality is ahead of trade-off depth." : profile.id === "practice" ? "Move consistency decisions to minute five." : "Your scope is senior; your story still sounds team-local."}</h3>
            <p>{isFreshLearner || profile.isLive ? emptySignalBody : profile.id === "foundation" ? "Finish the rate-limit and caching decision guides before adding timed practice." : profile.id === "practice" ? "The next two mocks will probe consistency before scale so the choice becomes automatic." : "Thursday’s session will rebuild one project story around influence, decision cost, and measurable outcome."}</p>
          </article>
        </div>
      </section>

      {profile.access.practice && !profile.isLive && !isFreshLearner ? (
        <section className="member-section">
          <div className="member-section-heading"><div><p className="member-kicker">Recent practice</p><h2>Every attempt leaves evidence.</h2></div><Link href="/learn/practice">Start another mock <span>↗</span></Link></div>
          <div className="mock-history-table">
            {MOCK_HISTORY.map((mock) => <div key={mock.id}><span>{mock.id}</span><strong>{mock.title}</strong><small>{mock.signal}</small><b>{mock.score}</b><time>{mock.date}</time></div>)}
          </div>
        </section>
      ) : null}

      <section className="member-section">
        <div className="member-section-heading"><div><p className="member-kicker">Continue learning</p><h2>Materials placed in context.</h2></div><Link href="/learn/library">View the library <span>↗</span></Link></div>
        <div className="member-material-row">
          {continuedMaterials.map((material) => (
            <Link href={`/learn/material/${material.slug}`} className="member-material-card" key={material.slug}>
              <span>{material.number}</span><small>{material.category} · {material.duration}</small><h3>{material.title}</h3><p>{material.description}</p><b>{material.format} ↗</b>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function formatFocusedTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 1) return "<1m";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
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

  return (
    <section className="member-section member-review-materials">
      <div className="member-section-heading">
        <div><p className="member-kicker">{profile.isLive ? `Inside your ${planLabel} plan` : "Inside this demo"}</p><h2>Open the material—not a placeholder.</h2></div>
        <span>{profile.isLive ? `Included with ${planLabel === "Foundation" ? "₹799 Foundation" : "₹2,499 Second Seat"} access` : "Review editions · human approval pending"}</span>
      </div>
      <div className="member-review-material-grid">
        {materials.map((material) => (
          <a href={material.href} target="_blank" rel="noreferrer" key={material.href}>
            <span className="member-review-cover">
              {material.preview ? (
                <Image src={material.preview} alt={`${material.title} cover`} width={993} height={1403} sizes="180px" />
              ) : (
                <span className="member-review-cover-fallback" aria-label={`${material.title} Vault QA asset`}>
                  <strong>{material.category}</strong>
                  <b>VAULT<br />ASSET</b>
                </span>
              )}
            </span>
            <span className="member-review-copy"><small>{material.category} · {material.format}</small><strong>{material.title}</strong><p>{material.detail}</p><b>{profile.isLive ? "Open Vault QA material" : "Open review edition"} ↗</b></span>
          </a>
        ))}
      </div>
    </section>
  );
}
