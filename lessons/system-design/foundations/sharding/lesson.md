---
id: sharding
title: Splitting a keyspace so one box is not the product
slug: sharding
kind: concept
track: system-design
difficulty: core
estimated_minutes: 16
summary: Choose a partition key from queries and explain hot keys, cross-partition invariants, and safe ownership changes.
tags:
  - system-design
  - system-design/foundations
  - system-design/storage
  - interviews
  - interviews/system-design
prerequisites:
  - interview-framework
related:
  - caching
  - cap-and-consistency
  - url-shortener
  - ride-hailing
  - indexes
  - unique-ids
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/ddl-partitioning.html
updated: 2026-10-26
status: canonical
---

# Splitting a keyspace so one box is not the product

## Snapshot

- Sharding divides a logical dataset among independently served partitions.
- Choose the partition key from access patterns and invariants, then measure distribution.
- More partitions do not split a single hot key automatically.
- Rebalancing requires a data migration and ownership protocol, not just a new hash function.

## Why it shows up in interviews

Partitioning helps when measured storage, throughput, isolation, or operational requirements exceed a simpler design. It also makes joins, unique constraints, and transactions across partitions harder. Explain what justifies that cost.

## Core idea

### ELI5

A request needs a reliable way to find the owner of its data. A hash can spread keys; a range can keep nearby keys together; a directory can explicitly assign owners. Each makes some operations easier and others more expensive.

[Route a key to its owner](viz/keyspace.md)

Suppose a short-link service has 4.6 TB of raw records. Thirty-two equal partitions would average about 144 GB each before indexes, replicas, and headroom. Those numbers do not prove a single database is too slow: benchmark the miss path, writes, and operational limits first.

## Comparison

| Partition choice | Efficient operation | Cost to investigate |
| --- | --- | --- |
| Hash of short code | Lookup by short code | Time-range reports cross partitions |
| Time range | Scan a period | The newest range receives most new writes |
| Tenant directory | Route a tenant's data together | One large tenant can dominate a partition |
| Geographic cell | Nearby candidate search | Dense cells and boundary queries need extra work |

A monotonically increasing ID creates a new-write hotspot with range partitioning, but not necessarily when the ID is hashed. A global unique index needs an authoritative owner or coordination; a key-generation service does not remove the need to enforce the store's invariant.

### Migration exercise

Start with `hash(key) % 32`, then change it to `% 64`. For uniformly distributed hashes, about half the keys now map to a different number. Changing routing before copying those records produces misses.

One alternative is a fixed set of logical buckets with a directory mapping each bucket to a physical shard. To move a bucket: copy a consistent snapshot, catch up changes, transfer write authority with a version/fence, switch routing, and keep a recovery path until old readers and writers are drained. Consistent hashing with virtual nodes is another placement strategy; it is not the same as changing a modulo divisor.

**Predict:** one short code receives 40% of reads. Does doubling the number of shards halve its load? **Check:** no. That key still has one owner. Replicated reads or caching may help if the freshness contract allows them.

## Common mistakes

- Picking a key without listing the queries and cross-record invariants.
- Treating an arbitrary disk threshold as a complete migration plan.
- Assuming a uniform average means no hot partitions.
- Dismissing cross-shard queries instead of deciding whether their cost is acceptable.

## How to talk about it

“Point reads dominate, so hashing the short code is a candidate. I will keep logical placement separate from physical hosts, measure skew, and explain the ownership handoff before promising online resharding.”

## Cross-links

- [Remembering the expensive answer nearby](../caching/lesson.md) (id: caching)
- [Consistency promises during failures](../cap-and-consistency.md) (id: cap-and-consistency)
- [Create and resolve short links safely](../../cases/url-shortener/lesson.md) (id: url-shortener)
- [Reserve drivers before confirming a match](../../cases/ride-hailing/lesson.md) (id: ride-hailing)
- [Order messages and resume delivery](../../cases/chat-system/lesson.md) (id: chat-system)
- [Indexes are precomputed answers](../../../cs/indexes.md) (id: indexes)
- [Forty-five minutes is a navigation problem](../interview-framework.md) (id: interview-framework)
- [Time-ordered IDs with per-worker sequences](../unique-ids/lesson.md) (id: unique-ids)
