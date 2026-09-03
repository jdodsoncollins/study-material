---
id: two-pointers
title: Squeeze from both ends
slug: two-pointers
kind: pattern
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Walk a sorted sequence from both ends so each comparison discards a whole side of the search.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/two-pointers
  - interviews/leetcode
prerequisites:
  - arrays-vs-linked-lists
related:
  - two-sum
  - three-sum
  - sliding-window
  - fast-slow-pointers
company_signal:
  - name: Amazon
    evidence: Candidate OA writeups and tagged-list threads keep listing sorted pair / container problems as two-pointer drills.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone-screen reports often follow a hash-map pair-sum with a "now the array is sorted" follow-up.
    year: 2026
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode two-pointer tagged threads
updated: 2026-09-02
status: canonical
---

# Squeeze from both ends

## Snapshot

- Two indices start at opposite ends (or one stays, one walks) and only ever move inward.
- Sorting first is the usual tax. After that, each comparison throws away a whole prefix or suffix.
- Use this when the input is ordered, or when you are allowed to order it and you do not need original indices.
- Same family as sliding window, different contract: here the useful pair is not a contiguous slice.

## Prompt

A ferry boarding sheet lists crate masses already sorted: `masses = [3, 5, 8, 12, 14, 21]`. The gangway holds exactly `limit = 26` if two crates ride together. Return any pair of values that add to 26. You may not reuse a crate.

This is the sorted sibling of pair-sum. If the interviewer wanted indices from an unsorted bag, you would not sort; you would hash.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "array is sorted" or "you may sort" | Ends become meaningful |
| Pair / triplet that hits a target | Inward pointers beat nested loops |
| "container with most water" shape | Area is min-height times width; move the short wall |
| Need original indices | Do not sort in place; stash `(value, index)` or switch to a map |

## Worked approach

[squeeze](viz/squeeze.md)

Left starts at 0, right at the last index. Compare `masses[L] + masses[R]` to the limit. Too small, `L++`. Too big, `R--`. Equal, done.

```ts
function ferryPair(masses: number[], limit: number): [number, number] | null {
  let left = 0;
  let right = masses.length - 1;
  while (left < right) {
    const sum = masses[left] + masses[right];
    if (sum === limit) return [masses[left], masses[right]];
    if (sum < limit) left += 1;
    else right -= 1;
  }
  return null;
}

console.log(ferryPair([3, 5, 8, 12, 14, 21], 26)); // [5, 21]
console.log(ferryPair([3, 5, 8, 12, 14, 21], 22)); // [8, 14]

```

The move is legal only because the array is sorted. If a sum is short, every partner of the current left is even smaller, so the left crate is useless.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested loops | O(n²) | O(1) | Correct, dead on large n |
| Sort + two pointers | O(n log n) | O(1) extra | Default when values, not indices, are required |
| Hash map of complements | O(n) expected | O(n) | Better when unsorted and indices matter |

## Walkthrough

`masses = [3, 5, 8, 12, 14, 21]`, `limit = 26`

1. `3 + 21 = 24` too small. Advance left.
2. `5 + 21 = 26`. Return `[5, 21]`.

A miss walk: limit `22`. `3+21=24` shrink right → `3+14=17` grow left → `5+14=19` grow → `8+14=22`. Hit.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `left <= right` and pairing an item with itself | Odd-length array invents a pair | Require `left < right` |
| Sorting then returning original indices | Indices lie | Keep tuples, or do not sort |
| Moving both pointers after a hit | Skips other valid pairs | Move one, then skip duplicates if they want unique pairs |
| Using this on an unsorted list | Wrong answers, confidently | Sort first, or switch patterns |

## Interview moves

- Say out loud: "If I may sort, two pointers. If I must return indices, hash."
- Ask whether the pair must be unique, and whether duplicates exist.
- For the "max area" cousin, narrate why you move the shorter side, not the longer.
- Name the sliding-window cousin so they know you are not mixing contracts.

## Cross-links

- [Pair lookup instead of nested scanning](../../problems/two-sum/lesson.md) (id: two-sum)
- [Three-value search](../../problems/three-sum/lesson.md) (id: three-sum)
- [Grow and shrink a live range](../sliding-window/lesson.md) (id: sliding-window)
- [Two speeds, one list](../fast-slow-pointers.md) (id: fast-slow-pointers)
- [Hash maps as an index](../hash-maps.md) (id: hash-maps)
- [Arrays versus linked lists](../../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
