---
id: big-o
title: Big-O as a conversation
slug: big-o
kind: concept
track: cs
difficulty: intro
estimated_minutes: 12
summary: Big-O is how you name the bottleneck and compare plans, not a stopwatch reading.
tags:
  - cs
  - cs/complexity
  - cs/data-structures
  - interviews
  - interviews/leetcode
prerequisites: []
related:
  - hashing-internals
  - arrays-vs-linked-lists
  - two-sum
  - hash-maps
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Big-O as a conversation

## Snapshot

- Big-O names how cost *grows* as input size `n` grows. It is not "this function takes 3ms."
- Interviews want a comparison of plans, not a recitation of the definition.
- Say *expected*, *amortized*, or *worst-case* when those words change the story.
- Space is part of the answer. Trading O(n) memory for O(n) time is a deal you should name.

## Why it shows up in interviews

A useful explanation connects the input size to the work. Define `n`, count the expensive operations, and state the assumptions behind library operations. For a conventional hash table, expected lookup cost and amortized insertion cost answer different questions.

Start with a correct baseline, estimate its work for the given constraints, then compare a better plan and its memory cost.

## Core idea

### ELI5

How does the *work* grow when the inbox gets bigger? Not "how many milliseconds on my laptop."

- Twice as many emails, same work per email → the work doubles. That is **linear**.
- For each email you scan every other email looking for a duplicate subject → the work squares. That is **quadratic**.
- You sort the inbox once, then walk it → extra `log n` on top of the walk.

**Big-O is an asymptotic upper bound.** We usually give a tight bound when comparing algorithms; Θ names a tight bound explicitly. For example, a linear scan is O(n), and also O(n²), but O(n²) hides useful information. Constants matter for measured performance even when they disappear from the bound.

```
n = 10     n² = 100
n = 1e5    n² = 10 billion; n log₂ n ≈ 1.66 million
n = 1e8    even a linear scan may have a substantial memory cost
```

When two plans share a class, *then* talk constants: "this walks the array twice, that one once, same O(n), I prefer one pass."

## Worked example

A checkout cart has `n` item prices. You must report whether any two add to a gift-card amount.

### Easy

`n = 10`. Checking each distinct pair uses `n(n−1)/2 = 45` comparisons. Doubling n gives 190 comparisons, roughly four times as many. This is Θ(n²) work in the worst case.

### Medium

`n = 100,000`. Distinct-pair scanning can require 4,999,950,000 comparisons. A set of previously seen prices reduces the work to expected O(n) under the usual constant-cost hash-table model, using O(n) space. These counts guide a choice; they do not promise a runtime deadline.

### Hard

Separate three claims: **worst-case** bounds every input, **expected** averages over a specified source of randomness, and **amortized** spreads cost over a sequence of operations. A chained hash table can have linear lookup when a bucket contains all entries; implementations may use other collision strategies. That sentence is [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals).

| Plan | Time | Space | What you say |
| --- | --- | --- | --- |
| Nested pair scan | O(n²) worst case | O(1) auxiliary | Compare n(n−1)/2 with the work budget |
| Sort, then two pointers | O(n log n), with a suitable sort | Depends on sort; O(n) if copying | Check mutation, original indices, and sorting workspace |
| Set of seen prices | O(n) expected | O(n) auxiliary | Assumes constant-cost hashing and equality |

```ts
function anyPairSumsTo(ids: number[], limit: number): boolean {
  const seen = new Set<number>();
  for (const id of ids) {
    if (seen.has(limit - id)) return true;
    seen.add(id);
  }
  return false;
}

console.log(anyPairSumsTo([4, 11, 8, 3, 15], 19)); // true
console.log(anyPairSumsTo([4, 11, 8], 3));         // false

```

The loop is O(n) iterations. Each `has` / `add` is expected O(1). Together: expected O(n) time, O(n) space. A simple chained implementation can degrade to O(n²) total under collisions. ECMAScript requires average sublinear access for Set, rather than mandating a particular hash-table implementation. JavaScript sorting also does not promise O(1) auxiliary space.

**Try it:** the function exits early on a match. Does a match at the second item change its worst-case bound? No: a no-match input still makes it scan all n items.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "Hash map is O(1)" as a law | Interviewer asks "always?" | "Expected, amortized across resizes" |
| Ignoring the inner loop hidden in `indexOf` | Silent O(n²) | Count library calls as work |
| Recursion without the tree | You quote O(n) for an exponential DAG | Draw the call tree, then memoize |
| Optimizing constants first | You micro-tune a quadratic | Kill the class, then the constant |

## How to talk about it

"Brute force is a nested scan, O(n²). At 10^5 it may require about five billion distinct-pair checks. I'll keep a set of prices I've already seen so each item is O(1) expected work, total expected O(n) time and O(n) space. If memory is constrained, I can compare sorting plus two pointers, accounting for the chosen sort’s workspace and whether mutation is allowed."

If they ask about the constant: "I would not claim this beats a tight O(n log n) sort on tiny n. Its expected growth rate is better under these assumptions; I would benchmark if actual latency were the requirement."

## Cross-links

- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Indexes are precomputed answers](./indexes.md) (id: indexes)
