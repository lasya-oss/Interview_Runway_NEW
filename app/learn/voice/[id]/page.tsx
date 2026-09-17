import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { getVoiceEntitlement } from "@/app/lib/paid-access";
import { getVoiceSession } from "@/app/lib/voice-session-store";
import { VoiceSessionClient } from "../session-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Live voice mock | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function VoiceSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireDemoProfile(`/learn/voice/${id}`);
  const entitlement = profile.isLive ? await getVoiceEntitlement(profile.email) : { enabled: false };
  if (!entitlement.enabled) {
    return <div className="member-page"><LockedMemberPanel tier="Vault" title="Voice practice is locked." body="Activate Vault or Second Seat to continue this session." /></div>;
  }
  const session = await getVoiceSession(profile.email, id, true);
  if (!session) notFound();
  if (session.status === "completed" || session.status === "scoring" || session.status === "failed") {
    redirect(`/learn/voice/${id}/report`);
  }
  return <div className="member-page"><VoiceSessionClient session={session} /></div>;
}
