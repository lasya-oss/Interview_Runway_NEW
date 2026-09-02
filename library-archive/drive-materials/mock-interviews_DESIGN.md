# InterviewRunway mock-interview design

## Product promise

Thirty dramatized practice interviews for India-based software engineers
targeting US remote roles. Each recording should feel like observing a credible
interview, not listening to a lesson disguised as one. The public product copy
must call these simulations or practice interviews; it must not imply that they
are recordings of real candidates or a named company's confidential process.

## Curriculum architecture

| Category | Count | Why it belongs |
|---|---:|---|
| Recruiter and remote-fit screens | 6 | Covers career narrative, title translation, location, engagement model, notice period, compensation, overlap hours, and motivation. |
| Live coding and problem solving | 6 | Turns the Vault's DSA patterns into spoken reasoning, clarification, testing, complexity analysis, and interviewer collaboration. |
| System design and architecture | 6 | Applies requirements, scale, data, tradeoffs, reliability, security, and failure analysis under realistic follow-up pressure. |
| Behavioral and leadership | 6 | Applies STAR without sounding rehearsed, with probes for individual contribution, conflict, failure, ambiguity, integrity, and remote collaboration. |
| Hiring-manager and project deep dives | 6 | Tests actual engineering scope, production judgment, product partnership, code quality, seniority, and cross-time-zone execution. |

The catalog in `catalog.json` defines the six interviews in each category.

## Duration contract

`mock-int-gen` must treat duration as an acceptance requirement, not a loose
description:

| Category | Required rough duration per interview |
|---|---:|
| Recruiter and remote-fit | 18-21 minutes |
| Live coding and problem solving | 32-38 minutes |
| System design and architecture | 35-40 minutes |
| Behavioral and leadership | 26-31 minutes |
| Hiring-manager and project deep dives | 31-36 minutes |

The complete collection should average approximately 31 minutes per interview
and total roughly 15.5 hours. Each catalog entry has a target within its
category range. Before accepting a script, estimate duration from speaker-level
word counts, speaking rates, turn gaps, thinking pauses, and overlaps. After
Hume assembly, measure the actual shared timeline. The final video must remain
inside its category range and within 10% of its catalog target. Rewrite or
retime material that misses the range; never add filler or long artificial
silence merely to reach a number.

## Reality contract

Every script must satisfy all of these rules:

1. Give both speakers stable identities, roles, time zones, and knowledge. Do
   not let either speaker know facts that were never introduced.
2. Open and close like the actual round. Include brief audio checks, agenda or
   time-boxing when natural, candidate questions, and a noncommittal next-step.
3. Keep the interviewer neutral. They should redirect, interrupt, challenge,
   take notes, and occasionally leave a weak answer unrescued.
4. Make the candidate competent but human. Include short pauses, one or two
   self-corrections, bounded uncertainty, and at least one answer that could be
   improved. Do not add filler to every turn.
5. Translate India-specific context once and concretely: scope, users, traffic,
   reporting line, notice period, or engagement model. Never make nationality
   the candidate's whole story.
6. Use `I` for individual decisions and `we` for team execution. Never invent
   confidential facts or perfect metrics.
7. Make probes evidence-seeking: exact contribution, rejected alternative,
   failure mode, measurement, disagreement, or what changed afterward.
8. For technical rounds, make the interviewer withhold assumptions until the
   candidate asks. A strong answer must emerge through dialogue, not a lecture.
9. Use only two to four overlaps in a 25-to-45-minute interview. Most overlaps
   are acknowledgments, clarification collisions, or a time-box redirect—not
   theatrical arguments.
10. Keep names, employers, and scenarios fictional or composite. Do not claim a
    question came from a specific company unless independently sourced and
    approved.

## Video language: Match View

- 1920x1080, static midnight InterviewRunway background built from the approved
  blurred photorealistic interview-room image.
- Exact website logo at top left; category, round, and elapsed time at top right.
- Interviewer seated on the left; candidate on the right; table between them
  and a thin vertical center line. The source image stays deliberately blurred
  so the people establish setting without becoming distracting avatars.
- No lip animation, camera motion, or synthetic talking-head treatment.
- Active dialogue appears only on its speaker's half. Keep the previous line at
  reduced opacity briefly so the exchange reads left-right like a tennis rally.
- During a marked overlap, show both captions simultaneously and highlight the
  first speaker's final fragment plus the second speaker's entry.
- Captions use at most two lines per side. Long utterances are divided at natural
  breath points without changing their wording.
- Do not put production labels or review tags on the viewing surface.

## Learning layers

The interview video stays clean. The same timed transcript powers three uses:

1. **Watch:** uninterrupted interview with side-specific dialogue.
2. **Practice:** pause before selected candidate turns, let the learner answer,
   then resume and compare.
3. **Coach:** a companion timeline reveals interviewer intent, evidence heard,
   missed opportunity, and a stronger direction without pretending there is
   one memorized perfect answer.

Each script therefore carries private production tags for `competency`,
`interviewer_intent`, `candidate_signal`, `coach_note`, and `pause_point`.
Those tags never appear in the clean video unless Coach mode is selected.

## Audio rules

- Ten approved candidate voices are reused exactly three times each. Four
  interviewer voices are balanced across the collection at 8, 8, 7, and 7
  uses. The exact mapping is frozen in `voice_assignments.json`.
- Preserve distinct rooms through very light, consistent ambience only; never
  add music under the interview.
- Use natural silence: roughly 250-500 ms for ordinary turns, 700-1400 ms before
  difficult answers, and zero or negative gap only for marked overlaps.
- Loudness target: -16 LUFS integrated, true peak no higher than -1 dBFS.
- Generate speakers separately, then assemble on a shared timeline. Do not ask
  TTS to perform both roles in one request.
- Write candidate turns for speech rather than reading: direct answer first,
  sentences of at most 28 words, breath groups of at most 45 words, and long
  answers divided into several audible thought units.
- Calibrate native Hume `speed` separately for every candidate voice with the
  same neutral test passage. Target roughly 145-170 WPM for substantive turns.
- Submit long candidate answers as sentence-sized Hume utterances so
  punctuation produces real resets and breaths. Preserve the displayed
  transcript while retaining segment-level synthesis metadata.
- Never apply a whole-interview or whole-speaker tempo stretch. Regenerate a
  locally rushed or dragging turn with native Hume controls instead.

## Production gates

1. Approve two complete pilot scripts and the category matrix.
2. Create `mock-int-gen` from the approved patterns and validation rubric.
3. Forward-test the skill, incorporate feedback, then generate all 30 scripts.
4. Apply the approved roster, generate Hume audio, and retain word timestamps,
   per-turn masters, sparse overlaps, and exact-duration interview masters.
5. Generate dialogue audio, overlaps, static visuals, captions, and coach data.
6. Run structural, A/V sync, loudness, caption-boundary, and full human listening
   review before publication.

