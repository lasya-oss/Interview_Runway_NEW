"use client";

import { useEffect, useRef, useState } from "react";

const DRIVE_READONLY_SCOPE = "https://www.googleapis.com/auth/drive.readonly";

type TokenResponse = {
  access_token?: string;
  error?: string;
  error_description?: string;
};

type TokenClient = {
  requestAccessToken(options?: { prompt?: string }): void;
};

type GoogleAccountsOauth2 = {
  initTokenClient(options: {
    client_id: string;
    callback(response: TokenResponse): void;
    error_callback?(error: { type?: string; message?: string }): void;
    login_hint?: string;
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
      existing.addEventListener("error", () => reject(new Error("Google sign-in could not be loaded.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.interviewrunwayGoogle = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google sign-in could not be loaded."));
    document.head.appendChild(script);
  });
}

export function DriveReplayPlayer({
  clientId,
  fileId,
  loginHint,
  mediaType = "video",
  title,
}: {
  clientId: string;
  fileId: string;
  loginHint: string | null;
  mediaType?: "video" | "audio";
  title: string;
}) {
  const [source, setSource] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "permission" | "error">("loading");
  const [message, setMessage] = useState("Preparing the protected replay…");
  const tokenClientRef = useRef<TokenClient | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let active = true;

    const showPermissionPrompt = () => {
      if (!active) return;
      setState("permission");
      setMessage("Allow one-time read access to the supplied material so it can play inside InterviewRunway.");
    };

    const loadMedia = async (accessToken: string) => {
      try {
        const response = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          },
        );
        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "The signed-in account cannot read the supplied material."
              : response.status === 404
                ? "The supplied material was not found."
                : "The original material could not be loaded.",
          );
        }

        const blob = await response.blob();
        if (!active) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setSource(objectUrl);
        setState("ready");
        setMessage("");
      } catch (error) {
        if (!active) return;
        setState("error");
        setMessage(error instanceof Error ? error.message : "The replay could not be loaded.");
      }
    };

    const authorize = (prompt: string) => {
      const oauth2 = window.google?.accounts.oauth2;
      if (!oauth2 || !clientId) {
        setState("error");
        setMessage("The original material is not connected to this workspace yet.");
        return;
      }

      tokenClientRef.current = oauth2.initTokenClient({
        client_id: clientId,
        callback: (response) => {
          if (!active) return;
          if (response.access_token) {
            setState("loading");
            setMessage("Loading the original material…");
            void loadMedia(response.access_token);
          } else {
            showPermissionPrompt();
          }
        },
        error_callback: showPermissionPrompt,
        login_hint: loginHint ?? undefined,
        scope: DRIVE_READONLY_SCOPE,
      });
      tokenClientRef.current.requestAccessToken({ prompt });
    };

    void loadGoogleIdentityServices()
      .then(() => authorize("none"))
      .catch(() => {
        if (!active) return;
        setState("error");
        setMessage("Protected material playback could not be initialized.");
      });

    return () => {
      active = false;
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    };
  }, [clientId, fileId, loginHint]);

  const handleMediaError = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSource(null);
    setState("error");
    setMessage("The original material could not be played.");
  };

  if (source) {
    return mediaType === "audio"
      ? <audio className="library-material-audio-player" aria-label={`${title} audio`} controls onError={handleMediaError} src={source} />
      : <video className="library-material-media" aria-label={`${title} video`} controls onError={handleMediaError} playsInline src={source} />;
  }

  return (
    <div
      className="practice-replay-video-state"
      data-google-drive-file-id={fileId}
      aria-live="polite"
      aria-busy={state === "loading"}
    >
      <span aria-hidden="true">{state === "loading" ? "···" : state === "permission" ? "01" : "!"}</span>
      {state === "error" ? <strong>Content unavailable</strong> : null}
      <p>{message}</p>
      {state === "permission" ? (
        <button type="button" onClick={() => tokenClientRef.current?.requestAccessToken({ prompt: "consent" })}>
          Allow replay access <span aria-hidden="true">↗</span>
        </button>
      ) : null}
    </div>
  );
}
