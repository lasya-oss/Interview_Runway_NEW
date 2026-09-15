---
id: mock_sysdesign_url-shortener_01
status: audio_complete_video_pending
category: sysdesign
round: system_design
duration_target_minutes: 35
candidate: Aditi Malhotra (fictional), Bengaluru, 4 years, backend engineer
interviewer: Daniel Ruiz (fictional), California, staff engineer
candidate_voice_id: e7cc4201-8ebc-4376-a4cf-78ca85142110
interviewer_voice_id: 2e4f5fed-e691-4d6a-bdbe-82880007ad4b
simulation_disclosure: metadata_and_product_page_only
---

# Design a Multi-Tenant URL Shortener

## Private scenario card

Aditi is interviewing for a fictional US remote engineering role and must design design a multi-tenant url shortener. The round intentionally challenges one estimate and one familiar-technology reflex. Facts are revealed only when asked, and the design must remain operable for an India-based engineer sharing ownership across time zones.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Daniel Ruiz — Interviewer:** Hi, Aditi. Can you hear me clearly?

**Aditi Malhotra — Candidate:** Hi, Daniel. Yes, I can hear you. Is my audio okay?

**Daniel Ruiz — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Aditi Malhotra — Candidate:** Sounds good. Thank you.

**Daniel Ruiz — Interviewer:** We have about forty-five minutes. We'll spend most of it on a system-design problem. I care about requirements, tradeoffs, and failure behavior more than drawing every possible component. I'll redirect if we need to move on.

**Aditi Malhotra — Candidate:** Yes, that works for me.

**Daniel Ruiz — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Aditi Malhotra — Candidate:** I'm a backend and platform engineer whose recent work includes link routing and campaign services in Java. I have designed event-driven and data-intensive services, operated them on call, and led bounded migrations. I have not built every feature in today's prompt at the exact stated scale, so I will use the requirements we establish rather than pretend my previous architecture transfers unchanged.

**Daniel Ruiz — Interviewer:** What architecture or operational decision in that work was specifically yours?

**Aditi Malhotra — Candidate:** In my current work on link routing and campaign services in Java, I owned the service boundary, failure contract, and rollout metrics for one major change. A staff engineer reviewed the design, two engineers shared implementation, and another team owned the upstream producer. My decisions were the consistency boundary, the recovery behavior, and when staged traffic could advance.

### Prompt and requirements — approximately 03:00-08:00

**Daniel Ruiz — Interviewer:** Design a multi-tenant URL-shortening service for business customers.

**Aditi Malhotra — Candidate:** Who are the users, and which actions are in scope?

**Daniel Ruiz — Interviewer:** Tenants create short links with optional custom aliases, redirects must work globally, links may expire or be disabled, and basic click analytics can arrive later. Editing a short code to point to a different destination is not allowed after creation.

**Aditi Malhotra — Candidate:** What scale, read-write shape, and latency should drive the design?

**Daniel Ruiz — Interviewer:** One hundred million redirects per day, five hundred creates per second at peak, twenty thousand redirects per second at peak, and roughly two billion active links. Redirect latency should be under one hundred milliseconds at the ninety-ninth percentile in supported regions.

**Aditi Malhotra — Candidate:** Which correctness, availability, or ordering promises matter most?

**Daniel Ruiz — Interviewer:** Redirect availability is more important than immediate analytics. A disabled or expired link must stop serving within roughly one minute. Custom aliases are unique within a tenant, while generated codes are globally unique.

**Aditi Malhotra — Candidate:** Should I include user-interface implementation, billing, and advanced analytics?

**Daniel Ruiz — Interviewer:** No. Define backend APIs and behavior, but exclude UI implementation, billing, and features not named in scope.

**Aditi Malhotra — Candidate:** May I choose a home region or should every write be active-active globally?

**Daniel Ruiz — Interviewer:** Start with the simplest regional model that meets the requirement. Explain what would force you to add multi-region write complexity.

**Aditi Malhotra — Candidate:** What retention, audit, and deletion behavior should I preserve?

**Daniel Ruiz — Interviewer:** Retain operational history long enough for customer support and audit. State a reasonable policy and separate reversible soft deletion from irreversible cleanup.

**Aditi Malhotra — Candidate:** I'll design the core actions and contracts just named, optimize for the stated peak and quality priorities, and exclude the advanced features. I will identify the source of truth, one detailed write and read path, then test failures and regional behavior. The most important domain constraints appear to be: Redirect availability is more important than immediate analytics. A disabled or expired link must stop serving within roughly one minute. Custom aliases are unique within a tenant, while generated codes are globally unique.

