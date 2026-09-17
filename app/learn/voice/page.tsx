import type { Metadata } from "next";
import Link from "next/link";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { getVoiceEntitlement } from "@/app/lib/paid-access";
import { countVoiceSessionsThisMonth, getVoiceSessions, type VoiceSession } from "@/app/lib/voice-session-store";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Voice mock interview | Learner workspace",
  robots: { index: false, follow: false },
};

export default async function VoicePage() {
  const profile = await requireDemoProfile("/learn/voice");
  const entitlement = profile.isLive
    ? await getVoiceEntitlement(profile.email)
    : { enabled: false, plan: null, monthlySessionLimit: 0 as const, sessionMinutes: 30 as const };

  if (!entitlement.enabled) {
    return (
      <div className="member-page">
        <LockedMemberPanel
          tier="Vault"
          title="Voice practice opens inside a paid learner plan."
          body="Voice mock interviews are a separate learner entitlement. Vault includes two 30-minute sessions each month; Second Seat includes ten."
        />
      </div>
    );
  }

  const [sessions, used] = await Promise.all([
    getVoiceSessions(profile.email),
    countVoiceSessionsThisMonth(profile.email),
  ]);
  const remaining = Math.max(0, entitlement.monthlySessionLimit - used);

  return (
    <div className="member-page voice-home">
      <section className="voice-hero">
        <div>
          <p className="member-kicker">Full-duplex interview practice</p>
          <h1>Answer out loud. <em>Get the evidence back.</em></h1>
          <p>A live interviewer adapts to your answer, accepts interruptions, and turns the saved transcript into a private answer-level report.</p>
          <div className="voice-hero-actions">
            <Link className="member-primary-button" href={remaining > 0 ? "/learn/voice/new" : "#voice-history"}>{remaining > 0 ? "Start a voice mock ↗" : "Monthly quota used"}</Link>
            <span>{remaining} of {entitlement.monthlySessionLimit} sessions remaining · 30 min each</span>
          </div>
        </div>
        <aside>
          <span>AVAILABLE NOW</span>
          <strong>Behavioral / STAR</strong>
          <strong>Role-specific Q&amp;A</strong>
          <small>English · hiring manager or peer engineer</small>
        </aside>
      </section>

      <section className="voice-history" id="voice-history">
        <div className="member-section-heading"><div><p className="member-kicker">Private history</p><h2>Your voice sessions.</h2></div><span>{used} used this month</span></div>
        {sessions.length ? (
          <div className="voice-history-list">
            {sessions.map((session: VoiceSession) => (
              <article key={session.id}>
                <span className={`voice-status is-${session.status}`}>{session.status.replace("_", " ")}</span>
                <div><h3>{session.interviewType === "behavioral" ? "Behavioral / STAR" : "Role-specific Q&A"}</h3><p>{session.persona === "hiring_manager" ? "Hiring manager" : "Peer engineer"} · {new Date(session.createdAt).toLocaleString()}</p></div>
                <Link href={session.status === "completed" || session.status === "scoring" || session.status === "failed" ? `/learn/voice/${session.id}/report` : `/learn/voice/${session.id}`}>
                  {session.status === "completed" ? "Open report" : session.status === "scoring" ? "Report status" : session.status === "failed" ? "Review session" : "Continue"} ↗
                </Link>
              </article>
            ))}
          </div>
        ) : <p className="voice-empty-history">No voice sessions yet. Your first transcript and score will appear here.</p>}
      </section>
    </div>
  );
}
