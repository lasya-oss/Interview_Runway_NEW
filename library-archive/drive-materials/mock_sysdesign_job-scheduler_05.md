---
id: mock_sysdesign_job-scheduler_05
status: audio_complete_video_pending
category: sysdesign
round: system_design
duration_target_minutes: 38
candidate: Deepa Krishnan (fictional), Chennai, 8 years, infrastructure engineer
interviewer: Daniel Ruiz (fictional), California, staff engineer
candidate_voice_id: efb6d51d-ce64-4ec3-bacc-5f8e3a2594db
interviewer_voice_id: 2e4f5fed-e691-4d6a-bdbe-82880007ad4b
simulation_disclosure: metadata_and_product_page_only
---

# Design a Distributed Job Scheduler

## Private scenario card

Deepa is interviewing for a fictional US remote engineering role and must design design a distributed job scheduler. The round intentionally challenges one estimate and one familiar-technology reflex. Facts are revealed only when asked, and the design must remain operable for an India-based engineer sharing ownership across time zones.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Daniel Ruiz — Interviewer:** Hi, Deepa. Can you hear me clearly?

**Deepa Krishnan — Candidate:** Hi, Daniel. Yes, I can hear you. Is my audio okay?

**Daniel Ruiz — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Deepa Krishnan — Candidate:** Sounds good. Thank you.

**Daniel Ruiz — Interviewer:** We have about forty-five minutes. We'll spend most of it on a system-design problem. I care about requirements, tradeoffs, and failure behavior more than drawing every possible component. I'll redirect if we need to move on.

**Deepa Krishnan — Candidate:** Yes, that works for me.

**Daniel Ruiz — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Deepa Krishnan — Candidate:** I'm a backend and platform engineer whose recent work includes distributed compute control planes in Go. I have designed event-driven and data-intensive services, operated them on call, and led bounded migrations. I have not built every feature in today's prompt at the exact stated scale, so I will use the requirements we establish rather than pretend my previous architecture transfers unchanged.

**Daniel Ruiz — Interviewer:** What architecture or operational decision in that work was specifically yours?

**Deepa Krishnan — Candidate:** In my current work on distributed compute control planes in Go, I owned the service boundary, failure contract, and rollout metrics for one major change. A staff engineer reviewed the design, two engineers shared implementation, and another team owned the upstream producer. My decisions were the consistency boundary, the recovery behavior, and when staged traffic could advance.

### Prompt and requirements — approximately 03:00-08:00

**Daniel Ruiz — Interviewer:** Design a multi-tenant distributed job scheduler for one-time and recurring jobs.

**Deepa Krishnan — Candidate:** Who are the users, and which actions are in scope?

**Daniel Ruiz — Interviewer:** Tenants submit jobs with a run time or cron expression, inspect history, cancel future runs, and set retry policy. Workers execute containerized tasks from seconds to hours. Exactly-once execution is not promised; the scheduler must make duplicate risk explicit.

**Deepa Krishnan — Candidate:** What scale, read-write shape, and latency should drive the design?

**Daniel Ruiz — Interviewer:** One hundred million scheduled runs per day, peak dispatch twenty thousand per second, ten million active recurring schedules, and jobs ranging from one second to six hours. Dispatch should usually begin within five seconds of due time.

**Deepa Krishnan — Candidate:** Which correctness, availability, or ordering promises matter most?

**Daniel Ruiz — Interviewer:** Do not lose an accepted schedule. At-least-once dispatch with idempotent job contracts is acceptable. One tenant cannot monopolize workers. Cancellation prevents future dispatch but may not stop an already running external effect. Recovery after control-plane outage must not create an uncontrolled storm.

**Deepa Krishnan — Candidate:** Should I include user-interface implementation, billing, and advanced analytics?

**Daniel Ruiz — Interviewer:** No. Define backend APIs and behavior, but exclude UI implementation, billing, and features not named in scope.

**Deepa Krishnan — Candidate:** May I choose a home region or should every write be active-active globally?

**Daniel Ruiz — Interviewer:** Start with the simplest regional model that meets the requirement. Explain what would force you to add multi-region write complexity.