**Daniel Ruiz — Interviewer:** That scope is right. Go ahead.

### Scale, invariants, and high-level design — approximately 08:00-17:00

**Aditi Malhotra — Candidate:** Two billion link rows at roughly a few hundred bytes each means hundreds of gigabytes before indexes and replication. Redirect traffic dominates writes by about forty to one. Generated identifiers and cache policy therefore influence the design more than analytics storage. I would size for peak redirect QPS with regional headroom and keep click events off the synchronous path.

**Daniel Ruiz — Interviewer:** Which assumption in that estimate is weakest, and which decision would change if it is wrong?

**Aditi Malhotra — Candidate:** The distribution tail is weaker than the average: hot tenants, large payloads, or fan-out can dominate even when aggregate volume looks manageable. I would measure the ninety-fifth and ninety-ninth percentiles and enforce explicit limits. The estimate supports separating high-volume immutable data from control metadata, but I would not purchase capacity or choose a partition count from one median number.

**Daniel Ruiz — Interviewer:** What correctness or product invariants are you protecting?

**Aditi Malhotra — Candidate:** Redirect availability is more important than immediate analytics. A disabled or expired link must stop serving within roughly one minute. Custom aliases are unique within a tenant, while generated codes are globally unique. I would also require idempotent client retries, an auditable state transition for every durable mutation, and bounded recovery so an outage cannot convert into a second overload incident.

**Daniel Ruiz — Interviewer:** Walk me through the high-level design.

**Aditi Malhotra — Candidate:** An authenticated control API validates destinations, reserves a tenant alias or generated code, and writes link metadata to the source-of-truth store. Regional redirect services read through a distributed cache to a replicated link store, enforce disabled and expiry state, return an HTTP redirect, and publish a bounded click event asynchronously. A separate pipeline aggregates analytics by tenant and link.

**Daniel Ruiz — Interviewer:** Where is the source of truth?

**Aditi Malhotra — Candidate:** The authoritative control and user-visible state follows this model: Link has internal ID, public code, tenant ID, destination, created and expiry times, status, version, and optional alias. A unique index protects tenant-plus-alias; generated public codes use an ID service and Base62 encoding or sufficiently large random values with collision checks. Click events contain link ID, coarse time, region, and privacy-limited attributes. Caches, indexes, analytics, and queues are derived or transport layers; each needs a named freshness and rebuild path.

**Daniel Ruiz — Interviewer:** Walk one accepted write through the system.

**Aditi Malhotra — Candidate:** On redirect, the edge normalizes the code, checks a small negative cache carefully, retrieves immutable destination and mutable status, verifies expiry, and returns 302 by default so product policy can change. Analytics publication is best effort through a durable local buffer; it must not delay the redirect.

**Daniel Ruiz — Interviewer:** Where do you need idempotency?

**Aditi Malhotra — Candidate:** At the public mutation boundary, at every database-to-queue handoff, and at consumers that can repeat an external effect. I use a caller-scoped idempotency key or stable domain identifier, persist the result with the mutation, and make duplicates return the original outcome. Idempotency does not turn an ambiguous external timeout into exactly once; it only bounds effects we control.

**Daniel Ruiz — Interviewer:** You introduced several components. What would you remove from version one?

**Aditi Malhotra — Candidate:** Start with one authoritative write region, globally replicated reads, cache-aside redirects, and asynchronous analytics. Do not begin with active-active link creation until write availability requirements justify global conflict handling.

**Daniel Ruiz — Interviewer:** I heard a technology reflex in that answer. Reconsider it.

**Aditi Malhotra — Candidate:** Aditi initially proposes putting every redirect behind a relational primary for strong consistency, then recognizes that availability and latency favor regional read replicas plus bounded status propagation. The correction is to restate the required capability first and select the simplest component the team can operate reliably.

**Daniel Ruiz — Interviewer:** How do you partition without creating a hot customer?

**Aditi Malhotra — Candidate:** Use a high-cardinality stable key for the primary write path and retain tenant as an authorization and fairness dimension. Very large tenants can be promoted to dedicated shards or scheduling buckets. I would not make tenant ID the only physical partition key when the prompt explicitly permits one tenant to dominate traffic.

**Daniel Ruiz — Interviewer:** What changes at ten times scale?

