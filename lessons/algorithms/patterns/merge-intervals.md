---
id: merge-intervals
title: Collapse overlapping ranges
slug: merge-intervals
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Sort ranges by start time, then walk once, merging anything that overlaps the current open interval.
tags:
  - algorithms
  - algorithms/intervals
  - algorithms/greedy
  - interviews/leetcode
prerequisites:
  - two-pointers
related:
  - two-pointers
  - heaps-top-k
  - monotonic-stack
  - topological-sort
company_signal:
  - name: Meta
    evidence: Candidate reports list meeting-merge and calendar-conflict prompts as a recurring medium.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: OA writeups describe "merge busy windows / insert an interval" as a tagged favorite.
    year: 2025
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode interval tagged threads
updated: 2026-09-02
status: canonical
---

# Collapse overlapping ranges

## Snapshot

- Sort by start. After that, a linear scan is enough because a later interval cannot sneak behind you.
- Overlap means `next.start <= current.end`. Touching endpoints usually count as overlap; ask.
- Insert-interval is the same walk with one extra range spliced in.
- "Minimum rooms" is not merge. That is a min-heap of end times.

## Prompt

Loading-dock bookings arrive as half-open hours `[start, end)`: `slots = [[1, 4], [8, 10], [3, 6], [9, 11]]`. Merge any overlapping bookings so the dock sheet shows busy blocks, not raw requests.

The numbers are dock hours, not the textbook `[[1,3],[2,6],[8,10],[15,18]]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| List of `[start, end]` | Interval pattern, not two-sum |
| "merge / insert / overlapping" | Sort + scan |
| "minimum rooms / CPU cores" | Heap of ends, not a merged list |
| "can you attend all?" | Check overlap, no merge required |

## Worked approach

Sort by start. Seed `current` with the first slot. For each next slot, either extend `current.end` or push `current` and open a new one.

```ts
function mergeSlots(slots: [number, number][]): [number, number][] {
  if (slots.length === 0) return [];
  const sorted = [...slots].sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let [open, close] = sorted[0];
  for (let i = 1; i < sorted.length; i++) {
    const [start, end] = sorted[i];
    if (start <= close) {
      close = Math.max(close, end);
    } else {
      out.push([open, close]);
      open = start;
      close = end;
    }
  }
  out.push([open, close]);
  return out;
}

console.log(mergeSlots([[1, 4], [8, 10], [3, 6], [9, 11]])); // [[1,6],[8,11]]

```

`start <= close` treats touching ranges as one block. If the prompt uses half-open hours and they say 4pm-end then 4pm-start is free, switch to `start < close`.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested overlap checks | O(n²) | O(n) | Misses transitivity |
| Sort + scan | O(n log n) | O(n) | Default |
| Sweep with a heap | O(n log n) | O(n) | Use for room count |

## Walkthrough

`slots = [[1, 4], [8, 10], [3, 6], [9, 11]]`

1. Sort: `[1,4], [3,6], [8,10], [9,11]`.
2. Open `[1,4]`. Next starts at 3, which is ≤ 4. Extend close to 6. Block `[1,6]`.
3. `[8,10]` starts after 6. Push `[1,6]`, open `[8,10]`.
4. `[9,11]` overlaps. Extend to `[8,11]`.
5. Result `[[1,6], [8,11]]`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Sorting by end | A long early range fails to swallow a later start | Sort by start |
| Replacing close instead of max | A nested range shrinks the block | `close = Math.max(close, end)` |
| Mutating the input sort | Caller still holds the unsorted booking list | Copy, or ask if in-place is allowed |
| Using merge to count rooms | Two overlaps can still need two docks | Heap of end times |

## Interview moves

- Ask whether touching endpoints merge, and whether the ranges are closed or half-open.
- Draw the number line. Interviewers want to see the sort, not a clever tree.
- If they follow with "how many docks do we need?", switch to a min-heap of closing times and say why merge is the wrong summary.
- Insert-interval: merge as usual, but treat the new slot as one more item in the sorted list, or splice during the walk.

## Cross-links

- [Squeeze from both ends](./two-pointers/lesson.md) (id: two-pointers)
- [Keep only the interesting k](./heaps-top-k.md) (id: heaps-top-k)
- [The next greater is waiting on a stack](./monotonic-stack.md) (id: monotonic-stack)
- [Order by prerequisites](./topological-sort/lesson.md) (id: topological-sort)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
