---
id: kth-largest
title: k-th busiest dock
slug: kth-largest
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: Stream scores through a min-heap of size k so the root is the k-th largest without sorting the whole hour.
tags:
  - algorithms
  - algorithms/heaps
  - interviews/leetcode
prerequisites:
  - heaps-top-k
related:
  - heaps-top-k
  - binary-search-on-answer
  - two-pointers
  - hash-maps
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list k-th largest / top-k as a default heap question.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone-screen writeups describe k-th largest in a stream as a common follow-up after a static sort.
    year: 2026
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode heap tagged threads
updated: 2026-09-02
status: canonical
---

# k-th busiest dock

## Snapshot

- Return the k-th largest *value*, not the k-th unique value, unless they say unique.
- Min-heap of size k: every new score that beats the root evicts the root. The root is the k-th largest.
- Sorting is honest and often fast enough. The heap is what they want to hear when n is huge and k is small.
- Quickselect is average O(n) for a one-shot query. Name it; implement the heap unless they push.

## Prompt

Dock throughput for the hour, pallets per lane: `scores = [31, 6, 18, 44, 18, 9, 25]`. Return the `k = 3`rd busiest total. Duplicate 18s both count. Lanes are not unique keys; you are ranking numbers.

This is k-th largest. The scores are a dock sheet, not a textbook random array.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| k-th largest / smallest | Heap or quickselect |
| Stream, repeated queries as items arrive | Online size-k heap |
| k-th *unique* | Dedup first, or a different structure |
| Median | Two heaps, not one |

## Worked approach

TypeScript has no stdlib heap. In the room, say so, then keep a tiny sorted buffer of size k (fine for the board) or sketch the heap.

```ts
function kthBusiest(scores: number[], k: number): number {
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

The sort-per-insert is O(n k log k). Swap in a real min-heap for O(n log k). The *logic* is identical: drop the smallest of the k winners.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Sort descending, pick `[k-1]` | O(n log n) | O(n) | Fine if they allow it |
| Size-k min-heap | O(n log k) | O(k) | Default |
| Quickselect | O(n) average, O(n²) worst | O(1) extra | One-shot, mutates the array |

## Walkthrough

`scores = [31, 6, 18, 44, 18, 9, 25]`, `k = 3`

1. First three: `[31, 6, 18]`. Sorted buffer `[6, 18, 31]`. Root/smallest of winners = 6.
2. 44 beats 6. Buffer `[18, 31, 44]`.
3. 18 ties 18. Does not beat 18. Stay.
4. 9 loses. 25 beats 18. Buffer `[25, 31, 44]`.

k-th largest is 25. Check: sorted descending `44, 31, 25, 18, 18, 9, 6`. Yes.

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
- Binary search on the answer also works (count how many scores ≥ mid) in O(n log range). Mention it if the values are huge and k is irrelevant.

## Cross-links

- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Binary search the feasible number](../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Squeeze from both ends](../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
