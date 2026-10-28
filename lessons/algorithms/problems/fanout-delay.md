---
id: fanout-delay
title: Slowest server to receive a push
slug: fanout-delay
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 18
summary: Run Dijkstra from the publishing server, then the time until everyone has the message is the largest shortest-path distance, or -1 if any server is unreachable.
tags:
  - algorithms
  - algorithms/graphs
  - algorithms/heaps
  - interviews
  - interviews/leetcode
prerequisites:
  - shortest-paths
related:
  - shortest-paths
  - bfs
  - heaps-top-k
  - course-order
company_signal: []
sources_consulted:
  - https://algs4.cs.princeton.edu/44sp/
updated: 2026-10-28
status: canonical
---

# Slowest server to receive a push

## Snapshot

- Same shape as "network delay time." Directed edges, nonnegative weights, one source.
- Each server receives the push at its shortest-path time from the source, because relays forward immediately along every link.
- Answer = the largest of those times. If any server is unreachable, there is no finite answer: return −1.
- Dijkstra with a min-heap. If every link cost the same, BFS would do.

## Prompt

A notification service publishes a push at server 0. Servers forward it along one-way links with a measured delay in milliseconds, and every server forwards the moment it first receives it. There are `n = 6` servers, numbered 0 to 5:

```
links = [[0,1,7], [0,2,2], [2,1,3], [1,3,4], [2,4,9], [3,4,1], [4,5,2]]   // [from, to, ms]
```

How long until every server has the push? Return `12`. If some server can never receive it, return `-1`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Time until all nodes receive / are infected / are reached" | Shortest paths from one source, then the max |
| Weighted one-way links, all ≥ 0 | Dijkstra |
| Every link takes one tick | BFS levels; the answer is the number of levels minus one |
| "Return −1 if impossible" | Check for `Infinity` after the run |
| Only care about one target | Stop when that target is popped |

## Worked approach

### ELI5

Release the push at server 0 and watch the clock.

1. Server 0 has it at time 0.
2. Whichever server would receive it soonest next is the next to receive it. Lock in that time.
3. From that server, check each outgoing link: does going through here arrive sooner than anything known so far? If so, write down the better time.
4. When nobody is left to lock in, look at the latest time on the board. If some server never got a time, the answer is −1.

### Syntax

```ts
const dist = [0, 5, 2, 9, 10, 12]; // the shortest times, once computed
console.log(Math.max(...dist));     // 12
const withIsland = [...dist, Infinity];
console.log(withIsland.some((d) => d === Infinity) ? -1 : Math.max(...withIsland)); // -1
```

### Then the details

The heap is a small array-backed binary heap of `[time, server]`. Stale entries are skipped on pop.

```ts
function slowestDelivery(n: number, links: number[][], source: number): number {
  const out: [number, number][][] = Array.from({ length: n }, () => []);
  for (const [from, to, ms] of links) out[from].push([to, ms]);
  const dist = new Array(n).fill(Infinity);
  const heap: [number, number][] = [];
  const push = (x: [number, number]) => {
    heap.push(x);
    for (let i = heap.length - 1; i > 0; ) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0], last = heap.pop()!;
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
    const [t, u] = pop();
    if (t > dist[u]) continue;
    for (const [v, ms] of out[u]) {
      if (t + ms < dist[v]) { dist[v] = t + ms; push([dist[v], v]); }
    }
  }
  const latest = Math.max(...dist);
  return latest === Infinity ? -1 : latest;
}

const links = [[0, 1, 7], [0, 2, 2], [2, 1, 3], [1, 3, 4], [2, 4, 9], [3, 4, 1], [4, 5, 2]];
console.log(slowestDelivery(6, links, 0)); // 12
console.log(slowestDelivery(7, links, 0)); // -1: server 6 has no incoming link
console.log(slowestDelivery(1, [], 0));    // 0
```

The detail: the answer is the *max* of the shortest times, not their sum and not the shortest time to the last-numbered server. And `Math.max(...dist)` on a very large `n` can hit the engine's argument limit; a plain loop is safer in production.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Dijkstra, binary heap | O(E log E) | O(V + E) | Default |
| Dijkstra, O(V²) array scan | O(V²) | O(V + E) | Fine for small dense graphs |
| Bellman-Ford | O(V · E) | O(V) | Only needed with negative delays |
| BFS | O(V + E) | O(V) | Only if every link has the same delay |

## Walkthrough

### Easy

Two servers and two parallel links, `[[0,1,5], [0,1,2]]`. Server 1 gets the faster copy at 2. Answer 2. Parallel links need no special handling; the faster one wins the relaxation.

### Medium

The prompt:

1. Pop 0 (0). Server 1 → 7, server 2 → 2.
2. Pop 2 (2). Server 1: 2 + 3 = 5 < 7, update. Server 4 → 11.
3. Pop 1 (5). Server 3 → 9.
4. Pop 3 (9). Server 4: 9 + 1 = 10 < 11, update.
5. Pop 4 (10). Server 5 → 12.
6. Pop 5 (12). Stale entries for server 1 (7) and server 4 (11) are skipped.

Times `[0, 5, 2, 9, 10, 12]`. The slowest is server 5 at 12.

### Hard

Same links with `n = 7`: server 6 exists but nothing links to it, so its time stays `Infinity` and the answer is −1. A cycle such as `[[0,1,1], [1,0,1], [1,2,4]]` with `n = 3` is harmless: when 0 is reached again through 1 at time 2, that is not better than 0, so nothing changes. Answer 5.

Follow-up: "a server takes 3 ms to process before forwarding." Add 3 to each outgoing link from a relay (not to the source's own receive time), or fold it into the relaxation as `t + 3 + ms`. Say which servers it applies to.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Summing delays along a BFS tree | Uses fewest hops, not least time | Dijkstra on weights |
| Forgetting unreachable servers | Returns a finite max that ignores them | Check for `Infinity`, return −1 |
| Treating links as undirected | Pushes travel backwards | Add only `from → to` |
| 0-based vs 1-based server ids | Index out of range or a phantom server | Ask; size arrays to match |
| Returning `dist[n − 1]` | Answers "time to the last-numbered server," not "to everyone" | Max over all |

## Interview moves

- Restate as "single-source shortest paths, then the max."
- Ask whether delays can be zero or negative and whether ids start at 0 or 1.
- Mention that JavaScript lacks a built-in heap and either write one or ask to assume it.
- Point out that the −1 case comes for free from the `Infinity` seeds.

## Cross-links

- [Settle the closest unsettled node next](../patterns/shortest-paths/lesson.md) (id: shortest-paths)
- [Expand level by level](../patterns/bfs/lesson.md) (id: bfs)
- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Training modules with prereqs](./course-order/lesson.md) (id: course-order)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
