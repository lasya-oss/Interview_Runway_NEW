import type { Metadata } from "next";
import { LockedMemberPanel, MemberShell } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { PracticeClient } from "./practice-client";
import { PracticeReplayCollection } from "./replay-card";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Practice | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function PracticePage() {
  const profile = await requireDemoProfile("/learn/practice");

  return (
    <MemberShell profile={profile} active="practice">
      <div className="member-page">
        {profile.access.practice ? (
          <>
            <PracticeReplayCollection />
            <PracticeClient learnerName={profile.firstName} />
          </>
        ) : (
          <LockedMemberPanel
            tier="The Second Seat"
            title="Timed practice begins after the foundation."
            body="The Vault account can inspect the learning system, roadmap, and representative materials. The Second Seat adds responsive mock sessions, transcripts, and evidence-linked corrections. This demo does not run an AI model."
          />
        )}
      </div>
    </MemberShell>
  );
}
