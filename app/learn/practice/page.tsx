import type { Metadata } from "next";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { getSecondSeatSessions } from "@/app/lib/second-seat-store";
import { PracticeClient } from "./practice-client";
import { PracticeReplayCollection } from "./replay-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Practice | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function PracticePage() {
  const profile = await requireDemoProfile("/learn/practice");
  const sessions = profile.isSecondSeatLive
    ? await getSecondSeatSessions(profile.email)
    : [];
  const activeSession = sessions.find((session) => session.status === "in_progress") ?? null;
  const completedSessions = sessions.filter((session) => session.status === "completed").slice(0, 5);

  return (
    <div className="member-page">
      {profile.access.practice ? (
        <>
          <PracticeReplayCollection />
          <PracticeClient
            learnerName={profile.firstName}
            isLive={profile.isSecondSeatLive === true}
            initialSession={activeSession}
            recentSessions={completedSessions}
          />
        </>
      ) : (
        <LockedMemberPanel
          tier="The Second Seat"
          title="Timed practice begins after the foundation."
          body="The Vault account can inspect the learning system, roadmap, and representative materials. The Second Seat adds responsive mock sessions, transcripts, and evidence-linked corrections. This demo does not run an AI model."
        />
      )}
    </div>
  );
}
