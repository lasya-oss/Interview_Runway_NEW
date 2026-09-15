"use client";

import Image from "next/image";
import { useState } from "react";
import { trackEvent } from "@/app/lib/analytics";
import {
  DEMO_PROFILES,
  DEMO_REVIEW_MATERIALS,
  type DemoProfile,
  type DemoTier,
} from "@/app/lib/demo-data";

const TIER_PROMISE: Record<DemoTier, { headline: string; summary: string; access: readonly string[] }> = {
  foundation: {
    headline: "Build the preparation base.",
    summary: "Inspect the structured library, 12-week roadmap, clean starting state, and progress model before timed practice begins.",
    access: ["Vault library + roadmap", "Real review-edition PDFs", "Foundation progress state"],
  },
  practice: {
    headline: "See the correction loop.",
    summary: "Open the same product with adaptive mocks, transcript evidence, scoring dimensions, and the next action already changed by performance.",
    access: ["Everything in Vault", "Adaptive practice + replays", "Feedback and readiness signals"],
  },
  premium: {
    headline: "Inspect human calibration.",
    summary: "Enter the complete workspace with coach-room access, evidence packets, session preparation, and a targeted calibration plan.",
    access: ["Everything in the Second Seat", "Coach room + private plan", "Calibration evidence"],
  },
};

export function DemoLoginClient({ returnTo }: { returnTo: string }) {
  const [opening, setOpening] = useState<DemoTier | null>(null);
  const [message, setMessage] = useState("");

  const startDemo = async (profile: DemoProfile) => {
    setOpening(profile.id);
    setMessage("");
    trackEvent("demo_tier_selected", { tier: profile.id });

    try {
      const response = await fetch("/api/demo-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preview: profile.id }),
      });
      const result = await response.json() as { ok: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setOpening(null);
        setMessage(result.message ?? "Unable to start the demo workspace.");
        return;
      }
      trackEvent("demo_action_completed", { tier: profile.id, action: "workspace_opened" });
      window.location.assign(returnTo);
    } catch {
      setOpening(null);
      setMessage("The demo workspace could not be started. Please try again.");
    }
  };

  return (
    <div className="demo-entry-stack" aria-label="Choose a product demo">
      {DEMO_PROFILES.map((profile, index) => {
        const promise = TIER_PROMISE[profile.id];
        const materials = DEMO_REVIEW_MATERIALS.filter((material) => material.profiles.includes(profile.id));
        const cover = materials[0];
        const isOpening = opening === profile.id;

        return (
          <article className={`demo-entry-card demo-entry-card-${profile.id}`} key={profile.id}>
            <div className="demo-entry-cover">
              {cover.preview ? (
                <Image
                  src={cover.preview}
                  alt={`${cover.title} review-edition cover`}
                  width={993}
                  height={1403}
                  sizes="(max-width: 900px) 32vw, 180px"
                />
              ) : (
                <div className="demo-entry-cover-fallback" aria-label={`${cover.title} Vault QA asset`}>
                  <strong>{cover.category}</strong>
                  <span>APPROVED<br />VAULT ASSET</span>
                </div>
              )}
              <span>REVIEW<br />EDITION</span>
            </div>

            <div className="demo-entry-copy">
              <div className="demo-entry-label">
                <span>0{index + 1} / {profile.planShort}</span>
                <small>{profile.progress === 0 ? "0% starting progress" : `${profile.progress}% populated progress`}</small>
              </div>
              <h2>{promise.headline}</h2>
              <p>{promise.summary}</p>
              <ul>
                {promise.access.map((item) => <li key={item}><i />{item}</li>)}
              </ul>

              <div className="demo-entry-learner">
                <span>{profile.initials}</span>
                <div><small>Demo learner</small><strong>{profile.name}</strong><p>{profile.role}</p></div>
              </div>

              <div className="demo-entry-materials">
                <span>Material visible in this demo</span>
                {materials.slice(0, 3).map((material) => (
                  <a href={material.href} target="_blank" rel="noreferrer" key={material.href}>
                    <b>{material.category}</b><span>{material.title}</span><small>{material.format} ↗</small>
                  </a>
                ))}
              </div>

              <button type="button" onClick={() => startDemo(profile)} disabled={opening !== null}>
                <span>
                  <small>INTERACTIVE WORKSPACE</small>
                  <strong>{isOpening ? "Loading populated workspace…" : `Enter ${profile.planShort} demo`}</strong>
                </span>
                <b aria-hidden="true">↗</b>
              </button>
            </div>
          </article>
        );
      })}

      {message ? <p className="demo-login-error" role="alert">{message}</p> : null}
      <p className="demo-login-note">Sample workspace data · Foundation cards use QA references; higher-tier demo materials remain marked pending final human editorial review.</p>
    </div>
  );
}