**Deepa Krishnan — Candidate:** What retention, audit, and deletion behavior should I preserve?

**Daniel Ruiz — Interviewer:** Retain operational history long enough for customer support and audit. State a reasonable policy and separate reversible soft deletion from irreversible cleanup.

**Deepa Krishnan — Candidate:** I'll design the core actions and contracts just named, optimize for the stated peak and quality priorities, and exclude the advanced features. I will identify the source of truth, one detailed write and read path, then test failures and regional behavior. The most important domain constraints appear to be: Do not lose an accepted schedule. At-least-once dispatch with idempotent job contracts is acceptable. One tenant cannot monopolize workers. Cancellation prevents future dispatch but may not stop an already running external effect. Recovery after control-plane outage must not create an uncontrolled storm.

**Daniel Ruiz — Interviewer:** That scope is right. Go ahead.

### Scale, invariants, and high-level design — approximately 08:00-17:00

**Deepa Krishnan — Candidate:** One hundred million runs per day averages about twelve hundred per second but peak dispatch is much higher. Active schedule metadata is manageable; immutable run and attempt history dominates writes. Long jobs make worker capacity a separate concern from scheduler QPS, so admission must consider CPU, memory, and tenant quota, not only queue depth.

**Daniel Ruiz — Interviewer:** Which assumption in that estimate is weakest, and which decision would change if it is wrong?

**Deepa Krishnan — Candidate:** The distribution tail is weaker than the average: hot tenants, large payloads, or fan-out can dominate even when aggregate volume looks manageable. I would measure the ninety-fifth and ninety-ninth percentiles and enforce explicit limits. The estimate supports separating high-volume immutable data from control metadata, but I would not purchase capacity or choose a partition count from one median number.

**Daniel Ruiz — Interviewer:** What correctness or product invariants are you protecting?

**Deepa Krishnan — Candidate:** Do not lose an accepted schedule. At-least-once dispatch with idempotent job contracts is acceptable. One tenant cannot monopolize workers. Cancellation prevents future dispatch but may not stop an already running external effect. Recovery after control-plane outage must not create an uncontrolled storm. I would also require idempotent client retries, an auditable state transition for every durable mutation, and bounded recovery so an outage cannot convert into a second overload incident.

**Daniel Ruiz — Interviewer:** Walk me through the high-level design.

**Deepa Krishnan — Candidate:** A control API persists schedule definitions and creates due-run obligations in partitioned time buckets. Scheduler leaders claim bucket shards with leases, materialize recurring occurrences idempotently, and enqueue runnable IDs. A dispatcher applies tenant fairness and resource admission, then offers work to agents. Agents heartbeat leases and report attempt state. Reconciliation detects expired leases, retries safely, and preserves a complete audit trail.

**Daniel Ruiz — Interviewer:** Where is the source of truth?

**Deepa Krishnan — Candidate:** The authoritative control and user-visible state follows this model: Schedule stores tenant, versioned cron or run time, timezone policy, job template, retry policy, and next occurrence. Run is unique on schedule ID plus scheduled occurrence and has desired state, resource class, priority, and timestamps. Attempt stores worker, lease token, heartbeat, exit result, and external idempotency key. Caches, indexes, analytics, and queues are derived or transport layers; each needs a named freshness and rebuild path.

**Daniel Ruiz — Interviewer:** Walk one accepted write through the system.

**Deepa Krishnan — Candidate:** A bucket owner scans due schedule partitions, conditionally creates each occurrence, updates the schedule's next time, and enqueues run IDs. Dispatch selects eligible tenants fairly, checks quota and resources, issues a lease token, and marks the attempt. A stale worker completion is rejected by the fencing token even if the external task may already have produced an effect.

**Daniel Ruiz — Interviewer:** Where do you need idempotency?

**Deepa Krishnan — Candidate:** At the public mutation boundary, at every database-to-queue handoff, and at consumers that can repeat an external effect. I use a caller-scoped idempotency key or stable domain identifier, persist the result with the mutation, and make duplicates return the original outcome. Idempotency does not turn an ambiguous external timeout into exactly once; it only bounds effects we control.

