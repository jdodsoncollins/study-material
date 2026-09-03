---
id: three-sum
title: Three-value search
slug: three-sum
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: After sorting, pin one ticket and squeeze the other two with two pointers so every zero-sum triple is found without a cubic scan.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/two-pointers
  - interviews/leetcode
prerequisites:
  - two-sum
  - two-pointers
related:
  - two-sum
  - two-pointers
  - hash-maps
  - big-o
company_signal:
  - name: Meta
    evidence: Candidate phone-screen reports and tagged lists keep listing three-value zero-sum as the follow-up to pair-sum.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: OA writeups treat unique triplets summing to a target as a default medium.
    year: 2025
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode Meta and Amazon tagged-list threads
updated: 2026-09-02
status: canonical
---

# Three-value search

## Snapshot

- You need three distinct positions whose values add to a target (often 0). Nested triplets are O(n³).
- Sort, then for each pinned left value run two-sum on the suffix.
- Skip duplicate pins and duplicate inner moves or you emit the same triple twice.
- Hashing every pair works too, but sorting plus two pointers is the expected board solution.

## Prompt

A box office dumps ticket stubs with over/under amounts relative to face value: `stubs = [9, -4, 5, -5, 2, 7, -7, 0]`. Find every unique triple of stubs that nets to `0` so the till balances. Each stub may be used at most once in a triple. Order inside a triple does not matter.

This is the three-sum shape. The stubs are not the textbook `[-1, 0, 1, 2, -1, -4]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "three values that add to X" | Pin one, two-pointer the rest |
| Unique triples, duplicates in input | Sort so you can skip equals |
| Unsorted, n around 10^3 | O(n²) is the budget; O(n³) is not |
| Need original indices | Do not sort in place without tuples |

## Worked approach

Sort. For each index `i`, run left/right on `i+1..end`. Move the side that makes the sum closer to 0. Skip repeats after a hit.

```ts
function balanceTriples(stubs: number[]): number[][] {
  const a = [...stubs].sort((x, y) => x - y);
  const out: number[][] = [];
  for (let i = 0; i < a.length; i++) {
    if (i > 0 && a[i] === a[i - 1]) continue;
    let l = i + 1, r = a.length - 1;
    while (l < r) {
      const sum = a[i] + a[l] + a[r];
      if (sum === 0) {
        out.push([a[i], a[l], a[r]]);
        l += 1;
        r -= 1;
        while (l < r && a[l] === a[l - 1]) l += 1;
        while (l < r && a[r] === a[r + 1]) r -= 1;
      } else if (sum < 0) l += 1;
      else r -= 1;
    }
  }
  return out;
}
```

If the pinned value is already positive and the array is sorted, later pins cannot sum to 0. You can break early.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Triple nested loops | O(n³) | O(1) extra | Only for tiny n |
| Sort + pin + two pointers | O(n²) | O(1) extra besides output | Default |
| Hash pairs, then lookup | O(n²) expected | O(n²) | Heavier, useful if you need indices |

## Walkthrough

`stubs = [9, -4, 5, -5, 2, 7, -7, 0]` → sorted `[-7, -5, -4, 0, 2, 5, 7, 9]`

1. Pin `-7`. Need `+7`. Pair `-5` with `9` (too small wait: -7-5+9=-3, grow left) … `-7 + 0 + 7 = 0`. Triple `[-7, 0, 7]`. `-7 + 2 + 5 = 0`. Triple `[-7, 2, 5]`.
2. Pin `-5`. `-5 + -4 + 9 = 0`. Triple `[-5, -4, 9]`.
3. Pin `-4`. Remaining positives are too large or miss. Later pins are ≥ 0 and cannot hit 0 with two non-negative partners except zeros, which we do not have in triplicate.

Triples: `[-7, 0, 7]`, `[-7, 2, 5]`, `[-5, -4, 9]`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Reusing index i as l or r | Pairing a stub with itself | `l = i + 1` |
| Not skipping duplicates | Same triple, different order | Skip after pin and after hit |
| Hashing without a uniqueness plan | Explosion of permutations | Sort the triple before inserting into a set, or do not hash |
| Mutating the caller's array | Silent test failures | Copy before sort |

## Interview moves

- Start from two-sum: "I would hash if I needed one pair of indices. For unique triples I sort."
- Ask whether triples must be unique as values, and whether the target is always 0.
- Mention the early break when `a[i] > 0`.
- If they add a fourth number, say "same idea, one more nested pin, O(n³)," and ask if n still allows it.

## Cross-links

- [Pair lookup instead of nested scanning](./two-sum.md) (id: two-sum)
- [Squeeze from both ends](../patterns/two-pointers.md) (id: two-pointers)
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
