import type { Metadata } from "next";
import { LockedMemberPanel, MemberShell } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { PracticeClient } from "./practice-client";

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
          <PracticeClient learnerName={profile.firstName} />
        ) : (
          <LockedMemberPanel
            tier="The Second Seat"
            title="Complete Foundation clearance to bring the cockpit alive."
            body="Foundation builds the baseline that responsive practice needs. Finish the remaining checkpoints to unlock several expert perspectives, responsive follow-ups, and an included practice-time allowance."
          >
            <div className="practice-history-note"><i /><p><strong>SECOND SEAT CLEARANCE · {profile.clearanceCompleted} OF {profile.clearanceTotal} COMPLETE</strong><br />Return to the roadmap to complete the sample Foundation checkpoints.</p></div>
          </LockedMemberPanel>
        )}
      </div>
    </MemberShell>
  );
}
