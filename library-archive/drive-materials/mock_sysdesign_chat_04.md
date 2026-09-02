---
id: mock_sysdesign_chat_04
status: audio_complete_video_pending
category: sysdesign
round: system_design
duration_target_minutes: 35
candidate: Varun Menon (fictional), Pune, 3 years, full-stack engineer
interviewer: Daniel Ruiz (fictional), California, staff engineer
candidate_voice_id: 19e0687c-bbd8-4398-9844-512ba01981ee
interviewer_voice_id: cb1a4fae-dad5-4729-bd73-a43f570b9117
simulation_disclosure: metadata_and_product_page_only
---

# Design Team Chat for Remote Work

## Private scenario card

Varun is interviewing for a fictional US remote engineering role and must design design team chat for remote work. The round intentionally challenges one estimate and one familiar-technology reflex. Facts are revealed only when asked, and the design must remain operable for an India-based engineer sharing ownership across time zones.

## Dialogue

### Connection, introduction, and frame — approximately 00:00-03:00

**Daniel Ruiz — Interviewer:** Hi, Varun. Can you hear me clearly?

**Varun Menon — Candidate:** Hi, Daniel. Yes, I can hear you. Is my audio okay?

**Daniel Ruiz — Interviewer:** It is. There was a brief delay when you joined, but it seems stable now. If it changes, we'll pause rather than talk over the connection.

**Varun Menon — Candidate:** Sounds good. Thank you.

**Daniel Ruiz — Interviewer:** We have about forty-five minutes. We'll spend most of it on a system-design problem. I care about requirements, tradeoffs, and failure behavior more than drawing every possible component. I'll redirect if we need to move on.

**Varun Menon — Candidate:** Yes, that works for me.

**Daniel Ruiz — Interviewer:** Before we get into the main round, could you give me a brief description of yourself and what you've been working on recently?

**Varun Menon — Candidate:** I'm a backend and platform engineer whose recent work includes real-time collaboration features in TypeScript and Go. I have designed event-driven and data-intensive services, operated them on call, and led bounded migrations. I have not built every feature in today's prompt at the exact stated scale, so I will use the requirements we establish rather than pretend my previous architecture transfers unchanged.

**Daniel Ruiz — Interviewer:** What architecture or operational decision in that work was specifically yours?

**Varun Menon — Candidate:** In my current work on real-time collaboration features in TypeScript and Go, I owned the service boundary, failure contract, and rollout metrics for one major change. A staff engineer reviewed the design, two engineers shared implementation, and another team owned the upstream producer. My decisions were the consistency boundary, the recovery behavior, and when staged traffic could advance.

### Prompt and requirements — approximately 03:00-08:00

**Daniel Ruiz — Interviewer:** Design team chat for a remote-work product, including direct messages and channels.

**Varun Menon — Candidate:** Who are the users, and which actions are in scope?

**Daniel Ruiz — Interviewer:** Users send text messages, create channels, receive messages in real time, reconnect after being offline, and see basic delivery state. Presence, reactions, and full-text search are secondary; voice and video are out of scope.

**Varun Menon — Candidate:** What scale, read-write shape, and latency should drive the design?

**Daniel Ruiz — Interviewer:** One million daily active users, one hundred thousand concurrent connections, ten thousand message writes per second at peak, and a much higher fan-out delivery rate. Retain message history for years; first online delivery should usually be under one second.

**Varun Menon — Candidate:** Which correctness, availability, or ordering promises matter most?

**Daniel Ruiz — Interviewer:** A sent message must be durable before acknowledgment. Preserve order within a conversation using server-assigned sequence, not global order. Reconnect must fill gaps without duplicating the visible message. Large channels need fan-out controls.

**Varun Menon — Candidate:** Should I include user-interface implementation, billing, and advanced analytics?

**Daniel Ruiz — Interviewer:** No. Define backend APIs and behavior, but exclude UI implementation, billing, and features not named in scope.

**Varun Menon — Candidate:** May I choose a home region or should every write be active-active globally?

**Daniel Ruiz — Interviewer:** Start with the simplest regional model that meets the requirement. Explain what would force you to add multi-region write complexity.

**Varun Menon — Candidate:** What retention, audit, and deletion behavior should I preserve?

**Daniel Ruiz — Interviewer:** Retain operational history long enough for customer support and audit. State a reasonable policy and separate reversible soft deletion from irreversible cleanup.

**Varun Menon — Candidate:** I'll design the core actions and contracts just named, optimize for the stated peak and quality priorities, and exclude the advanced features. I will identify the source of truth, one detailed write and read path, then test failures and regional behavior. The most important domain constraints appear to be: A sent message must be durable before acknowledgment. Preserve order within a conversation using server-assigned sequence, not global order. Reconnect must fill gaps without duplicating the visible message. Large channels need fan-out controls.

