---
id: mock_sysdesign_webhook-delivery_03
status: audio_complete_video_pending
category: sysdesign
round: system_design
duration_target_minutes: 35
candidate: Neha Kulkarni (fictional), Hyderabad, 6 years, platform engineer
interviewer: Daniel Ruiz (fictional), US-based staff engineer
candidate_voice_id: 8b55b7c5-4c05-4968-a80e-c91e152d58b9
interviewer_voice_id: 8b9ed861-3382-455d-9c03-a40671943d6b
simulation_disclosure: metadata_and_product_page_only
---

# Design a Reliable Webhook Delivery Service

## Private scenario card

Neha is interviewing for a senior backend role on a remote platform team. She
has designed event-driven systems but has not built a commercial webhook
platform at the exact scale in the prompt. Daniel has forty-five minutes. He
will reveal requirements only when asked and will redirect the conversation
from broad architecture toward delivery semantics, overload, and tenant
isolation. Both speakers can see a shared whiteboard, but the learner's Match
View remains the static two-person scene; a clean reference diagram belongs in
the companion Coach layer, not the interview video.

## Dialogue

### Connection, introduction, and agenda — approximately 00:00-02:30

**Daniel — Interviewer:** Hi, Neha. Can you hear me?

**Neha — Candidate:** Yes. Hi, Daniel. I can hear you. Is my audio clear?

**Daniel — Interviewer:** It is. Your video froze for a second, but audio is
stable. If the connection gets worse, we can turn video off. How is your day
going?

**Neha — Candidate:** Going well, thank you. It's late afternoon here, so this
is a good time.

**Daniel — Interviewer:** Great. We have about forty-five minutes. We'll spend
the first few minutes on introductions, then most of the time on a design
problem. I care more about how you make decisions than how many boxes you draw.
Please ask questions and think aloud. I'll interrupt if I want to go deeper or
move us along. We'll save a few minutes at the end for your questions.

**Neha — Candidate:** Sounds good.

**Daniel — Interviewer:** Before we start the design, could you give me a brief
description of your background and what you've been working on?

**Neha — Candidate:** Sure. I'm a platform engineer with six years of backend
experience. I currently work at a B2B commerce company called
MarketDock in Hyderabad. My team owns internal event delivery and merchant
integrations. We process order and inventory changes from about thirty internal
services, mostly through Kafka and Kotlin services, with PostgreSQL for control
data.

In the last year I led a retry and replay redesign after duplicate inventory
updates caused operational issues for two merchants. I wrote the proposal,
built the idempotency and replay path with two other engineers, and coordinated
the migration with four producer teams. I haven't operated a public webhook
product at extremely large scale, but I have worked on similar delivery and
failure problems.

**Daniel — Interviewer:** Helpful. Let's use that experience, but don't feel
you have to copy your current system.

### Prompt and requirement discovery — approximately 02:30-08:00

**Daniel — Interviewer:** Design a webhook delivery service. Our product teams
produce events, and external customers want those events sent to endpoints they
control. How would you approach it?

**Neha — Candidate:** I'll first clarify the product behavior and scale, then I
can propose a high-level design, define the data and delivery semantics, and
spend time on failures and operations. Is that a reasonable structure?

**Daniel — Interviewer:** Yes.

**Neha — Candidate:** Who are the users? Are these companies integrating their
servers with us, rather than individual end users?

**Daniel — Interviewer:** Correct. Think of SaaS customers. A tenant can
register one or more HTTPS endpoints and subscribe each endpoint to event
types—for example, an invoice being paid or an account being updated.

**Neha — Candidate:** Do we own the source events, or do producers call this
service after their business transaction? I'm asking because I want to avoid
losing an event between the source-of-truth write and publication.

**Daniel — Interviewer:** Internal product services own the business data.
Today they already publish durable domain events to a company event bus. You
can consume from that bus. You don't need to redesign every producer.

