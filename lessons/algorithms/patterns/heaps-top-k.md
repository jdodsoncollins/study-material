---
id: heaps-top-k
title: Keep only the interesting k
slug: heaps-top-k
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Stream n items through a size-k heap so you never sort the whole input just to name the extremes.
tags:
  - algorithms
  - algorithms/heaps
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - kth-largest
  - binary-search-on-answer
  - hash-maps
  - merge-intervals
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list top-k frequent / k-th largest as a default heap question.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone-screen writeups describe "k closest" and "k frequent" as common twenty-minute prompts.
    year: 2026
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode heap / top-k tagged threads
updated: 2026-09-02
status: canonical
---

# Keep only the interesting k

## Snapshot

- You need the k biggest, smallest, closest, or most frequent. You do not need a fully sorted list.
- A min-heap of size k holds the k largest: the root is the smallest of those winners, so a newcomer only has to beat the root.
- Frequency top-k is two steps: count, then heap the counts.
- Sorting is O(n log n) and fine until they say n is huge and k is tiny.

## Prompt

Dock scanners report how many pallets each lane cleared this hour: `cleared = [19, 4, 27, 12, 27, 8]`. Return the k = 2 busiest lane totals (values, not ranks). Ties stay; you are ranking scores, not unique lanes.

This is k-th largest / top-k, told as throughput rather than a textbook stream of random ints.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "k largest / smallest / frequent / closest" | Heap of size k |
| Stream that will not fit in memory | Online heap; you never store n |
| "median of a stream" | Two heaps, not one |
| k equals n | Just sort |

## Worked approach

TypeScript has no stdlib heap. In an interview, say you would use one, then either sketch the array-heap or, for small k, keep a sorted buffer. The logic is: push, and if size > k, pop the min.

```ts
function topK(cleared: number[], k: number): number[] {
  const heap: number[] = [];
  const swim = (i: number) => {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p] <= heap[i]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const sink = (i: number) => {
    while (true) {
      let s = i;
      const l = i * 2 + 1, r = l + 1;
      if (l < heap.length && heap[l] < heap[s]) s = l;
      if (r < heap.length && heap[r] < heap[s]) s = r;
      if (s === i) break;
      [heap[s], heap[i]] = [heap[i], heap[s]];
      i = s;
    }
  };
  for (const x of cleared) {
    heap.push(x);
    swim(heap.length - 1);
    if (heap.length > k) {
      heap[0] = heap.pop()!;
      sink(0);
    }
  }
  return heap;
}

console.log(topK([19, 4, 27, 12, 27, 8], 2).sort((a, b) => a - b)); // [27, 27]

```

Min-heap of size k → k largest. Max-heap of size k → k smallest. Do not mix that up on the board.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Sort | O(n log n) | O(n) | Honest default if n is modest |
| Size-k heap | O(n log k) | O(k) | Default interview answer |
| Quickselect | O(n) average | O(1) extra | Name it for k-th; worse for full top-k list |

## Walkthrough

`cleared = [19, 4, 27, 12, 27, 8]`, `k = 2`

1. Heap `[19]`, then `[4, 19]`. Size 2.
2. 27 beats 4. Pop 4. Heap `[19, 27]`.
3. 12 loses to 19. Stay.
4. Second 27 beats 19. Heap `[27, 27]`.
5. 8 loses. Answer the two 27s.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Max-heap for k largest | Heap holds the wrong tail | Min-heap for k largest |
| Heap of size n | You sorted with extra steps | Cap at k |
| Frequency top-k without a count map | Heap has no key | Count first, heap the entries |
| Claiming O(n) always | Quickselect is average-case | Say the average and the worst |

## Interview moves

- Ask whether k is tiny relative to n. That chooses heap versus sort.
- For "k frequent," write the count map first, then the heap. Two patterns, one problem.
- Mention quickselect if they only want the k-th value, not the whole set.
- If they add "streaming, n does not fit," the size-k heap is the whole design.

## Cross-links

- [k-th busiest dock](../problems/kth-largest/lesson.md) (id: kth-largest)
- [Binary search the feasible number](./binary-search-on-answer.md) (id: binary-search-on-answer)
- [Hash maps as an index](./hash-maps.md) (id: hash-maps)
- [Collapse overlapping ranges](./merge-intervals.md) (id: merge-intervals)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
