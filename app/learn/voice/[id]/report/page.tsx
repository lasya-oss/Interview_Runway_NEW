import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { getVoiceEntitlement } from "@/app/lib/paid-access";
import { getVoiceSession } from "@/app/lib/voice-session-store";
import { VoiceReportClient } from "../../report-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Voice interview report | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function VoiceReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireDemoProfile(`/learn/voice/${id}/report`);
  const entitlement = profile.isLive ? await getVoiceEntitlement(profile.email) : { enabled: false };
  if (!entitlement.enabled) {
    return <div className="member-page"><LockedMemberPanel tier="Vault" title="Voice reports are private." body="Sign in with the entitled learner account that owns this session." /></div>;
  }
  const session = await getVoiceSession(profile.email, id, true);
  if (!session) notFound();
  return <div className="member-page"><VoiceReportClient initialSession={session} /></div>;
}