**Daniel Ruiz — Interviewer:** That scope is right. Go ahead.

### Scale, invariants, and high-level design — approximately 08:00-17:00

**Varun Menon — Candidate:** Ten thousand writes per second with perhaps one kilobyte of text and metadata is about ten megabytes per second before replication, under one terabyte per day. Fan-out can be orders of magnitude larger than writes, so connection gateways and large-channel delivery dominate network work. History storage grows steadily and needs partition and retention planning.

**Daniel Ruiz — Interviewer:** Which assumption in that estimate is weakest, and which decision would change if it is wrong?

**Varun Menon — Candidate:** The distribution tail is weaker than the average: hot tenants, large payloads, or fan-out can dominate even when aggregate volume looks manageable. I would measure the ninety-fifth and ninety-ninth percentiles and enforce explicit limits. The estimate supports separating high-volume immutable data from control metadata, but I would not purchase capacity or choose a partition count from one median number.

**Daniel Ruiz — Interviewer:** What correctness or product invariants are you protecting?

**Varun Menon — Candidate:** A sent message must be durable before acknowledgment. Preserve order within a conversation using server-assigned sequence, not global order. Reconnect must fill gaps without duplicating the visible message. Large channels need fan-out controls. I would also require idempotent client retries, an auditable state transition for every durable mutation, and bounded recovery so an outage cannot convert into a second overload incident.

**Daniel Ruiz — Interviewer:** Walk me through the high-level design.

**Varun Menon — Candidate:** Clients maintain WebSocket connections to regional gateways. A message API authenticates membership, assigns an idempotent message ID and conversation sequence, persists the message, then publishes a conversation event. Fan-out services route to online gateway sessions and update per-user inbox or cursor state. Offline clients fetch history after their last acknowledged sequence. Search indexing and push notifications consume asynchronously.

**Daniel Ruiz — Interviewer:** Where is the source of truth?

**Varun Menon — Candidate:** The authoritative control and user-visible state follows this model: Conversation stores type and membership version. Message is keyed by conversation and monotonically increasing sequence, with sender, client idempotency key, body reference, and timestamps. Membership changes are versioned. UserConversationState tracks last read or delivered sequence, while ephemeral presence lives in a TTL store. Caches, indexes, analytics, and queues are derived or transport layers; each needs a named freshness and rebuild path.

**Daniel Ruiz — Interviewer:** Walk one accepted write through the system.

**Varun Menon — Candidate:** A client sends with a stable client ID. The service checks membership, conditionally creates the message, obtains the next conversation sequence, persists before acknowledgment, and publishes. Gateways deliver to active sessions; a reconnect sends the last received sequence and fetches the missing range. Duplicated events collapse on message ID and sequence.

**Daniel Ruiz — Interviewer:** Where do you need idempotency?

**Varun Menon — Candidate:** At the public mutation boundary, at every database-to-queue handoff, and at consumers that can repeat an external effect. I use a caller-scoped idempotency key or stable domain identifier, persist the result with the mutation, and make duplicates return the original outcome. Idempotency does not turn an ambiguous external timeout into exactly once; it only bounds effects we control.

**Daniel Ruiz — Interviewer:** You introduced several components. What would you remove from version one?

**Varun Menon — Candidate:** Use one home region per conversation initially, partition history by conversation, and replicate for disaster recovery. Avoid global multi-writer ordering until product requirements demand cross-region write availability.

**Daniel Ruiz — Interviewer:** I heard a technology reflex in that answer. Reconsider it.

**Varun Menon — Candidate:** Varun initially proposes writing every recipient inbox row synchronously before acknowledging the message, then recognizes that very large channels require durable message-first acknowledgment and asynchronous fan-out. The correction is to restate the required capability first and select the simplest component the team can operate reliably.

**Daniel Ruiz — Interviewer:** How do you partition without creating a hot customer?

**Varun Menon — Candidate:** Use a high-cardinality stable key for the primary write path and retain tenant as an authorization and fairness dimension. Very large tenants can be promoted to dedicated shards or scheduling buckets. I would not make tenant ID the only physical partition key when the prompt explicitly permits one tenant to dominate traffic.

**Daniel Ruiz — Interviewer:** What changes at ten times scale?

**Varun Menon — Candidate:** I would first identify the measured bottleneck: edge bandwidth, hot metadata, queue lag, connection count, or background fan-out. Then scale that dimension through more partitions, regional reads, batching, or asynchronous work. I would not add multi-region consensus merely because the traffic number has another zero.

