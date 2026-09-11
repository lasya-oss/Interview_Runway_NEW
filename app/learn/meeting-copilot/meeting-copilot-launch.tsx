"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";

type LaunchState = "idle" | "checking" | "unavailable" | "blocked";

const PROBE_TIMEOUT_MS = 1800;
const PROBE_CACHE_MS = 5000;

export function MeetingCopilotLaunch({
  href,
  probeUrl,
}: {
  href: string;
  probeUrl: string;
}) {
  const [state, setState] = useState<LaunchState>("idle");
  const availabilityRef = useRef<{ available: boolean; checkedAt: number } | null>(null);
  const probeRef = useRef<Promise<boolean> | null>(null);

  useEffect(() => {
    void probeCompanion(probeUrl, availabilityRef, probeRef);
  }, [probeUrl]);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    if (state === "checking") return;

    const cachedAvailability = availabilityRef.current;
    const hasFreshAvailability = cachedAvailability && Date.now() - cachedAvailability.checkedAt < PROBE_CACHE_MS;
    if (hasFreshAvailability) {
      if (!cachedAvailability.available) {
        setState("unavailable");
        return;
      }

      const companionTab = window.open(href, "_blank", "noopener,noreferrer");
      setState(companionTab ? "idle" : "blocked");
      return;
    }

    setState("checking");

    void probeCompanion(probeUrl, availabilityRef, probeRef).then((available) => {
      if (!available) {
        setState("unavailable");
        return;
      }

      const companionTab = window.open(href, "_blank", "noopener,noreferrer");
      setState(companionTab ? "idle" : "blocked");
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

function probeCompanion(
  url: string,
  availabilityRef: { current: { available: boolean; checkedAt: number } | null },
  probeRef: { current: Promise<boolean> | null },
) {
  if (probeRef.current) return probeRef.current;

  const probe = probeLocalCompanion(url).then((available) => {
    availabilityRef.current = { available, checkedAt: Date.now() };
    return available;
  }).finally(() => {
    probeRef.current = null;
  });
  probeRef.current = probe;
  return probe;
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
