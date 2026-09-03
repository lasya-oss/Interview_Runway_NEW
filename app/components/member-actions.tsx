"use client";

import { useState } from "react";
import type { DemoTier } from "@/app/lib/demo-data";

const PLAN_OPTIONS = [
  { id: "foundation", label: "Vault", detail: "Foundation · 12 weeks" },
  { id: "practice", label: "Second Seat", detail: "AI practice · 4 weeks" },
  { id: "premium", label: "Human Calibration", detail: "Coach room · full access" },
] as const satisfies ReadonlyArray<{ id: DemoTier; label: string; detail: string }>;

export function LivePlanSwitcher({
  currentPlan,
  availablePlans = [],
}: {
  currentPlan: DemoTier;
  availablePlans?: readonly DemoTier[];
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = PLAN_OPTIONS.filter((option) => availablePlans.includes(option.id));

  if (options.length < 2) return null;

  const switchPlan = async (plan: DemoTier) => {
    if (plan === currentPlan || pending) return;
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/learner/plan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      if (!response.ok) throw new Error("Plan switch failed");
      window.location.assign("/learn");
    } catch {
      setPending(false);
      setError("Could not switch plan. Try again.");
    }
  };

  return (
    <label className="member-plan-switcher">
      <span>QA view · {options.length} plans available</span>
      <select
        aria-label="Switch paid plan experience"
        value={currentPlan}
        disabled={pending}
        onChange={(event) => void switchPlan(event.currentTarget.value as DemoTier)}
      >
        {options.map((option) => (
          <option value={option.id} key={option.id}>{option.label} · {option.detail}</option>
        ))}
      </select>
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}

export function DemoLogoutButton() {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    await fetch("/api/demo-session", { method: "DELETE" }).catch(() => null);
    window.location.assign("/demo-login");
  };

  return (
    <button className="member-switch-button" type="button" onClick={logout} disabled={loading}>
      {loading ? "Switching…" : "Switch learner"}
    </button>
  );
}

export function LiveLogoutButton() {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    setLoading(true);
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => null);
    window.location.assign("/sign-in");
  };

  return (
    <button className="member-switch-button" type="button" onClick={logout} disabled={loading}>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  );
}
