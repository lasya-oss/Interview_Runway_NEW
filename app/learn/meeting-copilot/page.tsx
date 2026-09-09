import type { Metadata } from "next";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { MEETING_COPILOT_RELEASE } from "@/app/lib/meeting-copilot-release";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Meeting Copilot | Learner workspace",
  robots: { index: false, follow: false },
};

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

  // Create the private bridge credential only when the learner clicks. This
  // keeps it out of the rendered page, RSC payload, DOM, and source-tab history.
  const launchUrl = profile.isLive === true && profile.id === "practice"
    ? "/api/meeting-copilot/launch"
    : MEETING_COPILOT_RELEASE.launchUrl;

  return (
    <div className="member-page">
      <section
        className="member-locked-panel"
        data-meeting-copilot-source-branch={MEETING_COPILOT_RELEASE.branch}
        data-meeting-copilot-source-commit={MEETING_COPILOT_RELEASE.commit}
        data-meeting-copilot-ui-version={MEETING_COPILOT_RELEASE.uiVersion}
      >
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
          href={launchUrl}
          target="_blank"
          rel="noreferrer"
        >
          Open Meeting Copilot <span aria-hidden="true">↗</span>
        </a>
      </section>
    </div>
  );
}
