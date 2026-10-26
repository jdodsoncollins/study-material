---
id: bfs
title: Expand level by level
slug: bfs
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Use a queue to visit nodes in distance order so the first time you reach a node is the shortest unweighted path.
tags:
  - algorithms
  - algorithms/graphs
  - algorithms/trees
  - interviews
  - interviews/leetcode
prerequisites:
  - trees-graphs
related:
  - dfs-backtracking
  - briefing-layers
  - number-of-islands
  - topological-sort
  - trees-graphs
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Expand level by level

## Snapshot

- Queue in, queue out. A node is processed only after every closer node.
- On an unweighted graph (or a grid with equal step cost), first visit is the shortest path.
- Mark visited when you *enqueue*, not when you dequeue, or the queue explodes with duplicates.
- Trees are graphs with no cycles. BFS still works; you just skip the visited set if you only go down.

## Prompt

A chat office floorplan is a grid. `.` is walkable, `#` is a desk, `S` is you, `D` is the meeting room. Moves are up, down, left, right. Return the fewest steps from S to D, or -1 if desks block every path.

```
. # D .
S . . #
. # . .
```

This is grid BFS, a shortest path on a map, not a maze handout.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "shortest path" and every edge costs 1 | BFS, not DFS, not Dijkstra |
| Grid, four or eight neighbors | Implicit graph; do not build an adjacency list unless asked |
| "levels" / "minutes until all oranges rot" | Multi-source BFS: seed the queue with every start |
| Weighted edges | Wrong tool; Dijkstra or 0-1 BFS |

## Worked approach

[layers](viz/layers.md)

### ELI5

Find S, push it at distance 0, mark visited. Pop, try four neighbors, skip walls and repeats. First time you stand on D, return that distance.

### Syntax

```ts
const q: [number, number, number][] = [[1, 0, 0]];
const [r, c, d] = q.shift()!;
console.log(r, c, d);
```

### Then the details

```ts
function stepsToDock(floor: string[][]): number {
  if (floor.length === 0 || floor[0].length === 0) return -1;
  const rows = floor.length;
  const cols = floor[0].length;
  const q: [number, number, number][] = [];
  const seen: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (floor[r][c] === "S") {
        q.push([r, c, 0]);
        seen[r][c] = true;
      }
    }
  }
  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let head = 0; head < q.length; head++) {
    const [r, c, d] = q[head];
    if (floor[r][c] === "D") return d;
    for (const [dr, dc] of dirs) {
      const nr = r + dr, nc = c + dc;
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
      if (seen[nr][nc] || floor[nr][nc] === "#") continue;
      seen[nr][nc] = true;
      q.push([nr, nc, d + 1]);
    }
  }
  return -1;
}

console.log(stepsToDock([
  [".", "#", "D", "."],
  ["S", ".", ".", "#"],
  [".", "#", ".", "."],
])); // 3

```

The full solution uses a head index so removing the next item does not shift the remaining array. The tiny syntax example uses shift only to show FIFO order. Assume a rectangular grid with one S and one D.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| DFS first path | O(cells) | O(cells) | Not shortest |
| BFS | O(cells) | O(cells) | Default on unweighted grids |
| Dijkstra | O(e log v) | O(v) | Only if step costs differ |

## Walkthrough

Grid as in the prompt. S is (1,0), D is (0,2).

### Easy

1. Queue `(1,0,0)`. Neighbors: `(0,0)` and `(1,1)` and `(2,0)`.

### Medium

2. Distance 1 cells expand. `(0,0)` cannot go north; east is a wall.
3. Distance 2 reaches `(1,2)` via `(1,1)`.
4. Distance 3 stands on `(0,2)` = D. Return 3.

### Hard

Block cell `(1,2)` in the prompt grid. D is now unreachable and the function returns −1. Explain why exhausting the queue proves that no allowed path reaches D.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Mark visited on dequeue | Duplicate enqueues and redundant work | Mark on enqueue |
| Recursion "BFS" | That is DFS | Use a queue |
| Forgetting bounds checks | Crash on the rim | Check before indexing |
| Treating 8-connected as 4 | Wrong shortest path | Ask the movement rule |

## Interview moves

- Ask: four directions or eight? Walls? Can we step on D?
- If several starting positions are allowed, push them all at distance 0. That is multi-source BFS, same code.
- Say why DFS is illegal here: "first path found is some path, not the short one."
- Name the weighted cousin so they know you will not force BFS onto Dijkstra.

## Cross-links

- [Explore, undo, try the next branch](../dfs-backtracking.md) (id: dfs-backtracking)
- [Land clusters on a map](../../problems/number-of-islands/lesson.md) (id: number-of-islands)
- [Order by prerequisites](../topological-sort/lesson.md) (id: topological-sort)
- [Training modules with prereqs](../../problems/course-order/lesson.md) (id: course-order)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
- [Cluster membership in nearly constant time](../union-find/lesson.md) (id: union-find)