**Daniel Ruiz — Interviewer:** How do you turn the traffic estimate into an initial capacity plan?

**Varun Menon — Candidate:** I separate steady state, stated peak, and controlled recovery load. Stateless services can begin with enough replicas for roughly twice the normal peak while autoscaling on saturation and queue age, but stateful partitions require measured item size, write amplification, replication, and hot-key headroom. I would load-test the dominant path and set an explicit admission limit before launch. Capacity without a rejection or backpressure policy is only an optimistic chart. For this design, I would verify it specifically at the websockets boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What is your consistency model from the user's perspective?

**Varun Menon — Candidate:** Authoritative mutations use conditional or transactional writes in the home ownership boundary. Derived caches, indexes, analytics, and regional replicas are eventually consistent with a stated objective. For each stale read I name the user consequence and whether the system may serve stale, fail closed, or bypass the cache. Security revocation and destructive state receive a tighter propagation path than ordinary analytics freshness. For this design, I would verify it specifically at the ordering boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How do schema changes remain compatible during a rolling deployment?

**Varun Menon — Candidate:** Use versioned contracts and expand-migrate-contract: add fields or readers first, keep old writers valid, backfill or dual-read with measurable comparison, move writers, then remove the old form only after usage reaches zero. Consumers ignore unknown additive fields where safe. A breaking semantic change receives a new version rather than reusing the same field name with a different meaning. For this design, I would verify it specifically at the presence boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What lifecycle applies to the largest or fastest-growing data?

**Varun Menon — Candidate:** Classify data by operational need, support window, audit, and legal retention. Hot state stays queryable; immutable payloads or history move to cheaper storage with indexes for bounded retrieval; expired derivatives can be rebuilt or deleted. Deletion is a workflow with tombstone, asynchronous cleanup, verification, and legal-hold checks. I would track bytes by tenant and class so retention policy has a measurable cost. For this design, I would verify it specifically at the offline delivery boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How do you test correctness beyond unit tests?

**Varun Menon — Candidate:** Use contract tests at API and event boundaries, deterministic fault injection for timeout and duplicate delivery, replay of representative production shapes with sensitive data removed, and invariant checks on sampled state. Staging should test recovery from partial completion, not only happy-path throughput. Before launch I would run a game day for the failure that creates the most ambiguous external or customer-visible state. For this design, I would verify it specifically at the search boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** How would you control infrastructure cost without hiding product risk?

**Varun Menon — Candidate:** Measure cost per successful user outcome, not only per request. The largest levers are retention, replication, egress, fan-out, cache efficiency, and retry amplification. I would set budgets and alert on trend, then change compression, lifecycle, batching, or tiering with correctness guardrails. Removing redundancy or shortening audit retention purely to hit a bill target requires an explicit product and risk decision. For this design, I would verify it specifically at the websockets boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What does a safe migration from an existing system look like?

**Varun Menon — Candidate:** Inventory callers and data ownership, define compatibility, then use shadow reads or dual calculations where results can be compared. Backfill is partitioned and resumable, with rate limits so it cannot starve normal traffic. Cut over by low-risk tenant or region, retain a bounded rollback path, and stop dual behavior after evidence and a deadline; permanent dual writes create a second source of truth. For this design, I would verify it specifically at the ordering boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** If one partition becomes hot, how do you detect and repair it?

**Varun Menon — Candidate:** Observe per-partition throughput, latency, queue age, key distribution, and throttling. Short-term mitigation can isolate or rate-limit the hot key, increase cache or consumer capacity, and protect other shards. Durable repair may split by a secondary hash, promote a large tenant, or change a fan-out model. Repartitioning needs a versioned routing map and gradual movement so clients do not guess ownership. For this design, I would verify it specifically at the presence boundary rather than assume the generic rule is enough.

**Daniel Ruiz — Interviewer:** What changes if the home region is unavailable for several hours?

**Varun Menon — Candidate:** Read-only or bounded-stale operations can fail over to a replica if the product accepts the state. For writes, promote only after fencing the old region and confirming the recovery point; otherwise two authorities can diverge. Queue new work durably where possible and expose delayed state. When the region returns, reconcile from versioned logs and drain deliberately instead of replaying every operation at full speed. For this design, I would verify it specifically at the offline delivery boundary rather than assume the generic rule is enough.

### Data, APIs, and detailed path — approximately 17:00-25:00

**Daniel Ruiz — Interviewer:** Give me the minimum useful data model.

