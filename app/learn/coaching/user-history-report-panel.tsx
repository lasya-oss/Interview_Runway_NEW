"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const GMAIL_SEND_SCOPE = "https://www.googleapis.com/auth/gmail.send";
const GOOGLE_EMAIL_SCOPE = "https://www.googleapis.com/auth/userinfo.email";
const GMAIL_REQUIRED_SCOPES = ["openid", GOOGLE_EMAIL_SCOPE, GMAIL_SEND_SCOPE] as const;
const GMAIL_AUTH_SCOPES = GMAIL_REQUIRED_SCOPES.join(" ");

type LearnerResult = {
  email: string;
};

type ReadyReport = {
  url: string;
  deliveredTo: string;
  learnerEmail: string;
};

type GoogleTokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
  scope?: string;
};

type GoogleTokenClient = {
  requestAccessToken(options?: {
    include_granted_scopes?: boolean;
    prompt?: string;
    scope?: string;
  }): void;
};

type GoogleOauth2 = {
  hasGrantedAllScopes(response: GoogleTokenResponse, ...scopes: string[]): boolean;
  initTokenClient(options: {
    callback(response: GoogleTokenResponse): void;
    client_id: string;
    error_callback?(error: { message?: string; type?: string }): void;
    hd?: string;
    include_granted_scopes?: boolean;
    login_hint?: string;
    scope: string;
  }): GoogleTokenClient;
};

type GmailGoogleWindow = Window & {
  google?: { accounts?: { oauth2?: GoogleOauth2 } };
};

