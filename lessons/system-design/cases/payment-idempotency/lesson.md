---
id: payment-idempotency
title: Make a payment retry refer to one operation
slug: payment-idempotency
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 16
summary: Preserve one logical capture across retries, different request keys, and uncertain provider responses.
tags:
  - system-design
  - system-design/product-cases
  - system-design/consistency
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - queues-delivery
  - cap-and-consistency
related:
  - queues-delivery
  - cap-and-consistency
  - transactions-isolation
  - rate-limiter
  - job-scheduler
company_signal: []
sources_consulted:
  - https://docs.stripe.com/api/idempotent_requests
updated: 2026-10-26
status: canonical
---

# Make a payment retry refer to one operation

## Snapshot

- Identify a logical payment operation independently of transport attempts.
- Scope idempotency keys and reject reuse with a different request.
- Protect the business invariant even when callers supply different keys.
- Treat a timeout after provider submission as an unknown outcome until resolved.

## What this round is actually scoring

Whether concurrent retries and uncertain provider responses can create duplicate business effects.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Capture | For this scenario, capture each payment intent at most once |
| Replay | Return the original operation state/result for a matching retry |
| Conflict | Reject key reuse with different amount, currency, or intent |
| Recovery | Reconcile unknown provider outcomes and publish durable status events |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume a peak of 20,000 requests/s. If that rate lasted all day, there would be 1.728 billion requests. At one kilobyte per retained record, the upper-bound raw growth is about 1.73 TB/day. Actual daily traffic depends on the peak's duration.

Hashing an idempotency key reduces the key's stored size; it does not eliminate the operation records. Capacity planning should account for retention, indexes, payloads, and replicas, then benchmark the write path.

## Design

### ELI5

A retry carries the same operation ticket. The service either continues that operation or returns its known result. A new ticket must not bypass the rule that this particular intent can only be captured once.

[Trace operation identity and replay](viz/keys.md)

### State and provider boundary

Store `(tenant, operation type, idempotency key)`, a canonical request fingerprint, intent ID, state, and result. Atomically claim the key and the intent's capture operation. A uniqueness constraint on the business operation protects against two callers using different request keys for the same capture.

Persist the intent to perform work before sending it. Use the stable **capture operation ID** as the downstream provider key, within that provider's documented scope and retention. A network timeout does not mean the capture failed. Query or retry that same provider operation according to its contract; do not create a fresh charge while the outcome is unknown.

When a provider result is established, atomically update local state, ledger entries as required, and an outbox event. The outbox relay may deliver more than once, so consumers deduplicate. Acknowledgement durability must name the replication/commit policy; “written to disk” alone leaves failures unspecified.

If response-cache entries expire after 24 hours, retain the longer-lived business invariant. An old request must not become a new capture merely because a cache entry disappeared. Partial captures or multiple captures would require a different explicitly modeled invariant.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Cached replay response | Fast matching retries | Does not enforce the underlying business invariant |
| Unique capture operation | Blocks different-key duplicates | Requires a clear intent lifecycle |
| Provider idempotency | Handles uncertain submission responses | Scope and retention are provider-specific |
| Reconciliation | Resolves unknown outcomes | Delayed final status and operational work |

## Failure modes

- Crash before submission: resume the durable pending operation.
- Timeout after submission: retain “unknown” and reconcile; do not assume failure.
- Different payload under the same key: return a conflict.
- Duplicate or out-of-order webhook: validate the source and apply allowed state transitions idempotently.

## Follow-ups an interviewer may ask

**Easy:** replay the same intent, key, amount, and currency. Which result is returned?

**Medium:** two different keys attempt the same intent concurrently. Identify the business constraint that decides the winner.

**Hard:** the provider's key retention expires while the local outcome is unknown. Explain why automatic submission under a new key is unsafe and how reconciliation resolves it.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Consistency promises during failures](../../foundations/cap-and-consistency.md) (id: cap-and-consistency)
- [Isolation defines what concurrent transactions can observe](../../../cs/transactions-isolation.md) (id: transactions-isolation)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [Schedule occurrences and recover leased work](../job-scheduler/lesson.md) (id: job-scheduler)
- [Reserve drivers before confirming a match](../ride-hailing/lesson.md) (id: ride-hailing)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
