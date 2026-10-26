---
id: queues-delivery
title: At-least-once, idempotency, and the dead-letter lane
slug: queues-delivery
kind: concept
track: system-design
difficulty: core
estimated_minutes: 15
summary: Separate repeated delivery from repeated effects and design crash-safe deduplication at the correct boundary.
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
company_signal: []
sources_consulted:
  - https://kafka.apache.org/41/design/design/#message-delivery-semantics
updated: 2026-10-26
status: canonical
---

# At-least-once, idempotency, and the dead-letter lane

## Snapshot

- A queue separates when work is accepted from when a worker attempts it.
- At-least-once processing can repeat work after a crash or an uncertain acknowledgement.
- A deduplication record is useful only when its relationship to the effect is safe across crashes.
- Exactly-once claims require a named boundary and cooperation from the systems inside it.

## Why it shows up in interviews

The important moment is often between “the effect happened” and “the worker recorded success.” A design must explain both retries after that moment and crashes just before it.

## Core idea

### ELI5

Give each logical operation a stable ticket. A worker may receive the ticket again. It must determine whether the operation already happened, still needs to happen, or has an unknown outcome that needs reconciliation.

[Follow a retry safely](viz/once.md)

For an effect inside one transactional database, insert the processed ticket and apply the effect in the **same transaction**, protected by a unique key. A crash commits both or neither. A later delivery finds the committed ticket and returns the recorded result.

An external API call is not included in that database transaction. Persisting “done” before the call can lose the effect; persisting it afterward can repeat the effect. Use a durable outbox for pending work and a stable operation key that the downstream system enforces. If the response is lost, replay with that key or query the operation's state. An outbox alone does not prevent duplicate external effects.

Some platforms offer transactional exactly-once processing within a defined scope. For example, Kafka can coordinate consumed offsets and produced records inside Kafka transactions; an unrelated payment or email system needs its own cooperation. See the [Kafka delivery semantics](https://kafka.apache.org/41/design/design/#message-delivery-semantics).

## Worked example

### Easy

A job adds a comment to a database. Store `job_id` under a unique constraint and insert the comment in the same transaction. Redelivery finds the existing result. Verify that a failed insert rolls back the processed marker too.

### Medium

A job sends a receipt through a provider. The provider accepts it, but the response times out. The local worker cannot infer whether delivery occurred. It retries with the same provider operation key if supported, or reconciles the unknown state. A local “seen IDs” set cannot close this gap.

### Hard

Worker A pauses until its lease expires. Worker B takes over. A resumes. A generation number can reject A's stale completion in the job database, but it cannot undo an external call A already made. The external operation also needs an enforced fencing token or idempotency protocol where the product requires it.

**Practice:** mark every crash point in “record ticket → charge → acknowledge.” Explain which ordering loses a charge and which can duplicate it. Then replace the sequence with a durable operation record and a cooperating downstream API.

## Common mistakes

| Mistake | Failure | Repair |
| --- | --- | --- |
| Mark processed, then act | Crash skips the effect forever | Commit marker with local effect, or track external operation state |
| Act, then mark processed | Redelivery may repeat the effect | Downstream idempotency or reconciliation |
| Retry every error forever | Poison work consumes capacity | Classify errors, bound attempts, inspect a dead-letter queue |
| Expire keys before retries stop | Old work becomes new work | Define retention and late-retry behavior |

## How to talk about it

“The queue may deliver again. I will make the database effect and processed marker atomic. For external effects, I will state the provider's key retention and recovery protocol instead of assuming the queue can guarantee them.”

## Cross-links

- [Consistency promises during failures](../cap-and-consistency.md) (id: cap-and-consistency)
- [Route notifications without confusing acceptance and delivery](../../cases/notification-system/lesson.md) (id: notification-system)
- [Schedule occurrences and recover leased work](../../cases/job-scheduler/lesson.md) (id: job-scheduler)
- [Make a payment retry refer to one operation](../../cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Order messages and resume delivery](../../cases/chat-system/lesson.md) (id: chat-system)
- [Budget model memory and schedule streamed generation](../../cases/llm-serving/lesson.md) (id: llm-serving)
- [Forty-five minutes is a navigation problem](../interview-framework.md) (id: interview-framework)
