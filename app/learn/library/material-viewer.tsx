"use client";

import { useEffect, useRef, useState } from "react";

const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

type TokenResponse = {
  access_token?: string;
};

type TokenClient = {
  requestAccessToken(options?: { prompt?: string }): void;
};

type GoogleAccountsOauth2 = {
  initTokenClient(options: {
    client_id: string;
    callback(response: TokenResponse): void;
    error_callback?(error: { type?: string; message?: string }): void;
    scope: string;
  }): TokenClient;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: GoogleAccountsOauth2;
      };
    };
  }
}

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts.oauth2) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-interviewrunway-google="true"]',
    );
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error("Secure material access could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.interviewrunwayGoogle = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Secure material access could not be loaded."));
    document.head.appendChild(script);
  });
}

function isTextMaterial(filename: string, mimeType: string) {
  return (
    /^text\//i.test(mimeType) ||
    /application\/(json|javascript)/i.test(mimeType) ||
    /\.(csv|json|md|srt|txt)$/i.test(filename)
  );
}

function materialDisplayKind(filename: string, mimeType: string) {
  if (isTextMaterial(filename, mimeType)) return "text" as const;
  if (/^video\//i.test(mimeType) || /\.mp4$/i.test(filename)) return "video" as const;
  if (/^audio\//i.test(mimeType) || /\.(m4a|mp3|wav|ogg)$/i.test(filename)) return "audio" as const;
  return "document" as const;
}

export function MaterialViewer({
  clientId,
  fileId,
  filename,
  mimeType,
  title,
}: {
  clientId: string;
  fileId: string;
  filename: string;
  mimeType: string;
  title: string;
}) {
  const displayKind = materialDisplayKind(filename, mimeType);
  const [source, setSource] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "permission" | "error">("loading");
  const [message, setMessage] = useState("Preparing this material inside InterviewRunway…");
  const tokenClientRef = useRef<TokenClient | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();

    const setPermissionState = () => {
      if (!active) return;
      setState("permission");
      setMessage("Allow one-time read access so this material can open inside InterviewRunway.");
    };

    const loadMaterial = async (accessToken: string) => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
            signal: controller.signal,
          },
        );
        if (!response.ok) {
          throw new Error(response.status === 403 ? "This account cannot read the selected material." : "The selected material could not be loaded.");
        }

        const blob = await response.blob();
        if (!active) return;

        if (displayKind === "text") {
          setTextContent(await blob.text());
        } else {
          const objectUrl = URL.createObjectURL(blob);
          objectUrlRef.current = objectUrl;
          setSource(objectUrl);
        }
        setState("ready");
        setMessage("");
      } catch (error) {
        if (!active || controller.signal.aborted) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "The selected material could not be loaded.");
      }
    };

    const authorize = (prompt: string) => {
      const oauth2 = window.google?.accounts.oauth2;
      if (!oauth2 || !clientId) {
        setState("error");
        setMessage("In-site material access is not configured for this workspace.");
        return;
      }

      tokenClientRef.current = oauth2.initTokenClient({
        client_id: clientId,
        callback: (response) => {
          if (!active) return;
          if (response.access_token) {
            setState("loading");
            setMessage("Loading the original material inside InterviewRunway…");
            void loadMaterial(response.access_token);
          } else {
            setPermissionState();
          }
        },
        error_callback: setPermissionState,
        scope: DRIVE_READONLY_SCOPE,
      });
      tokenClientRef.current.requestAccessToken({ prompt });
    };

    void loadGoogleIdentityServices()
      .then(() => authorize("none"))
      .catch(() => {
        if (!active) return;
        setState("error");
        setMessage("In-site material access could not be initialized.");
      });

    return () => {
      active = false;
      controller.abort();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [clientId, displayKind, fileId]);

  if (textContent !== null) {
    return (
      <pre className="library-material-text" aria-label={`${title} content`}>
        {textContent}
      </pre>
    );
  }

  if (source && displayKind === "video") {
    return <video className="library-material-media" aria-label={`${title} video`} controls playsInline preload="metadata" src={source} />;
  }

  if (source && displayKind === "audio") {
    return (
      <div className="library-material-audio">
        <span aria-hidden="true">AUDIO</span>
        <strong>{title}</strong>
        <audio aria-label={`${title} audio`} controls src={source} />
      </div>
    );
  }

  if (source && displayKind === "document") {
    return (
      <div className="library-material-document">
        <span aria-hidden="true">DOC</span>
        <strong>{title}</strong>
        <p>This Word template is open in InterviewRunway and ready to save for editing.</p>
        <a href={source} download={filename}>Save template <span aria-hidden="true">↓</span></a>
      </div>
    );
  }

  return (
    <div className="library-material-state" data-google-drive-file-id={fileId} aria-live="polite" aria-busy={state === "loading"}>
      <span aria-hidden="true">{state === "loading" ? "···" : state === "permission" ? "01" : "!"}</span>
      <p>{message}</p>
      {state === "permission" ? (
        <button type="button" onClick={() => tokenClientRef.current?.requestAccessToken({ prompt: "consent" })}>
          Allow material access <span aria-hidden="true">↗</span>
        </button>
      ) : null}
    </div>
  );
}