**Daniel Ruiz — Interviewer:** You introduced several components. What would you remove from version one?

**Deepa Krishnan — Candidate:** Start with minute-granularity time buckets, shard leases, three priority classes, and one primary control region. Add finer timing only for customers who require it; do not pay sub-second scheduling complexity for every job.

**Daniel Ruiz — Interviewer:** I heard a technology reflex in that answer. Reconsider it.

**Deepa Krishnan — Candidate:** Deepa initially reaches for a globally elected scheduler leader, then simplifies to independently leased time shards so throughput and failure scope do not depend on one leader. The correction is to restate the required capability first and select the simplest component the team can operate reliably.

**Daniel Ruiz — Interviewer:** How do you partition without creating a hot customer?

**Deepa Krishnan — Candidate:** Use a high-cardinality stable key for the primary write path and retain tenant as an authorization and fairness dimension. Very large tenants can be promoted to dedicated shards or scheduling buckets. I would not make tenant ID the only physical partition key when the prompt explicitly permits one tenant to dominate traffic.

**Daniel Ruiz — Interviewer:** What changes at ten times scale?

**Deepa Krishnan — Candidate:** I would first identify the measured bottleneck: edge bandwidth, hot metadata, queue lag, connection count, or background fan-out. Then scale that dimension through more partitions, regional reads, batching, or asynchronous work. I would not add multi-region consensus merely because the traffic number has another zero.

**Daniel Ruiz — Interviewer:** How do you turn the traffic estimate into an initial capacity plan?

**Deepa Krishnan — Candidate:** I separate steady state, stated peak, and controlled recovery load. Stateless services can begin with enough replicas for roughly twice the normal peak while autoscaling on saturation and queue age, but stateful partitions require measured item size, write amplification, replication, and hot-key headroom. I would load-test the dominant path and set an explicit admission limit before launch. Capacity without a rejection or backpressure policy is only an optimistic chart. For this design, I would verify it specifically at the leases boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What is your consistency model from the user's perspective?

**Deepa Krishnan — Candidate:** Authoritative mutations use conditional or transactional writes in the home ownership boundary. Derived caches, indexes, analytics, and regional replicas are eventually consistent with a stated objective. For each stale read I name the user consequence and whether the system may serve stale, fail closed, or bypass the cache. Security revocation and destructive state receive a tighter propagation path than ordinary analytics freshness. For this design, I would verify it specifically at the duplicate execution boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How do schema changes remain compatible during a rolling deployment?

**Deepa Krishnan — Candidate:** Use versioned contracts and expand-migrate-contract: add fields or readers first, keep old writers valid, backfill or dual-read with measurable comparison, move writers, then remove the old form only after usage reaches zero. Consumers ignore unknown additive fields where safe. A breaking semantic change receives a new version rather than reusing the same field name with a different meaning. For this design, I would verify it specifically at the partitioning boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What lifecycle applies to the largest or fastest-growing data?

**Deepa Krishnan — Candidate:** Classify data by operational need, support window, audit, and legal retention. Hot state stays queryable; immutable payloads or history move to cheaper storage with indexes for bounded retrieval; expired derivatives can be rebuilt or deleted. Deletion is a workflow with tombstone, asynchronous cleanup, verification, and legal-hold checks. I would track bytes by tenant and class so retention policy has a measurable cost. For this design, I would verify it specifically at the recovery boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How do you test correctness beyond unit tests?

**Deepa Krishnan — Candidate:** Use contract tests at API and event boundaries, deterministic fault injection for timeout and duplicate delivery, replay of representative production shapes with sensitive data removed, and invariant checks on sampled state. Staging should test recovery from partial completion, not only happy-path throughput. Before launch I would run a game day for the failure that creates the most ambiguous external or customer-visible state. For this design, I would verify it specifically at the fairness boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How would you control infrastructure cost without hiding product risk?

