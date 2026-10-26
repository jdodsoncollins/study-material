---
id: kth-largest
title: k-th highest view count
slug: kth-largest
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: Keep the k largest observed values and compare a simple sorted buffer with a scalable min-heap.
tags:
  - algorithms
  - algorithms/heaps
  - interviews
  - interviews/leetcode
prerequisites:
  - heaps-top-k
related:
  - heaps-top-k
  - binary-search-on-answer
  - two-pointers
  - hash-maps
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# k-th highest view count

## Snapshot

- Return the k-th largest *value*, not the k-th unique value, unless they say unique.
- Min-heap of size k: every new score that beats the root evicts the root. The root is the k-th largest.
- Sorting is honest and often fast enough. The heap is what they want to hear when n is huge and k is small.
- Quickselect is average O(n) for a one-shot query. Name it; implement the heap unless they push.

## Prompt

View counts on today's videos: `scores = [31, 6, 18, 44, 18, 9, 25]`. Return the `k = 3`rd highest count. Duplicate 18s both count. You are ranking numbers, not unique videos.

This is k-th largest. The numbers are not a textbook random array.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| k-th largest / smallest | Heap or quickselect |
| Stream, repeated queries as items arrive | Online size-k heap |
| k-th *unique* | Dedup first, or a different structure |
| Median | Two heaps, not one |

## Worked approach

### ELI5

Keep only the k largest values seen so far. The smallest retained value is the current k-th largest. A larger arrival replaces it; smaller arrivals cannot affect the answer.

### Syntax

```ts
const winners = [6,18,31];
winners.push(44);
winners.sort((a,b) => a-b);
winners.shift();
console.log(winners[0]); // 18: new third largest
```

### Then the details

```ts
function kthBusiest(scores: number[], k: number): number {
  if (!Number.isInteger(k) || k < 1 || k > scores.length) throw new Error("Invalid k");
  const buf: number[] = [];
  for (const s of scores) {
    buf.push(s);
    buf.sort((a, b) => a - b);
    if (buf.length > k) buf.shift();
  }
  return buf[0];
}

console.log(kthBusiest([31, 6, 18, 44, 18, 9, 25], 3)); // 25
console.log(kthBusiest([31, 6, 18], 1));                 // 31

```

The sort-per-insert is O(n k log(k + 1)). Swap in a real min-heap for O(n log(k + 1)). The *logic* is identical: drop the smallest of the k winners.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Sort descending, pick `[k-1]` | O(n log n) | O(n) | Fine if they allow it |
| Size-k min-heap | O(n log(k + 1)) | O(k) | Default |
| Quickselect | O(n) average, O(n²) worst | O(1) extra | One-shot, mutates the array |

## Walkthrough

`scores = [31, 6, 18, 44, 18, 9, 25]`, `k = 3`

[Keep a size-k floor](viz/buf.md)

### Easy

1. First three: `[31, 6, 18]`. Sorted buffer `[6, 18, 31]`. Root/smallest of winners = 6.

### Medium

2. 44 beats 6. Buffer `[18, 31, 44]`.
3. 18 ties 18. Does not beat 18. Stay.
4. 9 loses. 25 beats 18. Buffer `[25, 31, 44]`.

k-th largest is 25. Check: sorted descending `44, 31, 25, 18, 18, 9, 6`. Yes.

### Hard

For k = n, the answer is the minimum; for k = 1, it is the maximum. k must be an integer in 1..n, so an empty input has no valid k. The sorted buffer is a teaching step; use the heap from heaps-top-k when the O(n log k) bound is required.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Max-heap of size k | You kept the k smallest | Min-heap for k-th largest |
| Deduping when they did not ask | Wrong rank on ties | Keep duplicates |
| k = 1 vs k = n | Off-by-one in the buffer | Empty-check; cap at k |
| Quickselect without saying worst case | Overclaim | Average O(n), adversarial O(n²) |

## Interview moves

- Ask: k-th largest value, or k-th distinct? 1-indexed from the top?
- Offer sort first, then upgrade to a heap when they mention n = 10^7, k = 10.
- If they add "as scores stream in, report after each," the size-k heap is already online.
- Binary search on the answer also works (count how many scores ≥ mid) in O(n log range). Its usefulness depends on the integer range; a huge range increases the number of feasibility tests.

## Cross-links

- [Keep only the interesting k](../../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Binary search the feasible number](../../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../../strategy/pattern-first-prep.md) (id: pattern-first-prep)
