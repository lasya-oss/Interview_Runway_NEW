"use client";

import { useEffect, useState } from "react";

type LearnerResult = {
  email: string;
};

type ReadyReport = {
  url: string;
  learnerEmail: string;
};

export function UserHistoryReportPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LearnerResult[]>([]);
  const [selected, setSelected] = useState<LearnerResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReadyReport | null>(null);

  useEffect(() => () => {
    if (report) URL.revokeObjectURL(report.url);
  }, [report]);

  const clearReadyReport = () => {
    setReport(null);
  };

  const search = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searching || generating) return;
    setError(null);
    setSearched(false);
    setSearching(true);
    setSelected(null);
    setResults([]);
    clearReadyReport();
    try {
      const response = await fetch("/api/admin/user-history/learners", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ query }),
      });
      const body = (await response.json().catch(() => null)) as {
        learners?: LearnerResult[];
        error?: string;
        message?: string;
      } | null;
      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Your session expired. Sign in again to continue."
            : body?.error || body?.message || "Learner search failed",
        );
      }
      setSelected(null);
      setResults(Array.isArray(body?.learners) ? body.learners : []);
      setSearched(true);
    } catch (searchError) {
      setResults([]);
      setError(searchError instanceof Error ? searchError.message : "Learner search failed");
    } finally {
      setSearching(false);
    }
  };

  const chooseLearner = (learner: LearnerResult) => {
    if (searching || generating) return;
    clearReadyReport();
    setError(null);
    setSelected(learner);
  };

  const generate = async () => {
    if (!selected || generating || searching) return;
    setError(null);
    setGenerating(true);
    clearReadyReport();
    try {
      const response = await fetch("/api/admin/user-history/report", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ learnerEmail: selected.email }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(
          response.status === 401
            ? "Your session expired. Sign in again to continue."
            : body?.error || body?.message || "The report could not be generated",
        );
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().startsWith("application/pdf")) {
        throw new Error("The report service returned an unexpected file type");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The generated report is empty");
      setReport({ url: URL.createObjectURL(blob), learnerEmail: selected.email });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "The report could not be generated");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="user-history-report" aria-labelledby="user-history-report-title">
      <header>
        <div>
          <p className="member-kicker">Vivid Labs internal reporting</p>
          <h2 id="user-history-report-title">User History Report</h2>
          <p>Search a stored learner account, confirm the exact user, and generate a private PDF from the history Interview Runway actually records.</p>
        </div>
        <div className="user-history-report__privacy"><i /><span>Authorized company users only</span><small>Generated on the server · never emailed externally</small></div>
      </header>

      <div className="user-history-report__workflow" aria-busy={searching || generating}>
        <form onSubmit={search} className="user-history-report__search">
          <label htmlFor="user-history-search">Learner account email</label>
          <div>
            <input
              id="user-history-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search by email"
              autoComplete="off"
              aria-describedby="user-history-search-help"
              minLength={2}
              maxLength={254}
              required
            />
            <button className="member-secondary-button" type="submit" disabled={searching || generating || query.trim().length < 2}>
              {searching ? "Searching…" : "Search"}
            </button>
          </div>
          <small id="user-history-search-help">Names are not stored in the learner directory, so results use the exact account email.</small>
        </form>

        <div className="user-history-report__results" aria-live="polite" aria-busy={searching}>
          <span>Search results</span>
          {searched && !results.length ? <p>No stored learner records matched that email.</p> : null}
          {results.length ? (
            <ul aria-label="Stored learner accounts">
              {results.map((learner) => (
                <li key={learner.email}>
                  <button
                    type="button"
                    aria-pressed={selected?.email === learner.email}
                    className={selected?.email === learner.email ? "is-selected" : ""}
                    disabled={searching || generating}
                    onClick={() => chooseLearner(learner)}
                  >
                    <span>{learner.email}</span>
                    <small>Name not recorded</small>
                    <b>{selected?.email === learner.email ? "Selected" : "Select"}</b>
                  </button>
                </li>
              ))}
            </ul>
          ) : !searched ? <p>Enter at least two characters from the learner’s account email.</p> : null}
        </div>

        <aside className="user-history-report__confirm">
          <span>Confirmed learner</span>
          {selected ? (
            <>
              <strong>{selected.email}</strong>
              <small>Name not recorded · stored account history only</small>
              <button className="member-primary-button" type="button" onClick={() => void generate()} disabled={generating || searching}>
                {generating ? "Generating PDF…" : "Generate Report"} <span aria-hidden="true">↗</span>
              </button>
            </>
          ) : (
            <p>Select one search result before generating a report.</p>
          )}
        </aside>
      </div>

      {error ? <p id="user-history-report-error" className="user-history-report__error" role="alert">{error}</p> : null}
      {report ? (
        <div className="user-history-report__success" role="status">
          <div><i /><span>Report ready</span><p>The PDF for {report.learnerEmail} was generated from stored Interview Runway data.</p></div>
          <div>
            <a className="member-action-button" href={report.url} download="interviewrunway-user-history-report.pdf">Download PDF <span aria-hidden="true">↓</span></a>
            <a className="member-secondary-button" href={report.url} target="_blank" rel="noreferrer">Open PDF</a>
          </div>
        </div>
      ) : null}
    </section>
  );
}
