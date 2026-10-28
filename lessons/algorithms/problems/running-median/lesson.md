---
id: running-median
title: Median latency as samples arrive
slug: running-median
kind: problem
track: algorithms
difficulty: deep
estimated_minutes: 18
summary: Keep the smaller half of a stream in a max-heap and the larger half in a min-heap, so the median is always one or two heap tops away.
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
  - merge-sorted-feeds
  - lru-cache
company_signal: []
sources_consulted:
  - Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms (4th ed., 2022), Heapsort chapter (binary heaps and priority queues)
updated: 2026-10-28
status: canonical
---

# Median latency as samples arrive

## Snapshot

- Samples arrive one at a time. After each, report the median of everything seen so far.
- Split the stream at the middle. The **low** half lives in a max-heap (its top is the biggest small value). The **high** half lives in a min-heap (its top is the smallest big value).
- Keep the sizes equal, or let low hold one extra. Then the median is low's top, or the average of both tops.
- Each add is O(log n). Each median read is O(1). Re-sorting on every read is O(n log n) per read.

## Prompt

An API gateway records request latencies in milliseconds. A dashboard tile shows the median after every new sample:

```
samples = [40, 12, 31, 55, 8]
```

Build a `MedianTracker` with `add(ms)` and `median()`. For an even count, the median is the mean of the two middle values. The tests feed samples one by one and collect `median()` after each, so the expected output is one number per sample.

This is the same shape as "find median from a data stream." The domain and numbers are original.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "median" plus "stream" or "after each insert" | Two heaps |
| Need the middle, not the extremes | One heap only knows one end |
| Reads and writes interleave | Sorting per read repeats work |
| Values in a small known range (0–1000 ms buckets) | A count array can beat heaps; ask |
| "sliding window median" | Two heaps plus deletion (lazy or indexed); harder |

## Worked approach

[Balance the halves](viz/halves.md)

### ELI5

Two buckets on a table. The left bucket holds the smaller half of the numbers, and you can always see its **largest**. The right bucket holds the larger half, and you can always see its **smallest**.

1. A new number arrives. If it is no bigger than the left bucket's visible top, it goes left. Otherwise right.
2. If the left bucket now has two more than the right, move its top across. If the right has more than the left, move its top back.
3. Odd total: the median is the left top. Even total: average the two visible tops.

Every number in the left bucket is ≤ every number in the right. That is the invariant you say out loud.

### Syntax

The only new idea is a heap that can be min or max. Pass the comparison in.

```ts
const before = (a: number, b: number) => a > b; // max-heap order
const low = [31, 12];   // a max-heap: biggest on top
const high = [40, 55];  // a min-heap: smallest on top
console.log(before(low[0], low[1])); // true: 31 sits above 12
console.log((low[0] + high[0]) / 2); // 35.5 for four samples
```

### Then the details

```ts
class Heap {
  items: number[] = [];
  before: (a: number, b: number) => boolean;
  constructor(before: (a: number, b: number) => boolean) { this.before = before; }
  get size(): number { return this.items.length; }
  peek(): number { return this.items[0]; }
  push(x: number): void {
    const h = this.items;
    h.push(x);
    for (let i = h.length - 1; i > 0 && this.before(h[i], h[(i - 1) >> 1]); i = (i - 1) >> 1)
      [h[i], h[(i - 1) >> 1]] = [h[(i - 1) >> 1], h[i]];
  }
  pop(): number {
    const h = this.items, top = h[0], last = h.pop()!;
    if (h.length) {
      h[0] = last;
      for (let i = 0; ; ) {
        const l = 2 * i + 1, r = l + 1;
        let m = i;
        if (l < h.length && this.before(h[l], h[m])) m = l;
        if (r < h.length && this.before(h[r], h[m])) m = r;
        if (m === i) break;
        [h[i], h[m]] = [h[m], h[i]];
        i = m;
      }
    }
    return top;
  }
}

class MedianTracker {
  low = new Heap((a, b) => a > b);
  high = new Heap((a, b) => a < b);
  add(ms: number): void {
    if (this.low.size === 0 || ms <= this.low.peek()) this.low.push(ms);
    else this.high.push(ms);
    if (this.low.size > this.high.size + 1) this.high.push(this.low.pop());
    else if (this.high.size > this.low.size) this.low.push(this.high.pop());
  }
  median(): number {
    if (this.low.size === 0) throw new Error("no samples yet");
    return this.low.size > this.high.size ? this.low.peek() : (this.low.peek() + this.high.peek()) / 2;
  }
}

const tracker = new MedianTracker();
console.log([40, 12, 31, 55, 8].map(ms => { tracker.add(ms); return tracker.median(); }));
// [40, 26, 31, 35.5, 31]
```

