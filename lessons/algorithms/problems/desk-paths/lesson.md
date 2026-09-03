---
id: desk-paths
title: Only right and down to the desk
slug: desk-paths
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Fill a grid where each cell is paths-from-above plus paths-from-the-left, so you count routes without walking them.
tags:
  - algorithms
  - algorithms/dynamic-programming
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-2d
related:
  - dp-2d
  - dp-1d
  - number-of-islands
  - bfs
company_signal:
  - name: Google
    evidence: Candidate reports list unique-paths / grid-route counts as a common first 2D DP.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: OA writeups treat robot-on-grid path counts as the default DP-on-a-grid easy/medium.
    year: 2026
    confidence: medium
sources_consulted:
  - LeetCode Top 100 Liked (Unique Paths, 2026)
  - r/leetcode 2D DP tagged threads
updated: 2026-09-03
status: canonical
---

# Only right and down to the desk

## Snapshot

- Grid `rows × cols`. Start top-left, desk bottom-right. Moves: right or down. Count paths.
- `dp[r][c] = dp[r-1][c] + dp[r][c-1]`. First row and first column are 1.
- You can roll this into one row. Combinatorics `C(rows+cols-2, rows-1)` is the closed form; say it, then fill the table unless they want the formula.
- Obstacles (a blocked cell is 0) are the usual follow-up. Same fill.

## Prompt

A picker walks a `rows = 3` by `cols = 4` floor. Only right or down. How many walks reach the packing desk at the far corner?

This is unique-paths. The floor is 3×4, not the textbook 3×7.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Count paths, only two directions | 2D DP or combinatorics |
| Shortest path | BFS, not a count |
| Obstacles | Same table, blocked cells stay 0 |
| Every cell has a cost | Min-path-sum, still 2D, different rec |

## Worked approach

```ts
function walksToDesk(rows: number, cols: number): number {
  const dp = Array.from({ length: cols }, () => 1);
  for (let r = 1; r < rows; r++) {
    for (let c = 1; c < cols; c++) dp[c] += dp[c - 1];
  }
  return dp[cols - 1];
}

console.log(walksToDesk(3, 4)); // 10
console.log(walksToDesk(1, 1)); // 1
```

One array. `dp[c]` is the current row's cell `c`. Adding `dp[c-1]` uses the cell to the left, already updated this row; `dp[c]` before the add is the cell above.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Recurse right/down | Exponential | O(rows+cols) | Memo = the table |
| Full grid | O(rows · cols) | O(rows · cols) | Easy to draw |
| Rolling row | O(rows · cols) | O(cols) | Default |
| Binomial | O(min(rows, cols)) | O(1) | Mention; overflow on big grids |

## Walkthrough

3×4.

[Add above and left](viz/grid.md)

Row 0: `1 1 1 1` (only right).

Row 1: `1, 1+1=2, 2+1=3, 3+1=4`.

Row 2: `1, 1+2=3, 3+3=6, 6+4=10`.

10 paths. Check: you must take 2 down and 3 right, in some order. `C(5,2)=10`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Starting the interior at 0 and never seeding the first row | All zeros | First row/col = 1 |
| Allowing left/up | You count walks with cycles | Two directions only |
| Combinatorics then overflow | Silent wrap | Table, or bigints if they insist |
| 1×n treated as 0 | Off-by-one | `walksToDesk(1,1)` is 1 |

## Interview moves

- Draw the 3×4 and write the numbers in the cells. That *is* the proof.
- Name the binomial. Fill the table anyway so obstacles are a one-line change.
- Min-path-sum is `min(above,left)+cost`. Same skeleton.

## Cross-links

- [Fill a grid of overlapping subproblems](../../patterns/dp-2d.md) (id: dp-2d)
- [Reuse the last few answers](../../patterns/dp-1d.md) (id: dp-1d)
- [Pallet clusters on a flooded floor](../number-of-islands/lesson.md) (id: number-of-islands)
- [Expand level by level](../../patterns/bfs/lesson.md) (id: bfs)
