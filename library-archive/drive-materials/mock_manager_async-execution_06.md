---
id: mock_manager_async-execution_06
status: audio_complete_video_pending
category: hiring_manager
round: hiring_manager_deep_dive
duration_target_minutes: 34
candidate: Ayesha Rahman (fictional), Kochi, 6 years, full-stack engineer
interviewer: Jordan Patel (fictional), Colorado, engineering manager
candidate_voice_id: 32ab6304-5b90-45d3-a523-15fdd53e70c8
interviewer_voice_id: 3b8223cb-30e4-4472-9952-21f89f20548d
simulation_disclosure: metadata_and_product_page_only
---

# Owning a Remote Project Across Time Zones

## Private scenario card

Ayesha is a fictional India-based candidate in a hiring-manager round. The interviewer tests whether the candidate's project depth survives probes into architecture, exact ownership, stakeholder tradeoffs, rollout, incidents, mentoring, and remote execution. The candidate must not turn the answer into a flawless case study.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Jordan Patel — Interviewer:** Hi, Ayesha. Can you hear me clearly?

**Ayesha Rahman — Candidate:** Hi, Jordan. Yes, I can hear you. Is my audio okay?

**Jordan Patel — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Ayesha Rahman — Candidate:** Sounds good. Thank you.

**Jordan Patel — Interviewer:** We have about forty minutes. I want to understand one substantial project in depth, including your decisions and what happened after launch. Then we'll discuss a shorter team scenario and leave time for your questions.

**Ayesha Rahman — Candidate:** Yes, that works for me.

**Jordan Patel — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Ayesha Rahman — Candidate:** I'm an engineer whose recent work includes the remote customer-onboarding redesign across India, London, and California. My role combines hands-on implementation with ownership of bounded projects and production follow-through. I am looking for a remote product team where engineers help clarify outcomes, document decisions for other time zones, and remain accountable after launch.

**Jordan Patel — Interviewer:** Choose one project where your individual decisions materially changed the result. What was your ownership?

**Ayesha Rahman — Candidate:** I owned the end-to-end engineering plan, workflow state model, dependency ledger, and launch; product owned customer policy and each service team owned implementation. I will use that project because I can separate my decisions from the manager, staff engineer, product partner, and other implementers rather than describing the whole result as mine.

### Project context and ownership — approximately 03:00-11:00

**Jordan Patel — Interviewer:** What problem was the project solving, and who experienced it?

**Ayesha Rahman — Candidate:** Onboarding took weeks because identity, billing, and workspace setup had separate owners and decisions waited for overlap meetings. The first step was translating that symptom into a bounded user and operating outcome rather than assuming the request implied one architecture.

**Jordan Patel — Interviewer:** What was your scope?

**Ayesha Rahman — Candidate:** I owned the end-to-end engineering plan, workflow state model, dependency ledger, and launch; product owned customer policy and each service team owned implementation. I was accountable for closing the decisions in that boundary, surfacing risks, and following the rollout; I was not the owner of every adjacent system.

**Jordan Patel — Interviewer:** How large was the team and who was the decision owner?

**Ayesha Rahman — Candidate:** The core delivery group was three to five engineers plus product and an operational partner. I authored the engineering proposal and owned the bounded decision for the remote customer-onboarding redesign across India, London, and California. A staff engineer or manager reviewed risks that crossed other systems, and product owned policy or customer priority.

**Jordan Patel — Interviewer:** How did you know the problem was worth solving?

**Ayesha Rahman — Candidate:** I combined operational evidence, support or user behavior, and delivery cost. The clearest consequence was that onboarding took weeks because identity, billing, and workspace setup had separate owners and decisions waited for overlap meetings. I stated which numbers were measured and which were estimates, and we agreed on one success measure plus guardrails before implementation.

**Jordan Patel — Interviewer:** What was not in scope?

**Ayesha Rahman — Candidate:** We excluded adjacent platform modernization that did not change the immediate outcome of the remote customer-onboarding redesign across India, London, and California. That was important because the problem invited a broad rewrite. I documented the deferred work and the evidence that would justify it later rather than calling it unnecessary forever.

### Technical and product decisions — approximately 11:00-22:00

