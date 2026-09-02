import type { Metadata } from "next";
import Link from "next/link";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { SCORE_DIMENSIONS } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import {
  getLatestCompletedSecondSeatSession,
  getSecondSeatSession,
} from "@/app/lib/second-seat-store";
import { findSecondSeatMock } from "@/app/lib/second-seat-engine";
import { FeedbackClient } from "./feedback-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feedback | Learner workspace",
  robots: { index: false, follow: false },
};

const EVIDENCE = [
  {
    time: "06:14",
    dimensionKeys: ["problemFraming"],
    signal: "Problem framing · positive",
    excerpt: "I would keep ingestion independent from query serving because their traffic and failure profiles are different.",
    observation: "The answer separated write and read concerns before choosing storage, which kept the architecture coherent.",
    correction: "Preserve this ordering in the next design: product constraint, workload split, then component choice.",
  },
  {
    time: "14:52",
    dimensionKeys: ["tradeoffClarity"],
    signal: "Trade-off clarity · gap",
    excerpt: "We can add replicas for availability and scale the database as traffic grows.",
    observation: "Replication was named without choosing a consistency model or explaining what readers may observe after failover.",
    correction: "State the acceptable staleness and failover behaviour before discussing replica count.",
  },
  {
    time: "27:08",
    dimensionKeys: ["technicalDepth", "tradeoffClarity"],
    signal: "Operations · gap",
    excerpt: "If consumers fall behind, I would add more workers and monitor the queue length.",
    observation: "The recovery direction was sound, but queue length alone hid whether older events were breaching the product SLO.",
    correction: "Use age of oldest event by priority, consumer lag, and recovery rate; bound retries before scaling workers.",
  },
] as const;

const ACTIONS = [
  { number: "01", title: "Defend the consistency model", body: "Re-answer the same architecture opening with staleness and failover behaviour stated in the first five minutes.", meta: "15 min · verbal rehearsal", href: "/learn/material/rate-limiter", why: "A design can sound scalable while remaining ambiguous about what readers observe after failure. Naming the model makes the trade-off reviewable." },
  { number: "02", title: "Diagnose backlog with the right metric", body: "Write the operating response for queue age, retry amplification, and priority shedding during a 20× spike.", meta: "20 min · scenario", href: "/learn/material/notification-mock", why: "Queue length alone does not show whether older, higher-priority work is breaching the product promise." },
  { number: "03", title: "Repeat under a new prompt", body: "Run the notification-service sample and apply the same decision order without reusing the architecture.", meta: "35 min · scripted mock", href: "/learn/practice", why: "A changed prompt tests whether the correction transferred into a repeatable interview habit." },
] as const;

export default async function FeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ sessionId?: string | string[] }>;
}) {
  const profile = await requireDemoProfile("/learn/feedback");

  if (!profile.access.feedback) {
    return (
      <div className="member-page">
        <LockedMemberPanel
          tier="The Second Seat"
          title="Feedback begins with interview-shaped evidence."
          body="The Vault provides the preparation system and self-checks. The Second Seat adds stored transcripts, category-level practice scores, and corrections tied to specific moments. This demo uses prewritten sample evidence."
        />
      </div>
    );
  }

  const { sessionId: requestedSessionIdValue } = await searchParams;
  const requestedSessionId = typeof requestedSessionIdValue === "string"
    ? requestedSessionIdValue.trim()
    : "";
  const isLiveLearner = profile.isLive === true;
  const selectedSession = profile.isSecondSeatLive
    ? requestedSessionId
      ? await getSecondSeatSession(profile.email, requestedSessionId)
      : await getLatestCompletedSecondSeatSession(profile.email)
    : null;
  const feedbackSession = selectedSession?.status === "completed" && selectedSession.evaluation
    ? selectedSession
    : null;
  const liveEvaluation = feedbackSession?.evaluation ?? null;
  if (isLiveLearner && !liveEvaluation) {
    return (
      <div className="member-page">
        <section className="feedback-empty" aria-labelledby="feedback-empty-title">
          <p className="member-kicker">Second Seat · feedback room</p>
          <h1 id="feedback-empty-title">{requestedSessionId ? "That practice attempt is not ready for feedback." : "Your first transcript will become the baseline."}</h1>
          <p>{requestedSessionId ? "Feedback is available only for a completed practice attempt owned by your account. Complete the round before opening its debrief; no other attempt was substituted." : "Complete one practice round and this page will show category scores, transcript evidence, and the smallest useful next rehearsal. Nothing is pre-populated."}</p>
          <Link className="member-primary-button" href="/learn/practice">Start a practice round <span aria-hidden="true">↗</span></Link>
        </section>
      </div>
    );
  }

  const dimensions = liveEvaluation
    ? liveEvaluation.dimensions
    : isLiveLearner
      ? []
      : SCORE_DIMENSIONS.map((dimension, index) => ({
    key: ["problemFraming", "technicalDepth", "tradeoffClarity", "communication"][index],
    label: dimension.label,
    score: dimension[profile.id],
    delta: ["+6", "+4", "+2", "+9"][index],
    note: [
      "Requirements and workload boundaries appeared before architecture.",
      "Strong component knowledge; failure behaviour needs earlier treatment.",
      "Improving, but consistency and retry decisions still arrive after prompting.",
      "Concise explanations and clear responses to follow-up questions.",
    ][index],
      }));
  const evidence = liveEvaluation
    ? liveEvaluation.evidence.map((item, index) => ({
      ...item,
      time: `Turn ${String(index + 1).padStart(2, "0")}`,
      dimensionKeys: findSecondSeatMock(feedbackSession?.mockId ?? "")?.turns.find((turn) => turn.label === item.turn)?.dimensions ?? [],
    }))
    : EVIDENCE;
  const actions = liveEvaluation?.nextActions ?? ACTIONS;

  return (
    <div className="member-page">
      <FeedbackClient
        overall={liveEvaluation?.overall ?? (profile.id === "premium" ? 84 : 78)}
        dimensions={dimensions}
        evidence={evidence}
        actions={actions}
        premium={profile.id === "premium"}
        live={profile.isSecondSeatLive === true}
        secondSeat={profile.id === "practice" || profile.isSecondSeatLive === true}
        mockTitle={feedbackSession ? findSecondSeatMock(feedbackSession.mockId)?.title ?? "Your practice round" : isLiveLearner ? "Your practice round" : "Design a metrics pipeline"}
        insightTitle={liveEvaluation?.insightTitle}
        insightBody={liveEvaluation?.insightBody}
      />
    </div>
  );
}
