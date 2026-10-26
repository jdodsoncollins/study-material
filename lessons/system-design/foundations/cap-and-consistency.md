---
id: cap-and-consistency
title: Consistency promises during failures
slug: cap-and-consistency
kind: concept
track: system-design
difficulty: core
estimated_minutes: 14
summary: Define what each read and write promises, then explain how partitions and replica lag affect that promise.
tags:
  - system-design
  - system-design/foundations
  - system-design/consistency
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - sharding
  - queues-delivery
  - transactions-isolation
  - payment-idempotency
  - chat-system
company_signal: []
sources_consulted:
  - https://www.comp.nus.edu.sg/~gilbert/pubs/BrewersConjecture-SigAct.pdf
  - https://www.postgresql.org/docs/current/transaction-iso.html
updated: 2026-10-26
status: canonical
---

# Consistency promises during failures

## Snapshot

- During a network partition, a replicated read/write service cannot guarantee both linearizability and availability for every request to a non-failing node.
- CAP availability is a formal property; it is not the same as a monthly uptime percentage.
- State a consistency promise for a particular operation, with an explicit failure policy.
- Isolation, replication durability, freshness, and ordering answer different questions.

## Why it shows up in interviews

“Strong consistency” does not explain what a user observes. A useful answer names a write, a later read, the replicas they contact, and what happens when those replicas cannot communicate.

## Core idea

### ELI5

Two replicas stop communicating. One accepts a new value. The other receives a read but cannot discover that value. It cannot both return the latest committed value and always finish successfully using only what it knows.

Linearizability makes operations appear to occur atomically between their invocation and response, respecting real-time order. Read-your-writes is a narrower session promise: a user does not read a version older than their own acknowledged write. Eventual convergence alone sets no maximum delay.

Routing a session to its writer can help while that writer remains authoritative. After failover, a stale replica may still violate read-your-writes. A version token lets the reader require a replica that has reached that version, wait, or return an explicit unavailable response.

Transactions can span one machine or many. Isolation describes concurrent transaction behavior; it does not by itself specify when a remote replica receives a commit. Likewise, placing work on a queue does not select a consistency model or delivery guarantee without a protocol and configuration.

## Comparison

| Operation | Example promise | Failure behavior to decide |
| --- | --- | --- |
| Read a newly created private document | Read-your-writes | Wait for the required version or fail explicitly |
| Read a public feed | Stale data acceptable within a product target | Serve an older feed with its freshness known |
| Reserve the last item | Preserve the stock invariant | Reject or wait when the authoritative state is unavailable |
| Read presence | Approximate recent activity | Show stale/unknown status after missed heartbeats |

A two-second cache TTL is not automatically a two-second replication-lag bound. A cache can refill from a replica that is already much older. A strict freshness bound needs a way to determine the version or age and stop serving when the bound cannot be met.

**Predict:** a user writes version 12, then failover promotes a replica at version 10. Does sticky routing to the new primary preserve read-your-writes? **Check:** no. The read must wait for version 12, use a sufficiently current authority, or report that the promise cannot currently be met.

## Common mistakes

- Treating “AP” or “CP” as a complete description of every endpoint in an application.
- Calling asynchronous replication a bounded-staleness guarantee without a bound and enforcement.
- Assuming serializable transactions imply linearizable replica reads.
- Hiding an unavailable authoritative answer behind a cached success.

## How to talk about it

“For this stock update I preserve the invariant and reject writes when the authority cannot be reached. For the feed I permit stale reads. I will specify how old a response may be and what we do when we cannot prove that bound.”

## Cross-links

- [Splitting a keyspace so one box is not the product](./sharding/lesson.md) (id: sharding)
- [At-least-once, idempotency, and the dead-letter lane](./queues-delivery/lesson.md) (id: queues-delivery)
- [Make a payment retry refer to one operation](../cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Order messages and resume delivery](../cases/chat-system/lesson.md) (id: chat-system)
- [Isolation defines what concurrent transactions can observe](../../cs/transactions-isolation.md) (id: transactions-isolation)
- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