**Varun Menon — Candidate:** Conversation stores type and membership version. Message is keyed by conversation and monotonically increasing sequence, with sender, client idempotency key, body reference, and timestamps. Membership changes are versioned. UserConversationState tracks last read or delivered sequence, while ephemeral presence lives in a TTL store.

**Daniel Ruiz — Interviewer:** Which APIs define the product contract?

**Varun Menon — Candidate:** POST /conversations/{id}/messages accepts a client message ID; GET messages uses sequence cursors; WebSocket events include conversation, sequence, message ID, and type. Membership APIs update authorization separately. Search is eventually consistent and cannot be the source of message history.

**Daniel Ruiz — Interviewer:** How do you prevent a database write followed by a failed queue publish from losing work?

**Varun Menon — Candidate:** Write an outbox record in the same transaction as the authoritative mutation. A publisher sends it at least once and marks progress. Consumers deduplicate using the stable entity or event ID. If the chosen data store lacks multi-record transactions, co-locate the state and outbox in one atomic item or use a durable log as the source rather than hand-wave a cross-system transaction.

**Daniel Ruiz — Interviewer:** What data belongs outside the primary control store?

**Varun Menon — Candidate:** Large immutable bytes, append-only raw events, search indexes, and analytics aggregates should use stores suited to those access patterns. The primary control store retains identifiers, ownership, versions, state, and references. Separation reduces cost and hot-row pressure, but each external object needs lifecycle and consistency rules so metadata cannot point forever at missing content.

**Daniel Ruiz — Interviewer:** How are concurrent updates handled?

**Varun Menon — Candidate:** Use version numbers or conditional writes for user-visible mutable state. A stale client receives a conflict and refreshes rather than overwriting a newer decision. For workflows, state transitions are explicit and monotonic where possible; background workers carry the version or fencing token they claimed.

**Daniel Ruiz — Interviewer:** What would you cache?

**Varun Menon — Candidate:** Cache only read-heavy values with a clear invalidation or bounded-staleness rule. Include entity version in the cached value, use jittered TTLs, and protect misses with request coalescing. Security revocation and destructive state usually need shorter TTLs or an active invalidation path than ordinary immutable content.

### Failures, overload, and operations — approximately 25:00-27:00

**Daniel Ruiz — Interviewer:** Pressure-test the design against gateway disconnect during send. What happens and how does it recover?

**Varun Menon — Candidate:** For gateway disconnect during send, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against duplicate client retry. What happens and how does it recover?

**Varun Menon — Candidate:** For duplicate client retry, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against fan-out worker backlog. What happens and how does it recover?

**Varun Menon — Candidate:** For fan-out worker backlog, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against large channel hot partition. What happens and how does it recover?

**Varun Menon — Candidate:** For large channel hot partition, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against membership removal racing delivery. What happens and how does it recover?

**Varun Menon — Candidate:** For membership removal racing delivery, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against sequence allocator failure. What happens and how does it recover?

**Varun Menon — Candidate:** For sequence allocator failure, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** Pressure-test the design against search index lag. What happens and how does it recover?

**Varun Menon — Candidate:** For search index lag, I first preserve the source-of-truth invariant and prevent unbounded retry. The system records an explicit degraded state, uses deadlines, backoff, jitter, and idempotent transitions, and exposes the condition through user-impact metrics. Recovery is controlled rather than releasing the whole backlog at once. For this design specifically, the affected component follows the ownership boundary already described, and any ambiguous external effect remains visible rather than being relabeled success.

**Daniel Ruiz — Interviewer:** How do you protect healthy tenants while recovering a backlog?

**Varun Menon — Candidate:** Separate new work from retries, reserve capacity for the normal path, and apply tenant and endpoint admission controls. Recovery drains by oldest age and priority while watching saturation and downstream success. A large failed tenant cannot consume every worker merely because its queue is deepest.

**Daniel Ruiz — Interviewer:** What is the disaster-recovery posture?

**Varun Menon — Candidate:** Start with replicated durable data and a tested regional failover procedure. If the design uses a home write region, failover requires a fencing or promotion decision before writes resume elsewhere. Read paths may fail over sooner if bounded staleness is acceptable. Define recovery-time and recovery-point objectives rather than claiming instant lossless failover.

### Security, observability, and recap — approximately 27:00-32:00

**Daniel Ruiz — Interviewer:** Give me the highest-risk security controls.

**Varun Menon — Candidate:** Authorize conversation membership on writes and history reads, encrypt content, minimize message bodies in logs, audit admin access, scan links and attachments through separate systems, rate-limit abusive clients, and make membership changes invalidate cached authorization quickly. I would threat-model the public or cross-tenant boundary and make authorization part of the normal data path, not a gateway-only assumption.

