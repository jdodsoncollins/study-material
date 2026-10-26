---
id: rate-limiter
title: Enforce request budgets across servers
slug: rate-limiter
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 16
summary: Enforce explicit rolling-window and burst policies atomically across the servers handling one limiting key.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
  - load-balancing
related:
  - caching
  - load-balancing
  - interview-framework
  - http-and-tcp
  - payment-idempotency
company_signal: []
sources_consulted:
  - https://redis.io/docs/latest/commands/eval/
updated: 2026-10-26
status: canonical
---

# Enforce request budgets across servers

## Snapshot

- Define the key, time rule, and permitted burst before choosing an algorithm.
- A local bucket on every server multiplies a global limit unless budgets are coordinated.
- Admission checks and state updates must be atomic for the key being limited.
- Separate overload protection from user-facing quotas and billing limits.

## What this round is actually scoring

Whether the implementation enforces the stated limit under concurrency and partial failure.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Identity | Limit authenticated users; define a separate policy for anonymous traffic |
| Strict example | At most 30 admissions in any rolling 60 seconds |
| Burst example | Also cap short bursts with a bucket of capacity 10, refilling at 0.5 tokens/s |
| Failure | Choose fail-open, fail-closed, or a bounded emergency allowance per endpoint |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume 80,000 decisions/s across many keys. Size shards using measured decision throughput and replication overhead. Three replicas of one primary do not automatically provide three times the write capacity.

If twelve frontends each independently allow a burst of ten, one user can get 120 admissions. That violates a global burst of ten; describing it as a small percentage error does not repair the requirement.

## Design

### ELI5

Every request asks the same authority for its key, “Is there room in this budget?” The authority checks and consumes capacity as one operation. Two requests must not both spend the last token.

[Follow an admission decision](viz/bucket.md)

### Strict and approximate choices

For the rolling-window example, keep accepted event IDs with timestamps. Atomically remove expired entries, count the remaining entries, and insert a uniquely identified new event only if fewer than 30 remain. A timestamp alone is not a unique event ID. Define the window as `(now − 60 seconds, now]` and use a consistent clock source.

If the additional burst rule is required, perform both the rolling-window and token-bucket checks in the same atomic operation, updating both only on admission. A token bucket with refill 0.5/s and capacity ten alone does **not** mean at most 30 in every rolling minute: it can spend an initial burst as well as newly refilled tokens.

Hash the limiting key to an authority. For very hot keys, allocated local budgets can reduce coordination, but the sum of outstanding allocations and their expiry/recovery rules must bound overshoot. Replicating the same full budget to every server is not such a bound.

Return a retry hint based on the policy, and avoid synchronized client retries. IP-based limits need care because a shared NAT can represent many unrelated users.

## Tradeoffs

| Algorithm | Benefit | Limitation |
| --- | --- | --- |
| Fixed window | Small state | Bursts across a boundary |
| Sliding event log | Exact rolling-window count | State proportional to retained admissions |
| Token bucket | Explicit burst and sustained rate | Not a strict rolling-window quota |
| Allocated local budgets | Lower request-path coordination | Requires bounded allocation and recovery |

## Failure modes

- Concurrent non-atomic checks overspend the budget.
- Failover to stale counters can admit extra requests; define whether that is acceptable.
- A limiter outage needs a deliberate endpoint policy, not an accidental default.
- Retrying denied traffic without backoff can become the overload itself.

## Follow-ups an interviewer may ask

**Easy:** two requests arrive when one token remains. Trace the atomic result.

**Medium:** compare 30 requests at second 59 and 30 at second 60 under fixed and rolling windows.

**Hard:** permit no more than 5% overshoot during a partition. Derive a bound from outstanding leased budgets; if you cannot, use an authoritative decision or reject until coordination returns.

## Cross-links

- [Remembering the expensive answer nearby](../../foundations/caching/lesson.md) (id: caching)
- [Spreading work without creating a new bottleneck](../../foundations/load-balancing.md) (id: load-balancing)
- [Create and resolve short links safely](../url-shortener/lesson.md) (id: url-shortener)
- [Make a payment retry refer to one operation](../payment-idempotency/lesson.md) (id: payment-idempotency)
- [Distribute versioned feature decisions](../feature-flags.md) (id: feature-flags)
- [HTTP is a conversation, TCP is the pipe](../../../cs/http-and-tcp.md) (id: http-and-tcp)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
