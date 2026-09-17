"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function VoiceSetupClient({
  remaining,
  monthlyLimit,
  candidateProfile,
}: {
  remaining: number;
  monthlyLimit: number;
  candidateProfile: { name: string; targetRole: string | null; updatedAt: string } | null;
}) {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState("behavioral");
  const [persona, setPersona] = useState("hiring_manager");
  const [jobDescription, setJobDescription] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function createSession() {
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/voice/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewType, persona, language: "en", jobDescription }),
      });
      const body = await response.json() as { session?: { id: string }; error?: string };
      if (!response.ok || !body.session) throw new Error(body.error || "Session could not be created");
      router.push(`/learn/voice/${body.session.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Session could not be created");
      setPending(false);
    }
  }

  return (
    <section className="voice-setup-card">
      <div className="member-panel-label"><span>Configure the room</span><b>{remaining} / {monthlyLimit} sessions left this month</b></div>

      <fieldset>
        <legend>Interview type</legend>
        <label className={interviewType === "behavioral" ? "is-selected" : ""}>
          <input type="radio" name="interview-type" value="behavioral" checked={interviewType === "behavioral"} onChange={() => setInterviewType("behavioral")} />
          <span><strong>Behavioral / STAR</strong><small>Ownership, conflict, influence, failure, and measurable impact.</small></span>
        </label>
        <label className={interviewType === "role_specific" ? "is-selected" : ""}>
          <input type="radio" name="interview-type" value="role_specific" checked={interviewType === "role_specific"} onChange={() => setInterviewType("role_specific")} />
          <span><strong>Role-specific Q&amp;A</strong><small>Technical decisions, depth, trade-offs, and communication.</small></span>
        </label>
      </fieldset>

      <fieldset>
        <legend>Interviewer persona</legend>
        <label className={persona === "hiring_manager" ? "is-selected" : ""}>
          <input type="radio" name="persona" value="hiring_manager" checked={persona === "hiring_manager"} onChange={() => setPersona("hiring_manager")} />
          <span><strong>Hiring manager</strong><small>Warm, outcome-led, and probing on scope.</small></span>
        </label>
        <label className={persona === "peer_engineer" ? "is-selected" : ""}>
          <input type="radio" name="persona" value="peer_engineer" checked={persona === "peer_engineer"} onChange={() => setPersona("peer_engineer")} />
          <span><strong>Peer engineer</strong><small>Pragmatic, technical, and alert to hand-waving.</small></span>
        </label>
      </fieldset>

      <label className="voice-setup-field">
        <span>Job description <small>optional</small></span>
        <textarea
          maxLength={20_000}
          rows={10}
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          placeholder="Paste the role description. It stays private to this interview and its report."
        />
        <small>{jobDescription.length.toLocaleString()} / 20,000</small>
      </label>

      <div className="voice-profile-status">
        <span>Candidate context</span>
        {candidateProfile ? (
          <div><strong>{candidateProfile.name}</strong><small>{candidateProfile.targetRole || "Synced Meeting Copilot profile"} · updated {new Date(candidateProfile.updatedAt).toLocaleDateString()}</small></div>
        ) : (
          <div><strong>No synced profile</strong><small>The interview still works with the job description. A future Meeting Copilot profile save will sync here.</small></div>
        )}
      </div>

      {error ? <p className="voice-error" role="alert">{error}</p> : null}
      <button className="member-primary-button" type="button" disabled={pending || remaining <= 0} onClick={createSession}>
        {pending ? "Preparing room…" : remaining > 0 ? "Continue to mic check ↗" : "Monthly quota used"}
      </button>
    </section>
  );
}