**Jordan Patel — Interviewer:** Walk me through the architecture or operating model you chose.

**Ayesha Rahman — Candidate:** A workflow orchestrator with explicit states, idempotent service tasks, an audit timeline, and asynchronous decision records; existing services remained authoritative. The source of truth and recovery boundary were explicit, and derived views or queues had a rebuild or replay path.

**Jordan Patel — Interviewer:** What alternative did you seriously consider?

**Ayesha Rahman — Candidate:** A synchronous orchestration API looked simpler but coupled customer progress to three service availabilities and made cross-time-zone recovery opaque. It was not an obviously bad option; it optimized a different constraint. We rejected it because the dominant risk and rollout requirements favored the chosen path.

**Jordan Patel — Interviewer:** What decision was most controversial?

**Ayesha Rahman — Candidate:** Sales wanted manual overrides for every delayed account while security required strict identity gates; I separated safe resumable steps from non-bypassable checks. I made the tradeoff visible in the shared document, named the decider, and recorded what evidence would cause us to revisit it.

**Jordan Patel — Interviewer:** What did you personally implement?

**Ayesha Rahman — Candidate:** I implemented or paired on the riskiest contract and recovery path in the remote customer-onboarding redesign across India, London, and California, not every surrounding component. I also wrote the migration checks and dashboard because the quality of the rollout depended on them. Other engineers owned their components and are credited separately.

**Jordan Patel — Interviewer:** How did you keep the design from becoming too broad?

**Ayesha Rahman — Candidate:** I required each component in the remote customer-onboarding redesign across India, London, and California to connect to a stated outcome or failure mode. When a future-use feature had no current consumer, I removed it or preserved only a narrow interface. The design document included rejected options so simplicity did not look accidental.

**Jordan Patel — Interviewer:** How did remote collaboration change the project?

**Ayesha Rahman — Candidate:** Every open decision in the remote customer-onboarding redesign across India, London, and California had an owner, evidence link, and deadline. Overlap meetings were used only when async comments exposed a real tradeoff. After a call, the decision and rejected option were written so the next region did not rely on someone's memory.

**Jordan Patel — Interviewer:** What security or data concern affected the design?

**Ayesha Rahman — Candidate:** For the remote customer-onboarding redesign across India, London, and California, we minimized sensitive data in events and logs, enforced authorization at the owning service, encrypted durable state, and audited privileged repair or replay actions. I involved the relevant security or compliance owner at the design boundary instead of seeking a generic approval at the end.

**Jordan Patel — Interviewer:** What would have happened if your main dependency failed?

**Ayesha Rahman — Candidate:** The system entered an explicit pending or degraded state, bounded retries with backoff and jitter, and preserved an idempotent recovery path. We avoided converting dependency failure into an unbounded queue or duplicate external effect. The runbook stated what users and support would observe.

**Jordan Patel — Interviewer:** Take one request or job through the design at message-level detail.

**Ayesha Rahman — Candidate:** The path begins at the authenticated boundary, validates ownership and the current version, and creates the authoritative mutation with an idempotency key. In this project the core model was a workflow orchestrator with explicit states, idempotent service tasks, an audit timeline, and asynchronous decision records; existing services remained authoritative. A transaction or atomic item records the state and outbox; background work carries the stable entity ID. Each consumer conditionally advances state, records attempt evidence, and exposes an operation ID. If an external outcome is ambiguous, the state says so until reconciliation closes it. That tradeoff became concrete in the remote customer-onboarding redesign across India, London, and California work.

**Jordan Patel — Interviewer:** What was the most important data-model decision?

**Ayesha Rahman — Candidate:** We separated stable identity and ownership from append-only history and derived views. Mutable state had a version for conditional updates; events or attempts were immutable and linked by a stable ID. That let support reconstruct why the current state existed without reading logs from several services. The tradeoff was more explicit state transitions and storage, which we accepted because replay and audit were core to the problem. I would validate it against the rollout evidence from the remote customer-onboarding redesign across India, London, and California.

**Jordan Patel — Interviewer:** What API or event contract did another team depend on?