**Aditi Malhotra — Candidate:** I would first identify the measured bottleneck: edge bandwidth, hot metadata, queue lag, connection count, or background fan-out. Then scale that dimension through more partitions, regional reads, batching, or asynchronous work. I would not add multi-region consensus merely because the traffic number has another zero.

**Daniel Ruiz — Interviewer:** How do you turn the traffic estimate into an initial capacity plan?

**Aditi Malhotra — Candidate:** I separate steady state, stated peak, and controlled recovery load. Stateless services can begin with enough replicas for roughly twice the normal peak while autoscaling on saturation and queue age, but stateful partitions require measured item size, write amplification, replication, and hot-key headroom. I would load-test the dominant path and set an explicit admission limit before launch. Capacity without a rejection or backpressure policy is only an optimistic chart. For this design, I would verify it specifically at the requirements boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What is your consistency model from the user's perspective?

**Aditi Malhotra — Candidate:** Authoritative mutations use conditional or transactional writes in the home ownership boundary. Derived caches, indexes, analytics, and regional replicas are eventually consistent with a stated objective. For each stale read I name the user consequence and whether the system may serve stale, fail closed, or bypass the cache. Security revocation and destructive state receive a tighter propagation path than ordinary analytics freshness. For this design, I would verify it specifically at the ID generation boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How do schema changes remain compatible during a rolling deployment?

**Aditi Malhotra — Candidate:** Use versioned contracts and expand-migrate-contract: add fields or readers first, keep old writers valid, backfill or dual-read with measurable comparison, move writers, then remove the old form only after usage reaches zero. Consumers ignore unknown additive fields where safe. A breaking semantic change receives a new version rather than reusing the same field name with a different meaning. For this design, I would verify it specifically at the data model boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What lifecycle applies to the largest or fastest-growing data?

**Aditi Malhotra — Candidate:** Classify data by operational need, support window, audit, and legal retention. Hot state stays queryable; immutable payloads or history move to cheaper storage with indexes for bounded retrieval; expired derivatives can be rebuilt or deleted. Deletion is a workflow with tombstone, asynchronous cleanup, verification, and legal-hold checks. I would track bytes by tenant and class so retention policy has a measurable cost. For this design, I would verify it specifically at the cache boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How do you test correctness beyond unit tests?

**Aditi Malhotra — Candidate:** Use contract tests at API and event boundaries, deterministic fault injection for timeout and duplicate delivery, replay of representative production shapes with sensitive data removed, and invariant checks on sampled state. Staging should test recovery from partial completion, not only happy-path throughput. Before launch I would run a game day for the failure that creates the most ambiguous external or customer-visible state. For this design, I would verify it specifically at the abuse boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How would you control infrastructure cost without hiding product risk?

**Aditi Malhotra — Candidate:** Measure cost per successful user outcome, not only per request. The largest levers are retention, replication, egress, fan-out, cache efficiency, and retry amplification. I would set budgets and alert on trend, then change compression, lifecycle, batching, or tiering with correctness guardrails. Removing redundancy or shortening audit retention purely to hit a bill target requires an explicit product and risk decision. For this design, I would verify it specifically at the requirements boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What does a safe migration from an existing system look like?

**Aditi Malhotra — Candidate:** Inventory callers and data ownership, define compatibility, then use shadow reads or dual calculations where results can be compared. Backfill is partitioned and resumable, with rate limits so it cannot starve normal traffic. Cut over by low-risk tenant or region, retain a bounded rollback path, and stop dual behavior after evidence and a deadline; permanent dual writes create a second source of truth. For this design, I would verify it specifically at the ID generation boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** If one partition becomes hot, how do you detect and repair it?

**Aditi Malhotra — Candidate:** Observe per-partition throughput, latency, queue age, key distribution, and throttling. Short-term mitigation can isolate or rate-limit the hot key, increase cache or consumer capacity, and protect other shards. Durable repair may split by a secondary hash, promote a large tenant, or change a fan-out model. Repartitioning needs a versioned routing map and gradual movement so clients do not guess ownership. For this design, I would verify it specifically at the data model boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What changes if the home region is unavailable for several hours?

**Aditi Malhotra — Candidate:** Read-only or bounded-stale operations can fail over to a replica if the product accepts the state. For writes, promote only after fencing the old region and confirming the recovery point; otherwise two authorities can diverge. Queue new work durably where possible and expose delayed state. When the region returns, reconcile from versioned logs and drain deliberately instead of replaying every operation at full speed. For this design, I would verify it specifically at the cache boundary rather than assume the generic rule is enough.

