---
id: queues-delivery
title: At-least-once, idempotency, and the dead-letter lane
slug: queues-delivery
kind: concept
track: system-design
difficulty: core
estimated_minutes: 15
summary: Default delivery is at-least-once; exactly-once is at-least-once plus an idempotent consumer and a place for poison.
tags:
  - system-design
  - system-design/foundations
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - notification-system
  - job-scheduler
  - chat-system
  - payment-idempotency
  - cap-and-consistency
company_signal:
  - name: Amazon
    evidence: Candidate-reported L5 loops and prep-site frequency lists treat queues, retries, and poison messages as the operational heart of notification and job designs.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Candidate-reported messenger and feed fanout probes ask what happens when a consumer crashes after sending but before ack.
    year: 2026
    confidence: medium
sources_consulted:
  - Hello Interview job-scheduler and notification writeups (consulted, not copied)
  - Design Gurus 2026 FAANG guides
  - X threads on idempotency keys and at-least-once delivery
updated: 2026-09-02
status: canonical
---

# At-least-once, idempotency, and the dead-letter lane

## Snapshot

- Brokers retry. Networks retry. Your consumer will see the same message more than once. Design for **at-least-once**.
- **At-most-once** means you may drop work. That is a conscious product choice (presence pings), not a default.
- **Exactly-once** in interviews means: at-least-once delivery + a unique work id + a consumer that can see "already done" and skip.
- After N failures, stop retrying the happy queue. Put the body in a **dead-letter lane** (DLQ) with the error, and page a human or a replay job.

## Why it shows up in interviews

Notifications, feed fan-out, payment capture, job schedulers, and LLM GPU queues all have a buffer between "accepted" and "done." Interviewers are scoring whether you understand that the crash happens *after* the side effect and *before* the ack. If you only draw a queue box, you have not designed delivery.

## Core idea

A message has a life:

1. Producer writes to the broker (or is rejected). Client keeps a `work_id`.
2. Consumer leases the message, does the side effect, then acks.
3. If the consumer dies between side effect and ack, the lease expires and someone else gets the same body.

So the side effect must be **idempotent**: doing it twice equals doing it once. Patterns that actually work:

- Store `work_id` in a processed table before or with the side effect, same transaction when you can.
- Make the downstream API itself idempotent (Till capture with an idempotency key).
- Use a compare-and-set: "move job from `leased` to `done` only if `lease_owner = me`."

Ordering is a separate axis. A queue can be at-least-once *and* per-key ordered (one consumer on `conversation_id`) or concurrent and unordered. Do not promise global order.

Visibility timeout / lease: too short and you double-run healthy work. Too long and a crash stalls the key. Clockyard-style jobs often use 30s leases with heartbeats.

## Comparison

| Guarantee | Retry? | Duplicate side effects? | Honest use |
| --- | --- | --- | --- |
| At-most-once | No | No, but you drop | Presence, metrics, "best effort" pings |
| At-least-once | Yes | Yes, unless consumer is idempotent | Default for email, fan-out, jobs |
| Effectively-once | Yes | No, because of `work_id` fencing | Payments, ticket locks, job run-once |
| Broker "exactly-once" flag | Marketing | Still need an idempotent sink | Do not rest the design on the flag |

DLQ policy worth saying out loud:

| Poison symptom | Action |
| --- | --- |
| 5 failures, error looks transient | Exponential backoff, then DLQ |
| Schema cannot parse | DLQ immediately, do not block the partition |
| Downstream 429 | Slow the consumer, do not DLQ on the first blip |
| DLQ growing | Page; replay is a product decision, not automatic |

## Common mistakes

- Drawing Kafka/SQS and saying "that gives us exactly-once."
- Retrying forever on a bad payload and stalling every later message on that partition.
- Using the same queue for high-priority password-reset mail and bulk marketing.
- Forgetting the producer can also retry: two copies may be *enqueued*, not just redelivered.
- Ack-before-work (at-most-once by accident) or work-before-dedup-record (double send after crash).

## How to talk about it

"Producers send `work_id`s. The broker is at-least-once with a 30s lease. Consumers upsert into a processed table keyed by `work_id` and only then call the side effect, or they call an idempotent downstream with that same key. Failures go to a DLQ after five tries. I will not block a conversation partition on one poison payload. If this is money, the ledger write and the processed-row commit together."

That sentence works for [Herald](../cases/notification-system.md) (id: notification-system), [Clockyard](../cases/job-scheduler.md) (id: job-scheduler), and [Till](../cases/payment-idempotency.md) (id: payment-idempotency).

## Cross-links

- [CAP as a conversation, not a religion](./cap-and-consistency.md) (id: cap-and-consistency)
- [Fan-out that survives flaky devices](../cases/notification-system.md) (id: notification-system)
- [Cron, ad-hoc, leases, and retries](../cases/job-scheduler.md) (id: job-scheduler)
- [Making a double-click charge once](../cases/payment-idempotency.md) (id: payment-idempotency)
- [Ordered delivery for a 1:1 and small-group messenger](../cases/chat-system.md) (id: chat-system)
- [Batching tokens onto scarce GPUs](../cases/llm-serving.md) (id: llm-serving)
- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
