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
  - interviews/leetcode
prerequisites: []
related:
  - hashing-internals
  - arrays-vs-linked-lists
  - two-sum
  - hash-maps
company_signal:
  - name: Google
    evidence: Phone-screen writeups still open with "what's the complexity" before a line of code lands; candidates report justifying O(n) vs O(n log n) out loud.
    year: 2026
    confidence: high
sources_consulted:
  - Undergrad growth-rate definitions (CLRS-style)
  - r/leetcode threads on "expected O(1)" hash-map answers
  - Blind 75 / NeetCode pattern lists treating complexity as a spoken step
updated: 2026-09-02
status: canonical
---

# Big-O as a conversation

## Snapshot

- Big-O names how cost *grows* as input size `n` grows. It is not "this function takes 3ms."
- Interviews want a comparison of plans, not a recitation of the definition.
- Say *expected*, *amortized*, or *worst-case* when those words change the story.
- Space is part of the answer. Trading O(n) memory for O(n) time is a deal you should name.

## Why it shows up in interviews

The interviewer is scoring whether you notice the nested loop before the judge does. They also score whether you overclaim: "hash map is O(1)" is a junior reflex. A mid-level answer is "expected O(1) per lookup if the hash is decent and we ignore resize."

A 90-second version: brute force, why it dies at n ≈ 10^5, the cheaper plan, the leftover risk.

## Core idea

Drop constants and slower terms *after* you know they are slower. `2n` and `n` are the same class. `n` and `n log n` are not, and neither is "I sort every query."

```
n = 10     nested scan feels instant
n = 1e5    n² is 10 billion; n log n is fine
n = 1e8    even O(n) needs a reason to touch every byte
```

When two plans share a class, *then* talk constants: "this walks the array twice, that one once, same O(n), I prefer one pass."

## Worked example

A dock scanner dumps `n` crate IDs. You must report whether any two IDs sum to a load limit.

| Plan | Time | Space | What you say |
| --- | --- | --- | --- |
| Nested pair scan | O(n²) | O(1) | Correct, dies at large n |
| Sort, then two pointers | O(n log n) | O(1) extra if in-place | Fine if they allow mutating |
| Map of seen values | O(n) expected | O(n) | Default phone-screen answer |

```ts
function anyPairSumsTo(ids: number[], limit: number): boolean {
  const seen = new Set<number>();
  for (const id of ids) {
    if (seen.has(limit - id)) return true;
    seen.add(id);
  }
  return false;
}
```

The loop is O(n) iterations. Each `has` / `add` is expected O(1). Together: expected O(n) time, O(n) space. Worst-case hash collisions make it O(n²); say that only if they poke.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "Hash map is O(1)" as a law | Interviewer asks "always?" | "Expected, amortized across resizes" |
| Ignoring the inner loop hidden in `indexOf` | Silent O(n²) | Count library calls as work |
| Recursion without the tree | You quote O(n) for an exponential DAG | Draw the call tree, then memoize |
| Optimizing constants first | You micro-tune a quadratic | Kill the class, then the constant |

## How to talk about it

"Brute force is a nested scan, O(n²). At 10^5 that is too slow. I'll keep a set of values I've already seen so each crate is O(1) expected work, total expected O(n) time and O(n) space. If extra memory is banned, I sort and walk two pointers in O(n log n)."

If they ask about the constant: "I would not claim this beats a tight O(n log n) sort on tiny n. I claim it wins as n grows, which is what this prompt is testing."

## Cross-links

- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum)
- [Hash maps as an index](../algorithms/patterns/hash-maps.md) (id: hash-maps)
- [Indexes are precomputed answers](./indexes.md) (id: indexes)
