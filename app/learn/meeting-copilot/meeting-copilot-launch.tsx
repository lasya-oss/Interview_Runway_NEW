"use client";

import { useState, type MouseEvent } from "react";

type LaunchState = "idle" | "checking" | "unavailable" | "blocked";

const PROBE_TIMEOUT_MS = 1800;

export function MeetingCopilotLaunch({
  href,
  probeUrl,
}: {
  href: string;
  probeUrl: string;
}) {
  const [state, setState] = useState<LaunchState>("idle");

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (state === "checking") return;

    // Open synchronously from the user gesture so browsers do not block the
    // companion tab after the asynchronous local availability check.
    const pendingTab = window.open("about:blank", "_blank");
    if (!pendingTab) {
      setState("blocked");
      return;
    }
    pendingTab.opener = null;
    setState("checking");

    void probeLocalCompanion(probeUrl).then((available) => {
      if (!available) {
        pendingTab.close();
        setState("unavailable");
        return;
      }

      pendingTab.location.replace(href);
      setState("idle");
    });
  };

  const statusMessage = state === "checking"
    ? "Checking that Meeting Copilot is running on this device…"
    : state === "unavailable"
      ? "Meeting Copilot is not running on this device. Start the local companion, then try again."
      : state === "blocked"
        ? "The Meeting Copilot tab could not be opened. Allow pop-ups for Interview Runway, then try again."
        : null;

  return (
    <>
      <a
        className="member-primary-button"
        data-meeting-copilot-launch
        href={href}
        target="_blank"
        rel="noreferrer"
        onClick={handleClick}
        aria-busy={state === "checking"}
      >
        {state === "checking" ? "Checking Meeting Copilot…" : "Open Meeting Copilot"} <span aria-hidden="true">↗</span>
      </a>
      {statusMessage ? (
        <p
          className={`meeting-copilot-launch-status${state === "unavailable" || state === "blocked" ? " is-error" : ""}`}
          role={state === "checking" ? "status" : "alert"}
          aria-live="polite"
        >
          {statusMessage}
        </p>
      ) : null}
    </>
  );
}

async function probeLocalCompanion(url: string) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    await fetch(url, {
      cache: "no-store",
      mode: "no-cors",
      signal: controller.signal,
    });
    return true;
  } catch {
    return false;
  } finally {
    window.clearTimeout(timeout);
  }
}
