"use client";

import { FormEvent, useEffect, useState } from "react";

type Learner = {
  email: string;
  name: null;
  firstRecordedAt: string | null;
  lastActivityAt: string | null;
  activityCount: number;
  sourceCount: number;
  access: string[];
};

export function UserHistoryReportPanel() {
  const [query, setQuery] = useState("");
  const [learners, setLearners] = useState<Learner[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchLearners("")
      .then((result) => {
        if (!cancelled) setLearners(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Learners could not be loaded");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const search = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setSelectedEmail(null);
    try {
      setLearners(await fetchLearners(query));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Learners could not be loaded");
    } finally {
      setLoading(false);
    }
  };

  const generate = async () => {
    if (!selectedEmail || generating) return;
    setGenerating(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/user-history", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ email: selectedEmail }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: unknown } | null;
        throw new Error(typeof body?.error === "string" ? body.error : "The report could not be generated");
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get("content-disposition");
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] ?? "interviewrunway-user-history-report.pdf";
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      setMessage(`Report generated for ${selectedEmail}.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The report could not be generated");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <section className="coaching-admin-panel" aria-labelledby="user-history-report-title">
      <div className="coaching-admin-intro">
        <div>
          <p className="member-kicker">Company admin · learner history</p>
          <h2 id="user-history-report-title">Generate a complete user record.</h2>
          <p>Search the account history, select a learner, and download a structured PDF across Foundation, Second Seat, Human Calibration, feedback, scoring, and the chronological activity timeline.</p>
        </div>
        <div className="coaching-admin-badge"><span>PRIVATE</span><strong>PDF</strong><small>account-backed export</small></div>
      </div>

      <form className="coaching-admin-search" onSubmit={search}>
        <label htmlFor="user-history-search">Search learner or user</label>
        <div>
          <input
            id="user-history-search"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder="name is not stored · search by email"
            autoComplete="off"
          />
          <button type="submit" disabled={loading}>{loading ? "Searching..." : "Search"}</button>
        </div>
      </form>

      <div className="coaching-admin-results" aria-live="polite">
        <div className="coaching-admin-results-heading"><span>{loading ? "Loading account history" : `${learners.length} learner${learners.length === 1 ? "" : "s"} found`}</span><small>Only configured learner-domain accounts appear.</small></div>
        {learners.length ? (
          <ul>
            {learners.map((learner) => (
              <li key={learner.email}>
                <button
                  className={selectedEmail === learner.email ? "is-selected" : ""}
                  type="button"
                  onClick={() => {
                    setSelectedEmail(learner.email);
                    setMessage(null);
                    setError(null);
                  }}
                  aria-pressed={selectedEmail === learner.email}
                >
                  <span className="coaching-admin-result-mark" aria-hidden="true">{selectedEmail === learner.email ? "✓" : "IR"}</span>
                  <span><strong>{learner.email}</strong><small>{learner.activityCount} recorded event{learner.activityCount === 1 ? "" : "s"} · {learner.sourceCount} data source{learner.sourceCount === 1 ? "" : "s"}</small></span>
                  <em>{learner.access.length ? learner.access.join(" · ") : "History only"}</em>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="coaching-admin-empty">No matching learner record. Clear the search to view all available accounts.</p>
        )}
      </div>

      <div className="coaching-admin-action-row">
        <p>{selectedEmail ? <><strong>Selected:</strong> {selectedEmail}</> : "Select a learner to enable the export."}</p>
        <button className="member-primary-button" type="button" onClick={() => void generate()} disabled={!selectedEmail || generating}>
          {generating ? "Generating PDF..." : "Generate User History Report"} <span aria-hidden="true">↗</span>
        </button>
      </div>
      {error ? <p className="coaching-admin-feedback is-error" role="alert">{error}</p> : null}
      {message ? <p className="coaching-admin-feedback" role="status">{message}</p> : null}
      <p className="coaching-admin-boundary">Export scope follows records that InterviewRunway actually stores. Unavailable areas are labeled not-recorded in the PDF.</p>
    </section>
  );
}

async function fetchLearners(query: string): Promise<Learner[]> {
  const response = await fetch(`/api/admin/user-history?query=${encodeURIComponent(query)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const body = await response.json().catch(() => null) as { learners?: unknown; error?: unknown } | null;
  if (!response.ok) {
    throw new Error(typeof body?.error === "string" ? body.error : "Learners could not be loaded");
  }
  return Array.isArray(body?.learners) ? body.learners as Learner[] : [];
}