**Neha — Candidate:** Good. For delivery, should I assume at-least-once is
acceptable? Exactly-once delivery to an arbitrary customer server isn't really
something we can guarantee across an HTTP boundary.

**Daniel — Interviewer:** At-least-once is acceptable. Customers receive a
stable event ID so they can deduplicate. We should not silently drop an event.

**Neha — Candidate:** Is ordering required?

**Daniel — Interviewer:** Customers expect events for the same account to be
usually ordered, but strict global ordering is not required. If preserving
ordering would block all later events behind one failure, we prefer progress
and clear sequence metadata.

**Neha — Candidate:** Understood—best-effort order with a sequence or version,
not a promise that would create head-of-line blocking. What's the latency goal
for the first attempt, and how long do we retry?

**Daniel — Interviewer:** Ninety-nine percent of first attempts should start
within thirty seconds. Retry for up to twenty-four hours. Customers should be
able to inspect attempts and manually replay an event for seven days.

**Neha — Candidate:** For the replay, do we need to preserve the exact original
payload, including its schema version, or reconstruct it from current business
data?

**Daniel — Interviewer:** Preserve the exact payload that was originally sent.

**Neha — Candidate:** Okay. Authentication: I assume we sign requests with a
per-endpoint secret. Do customers also require fixed outbound IPs or mutual
TLS?

**Daniel — Interviewer:** HMAC signing is required. Fixed egress ranges are
important for enterprise customers. Mutual TLS can be a later extension.

**Neha — Candidate:** And can I get rough scale—tenants, events per day, peak,
and typical payload size?

**Daniel — Interviewer:** Fifteen thousand tenants, two hundred million event
deliveries per day, and a normal peak around fifteen thousand deliveries per
second. During catch-up after an outage, offered load can be much higher. The
median payload is about two kilobytes; cap it at two hundred fifty-six
kilobytes. One tenant can account for ten percent of traffic.

**Neha — Candidate:** That hot tenant and catch-up load will influence
partitioning and fairness. Last scope question: do tenants manage endpoints and
subscriptions through an API, a UI, or both?

**Daniel — Interviewer:** Both, but you only need to define the APIs and backend
behavior. Ignore the UI implementation, billing, and the internal event bus.

**Neha — Candidate:** Great. I'll treat endpoint registration, subscription,
automatic delivery, attempt history, disablement, and replay as in scope. I'll
exclude custom payload transformations and mutual TLS for now.

### Estimates and invariants — approximately 08:00-10:30

**Neha — Candidate:** Let me do only the estimates that affect the design. Two
hundred million deliveries per day is roughly twenty-three hundred per second
on average, but the given normal peak is fifteen thousand per second, so I'll
design the worker path for that peak with headroom—perhaps thirty thousand
attempt starts per second initially. Catch-up should be controlled rather than
allowed to consume unlimited capacity.

At two kilobytes median, raw payload volume is about four hundred gigabytes per
day before metadata and replication. Seven days is around 2.8 terabytes raw,
but the large-payload tail could make it higher. I wouldn't keep every payload
inline in the relational delivery table. I'd store immutable payload objects
in durable object storage and keep IDs, hashes, schema version, and status in
the control store.

**Daniel — Interviewer:** You used the median for storage. Is that safe?

**Neha — Candidate:** Not by itself. I would measure the actual byte
distribution and enforce the 256-kilobyte cap. For an interview estimate, I
would apply perhaps three to five times headroom until we know the ninety-fifth
percentile. The key design decision remains separating payload bytes from
frequently queried status records. I wouldn't purchase capacity from the median
calculation alone.

**Daniel — Interviewer:** Okay. What correctness properties are you designing
around?

**Neha — Candidate:** A durable source event that matches an active
subscription must create a durable delivery record. A customer success response
must not be intentionally delivered again unless they request replay, though a
timeout can still create a duplicate because we may not know whether they
processed it. Every attempt is auditable. Retries are bounded to twenty-four
hours. And one tenant's backlog must not prevent other tenants from meeting the
first-attempt objective.

