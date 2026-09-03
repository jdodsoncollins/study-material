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
company_signal:
  - name: Meta
    evidence: Pair-sum / frequency-map phone screens routinely follow up with "why is this O(n)?" and "what if every key collides?"
    year: 2026
    confidence: high
sources_consulted:
  - Undergrad hash-table collision notes (chaining vs open addressing)
  - r/leetcode threads on adversarial string hashes
  - Language docs on HashMap load factor and resize (Java / V8-style maps)
updated: 2026-09-02
status: canonical
---

# Why a map is "O(1)" until it isn't

## Snapshot

- Hashing is: `index = hash(key) mod bucketCount`, then store the key in that slot.
- Two keys can land in the same slot. That is a collision, not a bug.
- Average lookup is O(1) when buckets stay short. Worst case is O(n) if everything piles into one bucket.
- Growing the table (resize) is O(n) work that you amortize across inserts.

## Why it shows up in interviews

Almost every "make it faster than nested loops" answer is a hash map. Interviewers then check whether you treat O(1) as a law of physics. The adult sentence is: **expected O(1) per op, O(n) space, amortized across resizes, assuming a decent hash.**

This is the same machine as [two-sum](../algorithms/problems/two-sum.md) (id: two-sum) and as a DB hash index.

## Core idea

A coat-check with 8 hooks and 12 coats. Ticket number `hash(name) % 8` picks a hook. Two guests can share a hook: you hang a small chain of coats on it.

```
hash("Nia") % 8 → 3
hash("Omar") % 8 → 3     collision: chain 3 is Nia → Omar
hash("Pia") % 8 → 6
```

Load factor = items / buckets. When it climbs (often past ~0.7), you allocate more buckets and rehash. One insert pays O(n); most inserts pay O(1). That is *amortized*.

Two collision strategies:

- **Chaining** — each bucket is a list (or tree). Simple; extra pointers.
- **Open addressing** — if the slot is full, probe the next empty slot. Dense; deletes are fiddly.

## Worked example

```ts
function bucketOf(key: string, bucketCount: number): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return Math.abs(h) % bucketCount;
}
```

| Event | Cost | What you say |
| --- | --- | --- |
| Lookup, short chain | Expected O(1) | Default answer |
| Lookup, all keys collide | O(n) | Pathological / bad hash |
| Insert that triggers 2× resize | O(n) this call, amortized O(1) | Mention if they ask about "always O(1)" |
| Iterate all entries | O(n + buckets) | Walking empty slots costs too |

A hostile interviewer can feed keys that all hash to 0. Languages mitigate with randomized seeds so you cannot *plan* the pileup from outside.

## Common mistakes

- Saying "hash maps are O(1)" with no qualifier. Add *expected* and *amortized*.
- Using a mutable object as a key, then mutating it. The bucket it lives in is the old hash.
- Forgetting that `hash(key)` itself is O(length) for strings. n huge strings is not "free."
- Treating a language `Map` as ordered. Some are insertion-ordered; do not rely on sorted order.

## How to talk about it

"I'll use a hash map from value to index. Each lookup is expected O(1) because we spread keys across buckets. I am paying O(n) space. If the hash is terrible or someone attacks it, a bucket becomes a list and we degrade to O(n) per op. Resizes are amortized. If they need worst-case O(1), that is a different structure — not this."

If they ask hash vs tree map: "Tree map is O(log n) always and keeps order. Hash map is faster in expectation and unordered."

## Cross-links

- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum.md) (id: two-sum)
- [Indexes are precomputed answers](./indexes.md) (id: indexes)
- [Cache as a second store](../system-design/foundations/caching.md) (id: caching)
- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
