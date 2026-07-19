"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { CSSProperties, KeyboardEvent } from "react";
import { trackEvent } from "@/app/lib/analytics";

type DemoState = "briefing" | "answer" | "perspectives" | "followup" | "complete";

const QUESTION = "How would you design a rate limiter?";

const ANSWERS = [
  {
    id: "constraints",
    short: "Clarify the operating envelope first.",
    response: "I would first clarify traffic volume, burst tolerance, the identity being limited, and whether limits must be globally consistent before selecting an algorithm.",
    followup: "Assume 120,000 requests per second, short bursts are acceptable, and limits apply per API key across three regions. Where does the decision state live, and what consistency do you need?",
    followupAnswers: [
      "Use regional counters with a bounded global allowance, then reconcile asynchronously so the request path stays available.",
      "Use one globally consistent counter for every request, accepting the cross-region latency on the request path.",
    ],
  },
  {
    id: "token-bucket",
    short: "Start with a token bucket.",
    response: "I would start with a token bucket because it permits controlled bursts while enforcing a sustained rate, then place counters close to the request path.",
    followup: "The token bucket is a candidate, not yet a complete design. How will you prevent concurrent requests in different regions from overspending the same allowance?",
    followupAnswers: [
      "Partition a global allowance into regional budgets, reserve headroom, and replenish from an authoritative control plane.",
      "Let every region increment independently and repair any excess only after the customer reports a problem.",
    ],
  },
  {
    id: "fixed-window",
    short: "Use a fixed window for simplicity.",
    response: "I would use a fixed-window counter because it is operationally simple and easy to explain, while monitoring boundary bursts.",
    followup: "A client sends its full allowance at the end of one window and again at the start of the next. What change preserves simplicity while controlling that boundary burst?",
    followupAnswers: [
      "Use a sliding-window approximation or token bucket, then test the permitted burst explicitly against product requirements.",
      "Keep the fixed window unchanged because the average request rate is still within the published limit.",
    ],
  },
] as const;

const PERSPECTIVES = [
  { id: "interviewer", label: "INTERVIEWER", text: "What constraint is still missing?" },
  { id: "system-designer", label: "SYSTEM DESIGNER", text: "State the trade-off before choosing the algorithm." },
  { id: "communication", label: "COMMUNICATION", text: "Explain why the choice fits the traffic pattern." },
] as const;

const PROGRESS: Record<DemoState, number> = {
  briefing: 0,
  answer: 25,
  perspectives: 65,
  followup: 65,
  complete: 100,
};

const subduedPanel: CSSProperties = {
  padding: 18,
  border: "1px solid rgba(208,225,232,.13)",
  borderRadius: 14,
  background: "rgba(255,255,255,.035)",
};

