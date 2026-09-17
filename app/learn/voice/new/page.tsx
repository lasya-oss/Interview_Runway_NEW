import type { Metadata } from "next";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { getVoiceEntitlement } from "@/app/lib/paid-access";
import { getVoiceCandidateProfile } from "@/app/lib/voice-candidate-profile-store";
import { countVoiceSessionsThisMonth } from "@/app/lib/voice-session-store";
import { VoiceSetupClient } from "../setup-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Set up voice mock | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function NewVoiceSessionPage() {
  const profile = await requireDemoProfile("/learn/voice/new");
  const entitlement = profile.isLive
    ? await getVoiceEntitlement(profile.email)
    : { enabled: false, monthlySessionLimit: 0 as const };
  if (!entitlement.enabled) {
    return <div className="member-page"><LockedMemberPanel tier="Vault" title="Voice practice is locked." body="Activate Vault or Second Seat to start a live voice mock interview." /></div>;
  }
  const [used, candidateProfile] = await Promise.all([
    countVoiceSessionsThisMonth(profile.email),
    getVoiceCandidateProfile(profile.email),
  ]);
  return (
    <div className="member-page voice-setup-page">
      <section className="voice-page-heading">
        <p className="member-kicker">New voice mock</p>
        <h1>Set the interview, <em>then enter the room.</em></h1>
        <p>The job description and synced candidate context stay private to this session and its report.</p>
      </section>
      <VoiceSetupClient
        remaining={Math.max(0, entitlement.monthlySessionLimit - used)}
        monthlyLimit={entitlement.monthlySessionLimit}
        candidateProfile={candidateProfile ? { name: candidateProfile.name, targetRole: candidateProfile.targetRole, updatedAt: candidateProfile.updatedAt } : null}
      />
    </div>
  );
}
