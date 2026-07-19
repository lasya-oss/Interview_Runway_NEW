"use client";

import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";
import { trackEvent } from "@/app/lib/analytics";

const DIMENSIONS = [
  {
    key: "pattern",
    code: "01",
    name: "Pattern recognition",
    prompt: "An unfamiliar array problem arrives. What happens before you code?",
    options: [
      "I start coding and adjust when tests fail.",
      "I recall a similar solution and adapt it.",
      "I name constraints, candidate patterns, and the invariant.",
      "I compare candidate patterns, reject the wrong ones, and state complexity before implementation.",
    ],
    gap: "Pattern selection is happening too late to protect interview time.",
    action: "Run a ten-problem recognition pass without writing code.",
    exercise: "For a sliding-window prompt, name the window invariant and its failure condition in 90 seconds.",
  },
  {
    key: "systems",
    code: "02",
    name: "Systems judgment",
    prompt: "A system-design interviewer asks for a notification service. What anchors your first five minutes?",
    options: [
      "I draw the standard components I remember.",
      "I ask about scale, then start the architecture.",
      "I frame users, SLOs, volume, failure tolerance, and two decisions that change the design.",
      "I do that, then make one explicit trade-off and name the evidence that would reverse it.",
    ],
    gap: "Architecture is visible before the judgment behind it.",
    action: "Rehearse constraint-to-decision openings for three common systems.",
    exercise: "Choose at-least-once or at-most-once delivery and defend the user consequence of duplicates.",
  },
  {
    key: "story",
    code: "03",
    name: "Behavioural evidence",
    prompt: "When asked about ownership, what makes your answer credible across company contexts?",
    options: [
      "I describe what the team built.",
      "I explain my task and the final result.",
      "I make my decision, constraint, action, and measurable consequence explicit.",
      "I also separate my contribution from the team result and can defend the evidence under follow-up.",
    ],
    gap: "Experience is present, but individual judgment is hard to verify.",
    action: "Build three evidence-led stories from decisions you personally made.",
    exercise: "Retell one project in four lines: constraint, your decision, proof, consequence.",
  },
  {
    key: "role",
    code: "04",
    name: "Role intelligence",
    prompt: "How do you decide what to prepare for a specific company and role?",
    options: [
      "I use a general interview checklist.",
      "I collect common questions from public posts.",
      "I map public signals to likely capabilities and prioritise gaps.",
      "I triangulate credible sources, distinguish facts from inference, and build a role-specific rehearsal plan.",
    ],
    gap: "Preparation effort is not yet tied to the interview signal the role rewards.",
    action: "Turn one target job description into a capability-and-evidence map.",
    exercise: "Extract the three strongest capability signals from a target role and attach one proof point to each.",
  },
  {
    key: "remote",
    code: "05",
    name: "Remote-work readiness",
    prompt: "A US company discusses a remote offer. What do you clarify before comparing the headline pay?",
    options: [
      "I compare the converted annual amount.",
      "I ask about time zone and leave.",
      "I compare contract type, payment, benefits, tax handling, termination, and overlap expectations.",
      "I model total economics and risk, then prepare a negotiation tied to scope and constraints.",
    ],
    gap: "The offer may be evaluated without its operating and contractual risk.",
    action: "Build a total-offer comparison before discussing negotiation.",
    exercise: "Compare contractor and employee offers across pay, benefits, tax, termination, and currency risk.",
  },
  {
    key: "clarity",
    code: "06",
    name: "Communication clarity",
    prompt: "Under follow-up pressure, how does an interviewer find the decision in your answer?",
    options: [
      "I explain everything I know and let them pick the important part.",
      "I give the conclusion, then add context as I remember it.",
      "I state the decision, reason, evidence, and caveat in that order.",
      "I do that concisely, check alignment, and adapt depth without losing the decision thread.",
    ],
    gap: "Strong knowledge may be losing signal through answer structure.",
    action: "Record five two-minute answers and remove every sentence that does not support the decision.",
    exercise: "Explain a caching trade-off in 60 seconds: decision, reason, risk, reversal condition.",
  },
] as const;

