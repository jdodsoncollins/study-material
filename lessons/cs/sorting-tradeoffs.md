---
id: sorting-tradeoffs
title: Which sort, and what it costs you
slug: sorting-tradeoffs
kind: concept
track: cs
difficulty: intro
estimated_minutes: 16
summary: Merge, quick, heap, and counting sort differ in worst case, extra memory, stability, and locality; pick by the data and the guarantee you need, not by the average-case headline.
tags:
  - cs
  - cs/complexity
  - cs/data-structures
  - algorithms
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - big-o
  - arrays-vs-linked-lists
  - heaps-top-k
  - merge-intervals
  - two-pointers
company_signal: []
sources_consulted:
  - https://tc39.es/ecma262/#sec-array.prototype.sort
  - https://v8.dev/blog/array-sort
updated: 2026-10-28
status: canonical
---

# Which sort, and what it costs you

## Snapshot

- Comparison sorts need Ω(n log n) comparisons in the worst case. Merge sort and heap sort meet that bound in the worst case; quicksort does on average and degrades to O(n²) with bad pivots.
- A **stable** sort keeps equal keys in their original order. That matters when you sort by one field after another, or when the input order carries meaning (arrival time).
- Extra memory: merge sort O(n) for arrays, quicksort O(log n) stack with good pivoting, heap sort O(1).
- Counting sort is O(n + k) for integer keys in a range of size k, and stable when written carefully. It is not a comparison sort, so the n log n bound does not apply.
- JavaScript's `Array.prototype.sort` is required to be stable since ES2019; V8 uses TimSort. Its default comparison is by string, so numbers need a comparator.

## Why it shows up in interviews

You rarely write a sort from scratch in an interview, but you often choose one implicitly: "sort the intervals by start," "sort tickets by priority then time." Interviewers ask about stability, worst case, and memory to see whether you know what the library call promises. A follow-up such as "the keys are ages 0–120 and there are 50 million rows" is an invitation to say counting sort.

## Core idea

### ELI5

- **Merge sort:** split the pile in half, sort each half, then zip the two sorted halves together by repeatedly taking the smaller front card.
- **Quicksort:** pick a pivot card, put smaller cards left and larger right, then do the same on each side.
- **Heap sort:** build a heap so the largest card is always on top, take it off, repeat.
- **Counting sort:** if every card is a number from 0 to 3, count how many of each, then lay them out in order.

### What each one costs

| Sort | Time (worst) | Time (typical) | Extra space | Stable | Notes |
| --- | --- | --- | --- | --- | --- |
| Insertion | O(n²) | O(n) on nearly sorted | O(1) | Yes | Best for tiny or nearly sorted runs |
| Merge | O(n log n) | O(n log n) | O(n) | Yes | Sequential access; good for linked lists and external sorting |
| Quick | O(n²) | O(n log n) | O(log n) stack | No (usual in-place version) | Good cache behavior; randomized or median-of-three pivots |
| Heap | O(n log n) | O(n log n) | O(1) | No | Jumps around memory; slower in practice than quick |
| Counting | O(n + k) | O(n + k) | O(n + k) | Yes, if placed back to front or by prefix sums | Only for small integer key ranges |
| TimSort | O(n log n) | Near O(n) on presorted runs | O(n) | Yes | Merge sort plus insertion sort on detected runs |

Introsort (used by many C++ standard libraries) starts as quicksort and switches to heap sort if recursion gets too deep, which keeps quicksort's speed and caps the worst case.

### Stability, concretely

Sort support tickets by priority. Two tickets have priority 1; ticket `T4` arrived before `T7`. A stable sort guarantees `T4` stays before `T7`. An unstable sort may swap them. If you then rely on the order for "oldest first within a priority," the unstable result is wrong even though it is "sorted."

## Worked example

Tickets arrive in this order with priorities (0 is most urgent): `T1:2, T2:0, T3:3, T4:1, T5:0, T6:2, T7:1`.

### Easy

Sorted stably by priority: `T2, T5, T4, T7, T1, T6, T3`. Within each priority the arrival order is preserved: `T2` before `T5`, `T4` before `T7`, `T1` before `T6`.

