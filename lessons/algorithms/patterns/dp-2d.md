---
id: dp-2d
title: Fill a grid of overlapping subproblems
slug: dp-2d
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: When the state needs two indices, fill a table in an order that only reads already-solved cells.
tags:
  - algorithms
  - algorithms/dynamic-programming
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-1d
related:
  - dp-1d
  - desk-paths
  - dfs-backtracking
  - bfs
  - longest-unique-window
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Fill a grid of overlapping subproblems

## Snapshot

- Two moving parts in the state: index i in A and j in B, or row and column, or index and remaining budget.
- Write `dp[i][j]` in English first. This definition determines the recurrence and the fill order.
- Fill order is a dependency graph. Usually top-left to bottom-right, sometimes last row backward for knapsack reuse.
- Recursion + memo is the same table. Bottom-up just makes the fill order visible.

## Prompt

A robot may only step right or down through a city grid. Some cells are blocked buildings (`#`). The rest are streets (`.`). Start is top-left, destination is bottom-right.

```
. . #
. . .
# . .
```

Count the walks that reach the destination. This is unique-paths-with-obstacles.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "number of ways through a grid" | `dp[r][c] = from above + from left` |
| "edit distance / longest common subsequence" | Two string indices |
| "knapsack: item i and capacity c" | Item × budget table |
| Only one index changes | Drop back to 1D |

## Worked approach

### ELI5

`dp[r][c]` = ways to reach that cell. Blocked cells stay 0. First row (and column) can only come from one direction.

### Syntax

```ts
const fromAbove = 1, fromLeft = 1;
console.log(fromAbove + fromLeft); // 2 ways reach the center
```

### Then the details

```ts
function aisleWays(floor: string[][]): number {
  if (floor.length === 0 || floor[0].length === 0) return 0;
  const rows = floor.length, cols = floor[0].length;
  const dp: number[][] = Array.from({ length: rows }, () => Array(cols).fill(0));
  dp[0][0] = floor[0][0] === "#" ? 0 : 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (floor[r][c] === "#" || (r === 0 && c === 0)) continue;
      const up = r > 0 ? dp[r - 1][c] : 0;
      const left = c > 0 ? dp[r][c - 1] : 0;
      dp[r][c] = up + left;
    }
  }
  return dp[rows - 1][cols - 1];
}

console.log(aisleWays([
  [".", ".", "#"],
  [".", ".", "."],
  ["#", ".", "."],
])); // 4

```

If they then forbid extra O(rows · cols) memory, keep one rolling row: `new[c] += new[c-1]`, after zeroing blocked cells.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| DFS every path | Exponential | O(rows+cols) | Fine for tiny grids |
| Memo on (r,c) | O(rows · cols) | O(rows · cols) | Same as the table |
| Bottom-up table | O(rows · cols) | O(rows · cols) or O(cols) | Default |

## Walkthrough

Grid as in the prompt, 3×3, blocked (0,2) and (2,0).

### Easy

1. `dp[0][0] = 1`. `dp[0][1] = 1`. `dp[0][2] = 0` (blocked).

### Medium

2. Row 1: (1,0) from above = 1. (1,1) = 1 (up) + 1 (left) = 2. (1,2) = 0 + 2 = 2.
3. Row 2: (2,0) blocked = 0. (2,1) = 2 + 0 = 2. (2,2) = 2 + 2 = 4.

Four walks. The blocked top-right cell never contributes.

### Hard

Block the start cell: every count stays zero. On a much larger open grid, path counts can exceed the safe integer range. Use bigint or a specified modulus if exact large counts are required. The example assumes a rectangular grid and safely representable counts.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Not seeding `dp[0][0]` | Whole table stays 0 | Start cell is 1 if open |
| Adding from a blocked neighbor | Paths leak through buildings | Skip or zero blocked cells |
| Filling 0/1 knapsack capacity forward with 1D reuse | An item can be used twice | Walk capacity backward, or use 2D |
| Recursing without memo | Stack + exponential | Cache the pair `(i, j)` |

## Interview moves

- Write the English cell, then the recurrence, then the base row. In that order.
- Ask whether you may step on blocked cells (no) and whether start can be blocked (answer 0).
- If they swap to LCS, the grid is string indices and the recurrence is match vs skip.
- Mention 1D rolling only after the 2D table is correct. Compression is a bonus, not the first draft.

## Cross-links

- [Reuse the last few answers](./dp-1d.md) (id: dp-1d)
- [Explore, undo, try the next branch](./dfs-backtracking.md) (id: dfs-backtracking)
- [Expand level by level](./bfs/lesson.md) (id: bfs)
- [Longest substring without repeated letters](../problems/longest-unique-window/lesson.md) (id: longest-unique-window)
- [Fewest tokens for a fare](../problems/coin-change/lesson.md) (id: coin-change)
- [Trees are graphs with a promise](../../cs/trees-graphs.md) (id: trees-graphs)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