**Deepa Krishnan — Candidate:** Measure cost per successful user outcome, not only per request. The largest levers are retention, replication, egress, fan-out, cache efficiency, and retry amplification. I would set budgets and alert on trend, then change compression, lifecycle, batching, or tiering with correctness guardrails. Removing redundancy or shortening audit retention purely to hit a bill target requires an explicit product and risk decision. For this design, I would verify it specifically at the leases boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What does a safe migration from an existing system look like?

**Deepa Krishnan — Candidate:** Inventory callers and data ownership, define compatibility, then use shadow reads or dual calculations where results can be compared. Backfill is partitioned and resumable, with rate limits so it cannot starve normal traffic. Cut over by low-risk tenant or region, retain a bounded rollback path, and stop dual behavior after evidence and a deadline; permanent dual writes create a second source of truth. For this design, I would verify it specifically at the duplicate execution boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** If one partition becomes hot, how do you detect and repair it?

**Deepa Krishnan — Candidate:** Observe per-partition throughput, latency, queue age, key distribution, and throttling. Short-term mitigation can isolate or rate-limit the hot key, increase cache or consumer capacity, and protect other shards. Durable repair may split by a secondary hash, promote a large tenant, or change a fan-out model. Repartitioning needs a versioned routing map and gradual movement so clients do not guess ownership. For this design, I would verify it specifically at the partitioning boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What changes if the home region is unavailable for several hours?

**Deepa Krishnan — Candidate:** Read-only or bounded-stale operations can fail over to a replica if the product accepts the state. For writes, promote only after fencing the old region and confirming the recovery point; otherwise two authorities can diverge. Queue new work durably where possible and expose delayed state. When the region returns, reconcile from versioned logs and drain deliberately instead of replaying every operation at full speed. For this design, I would verify it specifically at the recovery boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How do privacy and data minimization affect observability?

**Deepa Krishnan — Candidate:** Carry stable opaque identifiers rather than payloads, redact credentials and content at the logging library, limit tenant-level access, and retain detailed traces for a bounded window. Metrics use low-cardinality dimensions; high-cardinality investigation moves to indexed logs with access audit. Sampling must preserve errors and rare security states. Debuggability is a requirement, but collecting every customer field is not the only way to achieve it. For this design, I would verify it specifically at the fairness boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What SLO would you publish, and what happens when it is missed?

**Deepa Krishnan — Candidate:** Publish the user-visible latency, availability, or freshness objective that matches the core path, plus a correctness indicator that is not hidden by fast failures. Error-budget burn triggers a response proportional to rate and duration: investigate, pause risky rollout, or shift capacity. The SLO should influence prioritization; if misses create only a dashboard color, it is not operating the system. For this design, I would verify it specifically at the leases boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What belongs in the support runbook?

**Deepa Krishnan — Candidate:** Start from the customer's symptom and safe identifiers, then list current state, expected delay, common response categories, containment steps, escalation owner, and actions support must not take. Repair or replay commands are audited and idempotent. The runbook says when an outcome is ambiguous and what to tell the customer; it does not require support to infer semantics from internal service names. For this design, I would verify it specifically at the duplicate execution boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How would you review this design with teams in three time zones?

**Deepa Krishnan — Candidate:** Post a concise proposal with requirements, invariants, diagram, rejected options, failure behavior, and open decisions. Every question gets an owner and deadline, and one named decider closes it. Use overlap for the few tradeoffs that cannot converge asynchronously, then update the written record immediately. Quiet is not treated as agreement when a team owns a critical dependency; their review is explicitly requested. For this design, I would verify it specifically at the partitioning boundary rather than assume the generic rule is enough.

### Data, APIs, and detailed path — approximately 17:00-25:00

**Daniel Ruiz — Interviewer:** Give me the minimum useful data model.

**Deepa Krishnan — Candidate:** Schedule stores tenant, versioned cron or run time, timezone policy, job template, retry policy, and next occurrence. Run is unique on schedule ID plus scheduled occurrence and has desired state, resource class, priority, and timestamps. Attempt stores worker, lease token, heartbeat, exit result, and external idempotency key.

**Daniel Ruiz — Interviewer:** Which APIs define the product contract?