### Medium

Priorities are only 0–3, so counting sort fits: count each priority (`0:2, 1:2, 2:2, 3:1`), turn counts into starting positions (`0, 2, 4, 6`), then place each ticket in arrival order at its priority's next slot. That is O(n + 4) and stable. With a million tickets it does a few linear passes and no comparisons, so it grows more slowly than any comparison sort.

### Hard

An interviewer says: "Quicksort is O(n log n), so it's always fine." Counter: with a first-element pivot on already sorted input, each partition removes one element, so the work is n + (n−1) + … ≈ n²/2 comparisons. For 100,000 sorted tickets that is about 5 billion. Randomized pivots make that case vanishingly unlikely for any fixed input, and introsort bounds it outright. If the interviewer also needs stability, quicksort is out anyway; use merge sort or the stable library sort.

```ts
type Ticket = { id: string; priority: number };

function mergeSort<T>(a: T[], cmp: (x: T, y: T) => number): T[] {
  if (a.length <= 1) return a.slice();
  const mid = a.length >> 1;
  const left = mergeSort(a.slice(0, mid), cmp), right = mergeSort(a.slice(mid), cmp);
  const out: T[] = [];
  let i = 0, j = 0;
  while (i < left.length && j < right.length) out.push(cmp(right[j], left[i]) < 0 ? right[j++] : left[i++]); // ties take left: stable
  return out.concat(left.slice(i), right.slice(j));
}

function countingSortBy<T>(a: T[], key: (x: T) => number, k: number): T[] {
  const start = new Array(k + 1).fill(0);
  for (const x of a) start[key(x) + 1]++;
  for (let v = 1; v <= k; v++) start[v] += start[v - 1]; // start[v] = first slot for key v
  const out = new Array<T>(a.length);
  for (const x of a) out[start[key(x)]++] = x; // arrival order within a key: stable
  return out;
}

const tickets: Ticket[] = [["T1", 2], ["T2", 0], ["T3", 3], ["T4", 1], ["T5", 0], ["T6", 2], ["T7", 1]].map(([id, priority]) => ({ id: id as string, priority: priority as number }));
console.log(mergeSort(tickets, (x, y) => x.priority - y.priority).map((t) => t.id).join(" ")); // T2 T5 T4 T7 T1 T6 T3
console.log(countingSortBy(tickets, (t) => t.priority, 4).map((t) => t.id).join(" "));          // same order
console.log(mergeSort([], (x: number, y: number) => x - y), [10, 9, 1].sort(), [10, 9, 1].sort((x, y) => x - y)); // [] [ 1, 10, 9 ] [ 1, 9, 10 ]
```

The last line shows the default string comparison trap in JavaScript.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "Quicksort is O(n log n)" | Worst case is O(n²) | Say "expected," and name the pivot strategy |
| Ignoring stability | Secondary order is lost | Use a stable sort, or sort by a composite key |
| `[10, 9, 1].sort()` in JavaScript | `[1, 10, 9]`: string order | Pass `(a, b) => a - b` |
| Counting sort on a huge key range | O(k) memory explodes | Only when k is small relative to n, or use radix sort |
| Comparator that is inconsistent | Undefined or implementation-defined order | Return negative/zero/positive consistently |
| Assuming heap sort is fastest because O(1) space | Poor locality makes it slower in practice | Measure; prefer library sorts |

## How to talk about it

"I'll sort with the language's stable sort by priority, which in JavaScript is required to be stable, so arrival order within a priority survives. That's O(n log n). Priorities are only 0 to 3, so if this becomes the hot path I could counting-sort in O(n) with four buckets. I wouldn't hand-roll quicksort: its worst case is quadratic without careful pivots and it isn't stable."

## Cross-links

- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Keep only the interesting k](../algorithms/patterns/heaps-top-k.md) (id: heaps-top-k)
- [Collapse overlapping ranges](../algorithms/patterns/merge-intervals.md) (id: merge-intervals)
- [Squeeze from both ends](../algorithms/patterns/two-pointers/lesson.md) (id: two-pointers)
- [CPU caches and the cost of a jump](./cpu-caches-locality.md) (id: cpu-caches-locality)
