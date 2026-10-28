---
id: shortest-paths
title: Settle the closest unsettled node next
slug: shortest-paths
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 18
summary: Dijkstra's algorithm pops the nearest unsettled node from a min-heap, settles it, and relaxes its outgoing edges; it needs nonnegative weights.
tags:
  - algorithms
  - algorithms/graphs
  - algorithms/heaps
  - interviews
  - interviews/leetcode
prerequisites:
  - bfs
  - heaps-top-k
related:
  - bfs
  - heaps-top-k
  - fanout-delay
  - topological-sort
  - number-of-islands
company_signal: []
sources_consulted:
  - https://doi.org/10.1007/BF01386390
  - https://algs4.cs.princeton.edu/44sp/
updated: 2026-10-28
status: canonical
---

# Settle the closest unsettled node next

## Snapshot

- Weighted graph, one source, nonnegative weights: Dijkstra with a min-heap, O((V + E) log V).
- Every edge weight is 1 (or all equal): plain [breadth-first search](../bfs/lesson.md) gives the same distances in O(V + E). Do not reach for a heap.
- Once a node is popped from the heap at its smallest distance, that distance is final. This is exactly what a negative edge breaks.
- Negative edges, no negative cycles: Bellman-Ford, O(V · E). A directed acyclic graph: relax in [topological order](../topological-sort/lesson.md), O(V + E), negatives allowed.

## Prompt

A video-call service relays media between five regional relays, numbered 0 to 4. Each link is one-way with a measured latency in milliseconds:

```
links = [[0,1,4], [0,2,1], [2,1,2], [1,3,1], [2,3,5], [3,4,3]]   // [from, to, ms]
```

A caller connects at relay 0. Return the lowest latency from relay 0 to every relay: `[0, 3, 1, 4, 7]`.

Notice that the direct link 0 → 1 costs 4, but 0 → 2 → 1 costs 3. Fewest hops is not fastest.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Minimum total cost / time / latency" over weighted edges | Dijkstra |
| Every step costs the same | BFS; a heap only adds a log factor |
| Weights can be negative (refunds, credits) | Dijkstra's finality argument fails; Bellman-Ford |
| Graph has no cycles (build steps, prerequisites) | Topological order + relax; handles negatives |
| "Time until everyone hears it" | Max of the shortest distances: [fanout-delay](../../problems/fanout-delay.md) |
| Grid where cells have different entry costs | Same algorithm; cells are nodes |

## Worked approach

[Relax the relays](viz/relax.md)

### ELI5

Spread a rumor that travels along links at their latency.

1. Relay 0 hears it at time 0.
2. Among relays that have not heard it yet, the next one to hear it is the one with the smallest best-known arrival time. Lock that time in.
3. From that relay, check each outgoing link: "would going through here arrive sooner than what this neighbor has now?" If yes, update the neighbor.
4. Repeat until nobody is left, or the closest remaining time is infinity (unreachable).

Step 2 is safe only because links cannot make time go backwards. If a link had negative latency, something locked earlier could later get faster.

### Syntax

The pieces are an adjacency list, a distance array seeded with `Infinity`, and one relaxation.

```ts
const links = [[0, 1, 4], [0, 2, 1], [2, 1, 2]];
const adj: [number, number][][] = [[], [], []];
for (const [from, to, ms] of links) adj[from].push([to, ms]);

const dist = [0, Infinity, Infinity];
for (const [to, ms] of adj[0]) dist[to] = Math.min(dist[to], dist[0] + ms);
for (const [to, ms] of adj[2]) dist[to] = Math.min(dist[to], dist[2] + ms); // relax through relay 2
console.log(dist); // [0, 3, 1]
```

### Then the details

JavaScript has no built-in priority queue, so the sample carries a small binary min-heap of `[distance, node]`. Instead of a decrease-key, push a fresh entry and skip stale ones when popped.

```ts
function shortestFrom(n: number, links: number[][], source: number): number[] {
  const adj: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [from, to, ms] of links) adj[from].push([to, ms]);
  const dist = new Array(n).fill(Infinity);
  const heap: [number, number][] = [];
  const push = (item: [number, number]) => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  dist[source] = 0;
  push([0, source]);
  while (heap.length) {
    const [d, u] = pop();
    if (d > dist[u]) continue; // stale entry: u was already settled cheaper
    for (const [v, w] of adj[u]) {
      if (d + w < dist[v]) { dist[v] = d + w; push([dist[v], v]); }
    }
  }
  return dist;
}

const relays = [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [2, 3, 5], [3, 4, 3]];
console.log(shortestFrom(5, relays, 0)); // [0, 3, 1, 4, 7]
console.log(shortestFrom(3, [[0, 1, 2]], 0)); // [0, 2, Infinity]: relay 2 unreachable
```

