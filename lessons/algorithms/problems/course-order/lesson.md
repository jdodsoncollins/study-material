---
id: course-order
title: Training modules with prereqs
slug: course-order
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Emit directed modules with indegree zero; if not all modules can be emitted, the graph contains a cycle.
tags:
  - algorithms
  - algorithms/graphs
  - interviews
  - interviews/leetcode
prerequisites:
  - topological-sort
  - bfs
related:
  - topological-sort
  - bfs
  - dfs-backtracking
  - union-find
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Training modules with prereqs

## Snapshot

- n modules, directed prereqs. Return one legal study order, or fail if a cycle exists.
- Kahn's peel is the phone-screen version: queue indegree 0, reduce neighbors.
- Isolated modules still belong in the order. Forget them and you fail the length check.
- Union-find cannot see direction. Do not reach for it.

## Prompt

Course modules `0..4`. Each pair `[a, b]` means "complete a before b": `need = [[0, 1], [1, 3], [2, 3], [0, 2]]`. Return any legal order of all five modules. If a cycle makes that impossible, return an empty list.

This is course-order / topo sort. The numbers are not a textbook CS-degree planner.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Directed prereqs, produce an order | Topo sort |
| "is it possible?" only | Same peel; just return a boolean |
| Undirected "groups of friends" | Wrong; that is union-find |
| Need every valid order | Backtracking on the current indegree-0 set |

## Worked approach

### ELI5

Count unfinished prerequisites for every module. Begin with all zero-count modules, including isolated ones. Completing a module reduces its successors’ counts. If fewer than n modules finish, a directed cycle prevents a full order.

### Syntax

```ts
const indegree = [0,1,1,2,0];
console.log(indegree.flatMap((n,id) => n === 0 ? [id] : [])); // [0,4]
```

### Then the details

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
  for (let head = 0; head < q.length; head++) {
    const cur = q[head];
    order.push(cur);
    for (const nxt of adj[cur]) {
      indeg[nxt] -= 1;
      if (indeg[nxt] === 0) q.push(nxt);
    }
  }
  return order.length === n ? order : [];
}

console.log(moduleOrder(5, [[0, 1], [1, 3], [2, 3], [0, 2]])); // e.g. [0,4,1,2,3]
console.log(moduleOrder(2, [[0, 1], [1, 0]]));                 // []

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

[Peel indegree zero](viz/peel.md)

### Easy

1. Indegree: 0:0, 1:1, 2:1, 3:2, 4:0. Queue `[0, 4]`.

### Medium

2. Peel 0. 1 and 2 drop to 0. Queue `[4, 1, 2]`.
3. Peel 4, 1, 2. After 1 and 2, node 3 drops to 0.
4. Peel 3. Order example: `[0, 4, 1, 2, 3]`.

Add `[3, 0]` and 0 never reaches indegree 0 after the first pass. Peel length < 5. Return `[]`.

### Hard

Add edge 3→0 to the prompt. Only isolated module 4 can be removed; the remaining modules depend on a cycle, so return []. For n = 0, [] is also a valid empty order. If callers need to distinguish those cases, return a separate success flag. Assume valid endpoint IDs.

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

- [Order by prerequisites](../../patterns/topological-sort/lesson.md) (id: topological-sort)
- [Expand level by level](../../patterns/bfs/lesson.md) (id: bfs)
- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Cluster membership in nearly constant time](../../patterns/union-find/lesson.md) (id: union-find)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../../strategy/pattern-first-prep.md) (id: pattern-first-prep)
