---
id: choosing-a-datastore
title: Pick a store by its access pattern
slug: choosing-a-datastore
kind: concept
track: system-design
difficulty: core
estimated_minutes: 18
summary: Choose relational, key-value, document, or wide-column storage from the queries and invariants you must serve, and know why B-trees and LSM trees trade reads against writes.
tags:
  - system-design
  - system-design/foundations
  - system-design/storage
  - cs
  - cs/databases
  - interviews
  - interviews/system-design
prerequisites:
  - indexes
related:
  - indexes
  - transactions-isolation
  - sharding
  - replication-and-failover
  - url-shortener
  - chat-system
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/btree.html
  - https://www.cs.umb.edu/~poneil/lsmtree.pdf
  - https://github.com/facebook/rocksdb/wiki/RocksDB-Overview
  - https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf
updated: 2026-10-28
status: canonical
---

# Pick a store by its access pattern

## Snapshot

- Start from the queries, the invariants that must hold atomically, and the size and growth of the data. The product category of the database comes last.
- Relational stores give joins, secondary indexes, constraints, and multi-row transactions. They are the default until a stated requirement pushes you away.
- Key-value stores answer "get/put by key" very predictably and partition easily. Anything else you build yourself.
- Document stores keep a whole aggregate together; wide-column stores keep rows sorted by a partition key and a clustering key, which suits large, append-heavy, time-ordered data.
- B-tree engines update pages in place and favor reads; LSM-tree engines buffer and append sorted runs and favor writes, paying with compaction and multi-level reads.

## Why it shows up in interviews

"Which database would you use?" is a test of reasoning, not brand knowledge. A good answer lists the access patterns first ("look up a link by code; list a user's links newest first"), names what must be atomic ("a code is unique"), and then picks the simplest store that serves those. Naming a product without the queries sounds like a guess. Naming the queries and then a store type is a design.

## Core idea

### ELI5

Write down every question the application asks the data and every rule that must never be broken. Then pick the store whose natural lookup matches the most frequent questions and whose transactions cover the rules. If one store cannot do both well, add a second one deliberately and decide which is the source of truth.

### What each model is good at

**Relational.** Tables, foreign keys, unique constraints, arbitrary secondary indexes, joins, and transactions across rows. A shopping cart with orders, line items, and inventory reservations fits here. Scaling writes past one primary requires partitioning, and cross-partition transactions get expensive or unavailable depending on the system.

**Key-value.** One key, one value, very fast. Session tokens, feature-flag snapshots, short-link code → destination. Range queries, secondary indexes, and multi-key atomicity are limited or absent unless the specific store adds them.

**Document.** A JSON-like aggregate per key, with indexes on fields inside it. A user profile with nested preferences and addresses reads in one fetch. Updates that span many documents need care; check the store's transaction scope.

**Wide-column.** Rows grouped by a partition key and sorted by clustering columns inside the partition. "All messages in conversation 812, newest first" is one sequential read of one partition. You design tables per query, often duplicating data, and the partition key must spread load evenly.

### B-tree versus LSM tree

A **B-tree** keeps keys sorted in fixed-size pages arranged as a shallow tree. A lookup reads a few pages from root to leaf. An update rewrites the affected page in place (with a write-ahead log for crash safety). Reads are predictable; random writes cause random page writes.

An **LSM tree** (log-structured merge tree) writes new entries into an in-memory sorted buffer (the memtable) plus a log. When the buffer fills, it is flushed as an immutable sorted file. Background **compaction** merges files and drops overwritten or deleted entries. Writes are sequential and cheap. A read may check the memtable and several files, newest first, which is why LSM engines keep per-file Bloom filters and indexes. Deletes are written as **tombstones** that hide older values until compaction removes both.

| Concern | B-tree | LSM tree |
| --- | --- | --- |
| Point read | A few page reads | Memtable plus possibly several files; Bloom filters skip most |
| Write | In-place page update plus log | Append to memtable plus log; compaction later |
| Range scan | Walk adjacent leaves | Merge across files |
| Write amplification | Page rewrites | Rewrites during each compaction level |
| Space | Pages can be partly empty | Old versions and tombstones until compaction |
| Typical fit | Read-heavy OLTP with secondary indexes | Write-heavy ingest, time series, large key-value sets |

