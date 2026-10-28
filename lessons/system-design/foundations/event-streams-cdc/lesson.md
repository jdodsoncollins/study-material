---
id: event-streams-cdc
title: Logs, partitions, and changes you can replay
slug: event-streams-cdc
kind: concept
track: system-design
difficulty: core
estimated_minutes: 18
summary: An event stream is an append-only, partitioned log; order holds per partition, consumer groups split partitions among workers, and the outbox pattern or change data capture gets database changes onto the log without a dual write.
tags:
  - system-design
  - system-design/foundations
  - system-design/messaging
  - interviews
  - interviews/system-design
prerequisites:
  - queues-delivery
related:
  - queues-delivery
  - news-feed
  - notification-system
  - payment-idempotency
  - sharding
company_signal: []
sources_consulted:
  - https://kafka.apache.org/documentation/
  - https://kafka.apache.org/41/design/design/#message-delivery-semantics
  - https://www.postgresql.org/docs/current/logicaldecoding.html
  - https://debezium.io/documentation/reference/stable/index.html
updated: 2026-10-28
status: canonical
---

# Logs, partitions, and changes you can replay

## Snapshot

- A log is an ordered, append-only sequence of records. Each record has an offset. Consumers track their own position and can re-read.
- A topic is split into partitions for throughput. Order is guaranteed only within a partition, so records that must stay ordered share a key that maps to one partition.
- In a consumer group, each partition is read by one member at a time. More members than partitions leaves some idle.
- Consumers usually commit offsets after processing, which gives at-least-once delivery; handlers must tolerate duplicates.
- Writing to a database and publishing an event as two separate steps can lose or invent events. The transactional outbox and change data capture (CDC) avoid that dual write.

## Why it shows up in interviews

"Put it on a queue" is the most common move in a design, and the follow-ups are predictable: which events must stay in order, how many consumers can work in parallel, what happens when a consumer crashes mid-batch, and how the event and the database row stay in agreement. A log-based stream answers these differently from a classic work queue, and saying how earns trust.

## Core idea

### ELI5

Think of a notebook where you only ever add lines at the bottom and number them. Several notebooks share the work, and every topic about the same cart always goes into the same notebook, so its lines stay in order. Readers keep a bookmark per notebook. If a reader drops out, another reader picks up its notebooks from the last saved bookmark, which may mean re-reading a few lines.

[Follow a change from the database to consumers](viz/outbox.md)

### Partitions, keys, and ordering

The producer picks a partition, usually by hashing the record key. All events for `cart:812` go to the same partition, so "item added" is always before "checkout" for that cart. Events for different carts can interleave in any order across partitions. If you need a global order, you have one partition and its throughput limit.

Changing the partition count changes the key-to-partition mapping for hash partitioning, which can break per-key ordering across the change. Plan the count ahead or migrate deliberately.

### Consumer groups and offsets

A consumer group is a set of workers sharing a subscription. The broker assigns partitions to members; when a member joins or leaves, partitions are **rebalanced**. Each member commits the offset it has finished. If it crashes after processing records 100–149 but before committing 150, the next owner restarts at 100 and those records are processed again. Make the handler idempotent: store a processed-event ID in the same transaction as the effect, or make the effect naturally idempotent (an upsert keyed by event ID).

Different groups read independently. The search indexer and the notification sender each get every event at their own pace.

### Retention and compaction

A log keeps records for a time or size limit, so a new consumer can replay history within that window. A **compacted** topic keeps at least the latest record per key, which turns the log into a replayable table of current values.

### The dual-write problem and the outbox

A service that does "update the order row, then publish `OrderPaid`" can crash between the two. The row is paid and no event is ever sent. Reversing the order invents an event for a payment that rolled back.

**Transactional outbox:** in the same database transaction as the business change, insert a row into an `outbox` table. A relay reads unsent outbox rows and publishes them, marking them sent afterward. A crash means the relay publishes again, so consumers deduplicate by event ID.

**Change data capture:** read the database's own change log (for example PostgreSQL logical decoding or a MySQL binlog) and turn committed row changes into events. Tools such as Debezium do this. CDC sees only what was committed, in commit order per table or database, but it exposes your table schema as an event contract unless you publish from an outbox table through CDC, which is a common combination.

## Worked example

A shopping service emits cart events to a topic with 4 partitions, keyed by cart ID. A consumer group of 2 workers updates a "recently viewed and bought" view.

### Easy

With the hash in the sketch below, `cart:812` maps to partition 3. Events `added(sku 5)`, `added(sku 9)`, `checkout` land at offsets 70, 71, 72 of partition 3. The worker that owns partition 3 sees them in that order.

### Medium

Worker B owns partitions 1 and 3. It processes offsets 70–72 on partition 3 and crashes before committing. A rebalance gives partitions 1 and 3 to worker A, which resumes partition 3 at offset 70. `checkout` is applied twice unless the view records processed event IDs. With dedupe, the second application is a no-op.

### Hard

A third and fourth worker join, making 4 workers for 4 partitions. A fifth worker would sit idle. The sketch shows key-to-partition mapping and a simple round-robin assignment. Real brokers use their own hash functions and assignment strategies; the shape is the same.

```ts
function partitionFor(key: string, partitions: number): number {
  let h = 0;
  for (const ch of key) h = (Math.imul(h, 31) + ch.charCodeAt(0)) >>> 0;
  return h % partitions;
}

function assign(partitions: number, workers: string[]): Record<string, number[]> {
  const out: Record<string, number[]> = Object.fromEntries(workers.map((w) => [w, []]));
  for (let p = 0; p < partitions; p++) out[workers[p % workers.length]].push(p);
  return out;
}

const keys = ["cart:812", "cart:813", "cart:812", "cart:907"];
console.log(keys.map((k) => `${k}->p${partitionFor(k, 4)}`)); // same cart, same partition
console.log(assign(4, ["A", "B"]));                   // { A: [ 0, 2 ], B: [ 1, 3 ] }
console.log(assign(4, ["A", "B", "C", "D", "E"]));    // E gets []
```

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| Expecting global order across partitions | Events for one entity arrive out of order | Key by the entity that needs ordering |
| More consumers than partitions | Extra workers idle | Size partitions for peak parallelism |
| Commit offset before processing | A crash skips records | Process, then commit; dedupe on replay |
| Update row, then publish | Lost or phantom events | Outbox in the same transaction, or CDC |
| Raw table CDC as the public contract | Every schema change breaks consumers | Publish a deliberate event shape (outbox via CDC) |
| Changing partition count casually | Per-key order breaks during the move | Plan the count; migrate with a cutover |

## How to talk about it

"Cart events go to a topic keyed by cart ID, so each cart's events are ordered. We have 12 partitions so up to 12 workers per consumer group. The order service writes the event into an outbox table in the same transaction as the order change, and CDC publishes that table. Consumers commit offsets after processing and dedupe by event ID, so a rebalance replay is harmless."

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../queues-delivery/lesson.md) (id: queues-delivery)
- [Build a feed with bounded fanout](../../cases/news-feed/lesson.md) (id: news-feed)
- [Route notifications without confusing acceptance and delivery](../../cases/notification-system/lesson.md) (id: notification-system)
- [Make a payment retry refer to one operation](../../cases/payment-idempotency/lesson.md) (id: payment-idempotency)
- [Splitting a keyspace so one box is not the product](../sharding/lesson.md) (id: sharding)
