---
id: number-of-islands
title: Land clusters on a map
slug: number-of-islands
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Flood-fill each unvisited land cell and count how many times you start a new fill; that count is the number of islands.
tags:
  - algorithms
  - algorithms/graphs
  - interviews
  - interviews/leetcode
prerequisites:
  - bfs
  - dfs-backtracking
related:
  - bfs
  - dfs-backtracking
  - union-find
  - trees-graphs
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Land clusters on a map

## Snapshot

- A grid of water (`0`) and land (`1`). Four-direction connectivity. Count the islands.
- Each cell is a graph node. You do not need to build an adjacency list.
- DFS, BFS, or union-find all work. Interview default is in-place DFS that sinks a cluster to `0`.
- Mark on visit. If you do not, you recount the same island forever.

## Prompt

A status map of live regions (`1` = land, `0` = water):

```
1 1 0 0 1
1 0 0 1 1
0 0 0 0 0
1 0 1 1 0
```

An island is a 4-connected group of land cells. Return how many islands are on the map.

This is number-of-islands. The grid is not the textbook 3×3 of `'1'`/`'0'`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Grid, count connected components | Flood fill |
| Four vs eight neighbors | Ask; it changes the count |
| Stream of land cells added over time | Union-find starts to win |
| Shortest path through the grid | BFS distances, not this problem |

## Worked approach

### ELI5

Scan each cell. When unvisited land appears, count one new island and visit every land cell connected to it. Mark cells before following neighbors, so this island cannot be counted again.

### Syntax

```ts
const grid = [[1,1],[0,1]];
grid[0][0] = 0; // mark this cell before exploring neighbors
console.log(grid[0][0]); // 0
```

### Then the details

```ts
function islandCount(floor: number[][]): number {
  const rows = floor.length, cols = floor[0]?.length ?? 0;
  const sink = (r: number, c: number) => {
    if (r < 0 || c < 0 || r >= rows || c >= cols || floor[r][c] !== 1) return;
    floor[r][c] = 0;
    sink(r + 1, c);
    sink(r - 1, c);
    sink(r, c + 1);
    sink(r, c - 1);
  };
  let clusters = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (floor[r][c] === 1) {
        clusters += 1;
        sink(r, c);
      }
    }
  }
  return clusters;
}

const floor = [
  [1, 1, 0, 0, 1],
  [1, 0, 0, 1, 1],
  [0, 0, 0, 0, 0],
  [1, 0, 1, 1, 0],
];
console.log(islandCount(floor.map((row) => row.slice()))); // 4

```

If they forbid mutating the grid, keep a `seen` matrix. If the grid is huge and skinny, BFS avoids stack depth.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| DFS flood | O(rows · cols) | O(rows · cols) stack worst case | Default |
| BFS flood | O(rows · cols) | O(rows · cols) worst-case queue | Safer depth |
| Union-find on land cells | O(rows · cols · α(rows · cols)) amortized | O(rows · cols) | Better when land is streamed |

## Walkthrough

Grid in the prompt.

[Sink a cluster](viz/sink.md)

### Easy

1. (0,0) is land. Cluster 1. Sink (0,0), (0,1), (1,0).

### Medium

2. (0,4) is land. Cluster 2. Sink (0,4), (1,4), (1,3).
3. Row 2 is all water.
4. (3,0) is land. Cluster 3. Isolated.
5. (3,2) is land. Cluster 4. Sink (3,2), (3,3).

Answer 4. Diagonal land does not touch; (1,3) never ate (3,2).

### Hard

Empty input and an all-water rectangular grid return 0. For one very large island, recursive calls may exceed the runtime stack. Use iterative DFS or BFS with a head-index queue; changing the traversal must preserve marking on discovery.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| 8-connected by accident | Under-count | Four dirs unless they say diagonal |
| Not marking visited | Infinite recursion | Zero the cell *before* recursing |
| Counting cells instead of starts | Returns land area | Increment only when you *start* a fill |
| Recursing on a huge blob | Stack overflow | BFS, or iterative stack |

## Interview moves

- Confirm 4-direction and that you may mutate. Those two questions save a rewrite.
- Name union-find as the follow-up when they add "land cells arrive one by one."
- If they ask for max cluster size, keep a size counter inside `sink` instead of a cluster count.
- Sketch why DFS here is allowed: you need any traversal, not a shortest path.

## Cross-links

- [Expand level by level](../../patterns/bfs/lesson.md) (id: bfs)
- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Cluster membership in nearly constant time](../../patterns/union-find/lesson.md) (id: union-find)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Fill a grid of overlapping subproblems](../../patterns/dp-2d.md) (id: dp-2d)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