**Ayesha Rahman — Candidate:** The contract named required fields, idempotency behavior, ordering or version semantics, error categories, and what a retry meant. I provided valid and invalid examples and a compatibility rule. We avoided words such as optional or backward compatible without observable definitions. When a consumer needed a new field, we added it before relying on it and measured adoption before removing the old representation. For that project, another time zone still needed to operate the decision without me present.

**Jordan Patel — Interviewer:** How did you estimate capacity without false precision?

**Ayesha Rahman — Candidate:** I used peak requests or jobs, payload or row size, retention, read-write ratio, and the largest tenant or cohort. I calculated only enough to decide partitioning, queue headroom, or storage class, then load-tested the dominant path. The average was not a safety argument; catch-up and skew mattered. We added explicit limits and an admission policy so exceeding the estimate produced bounded degradation rather than memory growth. The user-visible state in the remote customer-onboarding redesign across India, London, and California was the final test, not the diagram.

**Jordan Patel — Interviewer:** What happened when a dependency was unavailable?

**Ayesha Rahman — Candidate:** The service preserved the authoritative intent, moved the workflow to a visible pending or degraded state, and bounded retries with deadlines, backoff, and jitter. We reserved capacity for new work and protected other tenants or workflows. If a fallback changed user semantics, product approved it and support could see it. Recovery drained gradually while watching success and saturation rather than sending the entire backlog at once. I would record that explicitly in the remote customer-onboarding redesign across India, London, and California decision log.

**Jordan Patel — Interviewer:** Where could duplicate work occur?

**Ayesha Rahman — Candidate:** At client retry, database-to-queue publication, worker lease recovery, and any external timeout. We used stable request or entity IDs and conditional state changes at every boundary we controlled. For external effects, we passed an idempotency key where supported and documented ambiguous outcomes where it was not. I did not claim that an internal lock could guarantee exactly once across a remote system. That was part of the operating review for the remote customer-onboarding redesign across India, London, and California, not an afterthought.

**Jordan Patel — Interviewer:** Which metric told you the system was healthy for users?

**Ayesha Rahman — Candidate:** The primary indicator measured the user-visible outcome—completion latency, correctness, freshness, or availability—rather than only CPU. We paired it with backlog age, error categories, saturation, and a correctness check. Alerts used burn rate or time to exhaustion. The dashboard linked to the rollout decision so a green deployment did not hide a degrading customer path. That tradeoff became concrete in the remote customer-onboarding redesign across India, London, and California work.

**Jordan Patel — Interviewer:** What did you log and deliberately not log?

**Ayesha Rahman — Candidate:** We carried opaque request, entity, attempt, and version IDs through traces and state history. We did not log customer payloads, credentials, or full financial and identity data for convenience. Sensitive debugging required controlled access and audit. High-cardinality tenant investigation lived in indexed logs with bounded retention, while metrics kept dimensions controlled. I would validate it against the rollout evidence from the remote customer-onboarding redesign across India, London, and California.

**Jordan Patel — Interviewer:** How did security review change the project?

**Ayesha Rahman — Candidate:** It moved authorization and repair controls into the normal service path rather than leaving them at the edge. Privileged replay or override actions became audited and scoped, secrets used managed storage, and service identities had only the required access. One broad operational shortcut was replaced with a narrow, approved action. We recorded residual risk instead of treating review as a binary approval stamp. For that project, another time zone still needed to operate the decision without me present.

**Jordan Patel — Interviewer:** How did you make the decision legible to remote reviewers?

**Ayesha Rahman — Candidate:** The proposal started with outcome, constraints, invariants, and two viable options. The diagram labeled ownership and sync versus async paths. Open questions had an owner, recommendation, and deadline. I posted change summaries instead of asking reviewers to reread the entire document. When overlap was needed, we closed one disputed tradeoff and immediately updated the written source of truth. The user-visible state in the remote customer-onboarding redesign across India, London, and California was the final test, not the diagram.

**Jordan Patel — Interviewer:** Tell me about a stakeholder who initially opposed the plan.