### High-level design and event path — approximately 10:30-15:30

**Neha — Candidate:** At a high level, I have a control plane and a delivery
plane. The control plane exposes APIs to register endpoints, rotate secrets,
configure subscriptions, disable an endpoint, and inspect or replay deliveries.
Its source of truth can be a relational database because endpoint ownership,
uniqueness, state transitions, and queries by tenant matter.

The delivery plane consumes a domain event from the existing bus. A routing
service looks up active subscriptions for that event type, creates one delivery
record per matching endpoint, stores or references the immutable payload, and
enqueues the delivery ID. A fleet of workers claims ready delivery IDs, loads
the endpoint and payload, signs the request, sends it with a strict timeout,
classifies the response, records the attempt, and either marks success or
schedules a retry.

**Daniel — Interviewer:** You said the router creates delivery records and then
enqueues IDs. What happens if the database write succeeds and publishing to the
queue fails?

**Neha — Candidate:** I would use an outbox in the same transaction as the
delivery rows. An outbox publisher sends those IDs to the queue and marks the
outbox records published. Publishing can occur more than once, so workers must
claim deliveries idempotently. Alternatively, if the company bus supports a
transactional consume-and-produce pattern, we could use that, but I don't want
to assume it spans our database.

**Daniel — Interviewer:** What if an event fans out to ten thousand endpoints?
Do you put ten thousand rows in one transaction?

**Neha — Candidate:** No, that would be an unbounded transaction. I would first
write an event-ingestion record keyed by the stable source event ID, then page
through subscription matches and create delivery rows in bounded batches. Each
batch has an idempotent key—source event ID plus endpoint ID—enforced by a
unique constraint. A routing-progress cursor lets another worker resume if the
first crashes. The event isn't considered fully routed until all pages are
complete.

**Daniel — Interviewer:** How do you make sure a subscription change during
that fan-out doesn't produce confusing results?

**Neha — Candidate:** I see two policies. We could route against subscription
state at processing time, which is simpler but can vary across pages, or capture
a subscription version or snapshot boundary when the event is accepted. I
would choose a clear product rule: subscriptions active at the event's accepted
timestamp receive it. At this scale I may not materialize a full snapshot; I
could query versioned subscription rows using an effective-from and effective-
to interval. That adds storage and query complexity. If the business accepts
processing-time behavior, I would choose that simpler rule and document it.

**Daniel — Interviewer:** For this product, processing-time behavior is fine as
long as enabling a subscription doesn't cause older events to be delivered
automatically.

**Neha — Candidate:** Then I won't add temporal subscription versioning. The
manual replay API can be the explicit path for older events.

**Daniel — Interviewer:** What queue would you use?

**Neha — Candidate:** A durable partitioned log such as Kafka could work—

**Daniel — Interviewer:** Why a log rather than a work queue?

**Neha — Candidate:** I jumped to the technology we use at my current company.
The requirement is a durable ready-work queue with visibility or claim
semantics, delayed retry support, and enough partitions for worker throughput.
A managed queue may be simpler operationally. If we use Kafka, delayed retries
and per-delivery scheduling require extra topics or a scheduler, and a poison
item can complicate partition progress. I would choose based on the platform's
existing operational strengths, but the interface I need is durable,
at-least-once work distribution—not necessarily a replayable log.

### Data model and APIs — approximately 15:30-20:00

**Daniel — Interviewer:** Walk me through the minimum data model.

**Neha — Candidate:** `Endpoint` has endpoint ID, tenant ID, HTTPS URL, status,
encrypted signing-secret reference, secret version, event filters, created
time, and perhaps a rate limit. I might separate subscriptions into their own
table if filters become many-to-many.

`Event` has our event ID, source event ID, event type, subject or account ID,
schema version, created time, payload-object key, payload hash, and expiry.

