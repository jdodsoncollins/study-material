---
id: indexes
title: Indexes are precomputed answers
slug: indexes
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: An index is extra storage that turns a scan into a seek; you pay for it on every write, and the wrong index is worse than none.
tags:
  - cs
  - cs/databases
  - cs/data-structures
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
company_signal:
  - name: Amazon
    evidence: Service-design and backend screens still ask "what index would you add" and "why did this write get slower after the index."
    year: 2026
    confidence: high
sources_consulted:
  - B-tree vs hash index notes from database courses
  - Hello Interview / system-design talks on secondary indexes and write amplification
  - Query-plan intuition (seek vs seq scan) as used in interview debriefs
updated: 2026-09-02
status: canonical
---

# Indexes are precomputed answers

## Snapshot

- A table without a useful index is a heap you scan. An index is a sorted (or hashed) copy of *some* columns plus a pointer back to the row.
- **B-tree** indexes answer range and equality. **Hash** indexes answer equality only.
- Every write updates the table *and* each index that mentions a changed column.
- Selectivity matters: an index on `status` with two values often loses to a sequential scan.

## Why it shows up in interviews

"The listings page is slow" is a database round in disguise. They want you to ask which columns appear in `WHERE`, `JOIN`, and `ORDER BY`, then name an index, then name the write cost. "Just add an index" without a workload is the junior move.

This is the same idea as a hash map in [two-sum](../algorithms/problems/two-sum.md) (id: two-sum): precompute a lookup so you do not nest-scan.

## Core idea

A used bookstore. The shelves are the heap (arrival order). The card catalog is an index: author → shelf slot. Binary-search the cards (B-tree), or hash the author to a drawer (hash index).

```
row heap:  [crate 9][crate 3][crate 18]...
index on (yard, arrived_at):
  (east, 09:01) → row 2
  (east, 09:07) → row 0
  (west, 08:44) → row 1
```

A **covering** index has every column the query needs, so you never touch the heap. A **composite** index on `(yard, arrived_at)` helps `WHERE yard = ? ORDER BY arrived_at`, not `WHERE arrived_at = ?` alone — left prefix matters.

Primary keys are indexes. Secondary indexes in a clustered store often hold the PK, then bounce to the row (bookmark lookup).

## Comparison

| Tool | Answers | Weak at | Write tax |
| --- | --- | --- | --- |
| Heap scan | Anything, slowly | Point lookups | None extra |
| B-tree | `=`, `<`, `BETWEEN`, `ORDER BY` | Low-selectivity flags | Log n per insert |
| Hash index | `=` | Ranges | Expected O(1) per insert |
| Composite (a, b) | Prefix `a`, then `b` | Leading with `b` | Wider keys, more I/O |

```ts
// Left-prefix: this index helps q1, not q2.
type Idx = { yard: string; arrivedAt: number; row: number };
function lookupYard(idx: Idx[], yard: string): Idx[] {
  return idx.filter((e) => e.yard === yard); // real engine: B-tree seek + scan
}
```

At n = 10^7 rows, a seek is tens of page reads. A scan is millions. That is the whole product pitch.

## Common mistakes

- Indexing every column "just in case." Writes crawl; planner gets confused.
- Expecting `LIKE '%east'` to use a B-tree. Leading wildcard kills the order.
- Forgetting unique constraints *are* indexes. You already paid for them.
- Adding a secondary index, then filtering on a column that is not in it — still a heap bounce per hit.

## How to talk about it

"I will look at the query, not the table. Equality and range on high-selectivity columns go into a B-tree, matching the left prefix. I will not index a boolean. I will mention write amplification and storage. If the keyspace is huge, the index is what we shard on, not a random column."

If they ask hash vs B-tree: "Hash is equality and RAM-friendly, like a map. B-tree is the default on disk because pages stay ordered and ranges are free."

## Cross-links

- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Trees are graphs with a promise](./trees-graphs.md) (id: trees-graphs)
- [Isolation is which lie you agreed to](./transactions-isolation.md) (id: transactions-isolation)
- [Split the keyspace on purpose](../system-design/foundations/sharding.md) (id: sharding)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum.md) (id: two-sum)