**Ayesha Rahman — Candidate:** The opposition was reasonable because sales wanted manual overrides for every delayed account while security required strict identity gates; I separated safe resumable steps from non-bypassable checks. I restated their objective, showed where the current plan imposed cost, and offered a bounded alternative or pilot. The named decision owner closed the tradeoff. I did not label adoption resistance as a communication problem when the stakeholder was actually absorbing migration or operating work. I would record that explicitly in the remote customer-onboarding redesign across India, London, and California decision log.

**Jordan Patel — Interviewer:** What cost did the chosen design introduce?

**Ayesha Rahman — Candidate:** We accepted extra state, temporary dual operation, storage, or operational complexity to gain the required safety and migration control. I estimated that cost and assigned an end date where it was transitional. We removed one feature whose future value did not justify current complexity. Cost review included support and on-call burden, not only cloud spend. That was part of the operating review for the remote customer-onboarding redesign across India, London, and California, not an afterthought.

**Jordan Patel — Interviewer:** What did the test strategy miss at first?

**Ayesha Rahman — Candidate:** It missed the condition that later appeared in the incident: a London policy change was agreed in a call but not updated in the decision record, causing California to implement an obsolete rule for a day. The original tests covered the path we expected, not the lifecycle, writer, device, or timing boundary that changed behavior. We added the smallest regression case, a contract or integration test at the owning boundary, and a rollout signal that would detect the class even if the next instance looked different. That tradeoff became concrete in the remote customer-onboarding redesign across India, London, and California work.

**Jordan Patel — Interviewer:** How did shadow or dual operation prove equivalence?

**Ayesha Rahman — Candidate:** We defined which outputs should match exactly, which could differ by timing, and how mismatches were classified. Comparison ran on representative cohorts, and every ignored category had an owner and expiry. We sampled individual mismatches instead of trusting aggregate percentages alone. Shadow behavior did not produce customer effects, and the comparison pipeline itself was monitored for missing data. I would validate it against the rollout evidence from the remote customer-onboarding redesign across India, London, and California.

**Jordan Patel — Interviewer:** What was the rollback plan, and was it actually usable?

**Ayesha Rahman — Candidate:** Rollback was a rehearsed state transition, not a line saying revert. It named which version, data compatibility, queued work, and customer communication were involved. We tested it on a canary and retained old readers or adapters until the checkpoint passed. For irreversible migrations we used forward repair rather than pretending rollback could restore the old world. For that project, another time zone still needed to operate the decision without me present.

**Jordan Patel — Interviewer:** How did support or operations participate?

**Ayesha Rahman — Candidate:** They reviewed user-visible states, reason codes, safe repair actions, and escalation before launch. The runbook began with a customer symptom and stable identifier, then showed current state and allowed actions. That involvement exposed requirements engineers had missed. Support was not asked to infer behavior from internal service names or execute unrestricted production queries. The user-visible state in the remote customer-onboarding redesign across India, London, and California was the final test, not the diagram.

**Jordan Patel — Interviewer:** What technical debt did you intentionally leave?

**Ayesha Rahman — Candidate:** We kept one bounded manual path or single-region assumption because automating or distributing it was not justified by current volume and risk. The debt had an owner, evidence threshold, and observable cost. We did not call every deferred feature debt. The important part was ensuring the shortcut could not silently become the source of truth or bypass core authorization and audit. I would record that explicitly in the remote customer-onboarding redesign across India, London, and California decision log.

**Jordan Patel — Interviewer:** What would break first at ten times the scale?

**Ayesha Rahman — Candidate:** I would expect the measured skewed dimension—fan-out, hot partition, connection count, write amplification, or recovery backlog—to fail before generic CPU. The design already exposes those signals. The next step would split or isolate that dimension, add regional reads, batch work, or promote heavy tenants. I would not add global multi-writer consensus unless write availability, not traffic alone, required it. That was part of the operating review for the remote customer-onboarding redesign across India, London, and California, not an afterthought.

**Jordan Patel — Interviewer:** How do you know the result came from your project rather than another change?

**Ayesha Rahman — Candidate:** The observed result was that median onboarding time fell and support could identify the blocked owner; a small set of legacy billing accounts stayed on the old path. We used staged cohorts, before-and-after operational measures, or direct workflow evidence where available, and named simultaneous changes that limited attribution. I would not transform a correlated business metric into proof. The more defensible result was the system behavior and support evidence tied directly to the rollout. That tradeoff became concrete in the remote customer-onboarding redesign across India, London, and California work.

