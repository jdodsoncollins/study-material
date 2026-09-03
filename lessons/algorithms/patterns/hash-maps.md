---
id: hash-maps
title: Hash maps as an index
slug: hash-maps
kind: pattern
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Trade linear scans for expected constant lookups by storing the fact you will need later.
tags:
  - algorithms
  - algorithms/hash-maps
  - interviews/leetcode
prerequisites:
  - hashing-internals
related:
  - two-sum
  - lru-cache
  - hashing-internals
  - three-sum
company_signal:
  - name: Meta
    evidence: Candidate reports treat complement-index and frequency-map problems as the default first phone-screen question.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: OA writeups repeatedly mention counting / grouping with maps before any graph question.
    year: 2025
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode hash-map tagged threads
updated: 2026-09-02
status: canonical
---

# Hash maps as an index

## Snapshot

- A map is an index: key is the question you will ask, value is the answer you already computed.
- Three recurring jobs: complement lookup, frequency count, grouping by a derived key (anagram signature, rounded geo cell).
- Expected O(1) per op. Say "expected." Interviewers notice if you call it a law.
- If the key space is tiny and dense, an array beats a hash map.

## Prompt

A night dock stamps each pallet with a SKU and a bin index. Given `skus = ["N-4", "K-11", "N-8", "K-3"]` and a query SKU, return the bin you last saw it in. Then, given a *pair* of SKUs that should ride together because their weights add to a target, find them in one pass.

The pair half is the two-sum shape. The index half is why the pattern exists.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "have I seen X before?" | Store X when you see it |
| "count / majority / anagram" | Frequency or signature map |
| "return indices, input unsorted" | Do not sort; index by value |
| n is 10^5, inner scan would be n² | Map is the difference between pass and timeout |

## Worked approach

Decide the key *before* you code. For pair-sum the key is the complement. For "last bin" the key is the SKU.

```ts
function lastBin(skus: string[]): Map<string, number> {
  const bins = new Map<string, number>();
  for (let i = 0; i < skus.length; i++) bins.set(skus[i], i);
  return bins;
}

function pairByWeight(weights: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < weights.length; i++) {
    const partner = seen.get(target - weights[i]);
    if (partner !== undefined) return [partner, i];
    seen.set(weights[i], i);
  }
  return null;
}

console.log(Object.fromEntries(lastBin(["N-4", "K-11", "N-8", "K-3"])));
console.log(pairByWeight([4, 11, 8, 3, 15], 19)); // [1, 2]

```

Look up *before* insert when a value must not pair with itself.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Scan for each query | O(n) per query | O(1) | Dies under many queries |
| Hash index | O(n) build, O(1) expected lookup | O(n) | Default |
| Sorted array + binary search | O(n log n) build, O(log n) lookup | O(n) | Use when they forbid hashing |

## Walkthrough

`skus = ["N-4", "K-11", "N-8", "K-3"]`

1. Store `N-4 → 0`, `K-11 → 1`, `N-8 → 2`, `K-3 → 3`.
2. Query `K-11` hits bin 1.
3. Weights `[4, 11, 8, 3]`, target 19: `4` needs 15, miss; `11` needs 8, miss; `8` needs 11, hit index 1.

Duplicates: two copies of `6` and target `12` work only if the first `6` is already in the map when the second arrives.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Using an object for numeric keys | `"10"` and `10` collide as strings | `Map`, not `{}` |
| Insert then lookup | Self-pair on `2 * x = target` | Lookup first |
| Claiming worst-case O(1) | Adversarial collisions | "Expected O(1); array if key space is dense" |
| Mutating a map while iterating it | Missed keys / exceptions | Iterate a snapshot of keys |

## Interview moves

- Name the key and the value in one sentence before writing `new Map`.
- If they ask "can we do O(1) space?", pivot to sort + two pointers and say what you lose.
- Mention load factor and "I would use an array of size 26 for letters" so they hear that you know hashing internals.
- For grouping problems, define the signature (`sorted letters`, `count tuple`) as the key.

## Cross-links

- [Pair lookup instead of nested scanning](../problems/two-sum/lesson.md) (id: two-sum)
- [Three-value search](../problems/three-sum/lesson.md) (id: three-sum)
- [Scanner memory with eviction](../problems/lru-cache/lesson.md) (id: lru-cache)
- [Hashing internals](../../cs/hashing-internals.md) (id: hashing-internals)
- [What an index actually stores](../../cs/indexes.md) (id: indexes)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
