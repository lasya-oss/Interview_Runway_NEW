# Funnel Level 2 (AI Prep) Build Requirements

## Context

RemoteRunway (interviewrunway.com) sells interview prep for Indian software engineers targeting US/remote tech roles. Funnel level 2 is the "AI Prep" tier, priced ₹1999-2999, sold as an upsell to existing Funnel 1 (Vault, ₹799) buyers, not sold cold via ads. It replaces static content with interactive, personalized tools, all still at near-zero marginal cost since nothing here requires the founder's live time.

This tier has a second job beyond revenue: its scoring data is the qualifier that decides who gets nudged toward Funnel 3 (1:1 premium coaching, capacity-capped, high price). Build the scoring/threshold logic with that upsell role in mind, not just as a feature.

Target buyer: someone who already bought the Vault, is actively studying, and wants interactive practice instead of just reading/watching static content.

---

## Shared Technical Stack

- Frontend: Next.js, hosted on Vercel.
- Backend/API: Node or Python service, hosted on Railway or Render.
- Database + Auth + File storage: Supabase (Postgres, bundles auth and storage, low setup overhead for a solo build).
- LLM: Claude or GPT via API for all conversational/generation calls.
- Voice (if/when voice mode is added): ElevenLabs for TTS, Whisper (or equivalent) for STT.
- Code execution sandbox (for live coding mocks): Judge0 API or Piston API.
- Payments: Razorpay (India-native, handles UPI and cards).

Build text-only mock interviews first. Voice is a v2 addition, it roughly doubles per-session cost and adds real latency/complexity, don't block launch on it.

---

## Component 1: AI Mock Interviewer

**Purpose:** Runs a full interactive mock interview, not a scripted quiz. Must ask real follow-up questions based on what the candidate says, like an actual interviewer would.

**Interview types to support:**
- Coding/DSA round (with optional live code execution against test cases via the sandbox)
- System design round (discussion-based, no code execution needed)
- Behavioral round (STAR-based follow-ups)