**Jordan Patel — Interviewer:** What would you expect a senior reviewer to challenge in this design?

**Ayesha Rahman — Candidate:** I would expect a challenge to the boundary between the chosen architecture and the rejected alternative: a synchronous orchestration API looked simpler but coupled customer progress to three service availabilities and made cross-time-zone recovery opaque. I would also invite scrutiny of failure recovery and the assumption behind the largest cohort. A good review should attack a real cost or invariant. If reviewers only discuss naming or preferred technology, the proposal has not made the consequential decisions visible enough. I would validate it against the rollout evidence from the remote customer-onboarding redesign across India, London, and California.

**Jordan Patel — Interviewer:** Describe one concurrency or race condition you had to reason through.

**Ayesha Rahman — Candidate:** Two workers or user actions could observe the same version and attempt the transition. We used a conditional update on state and version so only one won, and the loser reloaded rather than repeating the external effect. Where leases were involved, a fencing token prevented a stale worker from committing. We tested the interleaving deliberately; a lock in one process would not protect a distributed retry or failover. For that project, another time zone still needed to operate the decision without me present.

**Jordan Patel — Interviewer:** Who owned the service after the project launch?

**Ayesha Rahman — Candidate:** The delivery team retained a named service owner and joined the operating rotation rather than transferring a black box to operations. I documented the SLO, dependency map, dashboards, runbook, and known limits, then shadowed the first rotation with other engineers. Ownership meant responding to evidence and improving the system, not being personally available for every page forever. The user-visible state in the remote customer-onboarding redesign across India, London, and California was the final test, not the diagram.

### Rollout, operations, and hindsight — approximately 22:00-29:00

**Jordan Patel — Interviewer:** How did you roll it out?

**Ayesha Rahman — Candidate:** We ran new and old workflows for a pilot cohort, compared completion states daily, migrated one customer segment at a time, and kept a manual reconciliation path. Each stage had an owner, success and rollback thresholds, and a way to compare new behavior with the old path. We did not treat deployment as evidence of adoption or correctness.

**Jordan Patel — Interviewer:** What actually happened after launch?

**Ayesha Rahman — Candidate:** Median onboarding time fell and support could identify the blocked owner; a small set of legacy billing accounts stayed on the old path. I would preserve the limitation in that result rather than claim the project solved every case.

**Jordan Patel — Interviewer:** Tell me about a failure during the work.

**Ayesha Rahman — Candidate:** A London policy change was agreed in a call but not updated in the decision record, causing California to implement an obsolete rule for a day. We separated containment, customer communication, root cause, and the durable prevention mechanism.

**Jordan Patel — Interviewer:** What was your mistake in that failure?

**Ayesha Rahman — Candidate:** My mistake was an assumption in test coverage, stakeholder mapping, or rollout evidence—not merely that another component failed. I stated it in the review and changed the default or checklist so the learning did not rely on me remembering next time.

**Jordan Patel — Interviewer:** What would you do differently?

**Ayesha Rahman — Candidate:** I would assign a decision scribe for every overlap call and define exception ownership before the pilot. I would keep the successful staged approach but move that learning earlier, when it could still change the design rather than only the postmortem.

**Jordan Patel — Interviewer:** What did the project teach you about your level?

**Ayesha Rahman — Candidate:** I can independently own a meaningful project and influence adjacent teams, but I still benefit from review when the decision becomes organization-wide or enters a domain I have not operated. I would not use one project to claim broader staff-level scope than the evidence supports.

### Team and remote-execution scenario — approximately 29:00-31:00

**Jordan Patel — Interviewer:** Give me a shorter example involving another engineer.

**Ayesha Rahman — Candidate:** One service team missed two written deadlines; I initially escalated the dates, then learned their dependency was unstated and rebuilt the plan around the actual blocker. The important part was adjusting my own behavior, not labeling the teammate as the problem.

**Jordan Patel — Interviewer:** How do you decide when to step in?

