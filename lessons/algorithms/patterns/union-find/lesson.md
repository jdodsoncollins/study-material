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
  - interviews/leetcode
prerequisites:
  - trees-graphs
related:
  - number-of-islands
  - bfs
  - topological-sort
  - trees-graphs
company_signal:
  - name: Google
    evidence: Candidate onsite reports mention connected-components / redundant-connection prompts as union-find tells.
    year: 2026
    confidence: medium
  - name: Meta
    evidence: Tagged-list threads list number-of-provinces and similar "are these accounts the same person" merges.
    year: 2026
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode union-find tagged threads
updated: 2026-09-02
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

This is online connectivity, told as a dock-yard radio mesh.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "connected components as edges stream in" | Union-find, not a full BFS per query |
| "redundant edge" / "already connected" | Union returns false if same root |
| "accounts merge / friend circles" | Same structure, keys are people |
| Grid islands, full grid given | DFS/BFS is the default; union-find is a flex |

## Worked approach

[dsu](viz/dsu.md)

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
```

`union` returning false is the "redundant cable" signal. `parts` is the live component count.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| BFS from every query | O(n + e) per query | O(n) | Fine once, fatal in a loop |
| Union-find, naive | O(n) per find | O(n) | Degenerates to a linked list |
| Path compression + rank | Almost O(1) per op (inverse Ackermann) | O(n) | Default. Say "nearly O(1)," not O(1) |

## Walkthrough

Towers 0..5, cables `[0-1], [1-2], [3-4], [2-0]`.

1. 0-1: different roots, merge. Parts 5.
2. 1-2: 1's root is 0, merge 2. Parts 4. Components `{0,1,2}`, `{3,4}`, `{5}`.
3. 3-4: merge. Parts 3.
4. 2-0: both already under 0. Redundant. Parts stay 3.

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
- Inverse Ackermann is trivia. "Nearly constant with compression and rank" is the adult sentence.

## Cross-links

- [Pallet clusters on a flooded floor](../../problems/number-of-islands.md) (id: number-of-islands)
- [Expand level by level](../bfs/lesson.md) (id: bfs)
- [Order by prerequisites](../topological-sort/lesson.md) (id: topological-sort)
- [Trees and graphs](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Explore, undo, try the next branch](../dfs-backtracking.md) (id: dfs-backtracking)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
