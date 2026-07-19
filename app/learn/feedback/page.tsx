import type { Metadata } from "next";
import { LockedMemberPanel, MemberShell } from "@/app/components/member-shell";
import { SCORE_DIMENSIONS } from "@/app/lib/demo-data";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { FeedbackClient } from "./feedback-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feedback | Learner workspace",
  robots: { index: false, follow: false },
};

const EVIDENCE = [
  {
    time: "06:14",
    signal: "Problem framing · positive",
    excerpt: "I would keep ingestion independent from query serving because their traffic and failure profiles are different.",
    observation: "The answer separated write and read concerns before choosing storage, which kept the architecture coherent.",
    correction: "Preserve this ordering in the next design: product constraint, workload split, then component choice.",
  },
  {
    time: "14:52",
    signal: "Trade-off clarity · gap",
    excerpt: "We can add replicas for availability and scale the database as traffic grows.",
    observation: "Replication was named without choosing a consistency model or explaining what readers may observe after failover.",
    correction: "State the acceptable staleness and failover behaviour before discussing replica count.",
  },
  {
    time: "27:08",
    signal: "Operations · gap",
    excerpt: "If consumers fall behind, I would add more workers and monitor the queue length.",
    observation: "The recovery direction was sound, but queue length alone hid whether older events were breaching the product SLO.",
    correction: "Use age of oldest event by priority, consumer lag, and recovery rate; bound retries before scaling workers.",
  },
] as const;

const ACTIONS = [
  { number: "01", title: "Defend the consistency model", body: "Re-answer the same architecture opening with staleness and failover behaviour stated in the first five minutes.", meta: "15 min · verbal rehearsal", href: "/learn/material/rate-limiter" },
  { number: "02", title: "Diagnose backlog with the right signal", body: "Write the operating response for queue age, retry amplification, and priority shedding during a 20× spike.", meta: "20 min · scenario", href: "/learn/material/notification-mock" },
  { number: "03", title: "Repeat under a new prompt", body: "Run the notification-service sample and apply the same decision order without reusing the architecture.", meta: "35 min · scripted mock", href: "/learn/practice" },
] as const;

export default async function FeedbackPage() {
  const profile = await requireDemoProfile("/learn/feedback");

  if (!profile.access.feedback) {
    return (
      <MemberShell profile={profile} active="feedback">
        <div className="member-page">
          <LockedMemberPanel
            tier="The Second Seat"
            title="Feedback begins with interview-shaped evidence."
            body="The Vault provides the preparation system and self-checks. The Second Seat adds stored transcripts, category-level practice signals, and corrections tied to specific moments. This demo uses prewritten sample evidence."
          />
        </div>
      </MemberShell>
    );
  }

  const dimensions = SCORE_DIMENSIONS.map((dimension, index) => ({
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

  return (
    <MemberShell profile={profile} active="feedback">
      <div className="member-page">
        <FeedbackClient
          overall={profile.id === "premium" ? 84 : 78}
          dimensions={dimensions}
          evidence={EVIDENCE}
          actions={ACTIONS}
          premium={profile.id === "premium"}
        />
      </div>
    </MemberShell>
  );
}
