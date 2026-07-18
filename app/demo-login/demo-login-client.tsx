"use client";

import { useState, type FormEvent } from "react";
import { DEMO_PROFILES, type DemoProfile } from "@/app/lib/demo-data";

export function DemoLoginClient({ returnTo }: { returnTo: string }) {
  const [selected, setSelected] = useState<DemoProfile>(DEMO_PROFILES[0]);
  const [email, setEmail] = useState(DEMO_PROFILES[0].email);
  const [password, setPassword] = useState(DEMO_PROFILES[0].password);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  const chooseProfile = (profile: DemoProfile) => {
    setSelected(profile);
    setEmail(profile.email);
    setPassword(profile.password);
    setStatus("idle");
    setMessage("");
  };

  const submit = async (event?: FormEvent) => {
    event?.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/demo-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json() as { ok: boolean; message?: string };
      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message ?? "Unable to start the demo session.");
        return;
      }
      window.location.assign(returnTo);
    } catch {
      setStatus("error");
      setMessage("The demo session could not be started. Please try again.");
    }
  };

  return (
    <div className="demo-login-console">
      <div className="demo-profile-picker" aria-label="Sample learner profiles">
        {DEMO_PROFILES.map((profile) => (
          <button
            className={`demo-profile-card ${selected.id === profile.id ? "is-selected" : ""}`}
            key={profile.id}
            type="button"
            onClick={() => chooseProfile(profile)}
          >
            <span className="demo-profile-index">0{DEMO_PROFILES.indexOf(profile) + 1}</span>
            <span className="demo-profile-plan">{profile.planShort}</span>
            <strong>{profile.name}</strong>
            <small>{profile.role}</small>
            <span className="demo-profile-state">{profile.progress}% through current plan</span>
          </button>
        ))}
      </div>

      <form className="demo-login-form" onSubmit={submit}>
        <div className="demo-login-form-top">
          <div><span>Selected workspace</span><strong>{selected.plan}</strong></div>
          <span className="demo-environment-badge">Sample data</span>
        </div>
        <label>
          Demo email
          <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="username" />
        </label>
        <label>
          Demo password
          <input type="text" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" />
        </label>
        <button className="demo-login-submit" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Opening workspace…" : `Enter as ${selected.firstName}`} <span aria-hidden="true">↗</span>
        </button>
        {status === "error" ? <p className="demo-login-error" role="alert">{message}</p> : null}
        <p className="demo-login-note">This is a private product demo. The accounts contain fictional learner data and cannot make purchases or contact a coach.</p>
      </form>
    </div>
  );
}
