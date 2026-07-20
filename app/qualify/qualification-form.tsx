"use client";

import { FormEvent, useRef, useState } from "react";

type SubmissionState = "idle" | "submitting" | "success" | "error";

export function QualificationForm({ defaultEmail = "" }: { defaultEmail?: string }) {
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");
  const statusRef = useRef<HTMLDivElement>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "submitting") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      accountEmail: formData.get("accountEmail"),
      phaseOneStatus: formData.get("phaseOneStatus"),
      phaseTwoStatus: formData.get("phaseTwoStatus"),
      whatsappSupportPerson: formData.get("whatsappSupportPerson"),
      targetRole: formData.get("targetRole"),
      visibleGap: formData.get("visibleGap"),
      additionalContext: formData.get("additionalContext"),
      consent: formData.get("consent") === "on",
      website: formData.get("website"),
    };

    setState("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/qualification", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json().catch(() => null)) as { error?: string } | null;

      if (!response.ok) throw new Error(result?.error || "The application could not be submitted.");

      setState("success");
      setMessage("Application received. We’ll review your Foundation and Second Seat evidence, then contact the email connected to your account if Phase 3 is the right next step.");
      form.reset();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "The application could not be submitted.");
    }

    window.requestAnimationFrame(() => statusRef.current?.focus());
  };

  if (state === "success") {
    return (
      <div className="qualification-success" ref={statusRef} role="status" tabIndex={-1}>
        <span>APPLICATION RECEIVED</span>
        <h2>Your evidence is queued for review.</h2>
        <p>{message}</p>
        <div aria-hidden="true"><i /><i /><i /><b>03</b></div>
      </div>
    );
  }

  return (
    <form className="qualification-form" onSubmit={submit}>
      <div className="qualification-form__progress" aria-hidden="true"><span>ACCOUNT</span><i /><span>CLEARANCE</span><i /><span>VISIBLE GAP</span></div>

      <fieldset>
        <legend><span>01</span><strong>Connect the application to your progress</strong></legend>
        <label>
          <span>InterviewRunway account email</span>
          <input name="accountEmail" type="email" defaultValue={defaultEmail} autoComplete="email" maxLength={254} required placeholder="you@example.com" />
          <small>Use the same email associated with your Foundation and Second Seat access.</small>
        </label>
      </fieldset>

      <fieldset>
        <legend><span>02</span><strong>Confirm the two prerequisites</strong></legend>
        <div className="qualification-choice-group">
          <p>Have you completed Phase 1 · Foundation?</p>
          <div>
            <label><input type="radio" name="phaseOneStatus" value="completed" required /><span>Yes, completed</span></label>
            <label><input type="radio" name="phaseOneStatus" value="not_completed" required /><span>Not yet</span></label>
          </div>
        </div>
        <div className="qualification-choice-group">
          <p>Where are you in Phase 2 · The Second Seat?</p>
          <div>
            <label><input type="radio" name="phaseTwoStatus" value="completed" required /><span>Completed</span></label>
            <label><input type="radio" name="phaseTwoStatus" value="in_progress" required /><span>In progress</span></label>
            <label><input type="radio" name="phaseTwoStatus" value="not_started" required /><span>Not started</span></label>
          </div>
        </div>
        <label>
          <span>Who supported you through WhatsApp?</span>
          <input name="whatsappSupportPerson" type="text" maxLength={120} required placeholder="Support person’s name, or “Not sure”" />
          <small>This helps us connect your application to the guidance already provided.</small>
        </label>
      </fieldset>

      <fieldset>
        <legend><span>03</span><strong>Show why human calibration is the next move</strong></legend>
        <label>
          <span>Target role</span>
          <input name="targetRole" type="text" minLength={3} maxLength={180} required placeholder="Example: Senior backend engineer · US remote" />
        </label>
        <label>
          <span>What recurring gap is still visible?</span>
          <textarea name="visibleGap" minLength={20} maxLength={1200} required rows={5} placeholder="Describe the pattern that kept appearing in practice, the evidence you saw, and what you have already tried." />
          <small>Specific evidence is more useful than a general request for coaching.</small>
        </label>
        <label>
          <span>Anything else the reviewer should know? <em>Optional</em></span>
          <textarea name="additionalContext" maxLength={1500} rows={3} placeholder="Upcoming interview timing, target company type, or relevant constraints." />
        </label>
      </fieldset>

      <label className="qualification-form__consent">
        <input name="consent" type="checkbox" required />
        <span>I confirm this information is accurate and agree that InterviewRunway may review my learning record and contact me about Phase 3. Submission does not guarantee admission.</span>
      </label>

      <label className="qualification-form__honeypot" aria-hidden="true">
        Website
        <input name="website" type="text" tabIndex={-1} autoComplete="off" />
      </label>

      <div className="qualification-form__submit">
        <button type="submit" disabled={state === "submitting"}>
          {state === "submitting" ? "Saving application…" : "Check if I qualify"}
          <span aria-hidden="true">↗</span>
        </button>
        <p>There is no automatic Phase 3 checkout. A reviewer confirms evidence, fit, scope, and availability first.</p>
      </div>

      {state === "error" ? <div className="qualification-form__error" ref={statusRef} role="alert" tabIndex={-1}>{message}</div> : null}
    </form>
  );
}
