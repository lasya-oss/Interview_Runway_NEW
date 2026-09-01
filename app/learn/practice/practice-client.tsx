"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  evaluateSecondSeatSession,
  findSecondSeatMock,
  SECOND_SEAT_MOCKS,
  type SecondSeatEvaluation,
} from "@/app/lib/second-seat-engine";
import type { SecondSeatSession } from "@/app/lib/second-seat-store";

type PracticeState = "briefing" | "session" | "complete";

export function PracticeClient({
  learnerName,
  isLive,
  initialSession,
  recentSessions,
}: {
  learnerName: string;
  isLive: boolean;
  initialSession: SecondSeatSession | null;
  recentSessions: readonly SecondSeatSession[];
}) {
  const [selectedMockId, setSelectedMockId] = useState<string | null>(
    initialSession?.mockId ?? null,
  );
  const [sessionId, setSessionId] = useState(initialSession?.id ?? null);
  const [state, setState] = useState<PracticeState>(
    initialSession ? "session" : "briefing",
  );
  const [step, setStep] = useState(initialSession?.answers.length ?? 0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>(initialSession?.answers ?? []);
  const [evaluation, setEvaluation] = useState<SecondSeatEvaluation | null>(
    initialSession?.evaluation ?? null,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mock = (selectedMockId ? findSecondSeatMock(selectedMockId) : null) ?? SECOND_SEAT_MOCKS[0];
  const canResume = initialSession?.id === sessionId && answers.length < mock.turns.length;

  const selectMock = (mockId: string) => {
    setError(null);
    setSelectedMockId(mockId);
  };

  const begin = async () => {
    if (!selectedMockId) {
      setError("Choose a practice round before opening the practice room.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      if (isLive) {
        const response = await fetch("/api/second-seat/sessions", {
          body: JSON.stringify({ mockId: selectedMockId }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        const result = (await response.json()) as {
          session?: SecondSeatSession;
          error?: string;
        };
        if (!response.ok || !result.session) {
          throw new Error(result.error ?? "Practice session could not be started");
        }
        setSessionId(result.session.id);
      } else {
        setSessionId(`preview-${Date.now()}`);
      }
      setAnswers([]);
      setDraft("");
      setStep(0);
      setEvaluation(null);
      setState("session");
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Practice session could not be started",
      );
    } finally {
      setSaving(false);
    }
  };

  const resumeFromBriefing = () => {
    setError(null);
    setState("session");
  };

  const submit = async () => {
    const answer = draft.trim();
    if (!answer || saving) return;
    const nextAnswers = [...answers, answer];
    setError(null);
    setSaving(true);
    try {
      let nextEvaluation: SecondSeatEvaluation | null = null;
      if (isLive) {
        if (!sessionId) {
          throw new Error("This practice session has expired. Start a new one.");
        }
        const response = await fetch(`/api/second-seat/sessions/${sessionId}`, {
          body: JSON.stringify({ answers: nextAnswers }),
          headers: { "content-type": "application/json" },
          method: "PUT",
        });
        const result = (await response.json()) as {
          session?: SecondSeatSession;
          error?: string;
        };
        if (!response.ok || !result.session) {
          throw new Error(result.error ?? "Your response could not be saved");
        }
        nextEvaluation = result.session.evaluation;
      } else if (nextAnswers.length === mock.turns.length) {
        nextEvaluation = evaluateSecondSeatSession(mock, nextAnswers);
      }

      setAnswers(nextAnswers);
      setDraft("");
      if (nextAnswers.length === mock.turns.length) {
        setEvaluation(nextEvaluation);
        setState("complete");
      } else {
        setStep(nextAnswers.length);
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Your response could not be saved",
      );
    } finally {
      setSaving(false);
    }
  };

  const selectedMock = useMemo(
    () => (selectedMockId ? findSecondSeatMock(selectedMockId) : null),
    [selectedMockId],
  );

  if (state === "briefing") {
    return (
      <div className="practice-workspace">
        <section className="practice-heading">
          <div>
            <p className="member-kicker">The Second Seat · live practice room</p>
            <h1>Practise the decision, not the script.</h1>
            <p>
              Choose a round, answer three interviewer turns, and receive a structured
              practice signal tied to the transcript. Your account can resume an
              unfinished session and keeps completed debriefs available.
            </p>
          </div>
          <div className="practice-orbit" aria-hidden="true"><i /><i /><span /></div>
        </section>

        <section className="practice-track-picker" aria-labelledby="practice-track-title">
          <div className="practice-track-picker-heading">
            <div>
              <span>01 · CHOOSE YOUR ROUND</span>
              <h2 id="practice-track-title">What do you want to pressure-test?</h2>
            </div>
            <small>{isLive ? "Account session · responses saved as you go" : "Preview session · no account record"}</small>
          </div>
          <div className="practice-track-grid" role="group" aria-labelledby="practice-track-title">
            {SECOND_SEAT_MOCKS.map((candidate) => {
              const selected = selectedMockId === candidate.id;
              const contextId = `practice-round-context-${candidate.id}`;
              return (
                <div className={`practice-track-option-shell${selected ? " is-open" : ""}`} key={candidate.id}>
                  <button
                    aria-controls={contextId}
                    aria-expanded={selected}
                    aria-pressed={selected}
                    className={`practice-track-option ${selected ? "is-selected" : ""}`}
                    onClick={() => selectMock(candidate.id)}
                    type="button"
                  >
                    <span>
                      <small>{candidate.category} · ~{candidate.estimatedMinutes} min</small>
                      <strong>{candidate.title}</strong>
                      <span className="practice-track-description">{candidate.description}</span>
                    </span>
                    <i aria-hidden="true">↗</i>
                  </button>
                  {selected ? (
                    <div className="practice-track-context" id={contextId} aria-live="polite">
                      <span>Round context</span>
                      <strong>{candidate.objective}</strong>
                      <p><b>Opening question</b>{candidate.turns[0].prompt}</p>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          <div className="practice-briefing-action" id="practice-round-context" aria-live="polite">
            <div>
              <span>{selectedMock ? "Round objective" : "Choose a round"}</span>
              <strong>{selectedMock?.objective ?? "Select one of the three rounds to see its objective and open the practice room."}</strong>
            </div>
            <button
              className="member-primary-button"
              type="button"
              onClick={selectedMock && canResume && initialSession?.mockId === selectedMockId ? resumeFromBriefing : begin}
              disabled={saving || !selectedMock}
            >
              {saving ? "Opening practice room…" : !selectedMock ? "Choose a round" : canResume && initialSession?.mockId === selectedMockId ? "Resume session" : "Begin practice"} <span aria-hidden="true">↗</span>
            </button>
          </div>
        </section>

        {recentSessions.length > 0 ? (
          <section className="practice-history" aria-labelledby="practice-history-title">
            <div>
              <p className="member-kicker">Your recent evidence</p>
              <h2 id="practice-history-title">Completed practice stays useful.</h2>
              <p>Open Feedback to review the latest transcript, score, and next action.</p>
            </div>
            <div>
              {recentSessions.map((session) => {
                const completedMock = findSecondSeatMock(session.mockId);
                return (
                  <Link href="/learn/feedback" key={session.id}>
                    <span>{completedMock?.category ?? "Practice"}</span>
                    <strong>{completedMock?.title ?? "Completed session"}</strong>
                    <small>{session.evaluation?.overall ?? "—"} practice signal · {formatDate(session.completedAt)}</small>
                    <b>Open feedback ↗</b>
                  </Link>
                );
              })}
            </div>
          </section>
        ) : null}

        {error ? <p className="practice-inline-error" role="alert">{error}</p> : null}
        <div className="practice-history-note"><i /><p><strong>{learnerName}</strong>, each response is saved only for your Second Seat transcript and evaluation. Scores are practice signals, never hiring predictions.</p></div>
      </div>
    );
  }

  if (state === "complete" && evaluation) {
    return (
      <div className="practice-workspace practice-complete">
        <section>
          <p className="member-kicker">Practice signal recorded</p>
          <span className="practice-complete-mark">{evaluation.overall} / 100</span>
          <h1>Your transcript has a next move.</h1>
          <p>{evaluation.insightBody}</p>
          <div className="practice-complete-actions">
            <Link className="member-primary-button" href="/learn/feedback">Open your feedback <span aria-hidden="true">↗</span></Link>
            <button type="button" onClick={() => { setState("briefing"); setEvaluation(null); }}>Run another round</button>
          </div>
        </section>
        <div className="practice-transcript-summary">
          {answers.map((answer, index) => (
            <article key={mock.turns[index].id}>
              <span>0{index + 1}</span>
              <div><strong>{mock.turns[index].label}</strong><p>{answer}</p></div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  const turn = mock.turns[step];
  if (!turn) return null;

  return (
    <div className="practice-session">
      <header className="practice-session-header">
        <div><span>{mock.category}</span><strong>{mock.title}</strong></div>
        <div><span>{isLive ? "Account transcript" : "Preview transcript"}</span><b>{String(step + 1).padStart(2, "0")} / {String(mock.turns.length).padStart(2, "0")}</b></div>
        <button type="button" onClick={() => setState("briefing")}>Pause session</button>
      </header>

      <div className="practice-session-layout">
        <section className="practice-transcript" aria-label="Interview transcript">
          <div className="practice-transcript-disclaimer">Follow-up probes adapt to the decision you are making · {isLive ? "saved to your account" : "preview stays in this tab"}</div>
          {answers.map((answer, index) => (
            <div className="practice-turn-complete" key={mock.turns[index].id}>
              <article className="interviewer-turn"><span>Interviewer · 0{index + 1}</span><p>{mock.turns[index].prompt}</p><small>{mock.turns[index].probe}</small></article>
              <article className="learner-turn"><span>You</span><p>{answer}</p></article>
            </div>
          ))}
          <article className="interviewer-turn is-current">
            <span>Interviewer · 0{step + 1} · {turn.label}</span>
            <h1>{turn.prompt}</h1>
            <p>{turn.probe}</p>
            <small>Listen for: {turn.signals.slice(0, 4).join(" · ")}</small>
          </article>
        </section>

        <aside className="practice-response-panel">
          <div><span>Your response</span><b>{isLive ? "Saved on submit" : "Preview only"}</b></div>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write the answer you would say aloud…" rows={11} maxLength={5000} />
          <small className="practice-response-count">{draft.length} / 5000</small>
          <button className="member-primary-button" type="button" onClick={() => void submit()} disabled={!draft.trim() || saving}>{saving ? "Saving response…" : step === mock.turns.length - 1 ? "Finish and score" : "Submit and continue"} <span aria-hidden="true">↗</span></button>
          <p>Your transcript is evaluated against the round rubric after the final turn. The score explains what to practise next.</p>
          {error ? <p className="practice-inline-error" role="alert">{error}</p> : null}
        </aside>
      </div>
    </div>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Just now";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(new Date(value));
}