**Deepa Krishnan — Candidate:** POST /schedules uses an idempotency key; PATCH creates a new schedule version; DELETE marks future occurrences canceled; GET /runs filters by tenant and time; POST /runs/{id}/retry creates an audited manual generation. Worker APIs claim, heartbeat, and complete with fencing tokens.

**Daniel Ruiz — Interviewer:** How do you prevent a database write followed by a failed queue publish from losing work?

**Deepa Krishnan — Candidate:** Write an outbox record in the same transaction as the authoritative mutation. A publisher sends it at least once and marks progress. Consumers deduplicate using the stable entity or event ID. If the chosen data store lacks multi-record transactions, co-locate the state and outbox in one atomic item or use a durable log as the source rather than hand-wave a cross-system transaction.

**Daniel Ruiz — Interviewer:** What data belongs outside the primary control store?

**Deepa Krishnan — Candidate:** Large immutable bytes, append-only raw events, search indexes, and analytics aggregates should use stores suited to those access patterns. The primary control store retains identifiers, ownership, versions, state, and references. Separation reduces cost and hot-row pressure, but each external object needs lifecycle and consistency rules so metadata cannot point forever at missing content.

**Daniel Ruiz — Interviewer:** How are concurrent updates handled?

**Deepa Krishnan — Candidate:** Use version numbers or conditional writes for user-visible mutable state. A stale client receives a conflict and refreshes rather than overwriting a newer decision. For workflows, state transitions are explicit and monotonic where possible; background workers carry the version or fencing token they claimed.

**Daniel Ruiz — Interviewer:** What would you cache?

**Deepa Krishnan — Candidate:** Cache only read-heavy values with a clear invalidation or bounded-staleness rule. Include entity version in the cached value, use jittered TTLs, and protect misses with request coalescing. Security revocation and destructive state usually need shorter TTLs or an active invalidation path than ordinary immutable content.

### Failures, overload, and operations — approximately 25:00-30:00

**Daniel Ruiz — Interviewer:** Pressure-test the design against scheduler crash after enqueue before state update. What happens and how does it recover?

**Deepa Krishnan — Candidate:** For scheduler crash after enqueue before state update, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against worker loses lease but keeps running. What happens and how does it recover?

**Deepa Krishnan — Candidate:** For worker loses lease but keeps running, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against clock skew and daylight-saving cron. What happens and how does it recover?

**Deepa Krishnan — Candidate:** For clock skew and daylight-saving cron, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against control-plane outage and catch-up. What happens and how does it recover?

**Deepa Krishnan — Candidate:** For control-plane outage and catch-up, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against poison job retry storm. What happens and how does it recover?

**Deepa Krishnan — Candidate:** For poison job retry storm, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against large tenant quota exhaustion. What happens and how does it recover?

**Deepa Krishnan — Candidate:** For large tenant quota exhaustion, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against cancellation racing dispatch. What happens and how does it recover?

**Deepa Krishnan — Candidate:** For cancellation racing dispatch, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** How do you protect healthy tenants while recovering a backlog?

**Deepa Krishnan — Candidate:** Separate new work from retries, reserve capacity for the normal path, and apply tenant and endpoint admission controls. Recovery drains by oldest age and priority while watching saturation and downstream success. A large failed tenant cannot consume every worker merely because its queue is deepest.

**Daniel Ruiz — Interviewer:** What is the disaster-recovery posture?

**Deepa Krishnan — Candidate:** Start with replicated durable data and a tested regional failover procedure. If the design uses a home write region, failover requires a fencing or promotion decision before writes resume elsewhere. Read paths may fail over sooner if bounded staleness is acceptable. Define recovery-time and recovery-point objectives rather than claiming instant lossless failover.

### Security, observability, and recap — approximately 30:00-35:00

**Daniel Ruiz — Interviewer:** Give me the highest-risk security controls.

**Deepa Krishnan — Candidate:** Authenticate tenants and workers, isolate job images and secrets, enforce resource and network policy, encrypt schedule payloads, use short-lived worker credentials and fencing tokens, audit manual retries and cancellations, and prevent arbitrary host access from job containers. I would threat-model the public or cross-tenant boundary and make authorization part of the normal data path, not a gateway-only assumption.

