"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { VoiceSession } from "@/app/lib/voice-session-store";

export function VoiceReportClient({ initialSession }: { initialSession: VoiceSession }) {
  const router = useRouter();
  const [session, setSession] = useState(initialSession);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (session.status !== "scoring") return;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/voice/sessions/${session.id}`, { cache: "no-store" });
      const body = await response.json().catch(() => null) as { session?: VoiceSession } | null;
      if (response.ok && body?.session) setSession(body.session);
    }, 2_500);
    return () => window.clearInterval(timer);
  }, [session.id, session.status]);

  async function deleteSession() {
    if (!window.confirm("Delete this transcript, score, report record, and any approved audio? This cannot be undone.")) return;
    setDeleting(true);
    setError("");
    const response = await fetch(`/api/voice/sessions/${session.id}`, { method: "DELETE" });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      setError(body?.error || "Session could not be deleted");
      setDeleting(false);
      return;
    }
    router.push("/learn/voice");
    router.refresh();
  }

  if (session.status === "scoring") {
    return (
      <section className="voice-report-pending">
        <div className="voice-report-spinner" aria-hidden="true"><i /><i /></div>
        <p className="member-kicker">Offline diagnosis running</p>
        <h1>Your transcript is safe.</h1>
        <p>The fixed rubric is scoring each answer. This page will update automatically; the PDF will also be emailed to your account.</p>
      </section>
    );
  }

  if (session.status === "failed" || !session.score) {
    return (
      <section className="voice-report-pending">
        <p className="member-kicker">Report needs attention</p>
        <h1>The transcript was saved, but scoring did not finish.</h1>
        <p>No answer was lost. A human tester can review the stored transcript before this staging session is retried.</p>
        <div className="voice-report-actions"><a href={`/api/voice/sessions/${session.id}?download=transcript`}>Download transcript</a><button type="button" onClick={deleteSession} disabled={deleting}>Delete session</button></div>
        {error ? <p className="voice-error">{error}</p> : null}
      </section>
    );
  }

  const score = session.score;
  const interviewerNotes = (session.turns ?? []).flatMap((turn) => turn.toolCalls)
    .filter((call) => call.name === "saveInterviewerNote" && typeof call.result.note === "string")
    .map((call) => String(call.result.note).trim().slice(0, 1_000))
    .filter(Boolean)
    .slice(0, 20);
  return (
    <div className="voice-report">
      <section className="voice-report-hero">
        <div><p className="member-kicker">Voice mock report</p><h1>{score.sessionVerdict}</h1><p>{session.interviewType === "behavioral" ? "Behavioral / STAR" : "Role-specific Q&A"} · {score.perAnswer.length} scored answers · rubric {score.rubricVersion}</p></div>
        <div className="voice-report-actions"><a href={`/api/voice/sessions/${session.id}/report`}>Download PDF</a><a href={`/api/voice/sessions/${session.id}?download=transcript`}>Download transcript</a></div>
      </section>

      <section className="voice-report-summary">
        <article><span>Strengths</span><ul>{score.strengths.map((item) => <li key={item}>{item}</li>)}</ul></article>
        <article><span>Priority gaps</span><ul>{score.gaps.map((item) => <li key={item}>{item}</li>)}</ul></article>
      </section>

      <section className="voice-answer-scores">
        <div className="member-section-heading"><div><p className="member-kicker">Answer diagnosis</p><h2>Evidence, answer by answer.</h2></div></div>
        {score.perAnswer.map((answer, index) => (
          <article key={`${index}-${answer.question}`}>
            <div><span>{String(index + 1).padStart(2, "0")}</span><h3>{answer.question}</h3></div>
            <blockquote>{answer.answer}</blockquote>
            <dl>
              <div><dt>STAR</dt><dd>{answer.structure}/5</dd></div>
              <div><dt>Specificity</dt><dd>{answer.specificity}/5</dd></div>
              <div><dt>Relevance</dt><dd>{answer.relevance}/5</dd></div>
              <div><dt>Communication</dt><dd>{answer.communication}/5</dd></div>
            </dl>
            <p>{answer.feedback}</p>
          </article>
        ))}
      </section>

      {interviewerNotes.length ? (
        <section className="voice-report-summary">
          <article><span>Interviewer observations</span><ul>{interviewerNotes.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </section>
      ) : null}

      <section className="voice-drills">
        <div className="member-section-heading"><div><p className="member-kicker">Next loop</p><h2>Drills grounded in your library.</h2></div></div>
        <div>{score.recommendedDrills.map((drill, index) => (
          <Link href={`/learn/library/material/${drill.slug}?voice_session=${session.id}`} key={drill.slug}>
            <span>{String(index + 1).padStart(2, "0")}</span><strong>{drill.title}</strong><p>{drill.reason}</p><b>Open drill ↗</b>
          </Link>
        ))}</div>
      </section>

      <footer className="voice-data-controls">
        <div><strong>Your data</strong><p>Transcript, score, and {session.audioRetentionApproved ? "approved audio" : "no raw audio"}. Deleting removes this session and its R2 audio objects.</p></div>
        <button type="button" onClick={deleteSession} disabled={deleting}>{deleting ? "Deleting…" : "Delete session"}</button>
      </footer>
      {error ? <p className="voice-error">{error}</p> : null}
    </div>
  );
}