`Delivery` is unique on event ID and endpoint ID. It contains tenant ID,
status, next-attempt time, attempt count, first-attempt time, success time, last
HTTP status, and a version for conditional updates. `Attempt` is append-only:
attempt ID, delivery ID, start and end time, response category, HTTP status,
latency, and a bounded error summary. I would not store an entire customer
response body because it can contain sensitive data or be extremely large.

**Daniel — Interviewer:** Where do you partition the delivery table?

**Neha — Candidate:** My first thought is tenant ID because most control-plane
queries are tenant scoped, but the ten-percent tenant creates a hot partition.
For the write and worker path, I would use a composite shard such as hash of
delivery ID across many physical partitions while storing tenant ID as an
indexed attribute. For listing attempts by tenant, either the database supports
distributed secondary indexing at this volume or we maintain a separate query
projection. I don't want tenant ordering to dictate the physical hot path when
strict tenant-wide order isn't required.

**Daniel — Interviewer:** So is the relational database still your choice?

**Neha — Candidate:** For endpoint configuration, definitely. For two hundred
million new delivery rows per day, one conventional relational cluster may
become expensive and difficult to retain. I would split control data from
delivery state. Endpoint and subscription configuration can be relational.
High-volume delivery and attempt state can use a horizontally partitioned
key-value or wide-column store optimized for writes and point reads, with a
time-bucketed tenant index for the dashboard. The exact database depends on
what the company operates reliably.

**Daniel — Interviewer:** Give me the key APIs, not every field.

**Neha — Candidate:** `POST /v1/endpoints` creates an endpoint after ownership
and URL validation. `PATCH /v1/endpoints/{id}` changes status, filters, or URL.
Secret rotation should be a separate action so we can support an overlap period
between old and new secrets. `GET /v1/deliveries` filters by endpoint, event,
status, and time. `GET /v1/deliveries/{id}/attempts` returns safe attempt
metadata. `POST /v1/deliveries/{id}/replays` creates an explicit replay with an
idempotency key so a client retry doesn't create repeated replays.

**Daniel — Interviewer:** If an endpoint URL changes, do old failed deliveries
go to the old URL or the new one?

**Neha — Candidate:** I would snapshot the destination URL and signing-secret
version onto the delivery when it is created. Changing an endpoint should not
silently redirect already-created delivery obligations. The product can let
the customer explicitly replay to the current configuration. There is a tradeoff:
fixing a typo would not automatically repair the backlog. We could offer a
separate “apply new configuration to pending deliveries” action with an audit
record rather than make it implicit.

### Delivery semantics, retries, and recovery — approximately 20:00-26:15

**Daniel — Interviewer:** Let's go deeper on the worker. A worker sends a
request, the customer processes it, but the response times out. What happens?

**Neha — Candidate:** We have an ambiguous outcome. We record the timeout and
retry because the contract is at-least-once. The request includes the stable
event ID and delivery ID, and documentation tells customers to make processing
idempotent. Our signature also includes a timestamp and payload hash so they can
verify the request. We cannot claim exactly once.

**Daniel — Interviewer:** You said earlier that a success should not be
intentionally delivered again. How do two workers avoid sending the same ready
delivery at the same time?

**Neha — Candidate:** A worker claims the delivery with a conditional state
transition from `READY` to `IN_FLIGHT`, including a lease expiry and worker ID.
Only the winner sends. If the worker crashes, another can reclaim after the
lease. There is still a narrow duplicate possibility if the first worker sends
successfully and loses its lease before recording success. The external event
ID is the final deduplication mechanism.

**Daniel — Interviewer:** What responses do you retry?

**Neha — Candidate:** Timeouts, connection failures, most 5xx responses, 408,
and 429. For 429 I respect a bounded `Retry-After` if present. I would not
automatically retry most other 4xx responses because credentials, URL, or
payload are likely invalid. For 410 Gone, we could disable the endpoint after a
small confirmation threshold. I would use exponential backoff with jitter and
cap the interval so we still make a reasonable number of attempts within
twenty-four hours.