**Daniel Ruiz — Interviewer:** What would you alert on?

**Varun Menon — Candidate:** Send acknowledgment latency, durable write failures, online delivery latency, reconnect gap size, fan-out oldest age, duplicate client IDs, gateway connection saturation, hot conversations, and membership authorization errors. Alerts should connect to user impact or exhaustion trends; dashboards alone are not an operating mechanism.

**Daniel Ruiz — Interviewer:** How does support trace one customer's report?

**Varun Menon — Candidate:** Expose a safe request, entity, and attempt identifier to the customer. Carry it through logs, queue messages, traces, and state history. Support can retrieve status without viewing sensitive payloads, while operators can pivot by region, shard, response category, and version.

**Daniel Ruiz — Interviewer:** How would you roll out the riskiest change?

**Varun Menon — Candidate:** Use shadow reads or dual writes only where their comparison semantics are clear, then canary by tenant and region with automated rollback thresholds. Validate recovery, not only success. Keep old readers compatible until the migration checkpoint proves they are no longer needed.

**Daniel Ruiz — Interviewer:** Give me a short recap and name the tradeoff you would expect me to challenge.

**Varun Menon — Candidate:** Messages become durable and ordered within a conversation before the sender is acknowledged. WebSocket gateways handle live sessions, asynchronous fan-out protects writes from large channels, and sequence-based gap recovery serves offline clients. The main tradeoff is message-first durability versus immediate per-recipient state; I accept eventual fan-out so one large channel cannot make the write path unbounded.

### Candidate questions and close — approximately 32:00-35:00

**Daniel Ruiz — Interviewer:** I have what I need. What questions do you have for me?

**Varun Menon — Candidate:** Which part of this system is hardest for the team in production today?

**Daniel Ruiz — Interviewer:** Large-channel fan-out and reconnect correctness are the most operationally difficult areas.

**Varun Menon — Candidate:** That aligns with the failure cases we discussed.

**Varun Menon — Candidate:** How are design decisions reviewed across time zones?

**Daniel Ruiz — Interviewer:** The author posts a short proposal with a deadline and named decider. Most comments are asynchronous; unresolved tradeoffs get a focused overlap call and a written decision afterward.

**Varun Menon — Candidate:** That is the working model I'm looking for.

**Varun Menon — Candidate:** Those were my main questions. Thank you for the context and for your time.

**Daniel Ruiz — Interviewer:** I need to finish my notes and compare them with the rest of the interview team, so I won't give feedback on this call. The recruiter will contact you about the next step within a few business days.

**Varun Menon — Candidate:** Understood. Thank you, Daniel. Have a good day.

**Daniel Ruiz — Interviewer:** You too, Varun. Take care.

## Timing plan

- Interviewer words: 759 at approximately 145 words per minute.
- Candidate words: 2784 at approximately 125 words per minute.
- Dialogue turns: 115, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 6.7 minutes.
- Estimated finished duration: 35.0 minutes; catalog target: 35 minutes.

## Sparse overlap plan

1. The interviewer begins a narrowing follow-up under the final 200 ms of the candidate's broad opening. Keep both voices intelligible and neutral.
2. The candidate starts a brief acknowledgment about 160 ms before the interviewer finishes a later transition. Do not repeat this pattern elsewhere.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Requirements | Check whether architecture follows product semantics. | The candidate separates in-scope actions, quality promises, and non-goals. | Do not begin by naming a database. |
| Estimate challenge | Test false precision and distribution awareness. | The candidate names the weak tail assumption and preserves only decisions the estimate supports. | A useful estimate changes a design choice. |
| Technology reflex | See whether familiarity overrides requirements. | Varun initially proposes writing every recipient inbox row synchronously before acknowledging the message, then recognizes that very large channels require durable message-first acknowledgment and asynchronous fan-out. | Correct the model openly instead of defending a familiar tool. |
| Failure recovery | Test whether the design survives ambiguous and overloaded states. | The candidate uses bounded retry, explicit state, fairness, and controlled drain. | Recovery behavior is part of the product contract. |
| Recap | Check prioritization. | The candidate names one central tradeoff and residual risk. | A concise recap gives the interviewer something meaningful to challenge. |

## Deliberate imperfections to preserve

- Varun initially proposes writing every recipient inbox row synchronously before acknowledging the message, then recognizes that very large channels require durable message-first acknowledgment and asynchronous fan-out.
- The first estimate relies on an average or median and is corrected after the interviewer asks about the tail.
- The initial design contains one component that is removed when the interviewer asks for an operable first version.

