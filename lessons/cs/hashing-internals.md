---
id: hashing-internals
title: Why a map is "O(1)" until it isn't
slug: hashing-internals
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: A hash table is an array of buckets plus a function that turns keys into indexes; collisions and resizes are why we say expected O(1).
tags:
  - cs
  - cs/data-structures
  - cs/complexity
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
  - arrays-vs-linked-lists
related:
  - big-o
  - arrays-vs-linked-lists
  - indexes
  - hash-maps
  - two-sum
company_signal: []
sources_consulted:
  - https://tc39.es/ecma262/multipage/keyed-collections.html#sec-map-objects
updated: 2026-10-26
status: canonical
---

# Why a map is "O(1)" until it isn't

## Snapshot

- Hashing is: `index = hash(key) mod bucketCount`, then store the key in that slot.
- Two keys can land in the same slot. That is a collision, not a bug.
- Average lookup is O(1) when buckets stay short. Worst case is O(n) if everything piles into one bucket.
- Growing the table (resize) is O(n) work that you amortize across inserts.

## Why it shows up in interviews

A hash map can replace repeated searches when the question is an equality lookup. Sorting, trees, and other structures can fit different operations. Say **expected O(1) per op, O(n) space, amortized across resizes, assuming a decent hash.**

This is the same machine as [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum) and as a DB hash index.

## Core idea

### ELI5

A coat-check with 8 hooks and 12 coats. Ticket number `hash(name) % 8` picks a hook. Two guests can share a hook: you hang a small chain of coats on it.

```
hash("Nia") % 8 → 3
hash("Omar") % 8 → 3     collision: chain 3 is Nia → Omar
hash("Pia") % 8 → 6
```

Load factor = items / buckets. When it reaches the implementation’s threshold, the table may allocate more buckets and rehash. Thresholds depend on the collision strategy. One insert pays O(n); most inserts pay O(1). That is *amortized*.

Two collision strategies:

- **Chaining** — each bucket is a list (or tree). Simple; extra pointers.
- **Open addressing** — if the slot is full, probe the next empty slot. Dense; deletes are fiddly.

## Worked example

### Syntax

This toy string hash costs O(key length). It illustrates bucket selection, not a secure hash or the implementation of JavaScript Map. ECMAScript requires average sublinear access for Map; it does not mandate hashing or a worst-case O(1) bound. Assume `bucketCount` is a positive integer.

```ts
function bucketOf(key: string, bucketCount: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % bucketCount;
}

console.log(bucketOf("N-4", 8), bucketOf("K-11", 8));

```

| Event | Cost | What you say |
| --- | --- | --- |
| Lookup, short chain | Expected O(1) | Default answer |
| Lookup, all keys collide | O(n) | Pathological / bad hash |
| Insert that triggers 2× resize | O(n) this call, amortized O(1) | Mention if they ask about "always O(1)" |
| Iterate all entries | O(n + buckets) | Walking empty slots costs too |

### Easy

`bucketOf("N-4", 8)` and `bucketOf("K-11", 8)` — two string keys. Predict their buckets, then run the code: 5 and 2. If different keys do collide, compare the actual keys within the bucket; matching bucket numbers do not make the keys equal.

### Medium

Load factor reaches the chosen resize threshold. One insert pays O(n) to rehash. You still say amortized O(1) because that bill is spread across later inserts.

### Hard

A hostile interviewer feeds keys that all hash to 0. Worst-case lookup is O(n). Some implementations use randomized hashing or tree-shaped buckets to mitigate this; check the language and runtime rather than assuming a defense. That is why we say **expected** O(1).

**Try it:** if two different keys collide, can you overwrite the first entry? No: a correct table retains both and distinguishes them with equality checks.

## Common mistakes

- Saying "hash maps are O(1)" with no qualifier. Add *expected* and *amortized*.
- Confusing identity keys with value keys. JavaScript Map compares object keys by identity: mutating the object does not lose the entry. In a value-hashed collection, changing fields involved in hashing can invalidate lookup assumptions.
- Forgetting that `hash(key)` itself is O(length) for strings. n huge strings is not "free."
- Confusing insertion order with sorted order. JavaScript Map preserves insertion order. It does not sort keys.

## How to talk about it

"I'll use a hash map from value to index. Each lookup is expected O(1) because we spread keys across buckets. I am paying O(n) space. If the hash is terrible or someone attacks it, a bucket becomes a list and we degrade to O(n) per op. Resizes are amortized. If they need worst-case O(1), that is a different structure — not this."

If they ask hash vs tree map: "A balanced search-tree map supports O(log n) operations and sorted-key traversal. A hash map supports expected constant-time lookup under the hash-table model; ordering guarantees depend on the API. JavaScript Map iterates in insertion order."

## Cross-links

- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum)
- [Indexes are precomputed answers](./indexes.md) (id: indexes)
- [Remembering the expensive answer nearby](../system-design/foundations/caching/lesson.md) (id: caching)
- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
