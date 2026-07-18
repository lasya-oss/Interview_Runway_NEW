"use client";

import { useState } from "react";

export function PricingWorkspacePreview({ learnerName }: { learnerName: string }) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState("");

  async function openSampleWorkspace() {
    setIsOpening(true);
    setError("");

    try {
      const response = await fetch("/api/demo-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: "practice" }),
      });

      if (!response.ok) throw new Error("Sample workspace unavailable");
      window.location.assign("/learn");
    } catch {
      setError("The sample workspace could not open. Please try again.");
      setIsOpening(false);
    }
  }

  return (
    <div className="pricing-workspace-stage">
      <div className="pricing-workspace-frame" aria-label="AI Prep sample workspace at week three">
        <div className="pricing-workspace-topline">
          <span><i /> SAMPLE WORKSPACE · FICTIONAL PROGRESS</span>
          <span>AI PREP / PRACTICE LAYER</span>
          <span>WEEK 03 / 04</span>
        </div>

        <div className="pricing-workspace-shell">
          <aside className="pricing-workspace-nav" aria-hidden="true">
            <div className="pricing-workspace-mark"><b>IR</b><span>RUNWAY / 02</span></div>
            <ol>
              <li><span>01</span>Today</li>
              <li><span>02</span>Roadmap</li>
              <li><span>03</span>Library</li>
              <li className="is-active"><span>04</span>Practice</li>
              <li><span>05</span>Feedback</li>
            </ol>
            <div className="pricing-workspace-plan">
              <span>PLAN PROGRESS</span>
              <strong>54%</strong>
              <div><i /></div>
              <small>9-day practice rhythm</small>
            </div>
          </aside>

          <div className="pricing-workspace-main">
            <header>
              <div>
                <span>GOOD EVENING</span>
                <h3>{learnerName}.</h3>
                <p>Your evidence says: practise trade-off framing before adding more theory.</p>
              </div>
              <div className="pricing-readiness-dial" aria-label="Readiness signal 78 out of 100">
                <span>78</span><small>READINESS</small>
              </div>
            </header>

            <div className="pricing-workspace-command">
              <article>
                <div><span>NEXT ACTION / MOCK 08</span><b>35 MIN</b></div>
                <h4>Design a notification service.</h4>
                <p>State the delivery contract, bound retries, and defend one consistency trade-off.</p>
                <span className="pricing-command-link">OPEN PREPARATION <i aria-hidden="true">↗</i></span>
              </article>
              <aside>
                <span>RECENT EVIDENCE</span>
                <div><b>78</b><p>Metrics pipeline<small>Trade-off framing improved</small></p></div>
                <div><b>71</b><p>Queue backlog<small>Retry bounds still unclear</small></p></div>
                <div><b>68</b><p>Chat service<small>Name consistency earlier</small></p></div>
              </aside>
            </div>

            <div className="pricing-workspace-signal">
              <span>WEEKLY PRACTICE SIGNAL</span>
              <div aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
              <p><strong>+10</strong> across the last three scored mocks</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pricing-workspace-entry">
        <div>
          <span>NO PAYMENT · NO RECORD CREATED</span>
          <p>Explore fictional mid-tier progress, feedback, practice history, and the adaptive roadmap. The workspace itself will show how to start real access.</p>
        </div>
        <button className="primary-cta" type="button" onClick={openSampleWorkspace} disabled={isOpening}>
          {isOpening ? "Opening your sample…" : "Explore your sample workspace"} <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className="pricing-workspace-error" role="status" aria-live="polite">{error}</p>
    </div>
  );
}
