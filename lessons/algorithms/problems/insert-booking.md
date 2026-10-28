---
id: insert-booking
title: Drop a new booking into a busy calendar
slug: insert-booking
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Walk a sorted list of non-overlapping busy blocks in three phases, copying blocks that end before the new one, absorbing those that overlap it, and copying the rest.
tags:
  - algorithms
  - algorithms/intervals
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - merge-intervals
related:
  - merge-intervals
  - room-count
  - binary-search
  - two-pointers
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Drop a new booking into a busy calendar

## Snapshot

- Same shape as "insert interval." The existing list is already sorted and non-overlapping, so no sort is needed: one O(n) pass.
- Three phases: blocks entirely before the new one, blocks that overlap it (grow the new one to cover them), blocks entirely after.
- Ranges here are half-open `[start, end)`, the same rule as [collapse overlapping ranges](../patterns/merge-intervals.md): touching blocks stay separate.
- Binary search can find where the overlap starts, but building the output is still O(n).

## Prompt

A calendar shows busy blocks as half-open slot ranges, where slot 0 is 9:00–9:30, slot 1 is 9:30–10:00, and so on. The blocks are sorted and do not overlap:

```
busy = [[1, 3], [5, 7], [8, 10], [12, 15]]
```

A new meeting books `[6, 9]`. Return the updated busy blocks: `[[1, 3], [5, 10], [12, 15]]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Already sorted, non-overlapping" plus one new range | Linear three-phase walk; do not re-sort |
| Unsorted ranges, merge them all | Sort first: [merge intervals](../patterns/merge-intervals.md) |
| "Can this booking fit?" | Only check neighbours; binary search finds them |
| "How many rooms for all of these?" | Different question: [room count](./room-count.md) |

## Worked approach

### ELI5

Slide the new meeting along the day from the left.

1. Every busy block that is over before the new meeting starts: copy it as is.
2. Every block that overlaps the new meeting: melt it into the new meeting. The new meeting's start becomes the earlier start, its end the later end.
3. Once a block starts at or after the (grown) new meeting's end, write the new meeting, then copy the rest.

### Syntax

```ts
const [ns, ne] = [6, 9];
const before = (b: number[]) => b[1] <= ns; // over before the new one starts
const overlaps = (b: number[]) => b[0] < ne && b[1] > ns;
console.log(before([1, 3]), overlaps([5, 7]), overlaps([12, 15])); // true true false
```

### Then the details

```ts
function insertBooking(busy: number[][], booking: number[]): number[][] {
  const out: number[][] = [];
  let [start, end] = booking;
  let i = 0;
  while (i < busy.length && busy[i][1] <= start) out.push(busy[i++]);   // phase 1
  while (i < busy.length && busy[i][0] < end) {                        // phase 2
    start = Math.min(start, busy[i][0]);
    end = Math.max(end, busy[i][1]);
    i++;
  }
  out.push([start, end]);
  while (i < busy.length) out.push(busy[i++]);                          // phase 3
  return out;
}

const busy = [[1, 3], [5, 7], [8, 10], [12, 15]];
console.log(insertBooking(busy, [6, 9]));   // [[1,3],[5,10],[12,15]]
console.log(insertBooking(busy, [16, 18])); // appended at the end
console.log(insertBooking([], [2, 4]));     // [[2,4]]
```

The detail: phase 2's test is only `busy[i][0] < end`. Phase 1 already removed every block that ends at or before `start`, so any remaining block that starts before `end` must overlap. Testing both ends again is harmless but suggests you did not trust phase 1.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Append, re-sort, merge | O(n log n) | O(n) | Ignores that the input is sorted |
| Three-phase walk | O(n) | O(n) output | Default |
| Binary search for phase boundaries, then splice | O(log n) to locate, O(n) to build | O(n) | Faster only if the structure supports O(log n) edits, such as a balanced tree |

## Walkthrough

### Easy

`[16, 18]`. Every block ends at or before 16, so phase 1 copies all four. Phase 2 sees nothing. Append `[16, 18]`. Result `[[1,3], [5,7], [8,10], [12,15], [16,18]]`.

### Medium

The prompt, `[6, 9]`:

1. Phase 1: `[1,3]` ends at 3 ≤ 6, copy. `[5,7]` ends at 7 > 6, stop.
2. Phase 2: `[5,7]` starts at 5 < 9. Grow to `[5, 9]`. `[8,10]` starts at 8 < 9. Grow to `[5, 10]`. `[12,15]` starts at 12, not < 10. Stop.
3. Push `[5, 10]`, then copy `[12, 15]`.

Result `[[1, 3], [5, 10], [12, 15]]`.

### Hard

Touching: insert `[3, 5]` into the same list. Phase 1 copies `[1,3]` (ends at 3 ≤ 3). Phase 2 checks `[5,7]`: 5 < 5 is false, so nothing merges. Result `[[1,3], [3,5], [5,7], [8,10], [12,15]]`. Under half-open rules these are back-to-back, not overlapping. If the calendar should show one continuous busy block, change phase 1 to `busy[i][1] < start` and phase 2 to `busy[i][0] <= end`, and say it out loud.

Swallow everything: `[0, 20]` overlaps all four. Phase 1 copies nothing, phase 2 absorbs all, result `[[0, 20]]`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Re-sorting a sorted list | Correct but O(n log n) | Use the order you were given |
| Updating only `end` in phase 2 | A block that starts earlier than the booking loses its start | `start = min(start, block.start)` too |
| Mixing closed and half-open checks | Touching blocks merge in one place and not another | Pick one rule for all three phases |
| Forgetting to push the booking when phase 2 is empty | New meeting disappears | Push after phase 2, always |
| Mutating `busy` in place while reading it | Indices shift under you | Build a new array |

## Interview moves

- Ask whether touching blocks merge and whether ranges are half-open.
- Name the three phases before writing any loop.
- Point out you did not sort, and why that keeps it O(n).
- If asked about speed with many inserts, mention a balanced tree keyed by start, which makes locating O(log n).

## Cross-links

- [Collapse overlapping ranges](../patterns/merge-intervals.md) (id: merge-intervals)
- [Fewest rooms for a day of meetings](./room-count.md) (id: room-count)
- [Halve a sorted list until one slot is left](../patterns/binary-search/lesson.md) (id: binary-search)
- [Squeeze from both ends](../patterns/two-pointers/lesson.md) (id: two-pointers)