### Data, APIs, and detailed path — approximately 17:00-25:00

**Daniel Ruiz — Interviewer:** Give me the minimum useful data model.

**Aditi Malhotra — Candidate:** Link has internal ID, public code, tenant ID, destination, created and expiry times, status, version, and optional alias. A unique index protects tenant-plus-alias; generated public codes use an ID service and Base62 encoding or sufficiently large random values with collision checks. Click events contain link ID, coarse time, region, and privacy-limited attributes.

**Daniel Ruiz — Interviewer:** Which APIs define the product contract?

**Aditi Malhotra — Candidate:** POST /links accepts destination, expiry, and optional alias with an idempotency key; GET /links/{id} and PATCH status manage links; GET /analytics is eventually consistent. The public GET /{code} path is unauthenticated but heavily rate-limited and abuse monitored.

**Daniel Ruiz — Interviewer:** How do you prevent a database write followed by a failed queue publish from losing work?

**Aditi Malhotra — Candidate:** Write an outbox record in the same transaction as the authoritative mutation. A publisher sends it at least once and marks progress. Consumers deduplicate using the stable entity or event ID. If the chosen data store lacks multi-record transactions, co-locate the state and outbox in one atomic item or use a durable log as the source rather than hand-wave a cross-system transaction.

**Daniel Ruiz — Interviewer:** What data belongs outside the primary control store?

**Aditi Malhotra — Candidate:** Large immutable bytes, append-only raw events, search indexes, and analytics aggregates should use stores suited to those access patterns. The primary control store retains identifiers, ownership, versions, state, and references. Separation reduces cost and hot-row pressure, but each external object needs lifecycle and consistency rules so metadata cannot point forever at missing content.

**Daniel Ruiz — Interviewer:** How are concurrent updates handled?

**Aditi Malhotra — Candidate:** Use version numbers or conditional writes for user-visible mutable state. A stale client receives a conflict and refreshes rather than overwriting a newer decision. For workflows, state transitions are explicit and monotonic where possible; background workers carry the version or fencing token they claimed.

**Daniel Ruiz — Interviewer:** What would you cache?

**Aditi Malhotra — Candidate:** Cache only read-heavy values with a clear invalidation or bounded-staleness rule. Include entity version in the cached value, use jittered TTLs, and protect misses with request coalescing. Security revocation and destructive state usually need shorter TTLs or an active invalidation path than ordinary immutable content.

### Failures, overload, and operations — approximately 25:00-27:00

**Daniel Ruiz — Interviewer:** Pressure-test the design against cache stampede on a viral link. What happens and how does it recover?

**Aditi Malhotra — Candidate:** For cache stampede on a viral link, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against stale disabled-link cache. What happens and how does it recover?

**Aditi Malhotra — Candidate:** For stale disabled-link cache, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against hot custom alias abuse. What happens and how does it recover?

**Aditi Malhotra — Candidate:** For hot custom alias abuse, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against ID-generator outage. What happens and how does it recover?

**Aditi Malhotra — Candidate:** For ID-generator outage, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against analytics queue backlog. What happens and how does it recover?

**Aditi Malhotra — Candidate:** For analytics queue backlog, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against destination phishing and open-redirect abuse. What happens and how does it recover?

**Aditi Malhotra — Candidate:** For destination phishing and open-redirect abuse, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against regional read-store failure. What happens and how does it recover?

**Aditi Malhotra — Candidate:** For regional read-store failure, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** How do you protect healthy tenants while recovering a backlog?

**Aditi Malhotra — Candidate:** Separate new work from retries, reserve capacity for the normal path, and apply tenant and endpoint admission controls. Recovery drains by oldest age and priority while watching saturation and downstream success. A large failed tenant cannot consume every worker merely because its queue is deepest.

**Daniel Ruiz — Interviewer:** What is the disaster-recovery posture?

**Aditi Malhotra — Candidate:** Start with replicated durable data and a tested regional failover procedure. If the design uses a home write region, failover requires a fencing or promotion decision before writes resume elsewhere. Read paths may fail over sooner if bounded staleness is acceptable. Define recovery-time and recovery-point objectives rather than claiming instant lossless failover.

### Security, observability, and recap — approximately 27:00-32:00

**Daniel Ruiz — Interviewer:** Give me the highest-risk security controls.

