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
    <div className="member-page">
      <section className="member-locked-panel">
        <p className="member-kicker">Second Seat companion</p>
        <h1>Meeting Copilot</h1>
        <p>
          Meeting Copilot runs on this device so it can keep its existing microphone,
          screen capture, profiles, transcripts, and model connections private and intact.
          Keep Interview Runway open while the companion runs in its own tab.
        </p>
        <a
          className="member-primary-button"
          data-meeting-copilot-launch
          href={MEETING_COPILOT_URL}
          target="_blank"
          rel="noreferrer"
        >
          Open Meeting Copilot <span aria-hidden="true">↗</span>
        </a>
      </section>
    </div>
  );
}
