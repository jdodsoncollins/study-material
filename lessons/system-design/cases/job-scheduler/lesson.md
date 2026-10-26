---
id: job-scheduler
title: Schedule occurrences and recover leased work
slug: job-scheduler
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Create durable schedule occurrences and recover leased work without confusing lease expiry with a stopped worker.
tags:
  - system-design
  - system-design/product-cases
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
  - queues-delivery
related:
  - queues-delivery
  - notification-system
  - llm-serving
  - interview-framework
  - video-streaming
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/transaction-iso.html
updated: 2026-10-26
status: canonical
---

# Schedule occurrences and recover leased work

## Snapshot

- A schedule describes future occurrences; a run represents one occurrence.
- Durable run IDs connect retries to the same logical work.
- Leases permit recovery but do not prove the previous worker stopped.
- Define overlap and time-zone policies explicitly.

## What this round is actually scoring

Whether missed ticks, stale workers, and retries preserve the schedule contract.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Schedule | One-off and recurring jobs with a time zone |
| Run | Durable occurrences with retry limits and observable status |
| Overlap | Support an explicit allow/forbid/replace policy |
| Timing | Define acceptable start delay; do not promise exact execution time |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

Assume two million schedules, of which 10% are hourly. That produces 200,000 hourly occurrences, averaging about 56 starts/s. If they all fire on the hour, the burst is far larger than that average.

An indexed database query over due schedules may be adequate. Measure its scan and update cost before adding a distributed timing wheel or another coordination service.

## Design

### ELI5

Turn “run every hour” into durable tickets such as `(schedule 42, occurrence 10:00)`. Workers borrow tickets for a bounded time. A retry keeps the same occurrence identity.

[Follow run ownership](viz/lease.md)

### Ticks, claims, and effects

A ticker atomically inserts a uniquely identified occurrence and advances the schedule's next-fire time. If it crashes, a retry must neither lose nor duplicate the occurrence. Define whether downtime causes all missed occurrences, only the latest, or none to be created.

A worker atomically claims a ready run with a lease generation and expiry. Heartbeats and completion updates compare that generation. After expiry, a new worker receives a higher generation; stale updates from the old worker are rejected.

The old worker might still execute an external effect after losing its lease. Use a stable run operation ID for downstream idempotency or a fencing token that the downstream resource enforces. Fencing only the scheduler's status row does not protect an unrelated API call.

For “forbid overlap,” atomically enforce an active occurrence per schedule across leased, retry-waiting, and ready-for-retry states according to the product policy. Otherwise a lease expiry can accidentally allow the next occurrence to overlap a retry.

For daylight-saving transitions, specify what happens to nonexistent local times and repeated local times. Store the time-zone rule and the resolved occurrence identity; a bare local timestamp is ambiguous.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Indexed due-time scan | Simple durable implementation | Scan/update throughput to measure |
| Leases | Recover abandoned work | Stale workers still need fencing |
| Catch up every missed run | Preserves every occurrence | Recovery bursts |
| Coalesce missed runs | Bounded catch-up work | Some occurrences intentionally skipped |

## Failure modes

- Ticker crashes during advancement: transaction and unique occurrence ID recover safely.
- Worker pauses beyond its lease: reject stale state updates and protect external effects separately.
- A job always fails: stop after its retry policy and expose the failure.
- Many schedules align: spread starts only when the timing contract permits it, or reserve burst capacity.

## Follow-ups an interviewer may ask

**Easy:** a ticker creates the 10:00 run, crashes, and retries. Explain why one occurrence exists.

**Medium:** worker A's lease expires while its external request is in flight. Explain what a generation check does and does not prevent.

**Hard:** a 01:30 local schedule encounters a repeated clock hour. Choose a policy, identify both possible instants, and preserve that decision across retries.

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Route notifications without confusing acceptance and delivery](../notification-system/lesson.md) (id: notification-system)
- [Budget model memory and schedule streamed generation](../llm-serving/lesson.md) (id: llm-serving)
- [Publish renditions and serve adaptive playback](../video-streaming/lesson.md) (id: video-streaming)
- [Make a payment retry refer to one operation](../payment-idempotency/lesson.md) (id: payment-idempotency)
- [Forty-five minutes is a navigation problem](../../foundations/interview-framework.md) (id: interview-framework)
