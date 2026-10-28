---
id: room-count
title: Fewest rooms for a day of meetings
slug: room-count
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 15
summary: The rooms you need equal the most meetings running at one instant; sort starts and ends separately and sweep, or keep a min-heap of end times.
tags:
  - algorithms
  - algorithms/intervals
  - algorithms/greedy
  - algorithms/heaps
  - interviews
  - interviews/leetcode
prerequisites:
  - merge-intervals
  - heaps-top-k
related:
  - merge-intervals
  - insert-booking
  - heaps-top-k
  - two-pointers
company_signal: []
sources_consulted:
  - https://docs.python.org/3/library/heapq.html
updated: 2026-10-28
status: canonical
---

# Fewest rooms for a day of meetings

## Snapshot

- Same shape as "meeting rooms II." The answer is the peak number of meetings in progress at once.
- Sweep: sort all starts, sort all ends, walk the starts; each start either reuses a room freed by the earliest unprocessed end or opens a new one.
- Heap version: sort meetings by start, keep a min-heap of end times for rooms in use, and pop when the earliest end is at or before the next start.
- Both are O(n log n) for the sorts. Merging intervals does *not* answer this.

## Prompt

A scheduling assistant collects meeting requests for one morning as half-open ranges in minutes after 9:00. A meeting that ends at minute 30 frees its room for one that starts at minute 30.

```
meetings = [[10, 40], [15, 25], [20, 50], [30, 35], [45, 60]]
```

What is the smallest number of rooms that fits every meeting? Return `3`. Between minutes 20 and 25, three meetings are running (`[10,40]`, `[15,25]`, `[20,50]`), and again between 30 and 35.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Minimum rooms / servers / lanes so nothing collides" | Peak overlap |
| "Can one person attend everything?" | Sort by start, check neighbours; the answer is rooms ≤ 1 |
| "Merge into busy blocks" | Different question: [merge intervals](../patterns/merge-intervals.md) |
| Need to know *which* room each meeting gets | Heap version; store room ids with end times |
| Times are small integers in a fixed range | A difference array over the range also works |

## Worked approach

### ELI5

Stand at the door of the meeting-room floor with two sorted lists: the times people arrive and the times people leave.

1. Next event is an arrival before the next departure? Someone needs a room. If no room is free, open one more.
2. Next departure is at or before the next arrival? A room frees up. The arriving meeting takes it.
3. The number of rooms you ever had open is the answer.

You never need to know *which* meeting left. Any free room works for anyone.

### Syntax

```ts
const meetings = [[10, 40], [15, 25], [20, 50], [30, 35], [45, 60]];
const starts = meetings.map((m) => m[0]).sort((a, b) => a - b);
const ends = meetings.map((m) => m[1]).sort((a, b) => a - b);
console.log(starts, ends); // [10,15,20,30,45] [25,35,40,50,60]
```

### Then the details

```ts
function roomCount(meetings: number[][]): number {
  const starts = meetings.map((m) => m[0]).sort((a, b) => a - b);
  const ends = meetings.map((m) => m[1]).sort((a, b) => a - b);
  let rooms = 0;
  let j = 0; // earliest end not yet used to free a room
  for (const s of starts) {
    if (s >= ends[j]) j++; // a room freed at or before s; reuse it
    else rooms++;          // everyone is still busy; open another
  }
  return rooms;
}

console.log(roomCount([[10, 40], [15, 25], [20, 50], [30, 35], [45, 60]])); // 3
console.log(roomCount([[0, 10], [10, 20], [20, 30]]));                    // 1: back to back
console.log(roomCount([]));                                               // 0
```

The detail is `>=`. With half-open ranges, a start equal to an end can reuse that room. Using `>` books an extra room for every back-to-back pair.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Check every minute against every meeting | O(n · T) | O(1) | T is the time range; fine only for tiny T |
| Sort starts and ends, sweep | O(n log n) | O(n) | Default |
| Sort by start, min-heap of ends | O(n log n) | O(n) | Also tells you which room each meeting gets |
| Difference array over a small integer range | O(n + T) | O(T) | +1 at start, −1 at end, take the running max |

## Walkthrough

### Easy

Back to back: `[[0,10], [10,20], [20,30]]`. Starts `[0,10,20]`, ends `[10,20,30]`. Start 0 < 10: open room 1. Start 10 ≥ 10: reuse. Start 20 ≥ 20: reuse. One room.

### Medium

The prompt. Starts `[10, 15, 20, 30, 45]`, ends `[25, 35, 40, 50, 60]`.

| start | earliest unused end | action | rooms |
| --- | --- | --- | --- |
| 10 | 25 | 10 < 25, open | 1 |
| 15 | 25 | 15 < 25, open | 2 |
| 20 | 25 | 20 < 25, open | 3 |
| 30 | 25 | 30 ≥ 25, reuse; next end 35 | 3 |
| 45 | 35 | 45 ≥ 35, reuse; next end 40 | 3 |

Three rooms. Sorting the ends separately loses which meeting each end belongs to, and that is fine: any free room serves any meeting.

### Hard

Heap version, which the interviewer may ask for if they want room assignments. Sort meetings by start: `[10,40], [15,25], [20,50], [30,35], [45,60]`. Keep the end times of rooms in use in a min-heap.

1. `[10,40]`: heap empty, open. Heap {40}.
2. `[15,25]`: smallest end 40 > 15, open. Heap {25, 40}.
3. `[20,50]`: 25 > 20, open. Heap {25, 40, 50}. Size 3.
4. `[30,35]`: 25 ≤ 30, pop 25, push 35. Heap {35, 40, 50}.
5. `[45,60]`: 35 ≤ 45, pop 35, push 60. Heap {40, 50, 60}.

Peak size 3. JavaScript has no built-in heap; Python's `heapq` and Java's `PriorityQueue` do.

Identical meetings `[[5,9], [5,9], [5,9]]` need 3. A long meeting with short ones inside, `[[0,100], [10,20], [30,40]]`, needs 2: the short ones reuse each other's room.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Merging intervals and counting blocks | Counts busy stretches, not concurrent meetings | Peak overlap |
| `>` instead of `>=` with half-open ranges | Extra room for back-to-back meetings | Decide touching rules first |
| Default `sort()` on numbers | Sorts as strings: 100 before 15 | Pass `(a, b) => a − b` |
| Decrementing a counter on reuse and returning its final value | Returns rooms in use at the end of the day, not the peak | Track the max, or use the open/reuse form above |

## Interview moves

- Restate as "the peak number of overlapping meetings."
- Ask whether a meeting ending at 30 frees a room for one starting at 30.
- Give the sweep, then mention the heap version for room assignments.
- If they ask why separate sorts are allowed, say that rooms are interchangeable, so only counts of starts and ends matter.

## Cross-links

- [Collapse overlapping ranges](../patterns/merge-intervals.md) (id: merge-intervals)
- [Drop a new booking into a busy calendar](./insert-booking.md) (id: insert-booking)
- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Squeeze from both ends](../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
