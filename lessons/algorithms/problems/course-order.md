---
id: course-order
title: Training modules with prereqs
slug: course-order
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Peel directed modules with indegree zero until none remain; a leftover node is a cycle and the catalog is impossible.
tags:
  - algorithms
  - algorithms/graphs
  - interviews/leetcode
prerequisites:
  - topological-sort
  - bfs
related:
  - topological-sort
  - bfs
  - dfs-backtracking
  - union-find
company_signal:
  - name: Amazon
    evidence: Candidate reports list course-schedule / return-the-order as the standard topo-sort coding prompt.
    year: 2026
    confidence: high
  - name: Google
    evidence: Onsite writeups describe build-order and task-prereq graphs in the same family.
    year: 2025
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode course-schedule tagged threads
updated: 2026-09-02
status: canonical
---

# Training modules with prereqs

## Snapshot

- n modules, directed prereqs. Return one legal study order, or fail if a cycle exists.
- Kahn's peel is the phone-screen version: queue indegree 0, reduce neighbors.
- Isolated modules still belong in the order. Forget them and you fail the length check.
- Union-find cannot see direction. Do not reach for it.

## Prompt

Dock certifications are modules `0..4`. Each pair `[a, b]` means "complete a before b": `need = [[0, 1], [1, 3], [2, 3], [0, 2]]`. Return any legal order of all five modules. If a cycle makes that impossible, return an empty list.

This is course-order / topo sort. The catalog is warehouse training, not a CS-degree planner.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Directed prereqs, produce an order | Topo sort |
| "is it possible?" only | Same peel; just return a boolean |
| Undirected "groups of friends" | Wrong; that is union-find |
| Need every valid order | Backtracking on the current indegree-0 set |

## Worked approach

```ts
function moduleOrder(n: number, need: [number, number][]): number[] {
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
  return order.length === n ? order : [];
}
```

Confirm arrow meaning. Some prompts store `[course, prereq]` and the edge goes the other way.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Kahn peel | O(n + e) | O(n + e) | Default |
| DFS three-color + reverse postorder | O(n + e) | O(n + e) | Use if they want the cycle path |
| Try permutations | n! | O(n) | Not an answer |

## Walkthrough

n = 5, `need = [[0,1], [1,3], [2,3], [0,2]]`. Module 4 is a loner.

1. Indegree: 0:0, 1:1, 2:1, 3:2, 4:0. Queue `[0, 4]`.
2. Peel 0. 1 and 2 drop to 0. Queue `[4, 1, 2]`.
3. Peel 4, 1, 2. After 1 and 2, node 3 drops to 0.
4. Peel 3. Order example: `[0, 4, 1, 2, 3]`.

Add `[3, 0]` and 0 never reaches indegree 0 after the first pass. Peel length < 5. Return `[]`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Dropping isolated modules | Order too short, false cycle | Seed every indegree-0 node |
| Reversed edges | A legal-looking order violates a prereq | Restate "a before b" |
| Returning the partial peel | Silent wrong answer | Length must equal n |
| Using a min-heap "to be canonical" | Unasked extra work | Queue is enough unless they want smallest-index order |

## Interview moves

- Draw the five boxes and arrows. Point at 4 and say "loners still go in."
- Ask whether any legal order is fine, or whether they want the lexicographically smallest (then use a min-heap as the queue).
- If they ask "which edge to drop to fix a cycle," that is a follow-up: track parent during DFS, not Kahn.
- Name longest-path-on-DAG if they add module durations.

## Cross-links

- [Order by prerequisites](../patterns/topological-sort/lesson.md) (id: topological-sort)
- [Expand level by level](../patterns/bfs/lesson.md) (id: bfs)
- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Cluster membership in nearly constant time](../patterns/union-find/lesson.md) (id: union-find)
- [Trees and graphs](../../cs/trees-graphs.md) (id: trees-graphs)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
