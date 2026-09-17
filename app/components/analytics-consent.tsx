"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ANALYTICS_CONSENT_KEY } from "@/app/lib/analytics";

type ConsentChoice = "granted" | "denied" | null;

const CONSENT_CHANGED_EVENT = "interviewrunway:analytics-consent-changed";

function readConsent(): ConsentChoice {
  try {
    const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY);
    return value === "granted" || value === "denied" ? value : null;
  } catch {
    return null;
  }
}

function writeConsent(choice: Exclude<ConsentChoice, null>) {
  try {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, choice);
  } catch {
    // Consent still applies for this page even when browser storage is blocked.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT, { detail: choice }));
}

export function AnalyticsConsent() {
  const [choice, setChoice] = useState<ConsentChoice | undefined>(undefined);

  useEffect(() => {
    const updateChoice = () => setChoice(readConsent());
    updateChoice();
    window.addEventListener(CONSENT_CHANGED_EVENT, updateChoice);
    return () => window.removeEventListener(CONSENT_CHANGED_EVENT, updateChoice);
  }, []);

  if (choice !== null) return null;

  const choose = (nextChoice: Exclude<ConsentChoice, null>) => {
    writeConsent(nextChoice);
    setChoice(nextChoice);
  };

  return (
    <section className="analytics-consent" aria-labelledby="analytics-consent-title">
      <div>
        <strong id="analytics-consent-title">Your analytics choice</strong>
        <p>
          Essential storage supports sign-in, security, and purchases. Optional
          usage analytics stays off unless you allow it. See the{" "}
          <Link href="/legal/privacy">Privacy Policy</Link>.
        </p>
      </div>
      <div className="analytics-consent__actions">
        <button type="button" onClick={() => choose("denied")}>Essential only</button>
        <button type="button" onClick={() => choose("granted")}>Allow analytics</button>
      </div>
    </section>
  );
}

export function AnalyticsSettingsButton() {
  const reopen = () => {
    try {
      window.localStorage.removeItem(ANALYTICS_CONSENT_KEY);
    } catch {
      // The consent panel can still be reopened for the current page.
    }
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGED_EVENT));
  };

  return <button className="analytics-settings" type="button" onClick={reopen}>Analytics choices</button>;
}
