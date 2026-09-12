---
id: hash-maps
title: Hash maps as an index
slug: hash-maps
kind: pattern
track: algorithms
difficulty: intro
estimated_minutes: 18
summary: Trade linear scans for expected constant lookups by storing the fact you will need later.
tags:
  - algorithms
  - algorithms/hash-maps
  - interviews/leetcode
prerequisites:
  - hashing-internals
related:
  - two-sum
  - group-anagrams
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
updated: 2026-09-12
status: canonical
---

# Hash maps as an index

## Snapshot

- A map is an index: key is the question you will ask, value is the answer you already computed.
- Three recurring jobs: complement lookup, frequency count, grouping by a derived key (anagram signature, rounded geo cell).
- Expected O(1) per op. Say "expected." Interviewers notice if you call it a law.
- If the key space is tiny and dense, an array beats a hash map.

## Prompt

Two jobs, same map.

1. Last seen: `skus = ["N-4", "K-11", "N-8", "K-3"]`. A query SKU should return the cart index you last saw it at.
2. Pair by price: `prices = [4, 11, 8, 3, 15]`, `target = 19`. Return two indices whose values add to 19.

The index half is why the pattern exists. The pair half is the two-sum shape.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "have I seen X before?" | Store X when you see it |
| "count / majority / anagram" | Frequency or signature map |
| "return indices, input unsorted" | Do not sort; index by value |
| n is 10^5, inner scan would be n² | Map is the difference between pass and timeout |

## Worked approach

Decide the key *before* you code. For "last seen" the key is the SKU. For pair-sum the key is the complement you still need.

### ELI5

A map is an index: one question you will ask later, and the answer you already know.

Last-seen job (the SKU list above):

1. SKU `K-11` is at index 1. Store `K-11 → 1`.
2. If that SKU showed up again later, overwrite with the new index. Last write wins.
3. Someone asks "where is K-11?" You do not rescan the cart. You look it up.

Pair job (the price list above):

1. Walk left to right. This item costs 4. Need 15. Map empty. Store `4 → 0`.
2. Next costs 11. Need 8. Still a miss. Store `11 → 1`.
3. Next costs 8. Need 11. The entry is there. Those two items. Stop.

Say that out loud before you type `Map`. The key is the question. The value is the index.

### Syntax

You need `set`, `get`, and `has`.

```ts
const lastSeen = new Map<string, number>();
lastSeen.set("K-11", 1);
console.log(lastSeen.get("K-11")); // 1
console.log(lastSeen.has("N-4"));  // false
console.log(lastSeen.get("N-4"));  // undefined, not an error
```

Use `Map`, not `{}`. Numeric keys on an object become strings (`10` vs `"10"`).

### Then the details

Build the index in one pass. Last write wins, which is what "last seen" wants.

```ts
function lastSeenAt(skus: string[]): Map<string, number> {
  const seen = new Map<string, number>();
  for (let i = 0; i < skus.length; i++) seen.set(skus[i], i);
  return seen;
}

console.log(Object.fromEntries(lastSeenAt(["N-4", "K-11", "N-8", "K-3"])));
```

Pair-sum: look up the partner *before* you insert this price, or a lone `6` will pair with itself when the target is `12`.

```ts
function pairByPrice(prices: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < prices.length; i++) {
    const partner = seen.get(target - prices[i]);
    if (partner !== undefined) return [partner, i];
    seen.set(prices[i], i);
  }
  return null;
}

console.log(pairByPrice([4, 11, 8, 3, 15], 19)); // [1, 2]
console.log(pairByPrice([6, 6], 12));            // [0, 1]
```

Grouping (anagrams, rounded geo cells) is the same map: the key is a *signature* you compute, the value is a list.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Scan for each query | O(n) per query | O(1) | Dies under many queries |
| Hash index | O(n) build, O(1) expected lookup | O(n) | Default |
| Sorted array + binary search | O(n log n) build, O(log n) lookup | O(n) | Use when they forbid hashing |

## Walkthrough

### Easy

`skus = ["N-4", "K-11", "N-8", "K-3"]`. Last cart index for each SKU.

1. `N-4 → 0`
2. `K-11 → 1`
3. `N-8 → 2`
4. `K-3 → 3`

Query `K-11` → index 1. No rescan of the cart.

### Medium

Prices `[4, 11, 8, 3, 15]`, target `19`. Same numbers as the prompt.

| i | price | need | map before | result |
| --- | --- | --- | --- | --- |
| 0 | 4 | 15 | empty | miss, store 4→0 |
| 1 | 11 | 8 | 4→0 | miss, store 11→1 |
| 2 | 8 | 11 | 4→0, 11→1 | hit index 1 |

Return `[1, 2]`. You never look at 3 or 15.

### Hard

Two copies of `6`, target `12`. Look up before you insert.

- First `6`: need 6, map empty, store 6→0.
- Second `6`: need 6, map has it at 0, return `[0, 1]`.

If you insert first, the first `6` finds itself and you return `[0, 0]`, which is illegal.

Follow-up they actually ask: "group the SKUs that are anagrams." The map key becomes `sorted letters`, the value becomes a list. Walk that in [group-anagrams](../problems/group-anagrams/lesson.md) (id: group-anagrams). Follow-up #2: "why is this O(n)?" → [hashing-internals](../../cs/hashing-internals.md) (id: hashing-internals).

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
- [SKUs that share a packing cipher](../problems/group-anagrams/lesson.md) (id: group-anagrams)
- [Three-value search](../problems/three-sum/lesson.md) (id: three-sum)
- [Scanner memory with eviction](../problems/lru-cache/lesson.md) (id: lru-cache)
- [Hashing internals](../../cs/hashing-internals.md) (id: hashing-internals)
- [What an index actually stores](../../cs/indexes.md) (id: indexes)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
