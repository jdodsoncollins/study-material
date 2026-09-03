---
id: skip-bay
title: Skip a neighboring bay
slug: skip-bay
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: For each bay, the best take is that bay plus the best two-back, or skip it and keep the best so far.
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
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list house-robber / skip-adjacent as the standard 1D DP easy/medium after climb-stairs.
    year: 2026
    confidence: high
  - name: Google
    evidence: Phone-screen writeups describe adjacent-skip loot as a common linear DP.
    year: 2026
    confidence: medium
sources_consulted:
  - LeetCode Top 100 Liked (House Robber, 2026)
  - r/leetcode 1D DP tagged threads
updated: 2026-09-03
status: canonical
---

# Skip a neighboring bay

## Snapshot

- Bays in a line, each with a loot value. Take a subset. Adjacent bays alarm if both are taken. Maximize loot.
- `best[i] = max(best[i-1], best[i-2] + loot[i])`. Two scalars are enough.
- Circular bays (first and last also adjacent) is a follow-up: run the recurrence twice.
- Greedy "always take the bigger neighbor" fails. A small bay can unlock two large ones.

## Prompt

Bay loot, dollars: `loot = [6, 2, 9, 8, 1]`. Taking two neighbors trips the alarm. Return the most you can take.

This is house-robber. The row is dock bays, not `[1,2,3,1]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Max sum, no two adjacent | 1-D DP, two choices per index |
| Circular | Two ranges, take the max |
| Tree of houses | Tree DP, not this array |
| Unlimited coins | Coin-change, different recurrence |

## Worked approach

```ts
function maxBays(loot: number[]): number {
  let prev2 = 0;
  let prev1 = 0;
  for (const x of loot) {
    const take = prev2 + x;
    const skip = prev1;
    prev2 = prev1;
    prev1 = take > skip ? take : skip;
  }
  return prev1;
}

console.log(maxBays([6, 2, 9, 8, 1])); // 16
console.log(maxBays([4, 4]));          // 4
```

`prev1` is best ending at or before the last bay. `prev2` is best ending at or before the one before that.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Recurse take/skip | Exponential | O(n) stack | Memo makes it the table |
| 1-D table | O(n) | O(n) | Easy to draw |
| Two scalars | O(n) | O(1) | Default |

## Walkthrough

`loot = [6, 2, 9, 8, 1]`

[Take or skip this bay](viz/take.md)

1. 6. best=6.
2. 2 vs 6. Keep 6.
3. 6+9=15 vs 6. Take 15.
4. 6+8=14 vs 15. Keep 15.
5. 15+1=16 vs 15. Take 16.

`6+9+1`. Check: 2+8=10, 6+8=14, 2+9+1=12. 16 wins.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Greedy biggest-first | Skip a small bay you needed | Recurrence |
| Using `prev1` as `prev2` before copying | Off-by-one | Save `take` first |
| Starting both scalars at `loot[0]` | Double-counts bay 0 | `prev2=0`, `prev1=0`, then the loop |
| Circular without splitting | First and last both taken | Two runs, drop first or last |

## Interview moves

- Speak the cell: "skip this bay, or take it plus the best from two back."
- If they add a circle, do not mutate the recurrence. Run `[0..n-2]` and `[1..n-1]`.
- Climb-stairs is the same skeleton with `+1` instead of `+ loot[i]`.

## Cross-links

- [Reuse the last few answers](../../patterns/dp-1d.md) (id: dp-1d)
- [Fewest tokens for a fare](../coin-change/lesson.md) (id: coin-change)
- [One buy, one sell on the tape](../one-trade/lesson.md) (id: one-trade)
- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
