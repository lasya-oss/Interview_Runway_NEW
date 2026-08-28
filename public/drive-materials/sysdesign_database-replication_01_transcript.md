# Database Replication: Core model and tradeoffs

## Frame the problem

This lesson develops an interview-ready approach to Database Replication: Core model and tradeoffs. The central model is: Copy data across nodes to improve read scale and resilience while managing lag and failover. Begin by clarifying the product behavior rather than naming technologies. Ask who uses the system, what the critical write and read paths are, which operations must be correct, and which outcomes may be delayed. State two or three non-goals. This prevents a familiar architecture from being forced onto the wrong product.

## Requirements

Separate functional requirements from quality attributes. Functional requirements describe user-visible actions and state changes. Quality attributes describe scale, latency, availability, durability, consistency, privacy, and cost. Pick the two attributes that drive architecture and say why. Avoid promising maximum consistency, maximum availability, minimum latency, and minimum cost simultaneously. A strong interview answer makes the tradeoff visible and ties it to a user consequence.

## Estimate before drawing

Use rounded assumptions for daily active users, peak requests per second, read-to-write ratio, payload size, retention, and replication. Calculate only values that influence a decision. Label every assumption and keep units on the page. An estimate is useful when it changes partition count, storage tier, cache capacity, or network design. It is not useful when it creates false precision. Add headroom and distinguish average from peak load.

## Architecture

Build the design around these decisions: Leader/follower vs multi-leader, sync level, read routing, and recovery point. Draw clients, edge controls, stateless services, authoritative stores, asynchronous paths, and observability. Put arrows in the direction of data flow and label synchronous versus asynchronous work. For each durable write, identify the source of truth. For each cache or index, identify how it becomes fresh enough. For each queue, identify the consumer's idempotency strategy.

## Data and APIs

Define the smallest useful API and the core data entities. Include identifiers, ownership, timestamps or versions, and uniqueness constraints. Explain the dominant query patterns before selecting storage. If data is partitioned, name the partition key and show why it spreads load without breaking essential queries. If an operation crosses partitions or services, describe the consistency boundary and how partial completion is reconciled.

## Failure analysis

Pressure-test the design against Replication lag, split brain, lost writes, and failover storms. Walk through timeout, retry, dependency outage, overload, and recovery. Bound every retry with deadlines, backoff, and jitter. Use idempotency where a repeated request can create a duplicate effect. Define whether the system fails closed, fails open, serves stale data, queues work, or rejects it. Then explain how operators detect the condition and how the system returns to normal.

## Tradeoff discipline

For every major component, connect the choice to a requirement and name the cost it introduces. A cache reduces latency but creates freshness and invalidation work. Replication improves resilience and read capacity but introduces lag, conflict, and failover decisions. Partitioning increases scale but complicates queries, transactions, and rebalancing. Asynchronous work absorbs bursts but changes completion semantics and requires retries, deduplication, and backlog operations. This requirement-choice-cost pattern keeps the answer grounded and prevents architecture by buzzword.

## Scaling path

Start with the simplest architecture that satisfies the stated scale. Then identify the first bottleneck and evolve one dimension at a time: add caching for read pressure, partition state for size or write throughput, queue noncritical work for burst absorption, and add regional redundancy only when the availability objective justifies the cost. This evolution story demonstrates judgment better than drawing every distributed component from the beginning.

## Observability and security

Define service-level indicators for latency, availability, correctness, freshness, and backlog. Alert on user impact and exhaustion trends, not every internal fluctuation. Carry request identifiers through logs and traces. For security, authenticate the caller, authorize the resource action, encrypt in transit and at rest, minimize sensitive data, rotate credentials, and audit privileged changes. Mention abuse controls when the system exposes public APIs or user-generated content.

## Deep-dive readiness

Prepare to zoom into one write and one read at message-level detail. Name the request, validation, authoritative mutation, secondary updates, response, and recovery behavior. Then answer four predictable pivots: what changes at ten times scale, what happens when the main dependency is unavailable, how duplicate requests are handled, and how a user observes a stale or partial result. If a decision depends on an unknown requirement, offer two branches and ask the interviewer which product behavior to optimize.

## Interview recap

Close by restating the requirements that drove the design, the source of truth, the main data path, and the most important tradeoff. Offer one alternative and say when it would be preferable. Then invite the interviewer to choose a deep dive: data model, consistency, capacity, failure recovery, or a product-specific edge case. The design is complete when its behavior under pressure is as clear as its happy path. Keep the final summary short enough that the interviewer can challenge one decision while time remains.