The footgun is peeking an empty heap. `ms <= this.low.peek()` on an empty low compares against `undefined`, which is always false, so the check `this.low.size === 0` must come first. After routing, exactly one rebalance check runs, and it moves at most one item: a single add can only unbalance the sizes by one.

## Complexity

| Approach | Time per add | Time per median | Space | Notes |
| --- | --- | --- | --- | --- |
| Append, sort on every read | O(1) | O(n log n) | O(n) | Fine for a few hundred samples |
| Keep a sorted array, insert by binary search | O(n) shift | O(1) | O(n) | Often fast in practice; still linear |
| Two heaps | O(log n) | O(1) | O(n) | Default answer |
| Count array over fixed buckets | O(1) | O(buckets) | O(buckets) | Only if the value range is small and known |

## Walkthrough

### Easy

`samples = [40, 12, 31, 55, 8]`.

1. `40`: low empty, goes low. low `{40}`, high `{}`. Median `40`.
2. `12 ≤ 40`: low. low `{40, 12}`, high `{}`. Low is two ahead; move `40` to high. low `{12}`, high `{40}`. Median `(12 + 40) / 2 = 26`.
3. `31 > 12`: high. low `{12}`, high `{31, 40}`. High is bigger; move `31` back. low `{31, 12}`, high `{40}`. Median `31`.

### Medium

4. `55 > 31`: high. low `{31, 12}`, high `{40, 55}`. Balanced. Median `(31 + 40) / 2 = 35.5`.
5. `8 ≤ 31`: low. low `{31, 12, 8}`, high `{40, 55}`. Low has one extra, which is allowed. Median `31`.

Output `[40, 26, 31, 35.5, 31]`. Check the last one by sorting: `8, 12, 31, 40, 55`, middle is `31`.

### Hard

"Report p95, not the median." Same structure, different split: keep the low heap at `ceil(0.95 · n)` items instead of half. The top of low is the p95 under the nearest-rank definition. Percentile definitions vary (nearest-rank, linear interpolation), so ask which one the dashboard uses.

"Only the last 1000 samples count." Now samples leave as well as arrive. Heaps cannot delete an arbitrary value cheaply; the usual fixes are lazy deletion (a map of values to remove when they surface at a top) or an order-statistics tree. Say this is a different problem and how you would start it.

**Try it:** feed `[5, 5, 5, 1]`. Predict both heaps after each step. (After the last add: low `{5, 1}`, high `{5, 5}`, median `5`.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Two min-heaps | Low half shows its smallest, not its largest | Low must be a max-heap |
| Rebalance before inserting | Sizes drift by two | Insert, then rebalance once |
| Letting high hold the extra item | Odd-count median reads the wrong top | Pick one side for the extra and stick to it |
| Integer division for the even case | `35` instead of `35.5` in languages with int division | Divide as floating point, or ask about rounding |
| `median()` on an empty tracker | `undefined` or `NaN` leaks to the UI | Throw or return a sentinel; say which |

## Interview moves

- Start with "sort on every read" and its cost, then ask how often the dashboard reads versus writes.
- Draw the two buckets with the invariant "everything left ≤ everything right" and "sizes differ by at most one."
- Narrate the rebalance step on the first three samples; that is where bugs live.
- Mention the bucket-count alternative when latencies are bounded integers. It shows you think about the data, not only the pattern.

## Cross-links

- [Keep only the interesting k](../../patterns/heaps-top-k.md) (id: heaps-top-k)
- [k-th highest view count](../kth-largest/lesson.md) (id: kth-largest)
- [Merge k sorted notification feeds](../merge-sorted-feeds.md) (id: merge-sorted-feeds)
- [A lookup cache with least-recently-used eviction](../lru-cache/lesson.md) (id: lru-cache)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
