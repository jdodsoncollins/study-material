---
id: number-of-islands
title: Pallet clusters on a flooded floor
slug: number-of-islands
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Flood-fill each unvisited pallet cell and count how many times you start a new fill; that count is the number of clusters.
tags:
  - algorithms
  - algorithms/graphs
  - interviews/leetcode
prerequisites:
  - bfs
  - dfs-backtracking
related:
  - bfs
  - dfs-backtracking
  - union-find
  - trees-graphs
company_signal:
  - name: Amazon
    evidence: Candidate OA and phone-screen reports list grid island-count as a default graph easy/medium.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Onsite writeups describe island / flood-fill grids as a common first graph question.
    year: 2026
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode graph / island tagged threads
updated: 2026-09-02
status: canonical
---

# Pallet clusters on a flooded floor

## Snapshot

- A grid of aisle water (`0`) and pallet (`1`). Four-direction connectivity. Count the pallet clusters.
- Each cell is a graph node. You do not need to build an adjacency list.
- DFS, BFS, or union-find all work. Interview default is in-place DFS that sinks a cluster to `0`.
- Mark on visit. If you do not, you recount the same pallet forever.

## Prompt

After a sprinkler dump, the floor looks like this (`1` = pallet still dry, `0` = water):

```
1 1 0 0 1
1 0 0 1 1
0 0 0 0 0
1 0 1 1 0
```

A cluster is a 4-connected group of dry pallets. Return how many clusters the forklift must visit.

This is number-of-islands, told as a wet warehouse, not a map of `'1'`/`'0'` from a textbook.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Grid, count connected components | Flood fill |
| Four vs eight neighbors | Ask; it changes the count |
| Stream of land cells added over time | Union-find starts to win |
| Shortest path through the grid | BFS distances, not this problem |

## Worked approach

Scan. On a `1`, increment the answer and sink the whole cluster.

```ts
function palletClusters(floor: number[][]): number {
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
console.log(palletClusters(floor.map((row) => row.slice()))); // 4

```

If they forbid mutating the grid, keep a `seen` matrix. If the grid is huge and skinny, BFS avoids stack depth.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| DFS flood | O(rows · cols) | O(rows · cols) stack worst case | Default |
| BFS flood | O(rows · cols) | O(min(rows, cols)) typical queue | Safer depth |
| Union-find on land cells | O(rows · cols) | O(rows · cols) | Better when land is streamed |

## Walkthrough

Grid in the prompt.

[Sink a cluster](viz/sink.md)

1. (0,0) is land. Cluster 1. Sink (0,0), (0,1), (1,0).
2. (0,4) is land. Cluster 2. Sink (0,4), (1,4), (1,3).
3. Row 2 is all water.
4. (3,0) is land. Cluster 3. Isolated.
5. (3,2) is land. Cluster 4. Sink (3,2), (3,3).

Answer 4. Diagonal pallets do not touch; (1,3) never ate (3,2).

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
- [Trees and graphs](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Fill a grid of overlapping subproblems](../../patterns/dp-2d.md) (id: dp-2d)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
