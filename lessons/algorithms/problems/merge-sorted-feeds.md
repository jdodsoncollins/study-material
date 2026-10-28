---
id: merge-sorted-feeds
title: Merge k sorted notification feeds
slug: merge-sorted-feeds
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 15
summary: Merge several already-sorted timelines into one by keeping only each feed's next item in a min-heap, so each step costs log k instead of a full re-sort.
tags:
  - algorithms
  - algorithms/heaps
  - interviews
  - interviews/leetcode
prerequisites:
  - heaps-top-k
related:
  - heaps-top-k
  - kth-largest
  - running-median
  - merge-intervals
company_signal: []
sources_consulted:
  - Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms (4th ed., 2022), Heapsort chapter (binary heaps and priority queues)
updated: 2026-10-28
status: canonical
---

# Merge k sorted notification feeds

## Snapshot

- You have k lists, each already sorted. Produce one sorted list.
- The next output item is always the smallest of the k **front** items. Nothing deeper in any list can beat its own front.
- A min-heap holds at most k fronts. Pop the smallest, push that feed's next item. Each step is O(log k).
- Total O(N log k) for N items. Concatenate-and-sort is O(N log N), which is fine for small N and worth saying.

## Prompt

A notifications service has three shards. Each one returns its pending notification timestamps (minutes past the hour), already sorted:

```
feeds = [[3, 11, 20], [5, 9], [1, 14, 15, 22]]
```

Return one timeline with every timestamp in ascending order. Equal timestamps may appear; keep every copy.

This is the same shape as "merge k sorted lists." Here the feeds are arrays so the tests stay plain JSON.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "k sorted lists / files / shards / streams" | Heap of fronts, one per source |
| Sources too large to load at once | The heap only needs one item per source in memory |
| k is small, N is large | O(N log k) is close to linear |
| Two sources only | No heap; two pointers is the merge step of merge sort |

## Worked approach

### ELI5

Three people each hold a stack of cards sorted smallest on top.

1. Everyone lays their top card face up on the table.
2. Take the smallest face-up card. Write it down.
3. The person whose card you took lays their next card face up. If their stack is empty, they sit out.
4. Repeat until the table is empty.

The table never has more than k cards. Finding the smallest of those is what the heap is for.

### Syntax

JavaScript has no built-in heap. The smallest version: an array where the parent of `i` is `(i - 1) >> 1`.

```ts
const heap: number[] = [];
function push(x: number) {
  heap.push(x);
  let i = heap.length - 1;
  while (i > 0 && heap[i] < heap[(i - 1) >> 1]) {
    const p = (i - 1) >> 1;
    [heap[i], heap[p]] = [heap[p], heap[i]];
    i = p;
  }
}
push(3); push(5); push(1);
console.log(heap[0]); // 1, the smallest front
```

In the room, say "I will use a min-heap keyed by timestamp" and ask whether you may assume one exists. Many interviewers allow it.

### Then the details

The heap stores `[time, feedIndex, position]`, not just the time. Without the feed index you cannot find that feed's next item.

```ts
function mergeFeeds(feeds: number[][]): number[] {
  const heap: [number, number, number][] = [];
  const less = (a: number, b: number) =>
    heap[a][0] < heap[b][0] || (heap[a][0] === heap[b][0] && heap[a][1] < heap[b][1]);
  const swap = (a: number, b: number) => { [heap[a], heap[b]] = [heap[b], heap[a]]; };
  const push = (item: [number, number, number]) => {
    heap.push(item);
    for (let i = heap.length - 1; i > 0 && less(i, (i - 1) >> 1); i = (i - 1) >> 1) swap(i, (i - 1) >> 1);
  };
  const pop = (): [number, number, number] => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < heap.length && less(l, m)) m = l;
        if (r < heap.length && less(r, m)) m = r;
        if (m === i) break;
        swap(i, m); i = m;
      }
    }
    return top;
  };
  feeds.forEach((feed, f) => { if (feed.length) push([feed[0], f, 0]); });
  const out: number[] = [];
  while (heap.length) {
    const [time, f, p] = pop();
    out.push(time);
    if (p + 1 < feeds[f].length) push([feeds[f][p + 1], f, p + 1]);
  }
  return out;
}

console.log(mergeFeeds([[3, 11, 20], [5, 9], [1, 14, 15, 22]])); // [1, 3, 5, 9, 11, 14, 15, 20, 22]
console.log(mergeFeeds([[], [4]])); // [4]
```