**Daniel — Interviewer:** Why not retry a 404? The customer's deployment may
be temporarily incomplete.

**Neha — Candidate:** That's possible. I would make response policy explicit
and configurable only where evidence supports it. A short retry for 404—say a
few attempts over several minutes—could help deployment races, then mark it a
configuration failure rather than spend twenty-four hours. More important, the
dashboard should tell the customer why retries stopped and allow replay after
they fix the route.

**Daniel — Interviewer:** Where do delayed retries live?

**Neha — Candidate:** The delivery row's `next_attempt_at` is authoritative.
For scheduling, I can use time-bucketed queues—for example, minute buckets
sharded by hash—or a managed delayed queue if it meets throughput. Scheduler
workers read due buckets and enqueue delivery IDs onto ready queues. Enqueuing
twice is safe because the claim is conditional. I would avoid polling the
entire delivery table by time without an appropriate partitioned index.

**Daniel — Interviewer:** Suppose the customer is down for six hours. You build
a large retry backlog. They recover. What prevents us from sending everything
at once and taking them down again?

**Neha — Candidate:** Per-endpoint token buckets and concurrency limits. The
normal event stream and recovered retry stream both pass through the same
endpoint admission control. On repeated failures, a circuit breaker reduces
concurrency and extends backoff. When successes resume, capacity ramps up
gradually rather than opening fully. We should expose the backlog and estimated
drain time to the customer.

**Daniel — Interviewer:** Would you guarantee that a manually replayed event
jumps ahead of the backlog?

**Neha — Candidate:** I would give manual replay a higher priority but not let
it bypass endpoint safety limits. Otherwise an operator could accidentally
create a second outage. It can jump within the permitted capacity, and the UI
should say when it is queued.

**Daniel — Interviewer:** What happens after twenty-four hours?

**Neha — Candidate:** The delivery moves to an exhausted state, sometimes
called a dead-letter state, with its payload retained for the seven-day replay
window. We notify the customer through the dashboard and perhaps a separate
admin channel—not through the same failing endpoint. Manual replay creates a
new replay generation linked to the original event, so history remains clear.

### Backpressure, tenant isolation, and catch-up — approximately 26:15-30:15

**Daniel — Interviewer:** Let's say one tenant produces ten percent of traffic
and all of its endpoints are failing. How do healthy tenants keep meeting the
thirty-second objective?

**Neha — Candidate:** I would not use one undifferentiated FIFO queue. Ready
work is sharded, and the dispatcher applies weighted fair scheduling across
tenants or tenant buckets. Each tenant has quotas for in-flight attempts and
attempt rate; each endpoint has a tighter local limit. Capacity is reserved for
new first attempts so retries can't consume every worker. The very large tenant
may have an explicit purchased quota, but unused capacity can be borrowed.

**Daniel — Interviewer:** Weighted fairness at fifteen thousand tenants can be
complex. What's your simpler first version?

**Neha — Candidate:** Hash tenants into, say, hundreds of scheduling buckets,
keep separate queues for first attempts and retries, and use round-robin or
deficit scheduling across active buckets. Enforce per-tenant counters in a fast
distributed rate-limit store for the largest tenants. It won't provide perfect
fairness, but it bounds domination and is more operable. If measurements show
noisy-neighbor problems inside a bucket, we can promote large tenants to
dedicated buckets.

**Daniel — Interviewer:** The internal event bus is healthy, but our delivery
workers are at capacity. Do you keep accepting events?

**Neha — Candidate:** Up to a bounded durable backlog. The router persists the
delivery obligation, so accepting work without any limit can only move the
outage into storage. I would define backlog-age and capacity thresholds. As we
approach them, we stop nonessential replays, reduce retry pressure, and alert
operations. Since the upstream domain events are already durable, the routing
consumer can slow down rather than read infinitely. If product teams require
an acknowledgement from our service, that contract needs an overload response
or an SLO; but you said the existing bus is our source, so consumer lag is a
visible form of backpressure.

