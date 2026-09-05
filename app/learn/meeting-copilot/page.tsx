import type { Metadata } from "next";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meeting Copilot | Learner workspace",
  robots: { index: false, follow: false },
};

const MEETING_COPILOT_URL = "http://127.0.0.1:8123/";

export default async function MeetingCopilotPage() {
  const profile = await requireDemoProfile("/learn/meeting-copilot");

  if (!profile.access.practice) {
    return (
      <div className="member-page">
        <LockedMemberPanel
          tier="The Second Seat"
          title="Meeting Copilot joins you in the Second Seat."
          body="Meeting Copilot is available to learners with active Second Seat access."
        />
      </div>
    );
  }

  return (
    <div className="member-page member-page-meeting-copilot">
      <iframe
        className="meeting-copilot-frame"
        src={MEETING_COPILOT_URL}
        title="Meeting Copilot"
        allow="display-capture"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