Skip empty feeds when seeding. Pushing `feeds[f][0]` of an empty feed pushes `undefined`, and comparisons with `undefined` are always false, which quietly corrupts the heap.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Concatenate and sort | O(N log N) | O(N) | Honest baseline; often fastest for small N |
| Scan all k fronts each step | O(N · k) | O(k) | Fine for k ≤ 3 or so |
| Min-heap of fronts | O(N log k) | O(k) besides output | Default answer |
| Pairwise merge in rounds | O(N log k) | O(N) | Like merge sort's upper levels; no heap needed |

## Walkthrough

### Easy

Seed: fronts `3` (feed 0), `5` (feed 1), `1` (feed 2). Heap holds `{1, 3, 5}`.

1. Pop `1` from feed 2. Push its next, `14`. Heap `{3, 5, 14}`.
2. Pop `3` (feed 0). Push `11`. Heap `{5, 11, 14}`.
3. Pop `5` (feed 1). Push `9`. Heap `{9, 11, 14}`.
4. Pop `9`. Feed 1 is empty. Heap `{11, 14}`.
5. Pop `11`. Push `20`. Heap `{14, 20}`.
6. Pop `14`. Push `15`. Pop `15`. Push `22`. Pop `20`. Pop `22`.

Output `[1, 3, 5, 9, 11, 14, 15, 20, 22]`. The heap never held more than three entries.

### Medium

Duplicates and an empty shard: `[[2, 7], [], [2, 2, 9]]`. Seed skips the empty feed. Both feeds offer `2`; ties break on feed index, so feed 0's `2` comes out first. Output `[2, 2, 2, 7, 9]`. Every copy survives; this is a merge, not a union.

### Hard

"The shards are remote and each returns a page of 100 at a time." The algorithm does not change: the heap holds one item per shard, and when you pop a shard's last buffered item you fetch its next page before pushing. Memory is O(k × page size). If they ask for only the first m items (a feed page of 20), stop after m pops: O(k + m log k).

**Try it:** with k = 1000 shards and N = 10⁶ total items, roughly how many comparisons does the heap version do versus concatenate-and-sort? (About N · log₂ k ≈ 10⁷ versus N · log₂ N ≈ 2 × 10⁷. Same ballpark; the heap's win is memory and streaming, not raw speed.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Heap of bare timestamps | Cannot tell which feed to advance | Store `[time, feed, position]` |
| Seeding empty feeds | `undefined` in the heap breaks ordering | Skip `feed.length === 0` |
| Pushing all N items up front | O(N) memory; loses the streaming benefit | Only fronts in the heap |
| Claiming O(N log N) is "too slow" for N = 50 | Over-engineering | Say when the simple sort is the right call |
| Deduplicating | Notifications lost | Keep every copy unless asked |

## Interview moves

- Start with "concatenate and sort, O(N log N)," then ask how large k and N are.
- Say the invariant: "The heap holds exactly one front from each non-empty feed."
- Name what you store in each heap entry and why.
- For the streaming follow-up, point out that memory is O(k), independent of N.

## Cross-links

- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [k-th highest view count](./kth-largest/lesson.md) (id: kth-largest)
- [Median latency as samples arrive](./running-median/lesson.md) (id: running-median)
- [Collapse overlapping ranges](../patterns/merge-intervals.md) (id: merge-intervals)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
