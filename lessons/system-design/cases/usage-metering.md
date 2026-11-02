---
id: usage-metering
title: Bill bandwidth from events without double-counting
slug: usage-metering
kind: case-study
track: system-design
difficulty: core
estimated_minutes: 18
summary: Ingest usage events, dedupe them, window in UTC, apply tiers, and reconcile late arrivals into an invoice.
tags:
  - system-design
  - system-design/product-cases
  - system-design/messaging
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - payment-idempotency
  - queues-delivery
  - metrics-pipeline
related:
  - payment-idempotency
  - metrics-pipeline
  - rate-limiter
  - edge-waf
  - incident-debug-with-agent
company_signal: []
sources_consulted:
  - https://docs.stripe.com/api/idempotent_requests
updated: 2026-11-02
status: canonical
---

# Bill bandwidth from events without double-counting

## Snapshot

- Turn a stream of bandwidth events into a monthly per-site total and a tiered charge.
- Dedupe on event id. Window in UTC. Do not trust the worker's local clock.
- Late events adjust the open invoice. They do not rewrite a closed one in place.
- This is an original practice design. The numbers are illustrative.

## What this round is actually scoring

Whether a retry, a duplicate delivery, or a clock skew can charge a customer twice or drop a day of traffic. Interviewers also listen for how you would prove the invoice against the raw events.

## Company signal

No company is cited as asking this exact design. It is practice in the same family as idempotent payment capture and as the metering repos used in multi-phase coding rounds. Treat any company anecdote you have heard as secondhand until you confirm the round.

## Requirements

| Area | Requirement |
| --- | --- |
| Ingest | Accept events of `{eventId, siteId, bytes, at}` at least once |
| Dedupe | The same `eventId` for a site counts once |
| Window | Monthly buckets in UTC, half-open `[start, end)` |
| Rating | First 100 GB at 8¢, next 900 GB at 4¢, then 2¢, with a per-site override |
| Late data | Events up to 36 hours late land in the correct month if that invoice is still open |
| Closed months | A closed invoice gets an adjustment row, not a silent rewrite |
| Proof | A workspace admin can recompute a day from raw events |

## Back-of-envelope

Illustrative, not a production measurement.

40,000 sites, about 50,000 events each per day, is 2 billion events/day. A 5× peak for one hour is about 116,000 events/s. At 200 bytes on the wire, a day is about 400 GB before replication and indexes. You do not keep every raw event in the database that serves the invoice. You keep raw events in an append-only log for 45 days, and you keep daily aggregates per site forever at this scale: 40,000 × 45 days of daily rows is small. The hot path is the aggregate, not a scan of the log at invoice time.

100 GB is 100 × 1024³ bytes in this exercise. State the unit out loud so a tier boundary test is exact.

## Design

### ELI5

Each event is a ticket with a unique number. The counter for that site and that UTC day moves only the first time you see the ticket. At month end you sum the days, apply the tiers, and freeze the invoice. A ticket that shows up later adds an adjustment if the freeze already happened.

### Pipeline

1. **Ingest.** An API or a collector writes the event to a log. The producer may retry.
2. **Dedupe.** A consumer inserts `(siteId, eventId)` into a uniqueness table with a 45-day retention matching the log. Conflict means already counted. Do this in the same transaction as the daily aggregate increment.
3. **Aggregate.** Row key `(siteId, utcDate)` holds `bytes`. Increment only on a fresh event id.
4. **Rate.** A pure function `price(bytes, tiers)` with tests at 0, exactly 100 GB, exactly 1000 GB, and one byte over each boundary. Overrides are a row per site, versioned, so a price change does not rewrite history.
5. **Invoice.** On the first UTC day of the month, sum the previous month's daily rows, store the rated total, and mark the invoice open for 36 hours. After that, new events for that month write an adjustment document and a new total. The original rated row stays.

A worker crash after the aggregate write and before the offset commit must not double-count, because the uniqueness insert is in the same transaction as the increment. If you cannot get that transaction, store the event id in the aggregate store first and treat the log offset as a bookmark you can replay. Replaying is safe only while the uniqueness constraint holds.

### What you measure

Bytes counted, duplicate rate, lag from `at` to aggregate, and a daily reconciliation job: sum a sample of raw events and compare to the daily row. A mismatch pages a human. It does not auto-rewrite a closed invoice.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Unique `(siteId, eventId)` | Retries are safe | A retention window you must state |
| Daily rollups | Invoice reads are cheap | Late events need a second path |
| Frozen invoice plus adjustments | Auditable | More UI than "edit the row" |
| Per-site price override | Contracts differ | Rating must record which version it used |
| Recompute from the log | Proof | Too slow to be the request path at 2 billion events/day |

## Failure modes

- Local time windows split a day at a daylight-saving change. Use UTC.
- An inclusive end boundary (`<=`) counts the first byte of the next month twice.
- A retry after a timeout increments the daily row again because the event id was never stored.
- The rating function uses floating division for the tier cut and misses "exactly 100 GB."
- A backfill job writes into a closed invoice and the customer sees a changed total with no adjustment line.
- The reconciliation job and the invoice job race. Reconciliation compares a snapshot id, not a live counter.

## Follow-ups an interviewer may ask

**Easy:** An event is delivered twice. What is stored, and what does the customer see?

**Medium:** The event's `at` is 40 hours before ingest, and the invoice for that month is closed. Where does the byte go?

**Hard:** The uniqueness table expires an event id, and the log is replayed. How do you keep the daily row from moving again?

## Cross-links

- [Make a payment retry refer to one operation](./payment-idempotency/lesson.md) (id: payment-idempotency)
- [At-least-once, idempotency, and the dead-letter lane](../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Collect fleet metrics and logs without drowning in labels](./metrics-pipeline.md) (id: metrics-pipeline)
- [Enforce request budgets across servers](./rate-limiter/lesson.md) (id: rate-limiter)
- [Debug an incident with an agent on the telemetry](../../ai-agents/incident-debug-with-agent.md) (id: incident-debug-with-agent)
- [Push edge rules without freezing a publish](./edge-waf.md) (id: edge-waf)