**Daniel — Interviewer:** How do you recover after our own two-hour outage?

**Neha — Candidate:** First protect normal new events so the first-attempt SLO
recovers. Then allocate a controlled fraction of capacity to the backlog and
increase it while endpoint success rates and system saturation remain healthy.
Use the original event time in the payload and attempt metadata so customers
can distinguish delayed delivery. Track oldest event age, not only queue depth,
because depth alone doesn't tell us user delay.

### Security and observability — approximately 30:15-33:00

**Daniel — Interviewer:** We have three minutes before your questions. Give me
the highest-risk security concerns.

**Neha — Candidate:** First, endpoint registration can become server-side
request forgery. I would require HTTPS, resolve and reject private, loopback,
link-local, and cloud-metadata address ranges, then enforce the same egress
policy at connection time because DNS can change after validation. Delivery
workers run in a restricted egress network with fixed public ranges.

Second, signing secrets are encrypted through a managed key service and never
returned after creation. Requests use an HMAC over a versioned canonical form
including timestamp, event ID, and raw body. Secret rotation supports two valid
versions for a short window. Third, we cap request and response sizes, use
strict connect and total timeouts, redact headers and bodies from logs, and
audit endpoint and replay changes.

**Daniel — Interviewer:** What would you alert on?

**Neha — Candidate:** User-impact signals: first-attempt latency against the
thirty-second objective, delivery success rate segmented by response category,
oldest backlog age, exhausted deliveries, and routing lag from the internal
bus. Then saturation signals such as worker concurrency, scheduler delay,
queue depth, and control-store latency. I would avoid putting raw tenant IDs on
every metric because cardinality and cost will explode. Use bounded tiers or
top-tenant views in metrics, with tenant-level investigation through sampled
traces and indexed logs.

**Daniel — Interviewer:** A large tenant says delivery is slow, but global
metrics look fine. What identifier connects their support ticket to the path?

**Neha — Candidate:** The customer sees event ID, delivery ID, and attempt ID.
Those identifiers flow through routing logs, queue messages, worker traces, and
the attempt record. Support can search by delivery ID without needing access to
payload content. For a systemic issue, we can group by tenant bucket, endpoint,
worker region, and response category.

### Recap, candidate questions, and close — approximately 33:00-36:00

**Daniel — Interviewer:** Please give me a short recap. Assume I'm the engineer
who will challenge the most important tradeoff.

**Neha — Candidate:** The durable event bus is the source of incoming events.
A routing layer creates idempotent delivery obligations for active endpoint
subscriptions using bounded fan-out and an outbox. Payloads are immutable in
object storage; control configuration is relational; high-volume delivery
state is horizontally partitioned. Workers claim ready items with leases, sign
and send bounded HTTP requests, and use at-least-once semantics with stable IDs.

The main tradeoff is progress versus order. I preserve enough subject sequence
metadata for customers to detect reordering, but I don't block a tenant behind
one failed endpoint. Per-endpoint limits, tenant fairness, and reserved
first-attempt capacity protect healthy customers during retries and recovery.
The residual risk is unavoidable duplicate delivery after an ambiguous HTTP
outcome, so the contract and tooling make deduplication explicit.

**Daniel — Interviewer:** Good. What would you ask me?

**Neha — Candidate:** In this team, who owns the delivery SLO end to end? Is it
the platform team alone, or do producer teams share responsibility for event
quality and schema compatibility?

**Daniel — Interviewer:** The platform team owns delivery after a valid event
enters the bus. Producer teams own schema correctness. We have a schema review
and compatibility check, but the boundary still creates some debate during
incidents.

**Neha — Candidate:** That makes sense. How are design decisions reviewed on a
team spread across time zones? Is there a regular meeting, or is review mostly
asynchronous?

**Daniel — Interviewer:** The author posts a short proposal with a deadline.
Most comments are asynchronous. For unresolved tradeoffs, we use a thirty-
minute call during overlap and record the decision. The author doesn't need
unanimous agreement, but they do need to close the open questions.