These are tendencies. Real engines add caches, compression, and tuning that shift the numbers, so measure with the actual workload.

## Comparison

| Model | Natural query | Atomic scope (typical) | Watch out for |
| --- | --- | --- | --- |
| Relational | Any indexed predicate, joins | Multi-row, multi-table transactions | One write primary per partition |
| Key-value | Get/put by exact key | Single key | No secondary queries |
| Document | Fetch an aggregate; filter on indexed fields | One document; wider scopes vary by store | Cross-document invariants |
| Wide-column | Rows in one partition, sorted by clustering key | Usually one partition | Hot partitions; one table per query |

### Easy

Short links: "resolve by code" and "codes are unique." A key-value store or a relational table with a unique index both serve that. If the product also lists a user's links by creation time, a relational secondary index or a second key-value mapping is needed. Pick relational unless the read rate forces more.

### Medium

Chat history: "last 50 messages in a conversation," "messages after sequence 1,200," billions of rows, mostly appends. A wide-column table partitioned by conversation and clustered by sequence serves both queries as one partition read. Very large group chats can make one partition hot; split by `(conversation, time bucket)` if measurements show it.

### Hard

An LSM store receives `put(cart:7, 3 items)`, flushes, then `put(cart:7, 5 items)`, then `delete(cart:7)`. A read must return "not found" even though an older file still holds a value. The tombstone in the newest location wins. The sketch below shows that read order.

```ts
type Entry = { value: string | null }; // null is a tombstone

function lsmGet(memtable: Map<string, Entry>, files: Map<string, Entry>[], key: string): string | null {
  const hit = memtable.get(key);
  if (hit) return hit.value;
  for (const file of files) { // newest file first
    const e = file.get(key);
    if (e) return e.value; // first match wins, even a tombstone
  }
  return null;
}

const oldest = new Map([["cart:7", { value: "3 items" }], ["cart:9", { value: "1 item" }]]);
const newer = new Map([["cart:7", { value: "5 items" }]]);
const mem = new Map([["cart:7", { value: null }]]);
console.log(lsmGet(mem, [newer, oldest], "cart:7")); // null: deleted
console.log(lsmGet(mem, [newer, oldest], "cart:9")); // '1 item'
console.log(lsmGet(new Map(), [newer, oldest], "cart:7")); // '5 items' before the delete
```

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| Choosing a brand before listing queries | The store cannot answer the second query | Write the access patterns first |
| "NoSQL scales, SQL doesn't" | Throws away constraints the product needs | Size the load; partition relational data when needed |
| Unique rule enforced in application code | Two concurrent requests both pass the check | Use a store-level unique constraint or conditional write |
| Wide-column partition by a hot key | One node takes all the traffic | Pick a key with spread, or bucket it |
| Treating LSM deletes as instant | Space and read cost stay until compaction | Account for tombstones and compaction debt |
| Two stores with no source of truth | They drift and nobody knows which is right | Name the authority; feed the other from it |

## How to talk about it

"The hot paths are resolve-by-code and list-my-links. Uniqueness of the code must be atomic. A relational table with a primary key on code and an index on `(owner, created_at)` covers both. If reads grow past what replicas and a cache absorb, the code lookup moves well to a partitioned key-value store, with the relational table still the authority for ownership."

## Cross-links

- [Indexes are precomputed answers](../../cs/indexes.md) (id: indexes)
- [Isolation defines what concurrent transactions can observe](../../cs/transactions-isolation.md) (id: transactions-isolation)
- [Splitting a keyspace so one box is not the product](./sharding/lesson.md) (id: sharding)
- [Copies, leaders, and who is allowed to write](./replication-and-failover/lesson.md) (id: replication-and-failover)
- [Create and resolve short links safely](../cases/url-shortener/lesson.md) (id: url-shortener)
- [Order messages and resume delivery](../cases/chat-system/lesson.md) (id: chat-system)
