"use client";

import Link from "next/link";
import { useState } from "react";

const SCRIPT = [
  {
    label: "Frame the problem",
    prompt: "Design a multi-channel notification service. Before naming components, which requirements would you clarify and which two would most change the architecture?",
    probe: "The product requires email, push, and SMS. Transactional notifications should arrive within 30 seconds; marketing messages may take 15 minutes. How does that change your first design commitment?",
    sample: "I would separate transactional and marketing workloads because their latency and failure tolerance differ. I would also clarify delivery volume, per-user preferences, ordering needs, and whether duplicate delivery is acceptable.",
  },
  {
    label: "Commit to semantics",
    prompt: "Choose the delivery guarantee for provider jobs. Explain what the user experiences when the same event is processed twice.",
    probe: "Assume one SMS provider times out after accepting a request. You cannot know whether it sent the message. Where does idempotency live, and what do you record?",
    sample: "I would use at-least-once processing with an idempotency key derived from notification and channel. The delivery ledger records attempts and provider references, while channel-specific policy decides whether an ambiguous timeout may be retried.",
  },
  {
    label: "Operate under failure",
    prompt: "A provider outage causes the queue to grow twenty-fold. Describe backpressure, retry bounds, prioritisation, and the signal that tells operations the system is recovering.",
    probe: "Final follow-up: which lower-priority work would you shed first, and how would you prevent recovery traffic from causing another collapse?",
    sample: "I would protect transactional queues, pause marketing fan-out, cap exponential retries with jitter, and move exhausted work to a dead-letter stream. Recovery would be rate-shaped against provider health and measured through queue age by priority, not queue length alone.",
  },
] as const;

export function PracticeClient({ learnerName }: { learnerName: string }) {
  const [state, setState] = useState<"briefing" | "session" | "complete">("briefing");
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState("");
  const [answers, setAnswers] = useState<string[]>([]);

  const begin = () => {
    setAnswers([]);
    setDraft("");
    setStep(0);
    setState("session");
  };

  const submit = () => {
    if (!draft.trim()) return;
    const nextAnswers = [...answers, draft.trim()];
    setAnswers(nextAnswers);
    setDraft("");
    if (step === SCRIPT.length - 1) setState("complete");
    else setStep((value) => value + 1);
  };

  if (state === "briefing") {
    return (
      <div className="practice-workspace">
        <section className="practice-heading">
          <div>
            <p className="member-kicker">Deterministic interaction preview</p>
            <h1>Practise the decision, not the script.</h1>
            <p>This sample demonstrates how a responsive system-design mock feels. It uses a fixed three-turn sequence, makes no model call, and does not store or score what you type.</p>
          </div>
          <div className="practice-orbit" aria-hidden="true"><i /><i /><span /></div>
        </section>

        <section className="practice-briefing" aria-labelledby="practice-briefing-title">
          <div className="practice-briefing-main">
            <span>MOCK-08 · SAMPLE SESSION</span>
            <h2 id="practice-briefing-title">Design a notification service</h2>
            <p>The interviewer will probe requirements, delivery semantics, and operation under provider failure.</p>
            <button className="member-primary-button" type="button" onClick={begin}>Begin scripted mock <span aria-hidden="true">↗</span></button>
          </div>
          <dl>
            <div><dt>Round</dt><dd>System design</dd></div>
            <div><dt>Preview length</dt><dd>3 turns</dd></div>
            <div><dt>Target signal</dt><dd>Trade-off clarity</dd></div>
            <div><dt>Storage</dt><dd>None</dd></div>
          </dl>
        </section>

        <div className="practice-history-note"><i /><p><strong>{learnerName}</strong>, this is fictional product data. Production mocks require explicit transcript retention and deletion controls.</p></div>
      </div>
    );
  }

  if (state === "complete") {
    return (
      <div className="practice-workspace practice-complete">
        <section>
          <p className="member-kicker">Scripted preview complete</p>
          <span className="practice-complete-mark">03 / 03</span>
          <h1>You completed the interaction shape.</h1>
          <p>No AI evaluation occurred. The feedback page shows a separate, fictional evidence-based result so you can inspect the intended debrief experience.</p>
          <div className="practice-complete-actions">
            <Link className="member-primary-button" href="/learn/feedback">Open sample feedback <span aria-hidden="true">↗</span></Link>
            <button type="button" onClick={begin}>Run the sample again</button>
          </div>
        </section>
        <div className="practice-transcript-summary">
          {SCRIPT.map((turn, index) => (
            <article key={turn.label}><span>0{index + 1}</span><div><strong>{turn.label}</strong><p>{answers[index]}</p></div></article>
          ))}
        </div>
      </div>
    );
  }

  const turn = SCRIPT[step];

  return (
    <div className="practice-session">
      <header className="practice-session-header">
        <div><span>MOCK-08</span><strong>Notification service</strong></div>
        <div><span>Scripted demo</span><b>{String(step + 1).padStart(2, "0")} / 03</b></div>
        <button type="button" onClick={() => setState("briefing")}>End preview</button>
      </header>

      <div className="practice-session-layout">
        <section className="practice-transcript" aria-label="Sample interview transcript">
          <div className="practice-transcript-disclaimer">Fixed prompts · text remains in this tab · no score is produced</div>
          {answers.map((answer, index) => (
            <div className="practice-turn-complete" key={SCRIPT[index].label}>
              <article className="interviewer-turn"><span>Interviewer · 0{index + 1}</span><p>{SCRIPT[index].prompt}</p><small>{SCRIPT[index].probe}</small></article>
              <article className="learner-turn"><span>You</span><p>{answer}</p></article>
            </div>
          ))}
          <article className="interviewer-turn is-current">
            <span>Interviewer · 0{step + 1} · {turn.label}</span>
            <h1>{turn.prompt}</h1>
            <p>{turn.probe}</p>
          </article>
        </section>

        <aside className="practice-response-panel">
          <div><span>Your response</span><b>Not stored</b></div>
          <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Write the answer you would say aloud…" rows={11} />
          <button className="practice-sample-answer" type="button" onClick={() => setDraft(turn.sample)}>Use a sample response</button>
          <button className="member-primary-button" type="button" onClick={submit} disabled={!draft.trim()}>{step === SCRIPT.length - 1 ? "Finish preview" : "Submit and continue"} <span aria-hidden="true">↗</span></button>
          <p>The final feedback remains prewritten demo data and does not evaluate this response.</p>
        </aside>
      </div>
    </div>
  );
}
