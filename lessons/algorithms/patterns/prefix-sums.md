---
id: prefix-sums
title: Subtract two running totals to get any range
slug: prefix-sums
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 15
summary: Store the running total before each index so any contiguous range sum is one subtraction, and pair it with a hash map to count ranges that hit a target.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/hash-maps
  - interviews
  - interviews/leetcode
prerequisites:
  - hash-maps
  - sliding-window
related:
  - sliding-window
  - hash-maps
  - two-sum
  - dp-1d
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Subtract two running totals to get any range

## Snapshot

- `P[i]` is the sum of the first `i` values, with `P[0] = 0`. The sum of `a[l..r]` is `P[r + 1] − P[l]`.
- Build once in O(n); every range query after that is O(1). Only worth it when values do not change between queries.
- "Count contiguous stretches that sum to k" is [pair lookup](../problems/two-sum/lesson.md) on prefix totals: for each `P[j]`, how many earlier `P[i]` equal `P[j] − k`?
- That version works with negative values. A [sliding window](./sliding-window/lesson.md) does not, because shrinking the window no longer always lowers the sum.

## Prompt

Two questions from a service dashboard.

1. Hourly error counts for a deploy day: `errors = [3, 0, 4, 1, 2, 0, 5]`. The on-call engineer asks for many ranges, such as hours 2 through 5 inclusive. That one is `4 + 1 + 2 + 0 = 7`. Answer each range in constant time.
2. A wallet's balance changes, in dollars, in order: `deltas = [2, -1, 3, -2, 1, 2]`. How many contiguous runs of changes add up to exactly 3? Answer: `4`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Many "sum from i to j" queries on fixed data | Precompute running totals |
| "Number of subarrays with sum k", values may be negative | Prefix totals + hash map of counts |
| "Longest subarray with sum k" | Same map, store the *first* index of each total |
| "Sum divisible by k" | Bucket prefix totals by remainder |
| Values update between queries | A Fenwick or segment tree; plain prefix sums go stale |
| All values nonnegative, "longest/shortest with sum ≤ S" | A sliding window is simpler |

## Worked approach

### ELI5

Keep a tally on a receipt as you go: after each line, write the total so far.

1. To know what lines 3 through 6 cost, read the total after line 6 and subtract the total after line 2.
2. To count runs that add to 3: at each line, ask "how many earlier totals were exactly 3 less than my total now?" Each one marks the start of a run that adds to 3.
3. Before any lines, the total is 0. Write that down first, or runs that start at line 1 are missed.

### Syntax

```ts
const errors = [3, 0, 4, 1, 2, 0, 5];
const P = [0];
for (const x of errors) P.push(P[P.length - 1] + x);
console.log(P);           // [0, 3, 3, 7, 8, 10, 10, 15]
console.log(P[6] - P[2]); // hours 2..5 inclusive: 7
```

### Then the details

The counting version walks once and keeps `seen: total → how many times`. Look up before you record the current total, the same order as [pair lookup](../problems/two-sum/lesson.md).

```ts
function rangeSum(P: number[], l: number, r: number): number {
  return P[r + 1] - P[l]; // inclusive l..r
}

function countRunsSummingTo(deltas: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]); // the empty prefix
  let total = 0;
  let count = 0;
  for (const d of deltas) {
    total += d;
    count += seen.get(total - k) ?? 0;
    seen.set(total, (seen.get(total) ?? 0) + 1);
  }
  return count;
}

const P = [0, 3, 3, 7, 8, 10, 10, 15];
console.log(rangeSum(P, 2, 5));                          // 7
console.log(countRunsSummingTo([2, -1, 3, -2, 1, 2], 3)); // 4
console.log(countRunsSummingTo([], 3));                   // 0
```

The footgun is seeding the map. Without `[[0, 1]]`, every run that starts at index 0 is invisible: here, `[2, -1, 3, -2, 1]` would not be counted, and the answer drops to 3.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Re-add each range on demand | O(n) per query | O(1) | Fine for one query |
| Prefix array | O(n) build, O(1) per query | O(n) | Static data |
| Count runs, all pairs of ends | O(n²) | O(1) | Baseline to state first |
| Prefix + hash map | O(n) expected | O(n) | Handles negatives |
| Fenwick tree | O(log n) per update and query | O(n) | When values change |

## Walkthrough

### Easy

Hours 2 through 5 of `errors = [3, 0, 4, 1, 2, 0, 5]`. `P = [0, 3, 3, 7, 8, 10, 10, 15]`. The range ends at index 5, so read `P[6] = 10`; it starts at index 2, so subtract `P[2] = 3`. Answer 7, matching `4 + 1 + 2 + 0`.

### Medium

Count runs adding to 3 in `deltas = [2, -1, 3, -2, 1, 2]`. Running totals after each change: `2, 1, 4, 2, 3, 5`. `seen` starts as `{0: 1}`.

| change | total | need total − 3 | found | count | seen after |
| --- | --- | --- | --- | --- | --- |
| 2 | 2 | −1 | 0 | 0 | {0:1, 2:1} |
| −1 | 1 | −2 | 0 | 0 | {0:1, 2:1, 1:1} |
| 3 | 4 | 1 | 1 | 1 | + {4:1} |
| −2 | 2 | −1 | 0 | 1 | 2 → 2 |
| 1 | 3 | 0 | 1 | 2 | + {3:1} |
| 2 | 5 | 2 | 2 | 4 | + {5:1} |

The four runs: `[3]`, `[2, -1, 3, -2, 1]`, `[-1, 3, -2, 1, 2]`, `[1, 2]`. The last row found two, because total 2 appeared twice.

### Hard

"Longest run adding to 3" instead of a count. Store the **first** index where each total appears (seed `0 → −1`) and never overwrite it. At index 4 the total is 3 and total 0 was first seen at −1: length 5. At index 5 the total is 5 and total 2 was first seen at index 0: length 5. Longest is 5.

Why not a sliding window? With `-1` and `-2` in the data, growing the window can lower the sum and shrinking it can raise it, so there is no safe rule for when to move the left edge.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Forgetting `P[0] = 0` / `seen = {0: 1}` | Ranges starting at index 0 are lost | Seed the empty prefix |
| Off-by-one in `P[r + 1] − P[l]` | Range is one short or one long | `P` has length n + 1; write the formula once |
| Recording the total before looking it up | With k = 0, every index counts itself as a run | Look up, then record |
| Using a window with negative values | Misses runs or counts wrong ones | Prefix + hash map |
| Overwriting the first index in the "longest" variant | Returns a shorter run | Set only if the total is new |
| Large sums | Can exceed `Number.MAX_SAFE_INTEGER` | Ask about bounds; use `BigInt` if needed |

## Interview moves

- State the baseline: "all pairs of ends is O(n²); I can do one pass with running totals."
- Write `P[r + 1] − P[l]` on the board with a tiny example before coding.
- Ask whether values can be negative. That single answer picks window vs. prefix map.
- Name the link: "this is two-sum on running totals, with counts instead of indices."
- If they add updates, say "Fenwick tree" and give its O(log n) costs rather than rebuilding.

## Cross-links

- [Grow and shrink a live range](./sliding-window/lesson.md) (id: sliding-window)
- [Hash maps as an index](./hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../problems/two-sum/lesson.md) (id: two-sum)
- [Reuse the last few answers](./dp-1d.md) (id: dp-1d)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