export function UserHistoryReportPanel({
  deliveryEmail,
  googleClientId,
}: {
  deliveryEmail: string;
  googleClientId: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LearnerResult[]>([]);
  const [selected, setSelected] = useState<LearnerResult | null>(null);
  const [searching, setSearching] = useState(false);
  const [generationStage, setGenerationStage] = useState<"idle" | "authorizing" | "sending">("idle");
  const [gmailState, setGmailState] = useState<"loading" | "ready" | "error">("loading");
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ReadyReport | null>(null);
  const tokenClientRef = useRef<GoogleTokenClient | null>(null);
  const pendingLearnerRef = useRef<LearnerResult | null>(null);
  const reauthorizationAttemptedRef = useRef(false);
  const generating = generationStage !== "idle";

  useEffect(() => () => {
    if (report) URL.revokeObjectURL(report.url);
  }, [report]);

  const clearReadyReport = () => {
    setReport(null);
  };

  const requestGmailAuthorization = useCallback((options?: Parameters<GoogleTokenClient["requestAccessToken"]>[0]) => {
    const tokenClient = tokenClientRef.current;
    if (!tokenClient) return false;
    tokenClient.requestAccessToken(options);
    return true;
  }, []);

  const sendReport = useCallback(async (accessToken: string, learner: LearnerResult) => {
    setGenerationStage("sending");
    setError(null);
    let waitingForReauthorization = false;
    try {
      const response = await fetch("/api/admin/user-history/report", {
        method: "POST",
        headers: {
          authorization: `Bearer ${accessToken}`,
          "content-type": "application/json",
        },
        credentials: "same-origin",
        cache: "no-store",
        body: JSON.stringify({ learnerEmail: learner.email }),
      });
      if (response.status === 401 && !reauthorizationAttemptedRef.current) {
        reauthorizationAttemptedRef.current = true;
        pendingLearnerRef.current = learner;
        setGenerationStage("authorizing");
        setError("Your Gmail authorization expired. Reconnect Gmail to continue.");
        waitingForReauthorization = requestGmailAuthorization({
          include_granted_scopes: true,
          prompt: "select_account consent",
          scope: GMAIL_AUTH_SCOPES,
        });
        if (!waitingForReauthorization) {
          throw new Error("Gmail authorization is unavailable. Refresh this page and try again.");
        }
        return;
      }
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string; message?: string; reference?: string } | null;
        const reference = body?.reference ? ` Reference: ${body.reference}.` : "";
        throw new Error(
          response.status === 401
            ? "Gmail reauthorization was not accepted. Choose the same signed-in Vivid Labs account and allow email sending."
            : `${body?.error || body?.message || "The report could not be sent"}${reference}`,
        );
      }
      if (response.headers.get("x-interviewrunway-report-delivered") !== "gmail") {
        throw new Error("Gmail did not confirm report delivery");
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().startsWith("application/pdf")) {
        throw new Error("The report service returned an unexpected file type");
      }
      const blob = await response.blob();
      if (!blob.size) throw new Error("The generated report is empty");
      setReport({
        url: URL.createObjectURL(blob),
        deliveredTo: deliveryEmail,
        learnerEmail: learner.email,
      });
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "The report could not be sent");
    } finally {
      if (!waitingForReauthorization) {
        pendingLearnerRef.current = null;
        setGenerationStage("idle");
      }
    }
  }, [deliveryEmail, requestGmailAuthorization]);

  useEffect(() => {
    let active = true;

    void loadGoogleIdentityServices()
      .then(() => {
        if (!active) return;
        const oauth2 = getGoogleOauth2();
        if (!oauth2 || !googleClientId) throw new Error("Gmail authorization is unavailable");
        const workspaceDomain = deliveryEmail.split("@").at(-1);
        tokenClientRef.current = oauth2.initTokenClient({
          client_id: googleClientId,
          scope: GMAIL_AUTH_SCOPES,
          include_granted_scopes: true,
          login_hint: deliveryEmail,
          hd: workspaceDomain,
          callback: (response) => {
            if (!active) return;
            const learner = pendingLearnerRef.current;
            if (
              !response.access_token
              || !learner
              || !oauth2.hasGrantedAllScopes(response, ...GMAIL_REQUIRED_SCOPES)
            ) {
              pendingLearnerRef.current = null;
              setGenerationStage("idle");
              setError(
                response.error_description
                  || "Gmail permission was not granted. Choose the same signed-in Vivid Labs account and allow email sending.",
              );
              return;
            }
            void sendReport(response.access_token, learner);
          },
          error_callback: (googleError) => {
            if (!active) return;
            pendingLearnerRef.current = null;
            setGenerationStage("idle");
            const detail = [googleError.type, googleError.message].filter(Boolean).join(": ");
            setError(googleError.type === "popup_closed"
              ? "Gmail authorization was cancelled. No report was sent."
              : `Gmail authorization could not be completed${detail ? ` (${detail})` : ""}. No report was sent.`);
          },
        });
        setGmailState("ready");
      })
      .catch(() => {
        if (!active) return;
        tokenClientRef.current = null;
        setGmailState("error");
      });

    return () => {
      active = false;
      tokenClientRef.current = null;
    };
  }, [deliveryEmail, googleClientId, sendReport]);

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

  const generate = () => {
    if (!selected || generating || searching || pendingLearnerRef.current || gmailState !== "ready" || !tokenClientRef.current) return;
    setError(null);
    clearReadyReport();
    reauthorizationAttemptedRef.current = false;
    pendingLearnerRef.current = selected;
    setGenerationStage("authorizing");
    if (!requestGmailAuthorization()) {
      pendingLearnerRef.current = null;
      setGenerationStage("idle");
      setError("Gmail authorization is unavailable. Refresh this page and try again.");
    }
  };

  return (
    <section id="user-history-report" className="user-history-report" aria-labelledby="user-history-report-title">
      <header>
        <div>
          <p className="member-kicker">Vivid Labs internal reporting</p>
          <h2 id="user-history-report-title">User History Report</h2>
          <p>Choose the learner whose history should be reported. Interview Runway generates the PDF on the server and sends it only to your signed-in Vivid Labs Gmail account.</p>
        </div>
        <div className="user-history-report__privacy"><i /><span>Authorized company users only</span><small>Private Gmail delivery · {deliveryEmail}</small></div>
      </header>

      <div className="user-history-report__workflow" aria-busy={searching || generating}>
        <form onSubmit={search} className="user-history-report__search">
          <label htmlFor="user-history-search">Learner account to report</label>
          <div>
            <input
              id="user-history-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Search learner email"
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
          <small id="user-history-search-help">This selects whose history appears in the report. It does not change the Gmail recipient.</small>
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
              <small>Report subject · stored account history only</small>
              <div className="user-history-report__delivery">
                <span>Send PDF to</span>
                <strong>{deliveryEmail}</strong>
                <small>Signed-in Vivid Labs Gmail account</small>
              </div>
              <button className="member-primary-button" type="button" onClick={generate} disabled={generating || searching || gmailState !== "ready"}>
                {generationStage === "authorizing"
                  ? "Authorizing Gmail…"
                  : generationStage === "sending"
                    ? "Generating & sending…"
                    : gmailState === "loading"
                      ? "Connecting Gmail…"
                      : gmailState === "error"
                        ? "Gmail unavailable"
                        : "Generate & Email Report"} <span aria-hidden="true">↗</span>
              </button>
              <small className="user-history-report__gmail-note">
                {gmailState === "error"
                  ? "Gmail authorization could not be loaded. Refresh this page before trying again."
                  : "Google may ask once for permission to send this email from your company account."}
              </small>
            </>
          ) : (
            <p>Select one search result before generating a report.</p>
          )}
        </aside>
      </div>

      {error ? <p id="user-history-report-error" className="user-history-report__error" role="alert">{error}</p> : null}
      {report ? (
        <div className="user-history-report__success" role="status">
          <div><i /><span>Report sent</span><p>The PDF for {report.learnerEmail} was sent to {report.deliveredTo}. A private download copy is also ready.</p></div>
          <div>
            <a className="member-action-button" href={report.url} download="interviewrunway-user-history-report.pdf">Download PDF <span aria-hidden="true">↓</span></a>
            <a className="member-secondary-button" href={report.url} target="_blank" rel="noreferrer">Open PDF</a>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function getGoogleOauth2() {
  return (window as GmailGoogleWindow).google?.accounts?.oauth2;
}

function loadGoogleIdentityServices(): Promise<void> {
  if (getGoogleOauth2()) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-interviewrunway-google="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Google authorization could not be loaded")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.interviewrunwayGoogle = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google authorization could not be loaded"));
    document.head.appendChild(script);
  });
}