**Ayesha Rahman — Candidate:** I agree on decision boundaries and escalation triggers before the risky moment. I step in for irreversible customer, security, or data risk; otherwise I let the owner work through the problem and review at the checkpoint. Taking over can fix today while weakening tomorrow's ownership.

**Jordan Patel — Interviewer:** How do you give difficult feedback remotely?

**Ayesha Rahman — Candidate:** Privately and close to the event, with observable behavior, impact, and a requested change. I ask for missing context and separate a repeated pattern from one incident. I follow up in writing on the agreement, but I do not turn a sensitive conversation into a public document.

**Jordan Patel — Interviewer:** What do you do when a written deadline is missed?

**Ayesha Rahman — Candidate:** First determine whether the owner, dependency, and consequence were actually explicit. Then replan with the owner and communicate impact. Escalation is appropriate when risk exceeds their authority or a repeated commitment is invisible; it is not a substitute for discovering the real blocker.

**Jordan Patel — Interviewer:** How would your manager describe your growth area?

**Ayesha Rahman — Candidate:** I can move quickly into solution mode and need to spend more time confirming stakeholder and operating context at the beginning. The examples in this interview show that pattern. I have improved through decision briefs and earlier reviews, but it remains something I monitor.

**Jordan Patel — Interviewer:** Why this remote role now?

**Ayesha Rahman — Candidate:** I want the same end-to-end ownership in a team where written clarity and cross-time-zone decisions are normal operating requirements. I am not applying only for location flexibility; I am looking for product and production responsibility that does not depend on being near the decision maker.

### Candidate questions and close — approximately 31:00-34:00

**Jordan Patel — Interviewer:** I have what I need. What questions do you have for me?

**Ayesha Rahman — Candidate:** What outcome would make someone in this role clearly successful after six months?

**Jordan Patel — Interviewer:** They would own a project similar in depth to the remote customer-onboarding redesign across India, London, and California, earn trust in production follow-through, and make cross-time-zone decisions easier for the team.

**Ayesha Rahman — Candidate:** That combination of delivery and operating ownership makes sense.

**Ayesha Rahman — Candidate:** How do you prefer engineers to raise disagreement with you?

**Jordan Patel — Interviewer:** Early, with the user or system consequence made explicit. I do not require agreement, but I expect the concern and final decision to be recorded so the team can execute without reopening it informally.

**Ayesha Rahman — Candidate:** That's a clear expectation. Thank you.

**Ayesha Rahman — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Jordan Patel — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Ayesha Rahman — Candidate:** Understood. Thank you, Jordan. Have a good day.

**Jordan Patel — Interviewer:** You too, Ayesha. Take care.

## Timing plan

- Interviewer words: 604 at approximately 145 words per minute.
- Candidate words: 3148 at approximately 125 words per minute.
- Dialogue turns: 115, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 3.9 minutes.
- Estimated finished duration: 34.0 minutes; catalog target: 34 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Scope boundary | Separate project leadership from team or organization ownership. | I owned the end-to-end engineering plan, workflow state model, dependency ledger, and launch; product owned customer policy and each service team owned implementation. | Name adjacent owners so personal contribution becomes credible. |
| Rejected alternative | Test tradeoff quality. | A synchronous orchestration API looked simpler but coupled customer progress to three service availabilities and made cross-time-zone recovery opaque. | A real alternative should optimize something valuable. |
| Rollout | Find evidence after code completion. | We ran new and old workflows for a pilot cohort, compared completion states daily, migrated one customer segment at a time, and kept a manual reconciliation path. | Deployment is not the same as a successful outcome. |
| Incident | Test operational accountability. | A London policy change was agreed in a call but not updated in the decision record, causing California to implement an obsolete rule for a day. | Make containment, communication, cause, and prevention distinct. |
| Team scenario | Evaluate senior leverage. | One service team missed two written deadlines; I initially escalated the dates, then learned their dependency was unstated and rebuilt the plan around the actual blocker. | Helping does not always mean taking over. |

## Deliberate imperfections to preserve

- A London policy change was agreed in a call but not updated in the decision record, causing California to implement an obsolete rule for a day.
- I would assign a decision scribe for every overlap call and define exception ownership before the pilot.
- The candidate initially describes one shared outcome with 'we' and must identify the decision that was personally theirs.