**Daniel Ruiz — Interviewer:** What would you alert on?

**Deepa Krishnan — Candidate:** Schedule-to-dispatch delay, oldest due run, lease expirations, duplicate-attempt rate, worker capacity by resource class, tenant fairness, retry amplification, missed cron occurrence, cancellation races, and catch-up drain rate. Alerts should connect to user impact or exhaustion trends; dashboards alone are not an operating mechanism.

**Daniel Ruiz — Interviewer:** How does support trace one customer's report?

**Deepa Krishnan — Candidate:** Expose a safe request, entity, and attempt identifier to the customer. Carry it through logs, queue messages, traces, and state history. Support can retrieve status without viewing sensitive payloads, while operators can pivot by region, shard, response category, and version.

**Daniel Ruiz — Interviewer:** How would you roll out the riskiest change?

**Deepa Krishnan — Candidate:** Use shadow reads or dual writes only where their comparison semantics are clear, then canary by tenant and region with automated rollback thresholds. Validate recovery, not only success. Keep old readers compatible until the migration checkpoint proves they are no longer needed.

**Daniel Ruiz — Interviewer:** Give me a short recap and name the tradeoff you would expect me to challenge.

**Deepa Krishnan — Candidate:** Durable schedule definitions produce idempotent run obligations through leased time shards. Fair dispatch and resource admission separate scheduling from execution, while attempt leases and fencing handle worker failure without pretending external effects are exactly once. The central tradeoff is timely catch-up versus overload after an outage; recovery must reserve normal capacity and drain old work deliberately.

### Candidate questions and close — approximately 35:00-38:00

**Daniel Ruiz — Interviewer:** I have what I need. What questions do you have for me?

**Deepa Krishnan — Candidate:** Which part of this system is hardest for the team in production today?

**Daniel Ruiz — Interviewer:** Lease ambiguity and safe catch-up after outages are more difficult than calculating cron times.

**Deepa Krishnan — Candidate:** That aligns with the failure cases we discussed.

**Deepa Krishnan — Candidate:** How are design decisions reviewed across time zones?

**Daniel Ruiz — Interviewer:** The author posts a short proposal with a deadline and named decider. Most comments are asynchronous; unresolved tradeoffs get a focused overlap call and a written decision afterward.

**Deepa Krishnan — Candidate:** That is the working model I'm looking for.

**Deepa Krishnan — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Daniel Ruiz — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Deepa Krishnan — Candidate:** Understood. Thank you, Daniel. Have a good day.

**Daniel Ruiz — Interviewer:** You too, Deepa. Take care.

## Timing plan

- Interviewer words: 820 at approximately 145 words per minute.
- Candidate words: 3164 at approximately 125 words per minute.
- Dialogue turns: 123, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 6.2 minutes.
- Estimated finished duration: 38.0 minutes; catalog target: 38 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Requirements | Check whether architecture follows product semantics. | The candidate separates in-scope actions, quality promises, and non-goals. | Do not begin by naming a database. |
| Estimate challenge | Test false precision and distribution awareness. | The candidate names the weak tail assumption and preserves only decisions the estimate supports. | A useful estimate changes a design choice. |
| Technology reflex | See whether familiarity overrides requirements. | Deepa initially reaches for a globally elected scheduler leader, then simplifies to independently leased time shards so throughput and failure scope do not depend on one leader. | Correct the model openly instead of defending a familiar tool. |
| Failure recovery | Test whether the design survives ambiguous and overloaded states. | The candidate uses bounded retry, explicit state, fairness, and controlled drain. | Recovery behavior is part of the product contract. |
| Recap | Check prioritization. | The candidate names one central tradeoff and residual risk. | A concise recap gives the interviewer something meaningful to challenge. |

## Deliberate imperfections to preserve

- Deepa initially reaches for a globally elected scheduler leader, then simplifies to independently leased time shards so throughput and failure scope do not depend on one leader.
- The first estimate relies on an average or median and is corrected after the interviewer asks about the tail.
- The initial design contains one component that is removed when the interviewer asks for an operable first version.

