"use client";

import { useEffect, useRef, useState } from "react";

type GoogleCredentialResponse = {
  credential?: string;
};

type GoogleAccountsId = {
  initialize(options: {
    auto_select: boolean;
    callback(response: GoogleCredentialResponse): void;
    client_id: string;
    itp_support: boolean;
    ux_mode: "popup";
  }): void;
  renderButton(
    element: HTMLElement,
    options: {
      logo_alignment: "left";
      shape: "pill";
      size: "large";
      text: "signin_with";
      theme: "outline";
      type: "standard";
      width: number;
    },
  ): void;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: GoogleAccountsId;
      };
    };
  }
}

export function GoogleSignIn({
  clientId,
  returnTo,
}: {
  clientId: string;
  returnTo: string;
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState("Loading secure Google sign-in…");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;

    const handleCredential = async ({
      credential,
    }: GoogleCredentialResponse) => {
      if (!credential || !active) {
        setMessage("Google did not return a credential. Please try again.");
        return;
      }

      setSubmitting(true);
      setMessage("Verifying your Google account…");

      try {
        const response = await fetch("/api/auth/google", {
          body: JSON.stringify({ credential }),
          headers: { "content-type": "application/json" },
          method: "POST",
        });
        const result = (await response.json()) as {
          message?: string;
          ok?: boolean;
        };
        if (!response.ok || !result.ok) {
          setSubmitting(false);
          setMessage(
            result.message ??
              "This Google account could not be verified.",
          );
          return;
        }

        window.location.assign(returnTo);
      } catch {
        setSubmitting(false);
        setMessage("Sign-in could not be completed. Please try again.");
      }
    };

    const initialize = () => {
      if (!active || !window.google?.accounts.id || !buttonRef.current) return;

      buttonRef.current.replaceChildren();
      // The account chooser stays open to verified Google identities. Product
      // entitlements and Vivid Labs-only administration are enforced
      // independently on the server after authentication.
      window.google.accounts.id.initialize({
        auto_select: false,
        callback: handleCredential,
        client_id: clientId,
        itp_support: true,
        ux_mode: "popup",
      });
      window.google.accounts.id.renderButton(buttonRef.current, {
        logo_alignment: "left",
        shape: "pill",
        size: "large",
        text: "signin_with",
        theme: "outline",
        type: "standard",
        width: 320,
      });
      setMessage("Use the Google account you want connected to InterviewRunway.");
    };

    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-interviewrunway-google="true"]',
    );
    if (existing) {
      if (window.google?.accounts.id) initialize();
      else existing.addEventListener("load", initialize, { once: true });
      return () => {
        active = false;
        existing.removeEventListener("load", initialize);
      };
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.dataset.interviewrunwayGoogle = "true";
    script.onload = initialize;
    script.onerror = () => {
      if (active) setMessage("Google sign-in could not be loaded.");
    };
    document.head.appendChild(script);

    return () => {
      active = false;
    };
  }, [clientId, returnTo]);

  return (
    <div className="google-sign-in">
      <div
        aria-label="Sign in with Google"
        className={submitting ? "is-submitting" : ""}
        ref={buttonRef}
      />
      <p aria-live="polite">{message}</p>
    </div>
  );
}
