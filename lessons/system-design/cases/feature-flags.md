---
id: feature-flags
title: Distribute versioned feature decisions
slug: feature-flags
kind: case-study
track: system-design
difficulty: intro
estimated_minutes: 14
summary: Distribute validated rule versions and define stable assignment, propagation targets, and stale-value behavior.
tags:
  - system-design
  - system-design/product-cases
  - system-design/caching
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - caching
related:
  - caching
  - rate-limiter
  - interview-framework
  - job-scheduler
  - news-feed
company_signal: []
sources_consulted:
  - https://openfeature.dev/specification/sections/flag-evaluation/
updated: 2026-10-26
status: canonical
---

# Distribute versioned feature decisions

## Snapshot

- Separate flag authoring from fast local evaluation.
- Use stable assignment inputs and versioned rule snapshots.
- Define staleness and safe defaults per flag.
- A disconnected client cannot receive an immediate kill switch.

## What this round is actually scoring

Whether rollout assignment, propagation, and fallback behavior remain understandable during an outage.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Author | Authorized changes with validation, audit history, and rollback |
| Evaluate | Low-latency decisions from a validated local snapshot |
| Roll out | Stable percentage assignment under documented rule changes |
| Fail | Explicit last-known-value and expiry/default policy per flag |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume 100,000 server processes fetch a 5 MB snapshot every ten minutes. Full polling alone transfers about 833 MB/s on average, before protocol overhead. Smaller deltas, caching, and randomized polling can reduce pressure.

A two-second propagation target is a healthy-network objective, not a guarantee for every disconnected client. Measure local evaluation cost rather than asserting a nanosecond figure for arbitrary rules.

## Design

### ELI5

Publish a numbered rulebook. Each application validates and keeps a copy, then evaluates requests locally. The rulebook's version and fallback policy tell us what happens when updates stop arriving.

### Rules and rollout

Store immutable snapshot versions, rule schemas, ownership, and an audit trail. Validate types and references before publication. Use notifications or a watch stream for quick refresh, with randomized polling and version checks as recovery. A notification tells the client to obtain a validated version; it is not the authoritative rule data by itself.

For percentage rollout, hash a stable subject ID with a flag-specific salt into a fixed bucket range. A threshold increase can include more subjects while retaining already-included ones. Variant experiments may need persistent assignments when allocation rules change; deterministic hashing alone does not make arbitrary rule edits sticky.

Evaluate server-side rules for decisions requiring trusted identity or authorization. A client-visible flag is not an access-control boundary. Record exposure using a bounded telemetry path so an analytics outage does not block evaluations.

For each flag, choose whether an old snapshot remains valid, for how long, and which value to use after expiry. A safety-critical feature may fail closed after a short freshness deadline, sacrificing availability during a partition. Other features may keep the last known value.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Local evaluation | Low request latency | Rules may be stale |
| Remote evaluation | Central policy enforcement | Network dependency and latency |
| Watch plus polling | Fast normal updates with recovery | More lifecycle handling |
| Expiring snapshots | Bounds use of stale rules | Degradation during disconnection |

## Failure modes

- An invalid rule ships: schema validation and last-valid-version fallback prevent a fleet-wide parse failure.
- Watch connections silently stall: version/freshness checks detect the condition.
- A rollback changes the hash salt: assignments reshuffle unless the policy explicitly permits it.
- A kill switch cannot reach a client: enforce that flag's stale-value policy rather than claiming immediate propagation.

## Follow-ups an interviewer may ask

**Easy:** raise rollout from 10% to 20% using the same bucket mapping. Which existing users change?

**Medium:** change a variant's allocation boundaries. Explain whether previously assigned users remain in their variants.

**Hard:** disconnect a client before a kill switch. State the maximum stale-use policy and the availability cost of enforcing it.

## Cross-links

- [Remembering the expensive answer nearby](../foundations/caching/lesson.md) (id: caching)
- [Enforce request budgets across servers](./rate-limiter/lesson.md) (id: rate-limiter)
- [Schedule occurrences and recover leased work](./job-scheduler/lesson.md) (id: job-scheduler)
- [Build a feed with bounded fanout](./news-feed/lesson.md) (id: news-feed)
- [Forty-five minutes is a navigation problem](../foundations/interview-framework.md) (id: interview-framework)
- [Consistency promises during failures](../foundations/cap-and-consistency.md) (id: cap-and-consistency)