The footgun is the stale check. Without `if (d > dist[u]) continue`, a node popped a second time at a worse distance re-relaxes its edges. Answers stay correct with nonnegative weights, but the work stops being bounded by E log V in the way you claimed.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| BFS (all weights equal) | O(V + E) | O(V) | Distances are hop counts |
| Dijkstra, binary heap, lazy deletion | O(E log E), which is O(E log V) | O(V + E) | Default; heap holds up to E entries |
| Dijkstra, array scan for the minimum | O(V²) | O(V) | Competitive on dense graphs |
| Bellman-Ford | O(V · E) | O(V) | Negative edges; detects negative cycles |
| DAG: topological order + relax | O(V + E) | O(V) | Negative edges allowed; no cycles |

## Walkthrough

### Easy

All-equal weights. If every link in the prompt cost 1 ms, distances are hop counts: `[0, 1, 1, 2, 3]`. BFS finds them with a plain queue. Dijkstra would too, but the heap is unnecessary.

### Medium

The prompt, popping from the heap:

1. Pop relay 0 (0). Relax: relay 1 → 4, relay 2 → 1.
2. Pop relay 2 (1). Relay 1: 1 + 2 = 3 < 4, update. Relay 3: 1 + 5 = 6.
3. Pop relay 1 (3). Relay 3: 3 + 1 = 4 < 6, update.
4. Pop relay 3 (4). Relay 4: 4 + 3 = 7.
5. Pop relay 4 (7). Then the stale entries (relay 1 at 4, relay 3 at 6) come out and are skipped.

Result `[0, 3, 1, 4, 7]`.

### Hard

Why negative edges break it. Take four nodes with links `A→B 2`, `A→C 3`, `C→B −2`, `B→D 1`. The truth: `B = 1` (via C), `D = 2`.

Textbook Dijkstra, which marks a node final when it is popped, settles B at 2 (popped before C at 3), relaxes B→D to 3, and only then pops C. Even if C→B now lowers B to 1, B is already final and is never expanded again, so D keeps 3. The output disagrees with itself: B claims 1, yet D, one link of cost 1 past B, claims 3.

The lazy-deletion sample above happens to recover on this graph, because it re-pushes B at 1 and expands it again. That is no longer the algorithm you analyzed: with negative edges a node can be re-expanded many times, and a reachable negative cycle makes the loop run forever. Use Bellman-Ford (relax every edge V − 1 times, then one more pass to detect a negative cycle) when weights can be negative.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Using Dijkstra with negative weights | Wrong distances, silently | Bellman-Ford, or DAG relaxation |
| Using Dijkstra when all weights are 1 | Correct but slower and longer to write | BFS |
| No stale-entry check with lazy deletion | Extra relaxations; muddied complexity claim | `if (d > dist[u]) continue` |
| Marking visited on push instead of pop | Locks in a distance before a shorter path is found | A node is final when it is popped |
| Building adjacency for an undirected graph one way only | Half the paths vanish | Push both directions |
| `Array.prototype.sort` as the "heap" after each push | O(E · V log V) | A real heap, or the O(V²) array scan on purpose |

## Interview moves

- Ask first: directed or undirected, can weights be negative or zero, is the graph dense?
- If weights are all 1, say "this is BFS" and save ten minutes.
- State the invariant: "when I pop a node, no cheaper path to it exists, because every other path would have to leave the settled set through an edge that only adds."
- Mention that JavaScript lacks a heap and offer to write a small one, or ask if you may assume one.
- For "time until all nodes are reached," it is the max over `dist`, and −1 if any is still infinite.

## Cross-links

- [Expand level by level](../bfs/lesson.md) (id: bfs)
- [Keep only the interesting k](../heaps-top-k.md) (id: heaps-top-k)
- [Slowest server to receive a push](../../problems/fanout-delay.md) (id: fanout-delay)
- [Order by prerequisites](../topological-sort/lesson.md) (id: topological-sort)
- [Land clusters on a map](../../problems/number-of-islands/lesson.md) (id: number-of-islands)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