**Functional requirements:**
- Track conversation state across turns (question asked, candidate's response/code, follow-ups issued).
- Session length target: 30-45 minutes.
- Full transcript (including any submitted code) must be persisted at session end and handed to the Feedback/Scoring Engine (Component 2).
- User selects interview type and, optionally, target company (pulls company context from the Funnel 1 company question banks if available) before starting.

**Build approach:** LLM chat agent with a distinct structured system prompt per interview type. For coding rounds, integrate the code sandbox so submitted solutions actually run against test cases rather than being evaluated by the LLM's guess alone.

**Hosting:** Backend service on Railway/Render, LLM via API, code sandbox via Judge0/Piston.

**Est. cost per use:** ~$0.15-0.50/session (text only); add ~$0.10-0.30 if voice mode is enabled.

---

## Component 2: AI Feedback / Scoring Engine

**Purpose:** Converts a finished mock transcript into a structured, specific readiness assessment, not generic praise.

**Input:** The full transcript from Component 1.

**Output (structured JSON):** per-category scores (e.g. problem-solving, communication, code quality, system design tradeoffs), named strengths, named weaknesses, recommended next topics to study.

**Functional requirements:**
- Runs automatically at the end of every mock session, no manual trigger needed.
- Scores are stored per user, per session, to support trend tracking in Component 6.
- Define an explicit upsell threshold: e.g., if a user has 2+ sessions with an average score below a set bar, or plateaus across 3+ sessions without improvement, surface a "you're close, consider a 1:1 session" prompt pointing to Funnel 3. This threshold is a product decision to tune after real data, but the hook must exist from day one.

**Build approach:** A follow-on LLM call on the stored transcript, forced into structured JSON output via function calling / schema-constrained generation.

**Hosting:** Same backend, no new infra.

**Est. cost per use:** ~$0.02-0.10/session.

---

## Component 3: Personalized Study Plan

**Purpose:** Turns the static Funnel 1 roadmap (4-week/12-week generic version) into something that adapts to the individual.

**Inputs:** Funnel 1 roadmap template, user's stated target companies and timeline, latest scoring data from Component 2.

**Output:** A personalized week-by-week plan, stored per user, regenerated whenever new mock scores come in (or at minimum weekly).

**Build approach:** LLM call merging the static template with the user's profile and recent scores into a customized version. Store the result in the database, don't regenerate on every page view.

**Hosting:** Same backend, plan stored in Postgres/Supabase.

**Est. cost per use:** ~$0.01-0.05/generation.

---

## Component 4: AI Resume/LinkedIn Optimizer

**Purpose:** Scores and rewrites the user's resume/LinkedIn profile for US ATS systems and remote-recruiter visibility.

**Input:** Uploaded resume (PDF or pasted text) or pasted LinkedIn profile text.

**Output:** An ATS-style score, a rewritten resume, and a LinkedIn checklist. Optionally tailor the rewrite to a specific target company if the user selects one.

**Build approach:** Feed the resume text directly to the LLM for scoring and rewrite, no separate resume-parsing library needed, LLMs handle unstructured resume text natively.

**Hosting:** Same backend, uploaded files stored via Supabase storage or Cloudflare R2.

**Est. cost per use:** ~$0.01-0.05/pass.

---

## Component 5: AI Negotiation Simulator

**Purpose:** Lets the user practice a salary negotiation conversation before the real thing.

**Personas to support:** at minimum an aggressive lowballer, a friendly-but-firm recruiter, and a neutral baseline.

**Functional requirements:** Multi-turn roleplay conversation (10-20 min), ending in closing feedback on what the user did well and what to adjust.

**Build approach:** Same chat-agent pattern as Component 1, different system prompt/persona per negotiation style.

**Hosting:** Same backend.

**Est. cost per use:** ~$0.10-0.25/session.

---

## Component 6: Progress Dashboard

**Purpose:** Shows the user (and implicitly, you) their readiness trend over time.

**Data displayed:** mock scores over time, per-category breakdown, resume score history, session count.

**Functional requirements:** No LLM calls involved, this is a pure read/render of already-stored data. This is also where the Funnel 3 upsell prompt (from Component 2's threshold logic) should visibly surface.

**Build approach:** Standard web dashboard, charts rendered from Postgres/Supabase data.

**Hosting:** Frontend on Vercel, data from the same Supabase instance as everything else.

**Est. cost per use:** ~$0.

---

## Funnel Logic Summary

- Components 1, 2, and 3 form the core loop: mock → score → adjusted plan → mock again.
- Component 2's threshold logic is the single most important piece to get right, it's what decides who sees the Funnel 3 upsell and when. Under-trigger it and you leave premium revenue on the table; over-trigger it and it reads as a nag / feels like a paywall trick.
- Components 4 and 5 are standalone value-adds that don't depend on the mock loop, they can ship independently.

---

## Pricing Context

Priced ₹1999-2999, sold only to existing Vault buyers, never sold cold. Blended API cost per buyer across a typical session set (one mock + feedback + one study plan + one resume pass) is roughly $0.40-0.90, about 2-4% of revenue at this price. Confirms this tier stays near-zero marginal cost even with voice mode added later.

---

## Delivery Checklist for the Building Agent

- [ ] Text-only AI Mock Interviewer working for all three interview types, transcripts persisted.
- [ ] Feedback/Scoring Engine running automatically post-session, structured output stored, upsell threshold logic implemented (even if the threshold value itself needs later tuning).
- [ ] Personalized Study Plan generator pulling from Funnel 1 roadmap + live scores.
- [ ] Resume/LinkedIn Optimizer accepting uploads and returning a scored rewrite.
- [ ] Negotiation Simulator with at least 3 personas.
- [ ] Progress Dashboard rendering score trends and surfacing the Funnel 3 upsell prompt when the threshold fires.
- [ ] Razorpay payment gate in front of the whole tier, tied to Vault purchase verification (only Vault buyers can access).
- [ ] Voice mode explicitly deferred to v2, not blocking initial launch.
