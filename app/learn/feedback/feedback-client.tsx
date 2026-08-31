"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/app/lib/analytics";

type Dimension = { label: string; score: number; delta: string; note: string };
type Evidence = { time: string; signal: string; excerpt: string; observation: string; correction: string };
type Action = { number: string; title: string; body: string; meta: string; href: string };

export function FeedbackClient({
  overall,
  dimensions,
  evidence,
  actions,
  premium,
  live,
  mockTitle,
  insightTitle,
  insightBody,
}: {
  overall: number;
  dimensions: readonly Dimension[];
  evidence: readonly Evidence[];
  actions: readonly Action[];
  premium: boolean;
  live: boolean;
  mockTitle: string;
  insightTitle?: string;
  insightBody?: string;
}) {
  const [tab, setTab] = useState<"summary" | "evidence" | "actions">("summary");

  useEffect(() => {
    if (!live) trackEvent("mock_score_recorded", { mock: "MOCK-07", score: overall, sample: true });
  }, [live, overall]);

  return (
    <div className="feedback-workspace">
      <section className="feedback-heading">
        <div>
          <p className="member-kicker">{live ? "Your debrief · account record" : "Preview debrief · MOCK-07"}</p>
          <h1>{mockTitle}</h1>
          <p>{live ? "This evaluation was generated from your completed transcript. Each score is a practice signal and each correction points to a concrete next rehearsal." : "This preview demonstrates how a production transcript connects observations, scores, and the next study decision. It does not evaluate preview responses."}</p>
        </div>
        <div className="feedback-score" aria-label={`${live ? "Your" : "Preview"} overall score ${overall} out of 100`}>
          <span>Practice signal</span><strong>{overall}</strong><small>{live ? "Latest completed round" : "+7 across preview sessions"}</small>
        </div>
      </section>

      <div className="feedback-tabs" role="tablist" aria-label="Feedback sections">
        <button type="button" role="tab" aria-selected={tab === "summary"} onClick={() => setTab("summary")}>01 · Summary</button>
        <button type="button" role="tab" aria-selected={tab === "evidence"} onClick={() => setTab("evidence")}>02 · Transcript evidence</button>
        <button type="button" role="tab" aria-selected={tab === "actions"} onClick={() => setTab("actions")}>03 · Plan changes</button>
      </div>

      {tab === "summary" ? (
        <section className="feedback-summary" role="tabpanel">
          <div className="feedback-dimensions">
            {dimensions.map((dimension) => (
              <article key={dimension.label}>
                <div><span>{dimension.label}</span><b>{dimension.delta}</b></div>
                <strong>{dimension.score}</strong>
                <i><b style={{ width: `${dimension.score}%` }} /></i>
                <p>{dimension.note}</p>
              </article>
            ))}
          </div>
          <aside className="feedback-primary-insight">
            <span>{premium ? "Coach-visible pattern" : live ? "Adaptive plan change" : "Preview plan change"}</span>
            <h2>{insightTitle ?? "Move the consistency decision before the scale discussion."}</h2>
            <p>{insightBody ?? "The architecture was credible, but the consistency model arrived after prompting. The next design rehearsal should make that decision visible earlier."}</p>
            <div><b>Not a hiring prediction</b><small>Scores illustrate practice signals, not an estimate of receiving an offer.</small></div>
          </aside>
        </section>
      ) : null}

      {tab === "evidence" ? (
        <section className="feedback-evidence" role="tabpanel">
          <div className="feedback-evidence-intro"><p className="member-kicker">Traceable observations</p><h2>Every correction points back to a moment.</h2><p>{live ? "Your answers are retained with this account so the next practice decision has context." : "These preview excerpts demonstrate the required evaluation standard."}</p></div>
          <div className="feedback-evidence-list">
            {evidence.map((item, index) => (
              <article key={item.time}>
                <div className="feedback-evidence-marker"><span>{item.time}</span><i /><b>0{index + 1}</b></div>
                <div>
                  <small>{item.signal}</small>
                  <blockquote>“{item.excerpt}”</blockquote>
                  <dl><div><dt>Observed</dt><dd>{item.observation}</dd></div><div><dt>Correction</dt><dd>{item.correction}</dd></div></dl>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {tab === "actions" ? (
        <section className="feedback-actions" role="tabpanel">
          <div className="feedback-actions-heading"><p className="member-kicker">{live ? "Adaptive plan" : "Preview plan regeneration"}</p><h2>Correct the gap while it is still specific.</h2><p>{live ? "The next actions are generated from the lowest evidence signal in this transcript." : "These actions demonstrate the expected handoff from feedback to preparation."}</p></div>
          <div className="feedback-action-list">
            {actions.map((action) => (
              <article key={action.number}>
                <span>{action.number}</span>
                <div><small>{action.meta}</small><h3>{action.title}</h3><p>{action.body}</p></div>
                <Link href={action.href}>Open sample <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
          {premium ? <Link className="member-primary-button" href="/learn/coaching">Bring this pattern to the coach room <span aria-hidden="true">↗</span></Link> : <Link className="member-primary-button" href="/learn/practice">Run another scripted mock <span aria-hidden="true">↗</span></Link>}
        </section>
      ) : null}
    </div>
  );
}
