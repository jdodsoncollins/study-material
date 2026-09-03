---
id: topological-sort
title: Order by prerequisites
slug: topological-sort
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Linearize a directed acyclic graph so every edge points forward; a leftover cycle means no legal order.
tags:
  - algorithms
  - algorithms/graphs
  - interviews/leetcode
prerequisites:
  - bfs
  - trees-graphs
related:
  - course-order
  - bfs
  - dfs-backtracking
  - union-find
company_signal:
  - name: Amazon
    evidence: Candidate reports list course-schedule / build-order prompts as the usual topo-sort tell.
    year: 2026
    confidence: high
  - name: Google
    evidence: Onsite writeups describe compilation-order and task-graph questions in the same family.
    year: 2025
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode topological-sort threads
updated: 2026-09-02
status: canonical
---

# Order by prerequisites

## Snapshot

- Directed edges mean "must happen before." Undirected graphs do not have a topo order.
- Kahn's algorithm: queue every node with indegree 0, peel, reduce neighbors. The peel order is the answer.
- DFS with a three-color mark also works and is better at *finding* the cycle, worse at explaining in a phone screen.
- If you cannot peel n nodes, a cycle exists. Return failure, do not invent an order.

## Prompt

A warehouse training catalog has modules `0..5`. Edges `a → b` mean "finish a before b": `need = [[0,1], [1,2], [3,2], [4,5]]`. Return one legal study order, or say the catalog is impossible.

This is course-schedule, told as dock certifications rather than a university transcript.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "order tasks with prerequisites" | Topo sort |
| Directed edges, ask if possible | Detect a cycle as a failed peel |
| Undirected "connected" | Wrong pattern; union-find or BFS |
| Weighted durations | Topo still gives order; longest path on DAG is a follow-up |

## Worked approach

Build adjacency and indegree. Seed the queue with indegree 0. Peel.

```ts
function studyOrder(n: number, need: [number, number][]): number[] | null {
  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = Array(n).fill(0);
  for (const [a, b] of need) {
    adj[a].push(b);
    indeg[b] += 1;
  }
  const q: number[] = [];
  for (let i = 0; i < n; i++) if (indeg[i] === 0) q.push(i);
  const order: number[] = [];
  while (q.length) {
    const cur = q.shift()!;
    order.push(cur);
    for (const nxt of adj[cur]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) q.push(nxt);
    }
  }
  return order.length === n ? order : null;
}
```

Edge direction is a classic trap. Confirm: `a → b` means a first. If they store `[course, prereq]`, flip it.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Kahn (BFS peel) | O(n + e) | O(n + e) | Default interview answer |
| DFS three-color | O(n + e) | O(n + e) | Nice for cycle path |
| Random permutation + check | n! | O(n) | Joke, not an answer |

## Walkthrough

n = 6, `need = [[0,1], [1,2], [3,2], [4,5]]`

1. Indegrees: 1 has 1, 2 has 2, 5 has 1. 0, 3, 4 start at 0.
2. Peel 0, 3, 4 (queue order). After 0, node 1 drops to 0 and joins.
3. Peel 1; node 2 drops to 1 (still waiting on 3, already peeled, so actually 2 may already be 0 depending on order).
4. Peel 5 after 4. Peel 2 once both 1 and 3 are gone.
5. Six nodes peeled. One valid order: `[0, 3, 4, 1, 5, 2]`.

Add `2 → 0` and the peel stops with `{0,1,2}` still holding indegree. Return null.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Reversing the edge | Legal-looking order violates a prereq | Restate the arrow in English |
| Forgetting isolated nodes | They never enter the queue | Seed *every* indegree-0 node, including loners |
| Using union-find | Direction is lost | Union-find is undirected membership |
| Returning a partial peel | Silent wrong order | Require `order.length === n` |

## Interview moves

- Draw three boxes and two arrows before coding. Confirm direction with the interviewer.
- Say out loud what a leftover node means: cycle, not "I forgot a sort."
- If they ask for *all* orders, that is backtracking on the Kahn queue (multiple indegree-0 choices).
- If they add durations, the follow-up is longest path on the DAG, still after a topo peel.

## Cross-links

- [Training modules with prereqs](../problems/course-order.md) (id: course-order)
- [Expand level by level](./bfs.md) (id: bfs)
- [Explore, undo, try the next branch](./dfs-backtracking.md) (id: dfs-backtracking)
- [Cluster membership in nearly constant time](./union-find.md) (id: union-find)
- [Trees and graphs](../../cs/trees-graphs.md) (id: trees-graphs)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
