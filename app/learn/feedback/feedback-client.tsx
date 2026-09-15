"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { trackEvent } from "@/app/lib/analytics";
import type {
  SecondSeatAnswerFeedback,
  SecondSeatRubricScore,
} from "@/app/lib/second-seat-engine";

type FeedbackTab = "summary" | "evidence" | "actions";
type Dimension = { key: string; label: string; score: number; delta: string; note: string };
type Evidence = { time: string; dimensionKeys: readonly string[]; question?: string; relevance?: "irrelevant" | "partial" | "relevant"; signal: string; excerpt: string; observation: string; correction: string };
type Action = { number: string; title: string; body: string; meta: string; href: string; what?: string; why?: string; next?: string };

const TABS: readonly { key: FeedbackTab; number: string; label: string; description: string }[] = [
  { key: "summary", number: "01", label: "Summary", description: "Scores + pattern" },
  { key: "evidence", number: "02", label: "Answer review", description: "Original + improved" },
];

export function FeedbackClient({
  overall,
  dimensions,
  evidence,
  actions,
  premium,
  live,
  secondSeat = false,
  mockTitle,
  insightTitle,
  insightBody,
  scoreReason,
  rubricScores,
  answerFeedback,
  evaluationSource,
  evaluationNotice,
}: {
  overall: number;
  dimensions: readonly Dimension[];
  evidence: readonly Evidence[];
  actions: readonly Action[];
  premium: boolean;
  live: boolean;
  secondSeat?: boolean;
  mockTitle: string;
  insightTitle?: string;
  insightBody?: string;
  scoreReason?: string;
  rubricScores?: readonly SecondSeatRubricScore[];
  answerFeedback?: readonly SecondSeatAnswerFeedback[];
  evaluationSource?: "ai" | "rubric_fallback";
  evaluationNotice?: string;
}) {
  const [tab, setTab] = useState<FeedbackTab>("summary");
  const [focusedDimension, setFocusedDimension] = useState<string | null>(null);

  useEffect(() => {
    if (!live) trackEvent("mock_score_recorded", { mock: "MOCK-07", score: overall, sample: true });
  }, [live, overall]);

  if (secondSeat) {
    return (
      <SecondSeatFeedbackExperience
        overall={overall}
        dimensions={dimensions}
        evidence={evidence}
        live={live}
        mockTitle={mockTitle}
        insightTitle={insightTitle}
        insightBody={insightBody}
        scoreReason={scoreReason}
        rubricScores={rubricScores}
        answerFeedback={answerFeedback}
        evaluationSource={evaluationSource}
        evaluationNotice={evaluationNotice}
        tab={tab}
        onTabChange={setTab}
        focusedDimension={focusedDimension}
        onOpenSummary={(dimensionKey) => {
          setFocusedDimension(dimensionKey);
          setTab("summary");
        }}
      />
    );
  }

  return (
    <div className="feedback-workspace">
      <section className="feedback-heading">
        <div>
          <p className="member-kicker">{live ? "Your debrief · account history" : "Preview debrief · MOCK-07"}</p>
          <h1>{mockTitle}</h1>
          <p>{live ? "This evaluation was generated from your completed transcript. Each score shows practice performance and each correction points to a concrete next rehearsal." : "This preview demonstrates how a production transcript connects observations, scores, and the next study decision. It does not evaluate preview responses."}</p>
        </div>
        <div className="feedback-score" aria-label={`${live ? "Your" : "Preview"} overall score ${overall} out of 100`}>
          <span>Practice score</span><strong>{overall}</strong><small>{live ? "Latest completed round" : "+7 across preview sessions"}</small>
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
            <div><b>Not a hiring prediction</b><small>Scores show practice performance, not an estimate of receiving an offer.</small></div>
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
          <div className="feedback-actions-heading"><p className="member-kicker">{live ? "Adaptive plan" : "Preview plan regeneration"}</p><h2>Correct the gap while it is still specific.</h2><p>{live ? "The next actions are generated from the lowest evidence score in this transcript." : "These actions demonstrate the expected handoff from feedback to preparation."}</p></div>
          <div className="feedback-action-list">
            {actions.map((action) => (
              <article key={action.number}>
                <span>{action.number}</span>
                <div><small>{action.meta}</small><h3>{action.title}</h3><p>{action.body}</p></div>
                <Link className="feedback-action-button" href={action.href}>Open sample <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
          {premium ? <Link className="member-primary-button" href="/learn/coaching">Bring this pattern to the coach room <span aria-hidden="true">↗</span></Link> : <Link className="member-primary-button" href="/learn/practice">Run another scripted mock <span aria-hidden="true">↗</span></Link>}
        </section>
      ) : null}
    </div>
  );
}

function SecondSeatFeedbackExperience({
  overall,
  dimensions,
  evidence,
  live,
  mockTitle,
  insightTitle,
  insightBody,
  scoreReason,
  rubricScores,
  answerFeedback,
  evaluationSource,
  evaluationNotice,
  tab,
  onTabChange,
  focusedDimension,
  onOpenSummary,
}: {
  overall: number;
  dimensions: readonly Dimension[];
  evidence: readonly Evidence[];
  live: boolean;
  mockTitle: string;
  insightTitle?: string;
  insightBody?: string;
  scoreReason?: string;
  rubricScores?: readonly SecondSeatRubricScore[];
  answerFeedback?: readonly SecondSeatAnswerFeedback[];
  evaluationSource?: "ai" | "rubric_fallback";
  evaluationNotice?: string;
  tab: FeedbackTab;
  onTabChange: (tab: FeedbackTab) => void;
  focusedDimension: string | null;
  onOpenSummary: (dimensionKey: string) => void;
}) {
  const dimensionByKey = new Map(dimensions.map((dimension) => [dimension.key, dimension]));
  const lowestDimension = dimensions.reduce<Dimension | null>(
    (lowest, dimension) => !lowest || dimension.score < lowest.score ? dimension : lowest,
    null,
  );

  return (
    <div className="feedback-workspace feedback-workspace--second-seat" data-feedback-scope="second-seat">
      <section className="feedback-heading">
        <div>
          <p className="member-kicker">{live ? "Second Seat · account debrief" : "Second Seat · preview debrief"}</p>
          <h1>{mockTitle}</h1>
          <p>{live ? "This evaluation is grounded in your completed transcript. Follow each score from the moment it appeared to the next rehearsal it changes." : "This preview shows how the Second Seat connects transcript moments to practice scores and a focused next rehearsal."}</p>
        </div>
        <div className="feedback-score" aria-label={`${live ? "Your" : "Preview"} practice score ${overall} out of 100`}>
          <span>Practice score</span>
          <strong>{overall}<small>/100</small></strong>
          <small>{live ? "Latest completed round" : "Preview round"}</small>
        </div>
      </section>

      {evaluationNotice ? (
        <div className="feedback-evaluation-notice" role="status">
          <strong>{evaluationSource === "rubric_fallback" ? "Transcript saved · standard rubric used" : "Assessment note"}</strong>
          <span>{evaluationNotice}</span>
        </div>
      ) : null}

      <SecondSeatFeedbackTabs tab={tab} onChange={onTabChange} />

      {tab === "summary" ? (
        <section id="feedback-panel-summary" className="feedback-summary" role="tabpanel" aria-labelledby="feedback-tab-summary" tabIndex={0}>
          <div className="feedback-dimensions" aria-label="Feedback dimension scores">
            <div className="feedback-dimensions-heading"><div><p className="member-kicker">Score dimensions</p><p>Scores are out of 100 and reflect what this transcript made visible.</p></div><span>0–100 scale</span></div>
            {dimensions.map((dimension) => (
              <article
                id={`feedback-dimension-${dimension.key}`}
                className="feedback-dimension-card"
                data-focused={focusedDimension === dimension.key}
                key={dimension.key}
                aria-label={`${dimension.label}: ${dimension.score} out of 100, ${scoreBand(dimension.score)}`}
              >
                <div className="feedback-dimension-card-header"><span>{dimension.label}</span><b>{dimension.delta}</b></div>
                <div className="feedback-dimension-score"><strong>{dimension.score}<small>/100</small></strong><span>{scoreBand(dimension.score)}</span></div>
                <div className="feedback-dimension-meter" role="progressbar" aria-label={`${dimension.label} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={dimension.score} aria-valuetext={`${dimension.score} out of 100`}><b style={{ width: `${Math.max(0, Math.min(100, dimension.score))}%` }} /></div>
                <p>{dimension.note}</p>
              </article>
            ))}
            {rubricScores?.length ? (
              <section className="feedback-rubric" aria-labelledby="feedback-rubric-title">
                <div className="feedback-rubric-heading">
                  <div><p className="member-kicker">Evaluation rubric</p><h2 id="feedback-rubric-title">Why this score</h2></div>
                  <p>{scoreReason ?? "Each category reflects evidence in the answers from this round."}</p>
                </div>
                <div className="feedback-rubric-grid">
                  {rubricScores.map((rubric) => (
                    <article key={rubric.key}>
                      <div><strong>{rubric.label}</strong><b>{rubric.score}<small>/100</small></b></div>
                      <i role="progressbar" aria-label={`${rubric.label} score`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={rubric.score}><b style={{ width: `${Math.max(0, Math.min(100, rubric.score))}%` }} /></i>
                      <p>{rubric.reason}</p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
          <aside className="feedback-primary-insight">
            <span>Adaptive plan change</span>
            <h2>{insightTitle ?? "Make the next decision easy to follow."}</h2>
            <p>{insightBody ?? "The next rehearsal should preserve the strongest decision order while making the unresolved trade-off observable earlier."}</p>
            <div><b>Next focus</b><small>{lowestDimension ? `${lowestDimension.label} · ${lowestDimension.score}/100 · ${scoreBand(lowestDimension.score)}` : "The opening decision"}</small><b>How to read it</b><small>This score is evidence from this round, not a readiness score or hiring prediction.</small></div>
          </aside>
        </section>
      ) : null}

      {tab === "evidence" ? (
        <section id="feedback-panel-evidence" className="feedback-evidence" role="tabpanel" aria-labelledby="feedback-tab-evidence" tabIndex={0}>
          <div className="feedback-evidence-intro"><p className="member-kicker">Traceable answer review</p><h2>See what worked, what was missing, and how to improve it.</h2><p>{live ? "Your original answers stay beside each correction and improved version, so every score is explainable." : "Each preview excerpt is connected to the practice score it is meant to improve."}</p></div>
          {answerFeedback?.length ? (
            <div className="feedback-answer-list">
              {answerFeedback.map((answer, index) => (
                <article className="feedback-answer-card" key={answer.turnId}>
                  <header>
                    <div><span>Answer {String(index + 1).padStart(2, "0")}</span><strong>{verdictText(answer.verdict)}</strong></div>
                    <b>{answer.score}<small>/100</small></b>
                  </header>
                  <div className="feedback-answer-question"><span>Question</span><h3>{answer.question}</h3></div>
                  <section className="feedback-original-answer"><span>Your original answer</span><blockquote>“{answer.originalAnswer}”</blockquote></section>
                  <p className="feedback-answer-score-reason"><span>Why this score</span>{answer.scoreReason}</p>
                  <div className="feedback-answer-rubric" aria-label={`Rubric scores for answer ${index + 1}`}>
                    {answer.rubricScores.map((rubric) => (
                      <div key={rubric.key}><span>{rubric.label}</span><strong>{rubric.score}<small>/100</small></strong><p>{rubric.reason}</p></div>
                    ))}
                  </div>
                  <div className="feedback-learning-grid">
                    <LearningList title="What you did well" items={uniqueItems(answer.strengths, answer.correctPoints)} tone="positive" />
                    <LearningList title="What is incorrect" items={answer.incorrectPoints} tone="correction" />
                    <LearningList title="What is missing" items={answer.missingPoints} tone="neutral" />
                    <LearningList title="How to improve" items={uniqueItems(answer.weaknesses, answer.improvementActions)} tone="action" />
                  </div>
                  <div className="feedback-quality-notes">
                    <div><span>Relevance</span><p>{answer.relevanceFeedback}</p></div>
                    <div><span>Clarity</span><p>{answer.clarityFeedback}</p></div>
                    <div><span>Technical accuracy</span><p>{answer.technicalAccuracyFeedback}</p></div>
                    <div><span>Interview quality</span><p>{answer.interviewQualityFeedback}</p></div>
                  </div>
                  <section className="feedback-improved-answer"><span>Improved answer</span><blockquote>“{answer.improvedAnswer}”</blockquote><div><strong>Why this would score higher</strong><p>{answer.whyImprovedAnswerIsBetter}</p></div></section>
                </article>
              ))}
            </div>
          ) : (
          <div className="feedback-evidence-list">
            {evidence.map((item, index) => {
              const linkedDimensions = item.dimensionKeys
                .map((key) => dimensionByKey.get(key))
                .filter((dimension): dimension is Dimension => Boolean(dimension));
              return (
                <article key={`${item.time}-${index}`}>
                  <div className="feedback-evidence-marker"><span>{item.time}</span><i /><b>0{index + 1}</b></div>
                  <div>
                    <small>{item.signal}</small>
                    {linkedDimensions.length ? (
                      <div className="feedback-evidence-score-list" aria-label="Feedback scores connected to this evidence">
                        {linkedDimensions.map((dimension) => (
                          <button className="feedback-evidence-score-link" type="button" key={dimension.key} onClick={() => onOpenSummary(dimension.key)} aria-label={`View ${dimension.label} score in Summary`}>
                            <span>{dimension.label}</span><strong>{dimension.score}<small>/100</small></strong><em>{scoreBand(dimension.score)}</em><b>View score ↗</b>
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {item.question ? <p className="feedback-evidence-question"><span>Question evaluated</span>{item.question}</p> : null}
                    <blockquote>“{item.excerpt}”</blockquote>
                    <dl><div><dt>Observed</dt><dd>{item.observation}</dd></div><div><dt>Correction</dt><dd>{item.correction}</dd></div></dl>
                    <p className="feedback-evidence-improvement"><span>Improvement area</span>{linkedDimensions.length ? linkedDimensions.map((dimension) => `${dimension.label}: ${dimension.note}`).join(" ") : "This moment is retained, but no dimension mapping is available yet."}</p>
                  </div>
                </article>
              );
            })}
          </div>
          )}
        </section>
      ) : null}

    </div>
  );
}

function SecondSeatFeedbackTabs({ tab, onChange }: { tab: FeedbackTab; onChange: (tab: FeedbackTab) => void }) {
  function handleKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
    const currentIndex = TABS.findIndex((item) => item.key === tab);
    const nextIndex = event.key === "ArrowRight"
      ? (currentIndex + 1) % TABS.length
      : event.key === "ArrowLeft"
        ? (currentIndex - 1 + TABS.length) % TABS.length
        : event.key === "Home"
          ? 0
          : event.key === "End"
            ? TABS.length - 1
            : -1;
    if (nextIndex < 0) return;
    event.preventDefault();
    onChange(TABS[nextIndex].key);
  }

  return (
    <div className="feedback-tabs" role="tablist" aria-label="Second Seat feedback sections">
      {TABS.map((item) => (
        <button id={`feedback-tab-${item.key}`} type="button" role="tab" aria-selected={tab === item.key} aria-controls={`feedback-panel-${item.key}`} tabIndex={tab === item.key ? 0 : -1} onClick={() => onChange(item.key)} onKeyDown={handleKeyDown} key={item.key}>
          <span>{item.number}</span><strong>{item.label}</strong><small>{item.description}</small>
        </button>
      ))}
    </div>
  );
}

function LearningList({
  title,
  items,
  tone,
}: {
  title: string;
  items: readonly string[];
  tone: "positive" | "correction" | "neutral" | "action";
}) {
  const fallback = title === "What you did well"
    ? "No clear strength was identified in this answer yet."
    : title === "What is incorrect"
      ? "No major factual errors were identified."
      : title === "What is missing"
        ? "No important missing points were identified."
        : "Keep the correct content and make the reasoning more explicit.";
  return (
    <section className="feedback-learning-card" data-tone={tone}>
      <h4>{title}</h4>
      <ul>{(items.length ? items : [fallback]).map((item, index) => <li key={`${title}-${index}`}>{item}</li>)}</ul>
    </section>
  );
}

function uniqueItems(...groups: readonly (readonly string[])[]) {
  const seen = new Set<string>();
  return groups.flatMap((items) => items).filter((item) => {
    const key = item.trim().toLowerCase();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function verdictText(verdict: SecondSeatAnswerFeedback["verdict"]) {
  if (verdict === "off-topic") return "Off-topic answer";
  if (verdict === "misconception") return "Misconception found";
  return `${verdict[0].toUpperCase()}${verdict.slice(1)} answer`;
}

function scoreBand(score: number) {
  if (score >= 80) return "Strong evidence";
  if (score >= 65) return "Building";
  if (score >= 50) return "Developing";
  return "Focus next";
}
