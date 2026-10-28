---
id: message-queue
title: Keep an order-event log with offsets and redelivery
slug: message-queue
kind: case-study
track: system-design
difficulty: deep
estimated_minutes: 22
summary: Partition an append-only log by order ID, commit a message once replicas have it, let each consumer group track its own offset, and make redelivery after a crash harmless.
tags:
  - system-design
  - system-design/product-cases
  - system-design/messaging
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - queues-delivery
  - sharding
related:
  - queues-delivery
  - job-scheduler
  - notification-system
  - metrics-pipeline
  - kv-store
company_signal: []
sources_consulted:
  - https://kafka.apache.org/41/design/design/#message-delivery-semantics
  - Kleppmann, Designing Data-Intensive Applications (O'Reilly, 2017), chapter 11
updated: 2026-10-28
status: canonical
---

# Keep an order-event log with offsets and redelivery

## Snapshot

- Producers append order events to a partition chosen by `hash(order_id)`. Order holds within a partition, not across the topic.
- A message is **committed** once the in-sync replicas have it. Consumers only ever see committed messages.
- Each consumer group keeps its own offset per partition. Committing the offset after processing gives at-least-once delivery, so handlers must be idempotent.
- Retention deletes old segments by time or size, whether or not anyone read them. A queue that deletes on acknowledgement is a different product.

## What this round is actually scoring

Whether you can place the two commit points (message durable, offset advanced), say what a crash between "processed" and "offset committed" causes, and handle a message that can never be processed without stalling everyone behind it.

## Company signal

This is an original practice scenario. No traceable company-specific frequency evidence is supplied.

## Requirements

| Area | Requirement |
| --- | --- |
| Publish | The checkout service publishes `order_placed`, `order_paid`, `order_cancelled` |
| Consume | Receipt email, inventory, and analytics each read every event independently |
| Order | Events for one order are processed in the order they were published |
| Delivery | No acknowledged event is lost; duplicates are possible and handled |
| Replay | Analytics can re-read the last 7 days after a bug fix |
| Poison | One malformed event must not stop the other events in its partition forever |

## Back-of-envelope

These are illustrative workload assumptions, not production measurements.

- 25,000 events/s average, **100,000/s** at peak (a sale). About 1 KB each: **100 MB/s** in at peak.
- Replication factor 3: **300 MB/s** of disk writes across the cluster at peak.
- Three consumer groups each read everything: **300 MB/s** out at peak, mostly served from page cache because consumers read recent data.
- Seven days at the 25 MB/s average: 25 MB/s × 604,800 s ≈ **15.1 TB**, or **45.4 TB** with three replicas.
- The slowest group, receipt email, handles about 500 events/s per consumer. At 100,000/s it needs 200 consumers, and one partition is read by at most one consumer in a group, so it needs **at least 200 partitions**. Choose **256** for headroom: about 390 events/s per partition at peak.
- If one broker sustains about 50 MB/s of replicated writes comfortably (an assumption to benchmark), 300 MB/s needs at least 6. Run **9 brokers across 3 zones** so a zone loss leaves enough.

## Design

### ELI5

Each partition is a numbered notebook that only grows. Writers add lines at the end. Readers keep a bookmark saying "I've handled everything before line 812". If a reader crashes, it starts again at its bookmark, so it might see a few lines twice, never skip one. Old pages are torn out after a week no matter where the bookmarks are.

[Trace a publish, a crash, and a redelivery](viz/offsets.md)

### Operation and authoritative state

- **Partition log.** Each partition is an ordered sequence of messages with offsets 0, 1, 2, … stored as segment files. One broker is the **leader** for a partition; two followers copy from it. The leader's log, up to the replicated point, is authoritative.
- **Produce.** The producer hashes `order_id` to a partition and sends to its leader. With idempotence enabled, the producer has an ID and a per-partition sequence number, so the leader drops a retried batch it already appended.
- **Consume.** Consumers in a group split the partitions among themselves. Each fetches from its partitions' leaders starting at the group's committed offset, processes, and commits a new offset. Offsets are stored durably by the broker, in a compacted internal log.
- **Group membership.** When a consumer joins or dies, the group **rebalances** partitions. During a rebalance, the affected partitions pause.

### Commit boundaries

1. **Message committed.** The leader appends, followers fetch it, and once every in-sync replica has it, the leader advances the partition's **high watermark** past it. The producer's ack (with "all in-sync replicas" acks) means this point. Set a minimum in-sync replica count of 2 so a leader alone cannot acknowledge.
2. **Offset committed.** The consumer commits offset `n + 1` after its side effects for message `n` are done. Crash before the commit and messages since the last commit are redelivered. Commit before processing and a crash loses them: at-most-once.

```ts
type Run = { committed: number; redelivered: number };

// Process from `start`, commit every `batch` messages, crash after `crashAfter` messages.
function consume(log: string[], start: number, batch: number, crashAfter: number, sent: Set<string>): Run {
  let committed = start, redelivered = 0;
  for (let next = start, n = 0; next < log.length; next++, n++) {
    if (n === crashAfter) return { committed, redelivered };
    if (sent.has(log[next])) redelivered++;
    else sent.add(log[next]); // the receipt email, keyed by order ID
    if ((n + 1) % batch === 0 || next === log.length - 1) committed = next + 1;
  }
  return { committed, redelivered };
}

const log = ["order-41", "order-42", "order-43", "order-44", "order-45"];
const sent = new Set<string>();
const first = consume(log, 0, 2, 3, sent);
console.log(first); // { committed: 2, redelivered: 0 }: order-43 was handled but not committed
console.log(consume(log, first.committed, 2, Infinity, sent), sent.size); // { committed: 5, redelivered: 1 } 5
```

The `sent` set stands in for a durable "receipt already sent for this order" record. Without it, order-43 gets two emails.

### Recovery behavior

- **Leader broker dies.** A controller picks a new leader from the in-sync replicas. Committed messages survive because every in-sync replica had them. Allowing an out-of-sync replica to become leader ("unclean" election) restores availability sooner and can lose acknowledged messages. Keep it off for orders.
- **Consumer dies.** Rebalance hands its partitions to others; they resume from the committed offsets and redeliver the uncommitted tail.
- **Poison event.** After 3 failed attempts, the consumer writes the event to a **retry topic** with a delay, then to a **dead-letter topic** after the last retry, commits past it, and moves on. Consequence: later events for the same order may now run before it. If that matters, park the whole `order_id` (skip its later events into the same retry lane until the first is resolved).
- **Retention.** Segments older than 7 days are deleted. A consumer group whose offset points into a deleted segment must reset (to earliest or latest, by policy) and alert. That is data loss for that group; alert on consumer lag long before it happens.
- **Compaction.** For a "latest status per order" topic, keep only the newest message per key instead of deleting by age.

## Tradeoffs

| Choice | Benefit | Cost |
| --- | --- | --- |
| Partitioned log with offsets | Replay, many independent groups, high throughput | Order only within a partition; poison events need a side lane |
| Per-message ack queue with visibility timeout | Out-of-order completion; per-message retry | No cheap replay; broker tracks every message's state |
| Key by `order_id` | Per-order ordering | A huge account or a hot key skews one partition |
| More partitions | More consumer parallelism | More files, longer leader elections, more rebalance work |
| acks from all in-sync replicas | No loss of acknowledged messages on one failure | Higher publish latency |
| Commit offset after processing | At-least-once | Duplicates; handlers must be idempotent |
| Transactions spanning read, write, and offset | Exactly-once inside the log system | Does not cover external effects like sending an email |

## Failure modes

- **Double email.** A crash between sending and committing redelivers. Record "sent for order X" in the same store the email path checks.
- **Rebalance storm.** Consumers that take longer than the poll timeout to process a batch are presumed dead, triggering rebalances that cause more timeouts. Bound batch size and processing time.
- **Hot partition.** One merchant with 30% of orders lands on one partition. Key by `merchant_id + order_id` hash only if per-merchant ordering is not needed.
- **Lag past retention.** Inventory falls 8 days behind during an outage and silently skips a day. Lag alerts with time-to-retention.
- **Dual write.** The checkout service commits the order and then publishes; a crash between them loses the event. Use an outbox table relayed to the log.

## Follow-ups an interviewer may ask

**Easy:** a consumer processed offsets 812–815 and crashed before committing past 812. What runs again?

**Medium:** add a fourth consumer group for fraud checks that is three times slower than email. What changes in partitions and consumer counts?

**Hard:** finance wants each order counted exactly once in a revenue table outside the log. What can the log's transactions guarantee, and what must the revenue table do itself?

## Cross-links

- [At-least-once, idempotency, and the dead-letter lane](../../foundations/queues-delivery/lesson.md) (id: queues-delivery)
- [Schedule occurrences and recover leased work](../job-scheduler/lesson.md) (id: job-scheduler)
- [Route notifications without confusing acceptance and delivery](../notification-system/lesson.md) (id: notification-system)
- [Collect fleet metrics and logs without drowning in labels](../metrics-pipeline.md) (id: metrics-pipeline)
- [Replicate a cart store with quorums](../kv-store/lesson.md) (id: kv-store)
- [Splitting a keyspace so one box is not the product](../../foundations/sharding/lesson.md) (id: sharding)
