---
id: ride-hailing
title: Reserve drivers before confirming a match
slug: ride-hailing
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 22
summary: Use approximate locations for candidates and authoritative reservations for offers and trip assignment.
tags:
  - system-design
  - system-design/product-cases
  - system-design/realtime
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - sharding
  - queues-delivery
related:
  - sharding
  - queues-delivery
  - rate-limiter
  - interview-framework
  - payment-idempotency
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/transaction-iso.html
updated: 2026-10-26
status: canonical
---

# Reserve drivers before confirming a match

## Snapshot

- Location updates provide approximate candidates, not authoritative availability.
- Match reservation and acceptance require atomic state transitions.
- Offer expiry must reject stale accepts without releasing a newer offer.
- Nearby search, dispatch, trip state, and pricing have different consistency needs.

## What this round is actually scoring

Whether two riders or delayed events can assign the same driver to conflicting trips.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Locate | Show approximate nearby available drivers |
| Offer | Reserve a driver for at most one active offer in this scenario |
| Accept | Confirm only a current, authorized offer |
| Timing | Target a first offer within three seconds; driver acceptance has a separate timeout |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume one million online drivers update location every five seconds: 200,000 updates/s. At 100 bytes per update, raw ingress is about 20 MB/s before protocol and replication overhead.

Search load depends on ride requests and candidates examined, not just location updates. Downtown cells can be much hotter than the geographic average.

## Design

### ELI5

Use recent locations to find possible drivers. Then reserve one driver's authoritative availability before sending an offer. A driver's reply refers to that specific offer, so an old reply cannot accept a newer or expired one.

[Trace reservation and acceptance](viz/match.md)

### Search and transitions

Maintain an approximate geographic index with timestamped positions. Expand the search area when necessary, filtering stale locations. A driver moving between cells must still have one authoritative availability record independent of the cell index.

Atomically transition that record from `idle` to `offered(offer_id, expiry, generation)` before dispatching the offer. Two matchers racing for the same driver cannot both reserve it. Persist delivery intent so a crash after reservation can recover or expire the offer.

Acceptance verifies driver identity, current offer ID, generation, expiry, and the trip's state. Commit the driver/trip assignment through a transaction or an explicit coordinated protocol with recovery. A compare-and-set on the driver alone is insufficient if the trip can already be assigned elsewhere.

Expiry releases only the matching current offer generation. It must not release a later offer created after a delayed timer. Retries carry stable operation IDs. Nearby map updates can remain approximate even while assignment is strict.

Pricing uses separately defined inputs, update cadence, and product constraints. A multiplier in a practice example is a policy assumption, not evidence of a particular company's algorithm.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Approximate location index | Fast nearby search | Stale or duplicate candidates |
| Authoritative reservation | Prevents concurrent offers to one driver | Coordination and recovery work |
| Sequential offers | Simpler reservation model | Longer time if drivers decline |
| Multiple concurrent offers | Faster response opportunities | More complex cancellation and winner selection |

## Failure modes

- Two riders choose the same candidate: one authoritative reservation wins.
- An old offer is accepted after expiry: reject by offer identity and generation.
- A reservation succeeds but notification fails: retry delivery or expire it under the stored policy.
- Trip and driver states diverge: reconcile using the durable assignment operation, not map position.

## Follow-ups an interviewer may ask

**Easy:** two requests try to reserve the same idle driver. Name the atomic transition.

**Medium:** the driver's location crosses a cell boundary while an offer is active. Explain why ownership cannot live only in the spatial index.

**Hard:** an old expiry timer fires after a new offer is created. Show the compare condition that keeps the new offer intact.

## Cross-links

- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Make a payment retry refer to one operation](../payment-idempotency/lesson.md) (id: payment-idempotency)
- [Enforce request budgets across servers](../rate-limiter/lesson.md) (id: rate-limiter)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
- [Consistency promises during failures](../../foundations/cap-and-consistency.md) (id: cap-and-consistency)
