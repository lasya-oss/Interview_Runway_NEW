import type { Metadata } from "next";
import Link from "next/link";
import { LockedMemberPanel } from "@/app/components/member-shell";
import { requireDemoProfile } from "@/app/lib/demo-session";
import { isInternalFullAccessEmail } from "@/app/lib/internal-access";
import { UserHistoryReportPanel } from "./user-history-report-panel";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Coach room | Learner workspace",
  robots: { index: false, follow: false },
};

const SESSION_PATH = [
  { number: "01", state: "Complete", title: "Diagnostic review", detail: "Repeated evidence isolated staff-level narrative calibration as the primary gap.", date: "Evidence reviewed" },
  { number: "02", state: "Next", title: "Scope and influence calibration", detail: "Rebuild one project narrative around decision cost, cross-team influence, and durable outcome.", date: "Scheduled after admission" },
  { number: "03", state: "Planned", title: "Full-loop rehearsal", detail: "Apply the corrected narrative under behavioural and architecture follow-ups.", date: "After session 02" },
] as const;

const PRIVATE_FILES = [
  ["01", "Diagnostic evidence brief", "PDF · sample record", "Reviewed"],
  ["02", "Staff-level narrative spine", "Working document · sample", "Current"],
  ["03", "Architecture assumption sheet", "Worksheet · sample", "Before session 02"],
  ["04", "Session 01 private notes", "Coach note · sample", "Private"],
] as const;

export default async function CoachingPage() {
  const profile = await requireDemoProfile("/learn/coaching");

  if (!profile.access.coaching) {
    return (
      <div className="member-page">
        <LockedMemberPanel
          tier="Human Calibration"
          title="Human calibration is reserved for a named gap."
          body={`${profile.planShort} can see how the private coaching room is structured, but agenda notes, session scheduling, and coach deliverables belong to the qualification-based example engagement. No coach is contacted from this demo.`}
        >
          <p className="member-locked-evidence">The Human Calibration sample is triggered only after repeated practice evidence shows a persistent gap.</p>
        </LockedMemberPanel>
      </div>
    );
  }

  const canGenerateUserHistoryReport = profile.isLive && isInternalFullAccessEmail(profile.email);

  return (
      <div className="member-page coaching-workspace">
        <section className="coaching-heading">
          <div>
            <p className="member-kicker">Sample Human Calibration engagement</p>
            <h1>One gap. <em>Full attention.</em></h1>
            <p>This private room demonstrates the qualification-based experience. Coach identity, live availability, package scope, and meeting actions remain unavailable until they are verified and commercially final.</p>
          </div>
          <div className="coaching-status"><i /><span>Example engagement</span><strong>02 / 03</strong><small>sample session path</small></div>
        </section>

        {canGenerateUserHistoryReport ? (
          <UserHistoryReportPanel
            deliveryEmail={profile.email}
            googleClientId={process.env.GOOGLE_CLIENT_ID ?? ""}
          />
        ) : null}

        {profile.access.voice ? (
          <section className="voice-entry-card voice-entry-card--coach">
            <div><p className="member-kicker">Voice rehearsal</p><h2>Rehearse before live calibration.</h2><p>Choose Behavioral / STAR or role-specific Q&amp;A, then bring the scored evidence back into the Coach Room.</p></div>
            <Link className="member-primary-button" href="/learn/voice/new">Open voice mock ↗</Link>
          </section>
        ) : null}

        <section className="coaching-command-grid">
          <article className="coaching-next-session">
            <div className="member-panel-label"><span>Next calibration</span><b>Admission-controlled scheduling</b></div>
            <div className="coaching-session-timing"><span>BOOKING</span><strong>—</strong><small>DATE SET AFTER QUALIFICATION</small></div>
            <div>
              <p>Session 02 · 55 min example</p>
              <h2>Make staff-level scope unmistakable.</h2>
              <ul><li>Open with the irreversible decision</li><li>Show influence beyond direct authority</li><li>Quantify the operating consequence</li></ul>
            </div>
            <p className="coaching-session-state">Meeting access is created only after admission and booking are confirmed.</p>
          </article>

          <aside className="coaching-identity">
            <div className="coaching-identity-mark" aria-hidden="true"><i /><span>IR</span></div>
            <p className="member-kicker">Assigned founder coach</p>
            <h2>Verified identity appears here before paid coaching opens.</h2>
            <p>The public founder record must supply the real name, photograph, professional history, and coaching scope. This demo intentionally does not invent them.</p>
            <Link className="member-action-button member-action-button--dark" href="/about">Review the verification standard <span aria-hidden="true">↗</span></Link>
          </aside>
        </section>

        <section className="coaching-note" aria-labelledby="coach-note-title">
          <div><span>Private sample note</span><b>ILLUSTRATIVE FORMAT</b></div>
          <blockquote id="coach-note-title">“Your architecture is already credible. The level signal weakens when every decision receives equal narration. Lead with the decisions that were expensive to reverse, then show how other teams changed course because of them.”</blockquote>
          <p>Sample note written to demonstrate format; not authored by a real coach.</p>
        </section>

        <section className="coaching-path" aria-labelledby="coaching-path-title">
          <div className="member-section-heading"><div><p className="member-kicker">Example engagement path</p><h2 id="coaching-path-title">Diagnosis before live time.</h2></div><span>Terms not commercially final</span></div>
          <div>
            {SESSION_PATH.map((session) => (
              <article className={`coaching-path-step is-${session.state.toLowerCase()}`} key={session.number}>
                <span>{session.number}</span><div><small>{session.state} · {session.date}</small><h3>{session.title}</h3><p>{session.detail}</p></div><i />
              </article>
            ))}
          </div>
        </section>

        <section className="coaching-lower-grid">
          <div className="coaching-files">
            <div className="member-section-heading"><div><p className="member-kicker">Private workspace</p><h2>Working files with provenance.</h2></div></div>
            {PRIVATE_FILES.map(([number, title, format, state]) => (
              <article key={number}><span>{number}</span><div><h3>{title}</h3><small>{format}</small></div><b>{state}</b><span className="coaching-file-state">Sample only</span></article>
            ))}
          </div>
          <aside className="coaching-prework">
            {canGenerateUserHistoryReport ? (
              <>
                <p className="member-kicker">Vivid Labs internal reporting</p>
                <h2>User History Report.</h2>
                <p>Choose a stored learner account, generate its private history PDF, and send it to your signed-in Vivid Labs Gmail account.</p>
                <dl><div><dt>Source</dt><dd>Stored history only</dd></div><div><dt>Delivery</dt><dd>Company Gmail + private copy</dd></div></dl>
                <Link className="member-primary-button coaching-prework-report-action" href="#user-history-report">
                  Generate User History Report <span aria-hidden="true">&#8599;</span>
                </Link>
              </>
            ) : (
              <>
                <p className="member-kicker">Due before session 02</p>
                <h2>Bring two influence stories.</h2>
                <p>Each should identify the competing constraint, the decision you changed, who needed alignment, and the measurable result six weeks later.</p>
                <dl><div><dt>Preparation</dt><dd>25 min</dd></div><div><dt>Timing</dt><dd>Before the first session</dd></div></dl>
                <p className="coaching-submission-state">Submission opens only for an accepted engagement.</p>
              </>
            )}
          </aside>
        </section>

        <footer className="coaching-demo-boundary">
          <strong>Demo boundary</strong><p>No booking, rescheduling, file access, messaging, or coach contact occurs here. A production version requires verified identity, live calendar data, explicit package terms, and durable private storage.</p>
        </footer>
      </div>
  );
}