type Phase = "briefing" | "questions" | "report";

function scoreLabel(score: number) {
  if (score >= 4) return "Flight-ready";
  if (score >= 3) return "Visible signal";
  if (score >= 2) return "Inconsistent signal";
  return "High-risk gap";
}

export function DiagnosticClient() {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("briefing");
  const [step, setStep] = useState(0);
  const [scores, setScores] = useState<number[]>([]);
  const [shareState, setShareState] = useState("Share report");

  useEffect(() => {
    const encoded = new URLSearchParams(window.location.search).get("s");
    if (!encoded) return;
    const parsed = encoded.split("").map(Number);
    if (parsed.length === DIMENSIONS.length && parsed.every((value) => value >= 1 && value <= 4)) {
      queueMicrotask(() => {
        setScores(parsed);
        setPhase("report");
      });
    }
  }, []);

  const report = useMemo(() => {
    if (scores.length !== DIMENSIONS.length) return null;
    const strongestIndex = scores.indexOf(Math.max(...scores));
    const riskIndex = scores.indexOf(Math.min(...scores));
    const average = scores.reduce((total, score) => total + score, 0) / scores.length;
    const layer = average < 2.35
      ? { name: "Foundation · Vault", href: "/vault", reason: "Build the models before adding pressure." }
      : average < 3.35
        ? { name: "Practice · The Second Seat", href: "/second-seat", reason: "Use repeated attempts to make the gap measurable." }
        : scores[riskIndex] < 3
          ? { name: "Calibration · Human Review", href: "/premium", reason: "The base is strong; one narrow gap needs expert calibration." }
          : { name: "Practice · The Second Seat", href: "/second-seat", reason: "Stress-test the signal before spending on human review." };

    return {
      strongest: DIMENSIONS[strongestIndex],
      risk: DIMENSIONS[riskIndex],
      average,
      layer,
    };
  }, [scores]);

  const begin = () => {
    setScores([]);
    setStep(0);
    setPhase("questions");
    trackEvent("diagnostic_started", { version: "signal-check-v1" });
  };

  const answer = (score: number) => {
    const next = [...scores, score];
    setScores(next);
    if (step === DIMENSIONS.length - 1) {
      setPhase("report");
      trackEvent("diagnostic_completed", {
        version: "signal-check-v1",
        average: Number((next.reduce((total, value) => total + value, 0) / next.length).toFixed(2)),
      });
      window.history.replaceState(null, "", `/diagnostic?s=${next.join("")}`);
    } else {
      setStep((current) => current + 1);
    }
  };

  const share = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set("s", scores.join(""));
    const data = {
      title: "My InterviewRunway Signal Report",
      text: `Interview signal: ${Math.round((report?.average ?? 0) * 25)}/100. Strongest: ${report?.strongest.name}. Next gap: ${report?.risk.name}.`,
      url: url.toString(),
    };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(`${data.text} ${data.url}`);
      setShareState(navigator.share ? "Shared" : "Link copied");
      trackEvent("signal_report_shared", { strongest: report?.strongest.key, risk: report?.risk.key });
    } catch {
      setShareState("Share cancelled");
    }
  };

  if (phase === "briefing") {
    return (
      <section className="signal-briefing" aria-labelledby="signal-check-title">
        <div className="signal-grid-field" aria-hidden="true"><i /><i /><i /><span /></div>
        <div className="container signal-briefing-layout">
          <div>
            <p className="eyebrow">Free interview signal check</p>
            <h1 id="signal-check-title">Find the gap that is hiding your experience.</h1>
            <p>Six scenario-based checks. No payment. No account. Leave with one concrete exercise and the smallest useful next layer.</p>
            <button className="primary-cta" type="button" onClick={begin}>Start the 7–10 minute scan <span aria-hidden="true">↗</span></button>
            <small>No hiring prediction. No job guarantee. Your answers stay in this browser.</small>
          </div>
          <aside className="signal-scan-manifest" aria-label="Six diagnostic dimensions">
            <div><span>SCAN / 06 SYSTEMS</span><b>READY</b></div>
            {DIMENSIONS.map((dimension) => <p key={dimension.key}><span>{dimension.code}</span><strong>{dimension.name}</strong><i /></p>)}
          </aside>
        </div>
      </section>
    );
  }

  if (phase === "questions") {
    const dimension = DIMENSIONS[step];
    return (
      <section className="signal-question-stage" aria-labelledby="signal-question-title">
        <div className="container signal-question-layout">
          <aside className="signal-question-rail">
            <p>INTERVIEW SIGNAL / LIVE SCAN</p>
            <strong>{String(step + 1).padStart(2, "0")}</strong><span>/ 06</span>
            <div>{DIMENSIONS.map((item, index) => <i className={index <= step ? "is-active" : ""} key={item.key} />)}</div>
            <small>{Math.round((step / DIMENSIONS.length) * 100)}% complete</small>
          </aside>
          <AnimatePresence mode="wait">
            <motion.div
              className="signal-question-card"
              key={dimension.key}
              initial={reduceMotion ? false : { opacity: 0, x: 45, rotateY: -4 }}
              animate={{ opacity: 1, x: 0, rotateY: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -32 }}
            >
              <p><span>{dimension.code}</span>{dimension.name}</p>
              <h1 id="signal-question-title">{dimension.prompt}</h1>
              <div className="signal-answer-stack">
                {dimension.options.map((option, index) => (
                  <button type="button" onClick={() => answer(index + 1)} key={option}>
                    <span>{String.fromCharCode(65 + index)}</span><strong>{option}</strong><i aria-hidden="true">↗</i>
                  </button>
                ))}
              </div>
              <button className="signal-back" type="button" onClick={() => step === 0 ? setPhase("briefing") : (setScores((current) => current.slice(0, -1)), setStep((current) => current - 1))}>← Back</button>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    );
  }

  if (!report) return null;

  return (
    <section className="signal-report-stage" aria-labelledby="signal-report-title">
      <div className="container signal-report-shell">
        <header className="signal-report-head">
          <div><p className="eyebrow">Interview Signal Report</p><h1 id="signal-report-title">Your experience is present. Here is where the signal breaks.</h1></div>
          <div className="signal-score"><strong>{Math.round(report.average * 25)}</strong><span>signal<br />index</span></div>
        </header>

        <div className="signal-report-radar" aria-label="Scores across six interview dimensions">
          {DIMENSIONS.map((dimension, index) => (
            <article style={{ "--signal-score": `${scores[index] * 25}%` } as React.CSSProperties} key={dimension.key}>
              <div><span>{dimension.code}</span><strong>{dimension.name}</strong><b>{scores[index] * 25}</b></div>
              <i><b /></i><small>{scoreLabel(scores[index])}</small>
            </article>
          ))}
        </div>

        <div className="signal-report-readout">
          <article><span>STRONGEST SIGNAL</span><h2>{report.strongest.name}</h2><p>{scoreLabel(Math.max(...scores))}. Protect this strength while fixing the limiting gap.</p></article>
          <article className="is-risk"><span>HIGHEST-RISK GAP</span><h2>{report.risk.name}</h2><p>{report.risk.gap}</p></article>
          <article><span>NEXT ACTION</span><h2>{report.risk.action}</h2><p>Do this before adding more general preparation.</p></article>
          <article><span>SAMPLE EXERCISE</span><h2>{report.risk.exercise}</h2><p>One representative rehearsal from the active system.</p></article>
        </div>

        <div className="signal-recommendation">
          <div><span>RECOMMENDED PRODUCT LAYER</span><h2>{report.layer.name}</h2><p>{report.layer.reason}</p></div>
          <div><Link className="primary-cta" href={report.layer.href}>Inspect this layer <span aria-hidden="true">↗</span></Link><button type="button" onClick={share}>{shareState}</button></div>
        </div>
        <button className="signal-retake" type="button" onClick={begin}>Run the scan again</button>
      </div>
    </section>
  );
}
