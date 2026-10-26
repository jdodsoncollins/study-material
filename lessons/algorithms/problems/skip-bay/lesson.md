---
id: skip-bay
title: Choose a maximum sum without adjacent items
slug: skip-bay
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: For each item, compare skipping it with taking its score plus the best result before its neighbor.
tags:
  - algorithms
  - algorithms/dynamic-programming
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-1d
related:
  - dp-1d
  - coin-change
  - one-trade
  - dfs-backtracking
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Choose a maximum sum without adjacent items

## Snapshot

- Choose nonadjacent items from an ordered list of scores and maximize their total.
- `best[i] = max(best[i-1], best[i-2] + scores[i])`. Two scalars are enough.
- Circular items (first and last also adjacent) is a follow-up: run the recurrence twice.
- Greedy "always take the bigger neighbor" fails. A small item can unlock two large ones.

## Prompt

A playlist editor assigns scores `scores = [6,2,9,8,1]` to tracks in order. Choose tracks with the largest total score, without choosing adjacent tracks. Scores are nonnegative, and choosing no tracks is allowed.

This uses the same recurrence as the nonadjacent-sum family of problems.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Max sum, no two adjacent | 1-D DP, two choices per index |
| Circular | Two ranges, take the max |
| Tree of houses | Tree DP, not this array |
| Unlimited coins | Coin-change, different recurrence |

## Worked approach

### ELI5

At each position, compare two legal options: skip it and keep the previous best, or take it plus the best ending before its neighbor. Save the old previous best before updating the two rolling states.

### Syntax

```ts
const bestTwoBack = 6, bestOneBack = 6, value = 9;
console.log(Math.max(bestOneBack, bestTwoBack + value)); // 15
```

### Then the details

```ts
function maxNonAdjacent(scores: number[]): number {
  let prev2 = 0;
  let prev1 = 0;
  for (const x of scores) {
    const take = prev2 + x;
    const skip = prev1;
    prev2 = prev1;
    prev1 = take > skip ? take : skip;
  }
  return prev1;
}

console.log(maxNonAdjacent([6, 2, 9, 8, 1])); // 16
console.log(maxNonAdjacent([4, 4]));          // 4
```

`prev1` is best ending at or before the last item. `prev2` is best ending at or before the one before that.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Recurse take/skip | Exponential | O(n) stack | Memo makes it the table |
| 1-D table | O(n) | O(n) | Easy to draw |
| Two scalars | O(n) | O(1) | Default |

## Walkthrough

`scores = [6, 2, 9, 8, 1]`

[Take or skip this item](viz/take.md)

### Easy

1. 6. best=6.

### Medium

2. 2 vs 6. Keep 6.
3. 6+9=15 vs 6. Take 15.
4. 6+8=14 vs 15. Keep 15.
5. 15+1=16 vs 15. Take 16.

`6+9+1 = 16`, using positions 0, 2, and 4. Other legal selections include 2+8=10 and 6+8=14. The apparent 2+9+1 selection is invalid because 2 and 9 are adjacent.

### Hard

If the first and last positions are also adjacent, solve once excluding the first and once excluding the last, then take the maximum. Handle zero and one item separately so the single item is not accidentally excluded from both runs.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Greedy biggest-first | Skip a small item you needed | Recurrence |
| Using `prev1` as `prev2` before copying | Off-by-one | Save `take` first |
| Starting both scalars at `scores[0]` | Double-counts item 0 | `prev2=0`, `prev1=0`, then the loop |
| Circular without splitting | First and last both taken | Two runs, drop first or last |

## Interview moves

- Speak the cell: "skip this item, or take it plus the best from two back."
- If they add a circle, do not mutate the recurrence. Run `[0..n-2]` and `[1..n-1]`.
- Climbing-stairs counting also uses two earlier states, but adds their counts instead of maximizing a score. Define the state and recurrence separately.

## Cross-links

- [Reuse the last few answers](../../patterns/dp-1d.md) (id: dp-1d)
- [Fewest tokens for a fare](../coin-change/lesson.md) (id: coin-change)
- [One buy, one sell on the tape](../one-trade/lesson.md) (id: one-trade)
- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