**Neha — Candidate:** That's the working style I'm looking for. One last
question: if someone joined this role, what part of the platform would be most
important for them to understand in the first two months?

**Daniel — Interviewer:** Failure recovery. The happy path is not particularly
unusual. The hard part is knowing which backlogs are safe to drain, which
customer limits must be respected, and how to communicate an ambiguous outcome.

**Neha — Candidate:** Understood. Thank you. I enjoyed the problem.

**Daniel — Interviewer:** Thanks, Neha. I need to finish my notes and share
them with the interview team, so I don't have feedback for you on the call. The
recruiter will follow up about next steps. Have a good evening.

**Neha — Candidate:** Thank you, Daniel. Have a good day.

## Timing plan

- Interviewer words: 965 at approximately 145 words per minute.
- Candidate words: 2813 at approximately 125 words per minute.
- Dialogue turns: 101, with approximately 0.4 seconds average turn gap.
- Planned natural thinking, reading, writing, or coding pauses: 5.2 minutes.
- Estimated finished duration: 35.0 minutes; catalog target: 35 minutes.

## Sparse overlap plan

1. At the queue-choice probe, Daniel begins “Why a log…” during Neha's final
   word in “Kafka could work.” Target overlap: 260 ms. This is a technical
   redirect, not hostility.
2. During the timeout case, Neha starts “We have an ambiguous outcome” just as
   Daniel finishes “What happens?” Target overlap: 170 ms; Neha catches herself
   with a brief 300 ms pause before continuing.
3. Near the recap, Daniel says “Good” under the final words “deduplication
   explicit.” Target overlap: 140 ms, quiet acknowledgment only.

## Private coach map

| Moment | Interviewer intent | Candidate signal | Coaching value |
|---|---|---|---|
| Source-event question | Find the durability boundary before drawing. | Avoids redesigning producers after learning a durable bus exists. | Requirements change architecture; do not assume a request path. |
| Exactly-once statement | Test distributed-systems honesty. | Rejects an impossible external guarantee and names the deduplication contract. | Pause and ask learners what can still duplicate after a success. |
| Median-storage probe | Test estimate discipline. | Admits the estimate is insufficient and preserves only the useful design implication. | Estimates should drive a choice, not create false precision. |
| Fan-out transaction | Find an unbounded operation. | Introduces batches, idempotent keys, and resumable progress. | Strong answers explain crash recovery, not only normal fan-out. |
| Kafka interruption | Detect technology reflexes. | Owns the reflex and restates the capability requirement. | Preserve this self-correction; it is more realistic than a perfect first answer. |
| Endpoint change | Test state-version semantics. | Snapshots URL/secret and makes backlog migration explicit. | Show how innocent configuration changes create correctness decisions. |
| Timeout after processing | Test the unavoidable ambiguity. | Uses at-least-once, stable IDs, and receiver idempotency. | There is no internal lock that solves an unknown external outcome. |
| Hot failing tenant | Test noisy-neighbor control. | Adds tenant and endpoint admission plus first-attempt reservation. | Compare global FIFO with fairness-aware scheduling. |
| Simpler fairness version | Test operational judgment. | Backs away from perfect fairness toward buckets and promotion. | Seniority includes choosing an operable first version. |
| SSRF answer | Test whether security is integral. | Covers validation and connection-time enforcement, not only URL regex. | The callback URL is untrusted network input. |
| Recap | Test prioritization. | Names one central tradeoff and one residual risk. | A recap should expose the decision an interviewer can challenge. |

## Deliberate imperfections to preserve

- Neha initially reaches for Kafka because it is familiar, then corrects to
  capability-based selection.
- Her first storage estimate uses the median; Daniel challenges it.
- She offers a sophisticated fairness policy, then must produce an operable
  simpler version.
- She cannot eliminate duplicate delivery after an ambiguous HTTP outcome and
  says so plainly.

