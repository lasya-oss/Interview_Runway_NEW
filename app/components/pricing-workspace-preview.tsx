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
      window.location.assign("/learn/practice");
    } catch {
      setError("The sample workspace could not open. Please try again.");
      setIsOpening(false);
    }
  }

  return (
    <div className="pricing-workspace-stage">
      <div className="pricing-workspace-frame" aria-label="The Second Seat controlled sample workspace at week three">
        <div className="pricing-workspace-topline">
          <span><i /> CONTROLLED DEMO · SAMPLE DATA</span>
          <span>THE SECOND SEAT / ACTIVE</span>
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
                <h4>How would you design a rate limiter?</h4>
                <p>State the traffic constraint, choose the policy, and defend the trade-off before implementation.</p>
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
              <span>SAMPLE PRACTICE TIME</span>
              <div aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div>
              <p><strong>86 min</strong> remaining of a sample 120-minute allowance</p>
            </div>
          </div>
        </div>
      </div>

      <div className="pricing-workspace-entry">
        <div>
          <span>CONTROLLED DEMO · NO PAYMENT · NO RECORD CREATED</span>
          <p>Explore sample Second Seat progress, perspectives, practice history, and the responsive roadmap. The workspace clearly marks how Foundation clearance unlocks real access.</p>
        </div>
        <button className="primary-cta" type="button" onClick={openSampleWorkspace} disabled={isOpening}>
          {isOpening ? "Opening the demo…" : "Enter the Second Seat demo"} <span aria-hidden="true">↗</span>
        </button>
      </div>
      <p className="pricing-workspace-error" role="status" aria-live="polite">{error}</p>
    </div>
  );
}
