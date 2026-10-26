---
id: union-find
title: Cluster membership in nearly constant time
slug: union-find
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Maintain disjoint sets with path compression and union by rank so connectivity queries stay almost O(1).
tags:
  - algorithms
  - algorithms/union-find
  - algorithms/graphs
  - interviews
  - interviews/leetcode
prerequisites:
  - trees-graphs
related:
  - number-of-islands
  - bfs
  - topological-sort
  - trees-graphs
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Cluster membership in nearly constant time

## Snapshot

- Each item points at a parent. A find walks to the root. A union links two roots.
- Path compression flattens on find. Union by rank (or size) keeps trees shallow.
- Use it when the graph is a stream of edges and you need "are these connected?" after each one.
- If the whole graph is already in memory and you only need components once, BFS/DFS is simpler.

## Prompt

Radio towers `0..5` can talk if an engineer strings a cable. Cables arrive as `cables = [[0,1], [1,2], [3,4], [2,0]]`. After each cable, say whether the two towers were already in the same network. At the end, how many separate networks remain (include lonely tower 5)?

This is incremental undirected connectivity; edge deletion is outside this structure’s contract.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "connected components as edges stream in" | Union-find, not a full BFS per query |
| "redundant edge" / "already connected" | Union returns false if same root |
| "accounts merge / friend circles" | Same structure, keys are people |
| Grid islands, full grid given | DFS/BFS is the default; union-find is a flex |

## Worked approach

[dsu](viz/dsu.md)

### ELI5

Each component chooses one representative root. To connect two towers, find their roots. If the roots match, the cable adds no new connection. Otherwise attach one root under the other and reduce the component count by one. Path compression shortens future walks without changing membership.

### Syntax

```ts
const parent = [0, 1, 2];
parent[1] = 0; // join singleton 1 under root 0
console.log(parent[0] === parent[1]); // true
```

### Then the details

```ts
class Nets {
  parent: number[];
  rank: number[];
  parts: number;
  constructor(n: number) {
    this.parent = Array.from({ length: n }, (_, i) => i);
    this.rank = Array(n).fill(0);
    this.parts = n;
  }
  find(x: number): number {
    if (this.parent[x] !== x) this.parent[x] = this.find(this.parent[x]);
    return this.parent[x];
  }
  union(a: number, b: number): boolean {
    let ra = this.find(a), rb = this.find(b);
    if (ra === rb) return false;
    if (this.rank[ra] < this.rank[rb]) [ra, rb] = [rb, ra];
    this.parent[rb] = ra;
    if (this.rank[ra] === this.rank[rb]) this.rank[ra] += 1;
    this.parts -= 1;
    return true;
  }
}

const nets = new Nets(6);
for (const [a, b] of [[0, 1], [1, 2], [3, 4], [2, 0]]) {
  console.log(a, b, "merged", nets.union(a, b), "parts", nets.parts);
}

```

`union` returning false is the "redundant cable" signal. `parts` is the live component count.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| BFS from every query | O(n + e) per query | O(n) | Fine once, fatal in a loop |
| Union-find, naive | O(n) per find | O(n) | Degenerates to a linked list |
| Path compression + rank | O(α(n)) amortized per operation after initialization | O(n) | Default. Say "nearly O(1)," not O(1) |

## Walkthrough

Towers 0..5, cables `[0-1], [1-2], [3-4], [2-0]`.

### Easy

1. 0-1: different roots, merge. Parts 5.

### Medium

2. 1-2: 1's root is 0, merge 2. Parts 4. Components `{0,1,2}`, `{3}`, `{4}`, `{5}`.
3. 3-4: merge. Parts 3.
4. 2-0: both already under 0. Redundant. Parts stay 3.

### Hard

Remove cable 1–2 after processing the stream. Ordinary union-find cannot split the component to reflect that deletion. Explain why its compressed parents do not preserve enough edge history for removal. The sample assumes node IDs are integers in 0..n−1.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Forgetting to `find` before comparing | Two nodes in the same tree look distinct | Always compare roots |
| Union without rank | A long chain, finds go linear | Rank or size |
| Compressing without assignment | `find` walks the old path next time | `parent[x] = find(parent[x])` |
| 1-based ids in a 0-based array | Off-by-one merges | Pick a convention and pad if needed |

## Interview moves

- Write `find` with compression in one line and say why.
- Ask whether the graph is directed. Union-find is for undirected membership; directed needs topo or SCC.
- For islands, offer DFS first. Switch to union-find if they add "and now stream extra land cells."
- State the amortized bound and the two heuristics that support it; do not promise every individual operation is constant time.

## Cross-links

- [Land clusters on a map](../../problems/number-of-islands/lesson.md) (id: number-of-islands)
- [Expand level by level](../bfs/lesson.md) (id: bfs)
- [Order by prerequisites](../topological-sort/lesson.md) (id: topological-sort)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Explore, undo, try the next branch](../dfs-backtracking.md) (id: dfs-backtracking)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