function PracticeTimeGauge({ open, onToggle, light = false }: { open: boolean; onToggle: () => void; light?: boolean }) {
  const foreground = light ? "#263b45" : "#edf3f5";
  const secondary = light ? "#6b7e87" : "#8ca0a9";

  return (
    <section aria-label="Controlled demo sample practice time" style={{ ...subduedPanel, color: foreground, background: light ? "rgba(255,255,255,.42)" : subduedPanel.background }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <div>
          <span style={{ color: "#ff6b2c", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: ".09em" }}>CONTROLLED DEMO SAMPLE</span>
          <strong style={{ display: "block", marginTop: 7, fontSize: 21 }}>Practice time</strong>
        </div>
        <svg width="72" height="72" viewBox="0 0 96 96" role="img" aria-label="34 of 120 sample minutes used">
          <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(117,139,150,.2)" strokeWidth="7" />
          <circle cx="48" cy="48" r="38" fill="none" stroke="#ff6b2c" strokeWidth="7" strokeLinecap="round" strokeDasharray="238.76" strokeDashoffset="171.12" transform="rotate(-90 48 48)" />
          <text x="48" y="53" textAnchor="middle" fill={foreground} fontSize="18" fontFamily="var(--font-mono)">86</text>
        </svg>
      </div>
      <dl style={{ margin: "14px 0 0", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {[["INCLUDED", "120 min"], ["USED", "34 min"], ["REMAINING", "86 min"]].map(([label, value]) => (
          <div key={label} style={{ display: "block", minHeight: 0, padding: "9px 0 0", borderTop: "1px solid rgba(117,139,150,.18)" }}>
            <dt style={{ color: secondary, fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: ".06em" }}>{label}</dt>
            <dd style={{ margin: "5px 0 0", color: foreground, fontSize: 14, textAlign: "left" }}>{value}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        style={{ marginTop: 14, padding: 0, border: 0, color: "#ff6b2c", background: "none", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
      >
        {open ? "Close practice-time information" : "Add practice time — how it works"} <span aria-hidden="true">↗</span>
      </button>
      {open ? <p style={{ margin: "10px 0 0", color: secondary, fontSize: 13, lineHeight: 1.55 }}>Additional practice time is presented at a transparent operating cost before any purchase. Nothing is charged in this controlled demo.</p> : null}
    </section>
  );
}

function ProgressHeader({ state, onExit }: { state: DemoState; onExit: () => void }) {
  const progress = PROGRESS[state];
  return (
    <header className="practice-session-header">
      <div><span>SECOND SEAT · CONTROLLED DEMO</span><strong>Rate limiter</strong></div>
      <div style={{ minWidth: 185 }}>
        <span>Progress</span>
        <progress aria-label={`${progress}% complete`} max={100} value={progress} style={{ width: 105, accentColor: "#ff6b2c" }} />
        <b>{progress}%</b>
      </div>
      <button type="button" onClick={onExit}>End preview</button>
    </header>
  );
}

export function PracticeClient({ learnerName }: { learnerName: string }) {
  const [state, setState] = useState<DemoState>("briefing");
  const [answerId, setAnswerId] = useState<(typeof ANSWERS)[number]["id"] | null>(null);
  const [followupAnswer, setFollowupAnswer] = useState("");
  const [activePerspective, setActivePerspective] = useState(0);
  const [topupOpen, setTopupOpen] = useState(false);
  const topupTracked = useRef(false);
  const perspectiveRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    trackEvent("practice_time_viewed", { origin: "controlled_second_seat_demo", included_minutes: 120, used_minutes: 34 });
  }, []);

  const selectedAnswer = ANSWERS.find((answer) => answer.id === answerId) ?? null;

  const reset = () => {
    setAnswerId(null);
    setFollowupAnswer("");
    setActivePerspective(0);
    setState("briefing");
  };

  const begin = () => {
    setAnswerId(null);
    setFollowupAnswer("");
    setActivePerspective(0);
    setState("answer");
    trackEvent("second_seat_preview_started", { origin: "practice_workspace", question: "rate_limiter" });
  };

  const openTopup = () => {
    const willOpen = !topupOpen;
    setTopupOpen(willOpen);
    if (willOpen && !topupTracked.current) {
      topupTracked.current = true;
      trackEvent("practice_time_topup_started", { origin: "controlled_second_seat_demo" });
    }
  };

  const changePerspective = (index: number, input: "pointer" | "keyboard") => {
    setActivePerspective(index);
    trackEvent("second_seat_perspective_changed", { perspective: PERSPECTIVES[index].id, input });
  };

  const onPerspectiveKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight") nextIndex = (index + 1) % PERSPECTIVES.length;
    if (event.key === "ArrowLeft") nextIndex = (index - 1 + PERSPECTIVES.length) % PERSPECTIVES.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = PERSPECTIVES.length - 1;
    if (nextIndex === null) return;
    event.preventDefault();
    changePerspective(nextIndex, "keyboard");
    perspectiveRefs.current[nextIndex]?.focus();
  };

  const finish = () => {
    if (!followupAnswer) return;
    setState("complete");
    trackEvent("second_seat_preview_completed", { origin: "practice_workspace", answer_branch: answerId ?? "unknown" });
    trackEvent("practice_first_session_completed", { tier: "practice", mock: "RATE-LIMITER-SAMPLE" });
    trackEvent("demo_action_completed", { tier: "practice", action: "second_seat_loop_completed" });
  };

  if (state === "briefing") {
    return (
      <div className="practice-workspace">
        <section className="practice-heading">
          <div>
            <p className="member-kicker">The Second Seat · controlled interaction</p>
            <h1>One question. Three perspectives.</h1>
            <p>See how one answer changes the next prompt, while the progress instrument and included practice-time allowance remain visible.</p>
          </div>
          <div className="practice-orbit" aria-hidden="true"><i /><i /><span /></div>
        </section>

        <section className="practice-briefing" aria-labelledby="practice-briefing-title">
          <div className="practice-briefing-main">
            <span>SECOND SEAT · SAMPLE QUESTION</span>
            <h2 id="practice-briefing-title">{QUESTION}</h2>
            <p>You will choose an opening, inspect three expert perspectives, and receive a follow-up that responds to your decision.</p>
            <button className="member-primary-button" type="button" onClick={begin}>Begin controlled demo <span aria-hidden="true">↗</span></button>
          </div>
          <div style={{ padding: 28, display: "grid", alignContent: "center", gap: 18 }}>
            <dl style={{ padding: 0 }}>
              <div><dt>Interaction</dt><dd>One responsive loop</dd></div>
              <div><dt>Perspectives</dt><dd>Three specialist views</dd></div>
              <div><dt>Progress</dt><dd>0%</dd></div>
              <div><dt>Storage</dt><dd>None</dd></div>
            </dl>
            <PracticeTimeGauge light open={topupOpen} onToggle={openTopup} />
          </div>
        </section>

        <div className="practice-history-note"><i /><p><strong>{learnerName}</strong>, this controlled sample does not store, score, or transmit your selections. Permitted live support is limited to approved interview settings.</p></div>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="practice-workspace practice-complete">
        <section>
          <p className="member-kicker">Second Seat preview complete</p>
          <span className="practice-complete-mark">100%</span>
          <h1>One question became a clearer response.</h1>
          <p>This is a controlled demo. Foundation learners can unlock the complete Second Seat after clearance.</p>
          <div className="practice-complete-actions">
            <Link className="member-primary-button" href="/checkout/vault" onClick={() => trackEvent("foundation_checkout_started", { origin: "second_seat_demo_complete" })}>Start Foundation — ₹799 <span aria-hidden="true">↗</span></Link>
            <button type="button" onClick={begin}>Run the demonstration again</button>
          </div>
        </section>
        <div className="practice-transcript-summary">
          <article><span>01</span><div><strong>Opening decision</strong><p>{selectedAnswer?.response}</p></div></article>
          <article><span>02</span><div><strong>Responsive follow-up</strong><p>{selectedAnswer?.followup}</p></div></article>
          <article><span>03</span><div><strong>Your refinement</strong><p>{followupAnswer}</p></div></article>
        </div>
      </div>
    );
  }

  return (
    <div className="practice-session">
      <ProgressHeader state={state} onExit={reset} />

      <div className="practice-session-layout">
        <section className="practice-transcript" aria-live="polite">
          <div className="practice-transcript-disclaimer">Controlled sample · deterministic branches · no response is stored</div>
          <article className="interviewer-turn is-current">
            <span>Interviewer · sample question</span>
            <h1>{QUESTION}</h1>
            {state === "answer" ? <p>Choose the opening you would use aloud. The next prompt will respond to that choice.</p> : null}
          </article>

          {selectedAnswer ? <article className="learner-turn"><span>Your selected opening</span><p>{selectedAnswer.response}</p></article> : null}

          {state === "perspectives" ? (
            <div style={{ marginTop: 24 }}>
              <div role="tablist" aria-label="Second Seat perspectives" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 8 }}>
                {PERSPECTIVES.map((perspective, index) => (
                  <button
                    key={perspective.id}
                    ref={(node) => { perspectiveRefs.current[index] = node; }}
                    type="button"
                    role="tab"
                    id={`perspective-tab-${perspective.id}`}
                    aria-controls={`perspective-panel-${perspective.id}`}
                    aria-selected={activePerspective === index}
                    tabIndex={activePerspective === index ? 0 : -1}
                    onClick={() => changePerspective(index, "pointer")}
                    onKeyDown={(event) => onPerspectiveKeyDown(event, index)}
                    style={{ minHeight: 64, padding: "12px 14px", border: activePerspective === index ? "1px solid #ff6b2c" : "1px solid rgba(208,225,232,.13)", borderRadius: 10, color: activePerspective === index ? "#fff" : "#8297a1", background: activePerspective === index ? "rgba(255,107,44,.1)" : "rgba(255,255,255,.025)", fontFamily: "var(--font-mono)", fontSize: 12, cursor: "pointer" }}
                  >{perspective.label}</button>
                ))}
              </div>
              <article
                role="tabpanel"
                id={`perspective-panel-${PERSPECTIVES[activePerspective].id}`}
                aria-labelledby={`perspective-tab-${PERSPECTIVES[activePerspective].id}`}
                style={{ ...subduedPanel, minHeight: 170, marginTop: 10, display: "grid", alignContent: "center" }}
              >
                <span style={{ color: "#ff6b2c", fontFamily: "var(--font-mono)", fontSize: 12 }}>{PERSPECTIVES[activePerspective].label}</span>
                <strong style={{ maxWidth: 650, marginTop: 14, fontFamily: "var(--font-display)", fontSize: "clamp(1.7rem, 3vw, 3rem)", lineHeight: 1.05 }}>{PERSPECTIVES[activePerspective].text}</strong>
              </article>
              <p style={{ margin: "22px 0 0", color: "#bac8ce", fontSize: 15 }}><strong style={{ color: "#fff" }}>One question. Three perspectives. One clearer response.</strong></p>
            </div>
          ) : null}

          {state === "followup" && selectedAnswer ? (
            <article className="interviewer-turn is-current">
              <span>Responsive follow-up · based on your opening</span>
              <h1>{selectedAnswer.followup}</h1>
            </article>
          ) : null}
        </section>

        <aside className="practice-response-panel">
          <div><span>{state === "answer" ? "Choose an opening" : state === "perspectives" ? "Perspective pass" : "Choose a refinement"}</span><b>{PROGRESS[state]}% complete</b></div>

          {state === "answer" ? (
            <div role="group" aria-label="Select your opening answer" style={{ marginTop: 24, display: "grid", gap: 9, textTransform: "none" }}>
              {ANSWERS.map((answer, index) => (
                <button
                  type="button"
                  aria-pressed={answerId === answer.id}
                  onClick={() => setAnswerId(answer.id)}
                  key={answer.id}
                  style={{ minHeight: 78, padding: 15, display: "grid", gridTemplateColumns: "32px 1fr", gap: 10, alignItems: "center", border: answerId === answer.id ? "1px solid #ff6b2c" : "1px solid rgba(208,225,232,.13)", borderRadius: 11, color: "#dce6e9", textAlign: "left", background: answerId === answer.id ? "rgba(255,107,44,.1)" : "rgba(255,255,255,.025)", cursor: "pointer" }}
                >
                  <span style={{ color: "#ff6b2c", fontFamily: "var(--font-mono)" }}>{String.fromCharCode(65 + index)}</span><strong style={{ fontSize: 16, lineHeight: 1.45 }}>{answer.short}</strong>
                </button>
              ))}
              <button className="member-primary-button" type="button" disabled={!selectedAnswer} onClick={() => setState("perspectives")}>Send selected answer <span aria-hidden="true">↗</span></button>
            </div>
          ) : null}

          {state === "perspectives" ? (
            <>
              <p style={{ marginTop: 24, fontSize: 14, lineHeight: 1.55 }}>Use the tabs or Left/Right arrow keys to inspect each seat. Pointer interaction is optional.</p>
              <button className="member-primary-button" type="button" onClick={() => setState("followup")}>Generate responsive follow-up <span aria-hidden="true">↗</span></button>
            </>
          ) : null}

          {state === "followup" && selectedAnswer ? (
            <div role="group" aria-label="Select a follow-up response" style={{ marginTop: 24, display: "grid", gap: 9, textTransform: "none" }}>
              {selectedAnswer.followupAnswers.map((answer, index) => (
                <button
                  type="button"
                  aria-pressed={followupAnswer === answer}
                  onClick={() => setFollowupAnswer(answer)}
                  key={answer}
                  style={{ minHeight: 104, padding: 18, border: followupAnswer === answer ? "1px solid #ff6b2c" : "1px solid rgba(208,225,232,.13)", borderRadius: 11, color: "#dce6e9", textAlign: "left", background: followupAnswer === answer ? "rgba(255,107,44,.1)" : "rgba(255,255,255,.025)", fontSize: 15, lineHeight: 1.5, cursor: "pointer" }}
                >
                  <span style={{ marginRight: 10, color: "#ff6b2c", fontFamily: "var(--font-mono)" }}>0{index + 1}</span>{answer}
                </button>
              ))}
              <button className="member-primary-button" type="button" disabled={!followupAnswer} onClick={finish}>Complete the loop <span aria-hidden="true">↗</span></button>
            </div>
          ) : null}

          <div style={{ marginTop: 24, display: "block", textTransform: "none" }}>
            <PracticeTimeGauge open={topupOpen} onToggle={openTopup} />
          </div>
        </aside>
      </div>
    </div>
  );
}