**Aditi Malhotra — Candidate:** Validate schemes, block dangerous destinations according to product policy, isolate tenant control APIs, encrypt metadata, rate-limit redirects and creates, maintain abuse scanning and takedown audit, and avoid placing full IP addresses in long-lived analytics without a defined privacy need. I would threat-model the public or cross-tenant boundary and make authorization part of the normal data path, not a gateway-only assumption.

**Daniel Ruiz — Interviewer:** What would you alert on?

**Aditi Malhotra — Candidate:** Redirect availability and latency, cache hit rate, source-store errors, disabled-link propagation delay, create conflicts, click-buffer loss, abuse decisions, and per-region saturation; trace by request and link ID while keeping tenant cardinality controlled. Alerts should connect to user impact or exhaustion trends; dashboards alone are not an operating mechanism.

**Daniel Ruiz — Interviewer:** How does support trace one customer's report?

**Aditi Malhotra — Candidate:** Expose a safe request, entity, and attempt identifier to the customer. Carry it through logs, queue messages, traces, and state history. Support can retrieve status without viewing sensitive payloads, while operators can pivot by region, shard, response category, and version.

**Daniel Ruiz — Interviewer:** How would you roll out the riskiest change?

**Aditi Malhotra — Candidate:** Use shadow reads or dual writes only where their comparison semantics are clear, then canary by tenant and region with automated rollback thresholds. Validate recovery, not only success. Keep old readers compatible until the migration checkpoint proves they are no longer needed.

**Daniel Ruiz — Interviewer:** Give me a short recap and name the tradeoff you would expect me to challenge.

**Aditi Malhotra — Candidate:** The design separates a strongly controlled creation path from a highly available redirect path. One authoritative write region owns link identity, regional services serve replicated immutable destinations through caches, mutable disable state has a one-minute propagation objective, and analytics is asynchronous. The main tradeoff is accepting bounded stale reads to keep redirects fast and available; abuse and disabled-link freshness are the risks I would challenge first.

### Candidate questions and close — approximately 32:00-35:00

**Daniel Ruiz — Interviewer:** I have what I need. What questions do you have for me?

**Aditi Malhotra — Candidate:** Which part of this system is hardest for the team in production today?

**Daniel Ruiz — Interviewer:** Cache freshness for takedowns and abuse control is harder than generating short codes.

**Aditi Malhotra — Candidate:** That aligns with the failure cases we discussed.

**Aditi Malhotra — Candidate:** How are design decisions reviewed across time zones?

**Daniel Ruiz — Interviewer:** The author posts a short proposal with a deadline and named decider. Most comments are asynchronous; unresolved tradeoffs get a focused overlap call and a written decision afterward.

**Aditi Malhotra — Candidate:** That is the working model I'm looking for.

**Aditi Malhotra — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Daniel Ruiz — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Aditi Malhotra — Candidate:** Understood. Thank you, Daniel. Have a good day.

**Daniel Ruiz — Interviewer:** You too, Aditi. Take care.

## Timing plan

- Interviewer words: 767 at approximately 145 words per minute.
- Candidate words: 2827 at approximately 125 words per minute.
- Dialogue turns: 115, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 6.3 minutes.
- Estimated finished duration: 35.0 minutes; catalog target: 35 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Requirements | Check whether architecture follows product semantics. | The candidate separates in-scope actions, quality promises, and non-goals. | Do not begin by naming a database. |
| Estimate challenge | Test false precision and distribution awareness. | The candidate names the weak tail assumption and preserves only decisions the estimate supports. | A useful estimate changes a design choice. |
| Technology reflex | See whether familiarity overrides requirements. | Aditi initially proposes putting every redirect behind a relational primary for strong consistency, then recognizes that availability and latency favor regional read replicas plus bounded status propagation. | Correct the model openly instead of defending a familiar tool. |
| Failure recovery | Test whether the design survives ambiguous and overloaded states. | The candidate uses bounded retry, explicit state, fairness, and controlled drain. | Recovery behavior is part of the product contract. |
| Recap | Check prioritization. | The candidate names one central tradeoff and residual risk. | A concise recap gives the interviewer something meaningful to challenge. |

## Deliberate imperfections to preserve

- Aditi initially proposes putting every redirect behind a relational primary for strong consistency, then recognizes that availability and latency favor regional read replicas plus bounded status propagation.
- The first estimate relies on an average or median and is corrected after the interviewer asks about the tail.
- The initial design contains one component that is removed when the interviewer asks for an operable first version.

