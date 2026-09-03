---
id: cap-and-consistency
title: CAP as a conversation, not a religion
slug: cap-and-consistency
kind: concept
track: system-design
difficulty: core
estimated_minutes: 14
summary: CAP is a question about a specific partition and a specific read, not a team personality type you declare at minute two.
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
company_signal:
  - name: Google
    evidence: Candidate-reported loops and prep-site frequency writeups punish CAP slogans and reward saying which read is stale, for how long, and under which failure.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Candidate-reported L5/L6 designs (payments-adjacent, stores) probe whether you would reject a write rather than double-charge or lose an order during a replica blip.
    year: 2026
    confidence: medium
sources_consulted:
  - Standard distributed-systems interview CS (CAP / PACELC as conversation tools)
  - r/cscareerquestions threads on CAP as a trap question
  - X threads on requirements and consistency tradeoffs
updated: 2026-09-02
status: canonical
---

# CAP as a conversation, not a religion

## Snapshot

- CAP says: during a **network partition**, a replicated store cannot be both fully available for all operations *and* linearizable. It is not a menu you pick in peacetime.
- Most interview designs spend their lives in **PACELC's EL/EC**: when the network is fine, you still trade latency against consistency.
- Useful talk is per-read: "Alice must see her own mint; strangers may see it 2s late." That is a consistency *budget*, not a theorem.
- Money, inventory, and "did this job run" are usually "refuse the write if we cannot agree." Feeds and presence are usually "serve a slightly old copy."

## Why it shows up in interviews

It is a trap for people who say "we are AP because we care about users." Interviewers want to hear that you can name a partition, name an operation, and pick a degradation. They also want you to stop invoking CAP when the real issue is a single-primary failover or a cache TTL.

## Core idea

Split three different conversations:

1. **Failure mode** — disk dies, process dies, *network splits*. CAP only cares about the split.
2. **Replica role** — single primary plus async replica is a latency/durability choice. It is not "picking AP."
3. **Read promise** — linearizable, causal, read-your-writes, bounded staleness, eventual. Pick one per endpoint.

Read-your-writes is the promise users actually notice. After Alice mints a ClipForge link, her next resolve must find it. Sticky routing to the primary she wrote, or a session token that forces a primary read, is enough. Bob in another region can wait for replication.

Transactions are a *local* story. Isolation levels (see [transactions-isolation](../../cs/transactions-isolation.md) (id: transactions-isolation)) are about concurrent transactions on one database. Do not use "serializable" as a synonym for "cross-region consistent."

Queues do not make you eventually consistent as a personality. They make the *consumer* at-least-once. Combine with idempotency. See [queues-delivery](./queues-delivery/lesson.md) (id: queues-delivery).

## Comparison

| Situation | Promise you can defend | What you refuse to fake |
| --- | --- | --- |
| ClipForge resolve during replica lag | Bounded stale (TTL 2s) is fine | Advertising "always the latest long URL" |
| Alice just minted, Alice resolves | Read-your-writes via primary or session | Sending her to a lagging replica |
| Till capture | Reject if the ledger primary cannot ack | Serving a cached "paid" as truth |
| Kettle message in a 1:1 | Per-conversation ordering, not global | Total order across all chats |
| Fieldnote home | Seconds-stale inbox | Linearizable ranking of the world |
| Presence dots | Last-writer-wins, 30s heartbeat | A perfect online census during a split |

A one-line PACELC translation: "If we partition, this endpoint fails closed (money) or serves stale (feed). If we are healthy, I am willing to pay 5 ms of primary RTT for read-your-writes on the mint path, and I will not pay that on the public resolve path."

## Common mistakes

- Opening with "CAP theorem says we must choose." You must choose *during a partition, for this verb*.
- Calling a cache with a TTL "eventual consistency" as if that were a replica protocol.
- Promising linearizability *and* multi-region writes with no coordinator.
- Using "strong consistency" without naming the operation (read? write? which key?).
- Mixing isolation levels with cross-box replication. They are different knobs.

## How to talk about it

"I am not 'an AP person.' For ClipForge public resolve I will serve a 2-second-stale replica and keep the endpoint up if a region splits. For mint I fail closed: if the mint pool cannot commit the mapping, the client retries with the same request id. Alice's session is pinned to the writer so she never sees her own 404. If you want to zoom, pick either the mint uniqueness or the resolve lag, not both."

## Cross-links

- [Splitting a keyspace so one box is not the product](./sharding/lesson.md) (id: sharding)
- [At-least-once, idempotency, and the dead-letter lane](./queues-delivery/lesson.md) (id: queues-delivery)
- [Making a double-click charge once](../cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Ordered delivery for a 1:1 and small-group messenger](../cases/chat-system/lesson.md) (id: chat-system)
- [Isolation levels as a conversation](../../cs/transactions-isolation.md) (id: transactions-isolation)
- [Forty-five minutes is a navigation problem](./interview-framework.md) (id: interview-framework)
