---
id: indexes
title: Indexes are precomputed answers
slug: indexes
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: An index can narrow a search, but its benefit depends on query shape, data distribution, result size, and maintenance cost.
tags:
  - cs
  - cs/databases
  - cs/data-structures
  - interviews
  - interviews/system-design
prerequisites:
  - hashing-internals
  - trees-graphs
related:
  - hashing-internals
  - trees-graphs
  - transactions-isolation
  - sharding
  - two-sum
company_signal: []
sources_consulted:
  - https://www.postgresql.org/docs/current/indexes-multicolumn.html
  - https://www.postgresql.org/docs/current/indexes-index-only-scans.html
  - https://www.postgresql.org/docs/current/indexes-partial.html
updated: 2026-10-26
status: canonical
---

# Indexes are precomputed answers

## Snapshot

- An index stores searchable keys with a way to locate the corresponding rows.
- B-tree indexes support equality, ordered access, and ranges; hash indexes target equality.
- Indexes cost storage and maintenance on writes. Their value depends on the queries and data distribution.
- Use a query plan and measurements to check whether the database benefits from an index.

## Why it shows up in interviews

A slow inbox query is an access-pattern question: which rows does it filter, how are they ordered, and how many does it return? An index proposal should answer those questions and explain its write and storage costs.

## Core idea

### ELI5

Think of a separate list of message references sorted by folder and received time. To read recent messages from one folder, first find that folder's section, then scan the relevant range. Avoid rereading unrelated folders.

An index on `(folder, received_at)` is well suited to equality on folder followed by a time range or order. Leading columns matter, but “a later column can never use the index” is too strong: a planner may scan it or use optimizations such as skip scan, depending on the engine and distribution.

A covering index includes all columns needed by a query. Whether an index-only scan can avoid every table visit also depends on engine details; PostgreSQL may need heap visibility checks. A primary key is a logical constraint, typically enforced with a unique index, not a synonym for an index.

## Comparison

| Access path | Useful for | Main cost or limitation |
| --- | --- | --- |
| Table scan | A large fraction of rows | Reads rows that a selective query might skip |
| B-tree | Equality, order, and ranges | Tree traversal, result scanning, and write maintenance |
| Hash index | Equality | Does not provide range order |
| Composite B-tree | A query matching its key order | Wider keys; later predicates may not narrow the scan much |

### Easy

This sorted-array model demonstrates seek followed by scan. It is not a database implementation. Entries are already sorted by folder, then time; sorting and index maintenance are excluded from the lookup cost.

```ts
type Entry = { folder: string; receivedAt: number; row: number };
function lookupFolder(index: Entry[], folder: string): Entry[] {
  let lo = 0, hi = index.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (index[mid].folder < folder) lo = mid + 1;
    else hi = mid;
  }
  const matches: Entry[] = [];
  while (lo < index.length && index[lo].folder === folder) matches.push(index[lo++]);
  return matches;
}
const index: Entry[] = [
  { folder: "inbox", receivedAt: 8, row: 0 },
  { folder: "inbox", receivedAt: 11, row: 2 },
  { folder: "sent", receivedAt: 9, row: 1 },
];
console.log(lookupFolder(index, "inbox").map(e => e.row)); // [0,2]
console.log(lookupFolder(index, "drafts")); // []
```

### Medium

With n entries and k matches, this model takes O(log n + k) lookup time and O(k) output space. A range is not free: returning a million matches still requires work proportional to the output.

### Hard

A boolean flag can be selective when only a tiny fraction of rows is true. A partial index on pending work may help, while an index for a query returning most rows may not. Test the actual distribution instead of banning boolean indexes.

**Try it:** can a binary search on this array locate `receivedAt = 9` using time alone? Not as a single time-sorted range: time restarts within each folder. Consider a separate time index if that query matters.

## Common mistakes

- Adding indexes without a workload. Each extra structure consumes storage and adds maintenance.
- Calling a JavaScript `.filter()` demonstration an indexed seek. Filter scans its input.
- Assuming every table is a heap, or every secondary index stores the same kind of row reference. Storage layouts differ.
- Expecting an ordinary B-tree to efficiently seek arbitrary leading-wildcard text searches. Choose an index type and operator suited to the query.

## How to talk about it

“I will start with the filter and order, estimate how many rows match, propose a key order, and inspect the plan. I will account for writes, result size, and table lookups. The index choice and the sharding key are related workload decisions, but they are not automatically the same key.”

## Cross-links

- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Trees are graphs with a promise](./trees-graphs.md) (id: trees-graphs)
- [Isolation defines what concurrent transactions can observe](./transactions-isolation.md) (id: transactions-isolation)
- [Splitting a keyspace so one box is not the product](../system-design/foundations/sharding/lesson.md) (id: sharding)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum)
