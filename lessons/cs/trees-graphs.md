---
id: trees-graphs
title: Trees are graphs with a promise
slug: trees-graphs
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: A tree is a connected acyclic graph with one path between any pair; the moment a cycle or a second parent appears, you are in graph land.
tags:
  - cs
  - cs/data-structures
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - recursion-call-stack
  - big-o
  - hashing-internals
  - indexes
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Trees are graphs with a promise

## Snapshot

- A **graph** is nodes plus edges. Edges may be directed, weighted, or both.
- An undirected **tree** is connected and acyclic. n nodes imply n − 1 edges and exactly one path between any pair.
- A **DAG** (directed acyclic graph) still has no cycles but a node may have two parents. That is "course prereqs," not a tree.
- Interviews: pick BFS vs DFS, notice cycles, pick adjacency list vs matrix.

## Why it shows up in interviews

They want to hear you classify the input before you code. An org chart may be a tree if each non-root person has one manager; real reporting structures can be more general. A subway map is a graph. A valid prerequisite order requires a DAG. If you DFS a graph without a `seen` set, you loop forever and fail the round.

Tree problems often hide recursion and stack depth. Graph problems hide visited-state and "what is a node ID."

## Core idea

### ELI5

```
tree (org chart)          graph (shuttle stops)
    Maja                      A -- B
   /    \                     |    |
  Len   Oks                   C -- D     cycle: A-B-D-C-A
 /  \
Pia Qin
```

Same walk machinery. Different promises:

- Tree: no `seen` set is needed when following child edges. With undirected adjacency lists, skip the edge back to the parent or use a visited set.
- Graph: track traversal state to avoid revisiting cycles or repeated paths. A reachability `seen` set alone is not a complete directed-cycle detector.
- DAG: topological order exists; a cycle means "this schedule is impossible."

Store sparse graphs as adjacency lists (`Map<id, id[]>`). Store dense graphs as a matrix. n = 10^5, m ≈ n means list, not n² matrix.

## Comparison

| Shape | Promise | Default walk | Interview tell |
| --- | --- | --- | --- |
| Binary tree | ≤2 children, one parent | Recurse left/right | "left and right child" |
| BST | In-order is sorted | Go left or right | "search in log n if balanced" |
| Heap | Parent ≤ children | Not a search tree | "top-k, not lookup" |
| Tree (general) | One path, no cycle | BFS levels / DFS recurse | "org chart, file system" |
| DAG | No cycle, many parents | Kahn / DFS topo | "prereqs, build graph" |
| General graph | Anything | BFS/DFS + seen | "shortest hops, clone, islands" |

```ts
function bfs(start: string, adj: Map<string, string[]>): string[] {
  const seen = new Set([start]);
  const q: string[] = [start];
  const order: string[] = [];
  for (let i = 0; i < q.length; i++) {
    const node = q[i];
    order.push(node);
    for (const nxt of adj.get(node) ?? []) {
      if (seen.has(nxt)) continue;
      seen.add(nxt);
      q.push(nxt);
    }
  }
  return order;
}

const adj = new Map([
  ["feed", ["post", "comment"]],
  ["post", ["like"]],
  ["comment", ["like"]],
  ["like", []],
]);
console.log(bfs("feed", adj)); // feed, post, comment, like

```

BFS on unweighted edges is shortest *hop* path. It is not Dijkstra. For nonnegative weighted edges, Dijkstra is a common choice and often uses a heap. Negative weights need a different analysis; weighted DAGs can use topological-order relaxation.

**Try it:** the example has two paths to `like`. Why is it returned once? It is marked seen when enqueued. Now add `like → feed`: the visited set prevents repeated traversal, but it does not by itself explain which directed edge closes a cycle.

## Common mistakes

- DFS on a graph with no `seen` → infinite recursion.
- Calling a BST a balanced tree. A BST can be a linked list; then search is O(n).
- Using a matrix at n = 10^5. Memory explodes.
- BFS for weighted shortest path. Wrong tool.

## How to talk about it

"First I decide: tree, DAG, or general graph. If it is a tree I recurse on children and talk about height vs n. If it is a graph I assign IDs, build an adjacency list, and keep a seen set. Shortest hops is BFS. Ordering constraints is topo sort; a leftover node means a cycle."

If they ask trees vs B-trees: "A B-tree is a balanced multiway search tree. Its high branching factor can reduce page accesses. A binary heap supports priority operations rather than the same ordered-search contract."

## Cross-links

- [Recursion is a stack you didn't allocate](./recursion-call-stack.md) (id: recursion-call-stack)
- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Indexes are precomputed answers](./indexes.md) (id: indexes)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Virtual addresses, physical pages, and locality](./os-memory.md) (id: os-memory)
