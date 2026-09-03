---
id: next-hotter
title: Days until a hotter shift
slug: next-hotter
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Scan left to right and keep a decreasing stack of waiting days so each new high resolves every cooler day still on the stack.
tags:
  - algorithms
  - algorithms/stacks
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - monotonic-stack
related:
  - monotonic-stack
  - valid-brackets
  - merge-intervals
  - two-pointers
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list next-warmer-day / next-greater as the standard monotonic-stack medium.
    year: 2026
    confidence: high
  - name: Google
    evidence: Phone-screen writeups describe daily-temperatures style next-greater as a common stack follow-up.
    year: 2026
    confidence: medium
sources_consulted:
  - LeetCode Top 100 Liked (Daily Temperatures, 2026)
  - r/leetcode monotonic-stack tagged threads
updated: 2026-09-03
status: canonical
---

# Days until a hotter shift

## Snapshot

- For each day, how many days until a strictly hotter reading. None: 0.
- Nested scans are O(n²). A decreasing stack of *indices* waits for a warmer day.
- When today is hotter than the top of the stack, pop and write `today - thatIndex`. Repeat until the stack is decreasing again.
- The stack holds unresolved days. It never holds a day that already found its answer.

## Prompt

Shift-high temperatures, F: `temps = [62, 64, 61, 70, 63, 72]`. For each day, return how many days you wait until a hotter shift. Last day is 0 if nothing later is hotter.

This is next-warmer-day. The tape is not `[73,74,75,71,69,72,76,73]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Next greater to the right | Monotonic stack |
| Next greater to the left | Scan the other way, same stack |
| Equal counts as warmer | Ask; this prompt is strict |
| Sliding maximum of a window | Heap / deque, not this stack |

## Worked approach

```ts
function daysUntilHotter(temps: number[]): number[] {
  const wait = Array(temps.length).fill(0);
  const stack: number[] = [];
  for (let i = 0; i < temps.length; i++) {
    while (stack.length && temps[i] > temps[stack[stack.length - 1]]) {
      const j = stack.pop()!;
      wait[j] = i - j;
    }
    stack.push(i);
  }
  return wait;
}

console.log(daysUntilHotter([62, 64, 61, 70, 63, 72])); // [1, 2, 1, 2, 1, 0]
console.log(daysUntilHotter([50, 50]));                 // [0, 0]
```

Store indices, not temperatures. You need the distance `i - j`.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| For each day scan right | O(n²) | O(1) extra | Timeout at 10^5 |
| Decreasing index stack | O(n) | O(n) | Each index push/pop once |

## Walkthrough

`temps = [62, 64, 61, 70, 63, 72]`

[Pop when a hotter day arrives](viz/wait.md)

1. Push 62. 64 is hotter. Pop 62, wait=1. Push 64.
2. 61 is cooler. Push 61.
3. 70 is hotter than 61 (wait=1) and 64 (wait=2). Stack empty. Push 70.
4. 63 cooler. Push. 72 pops 63 (1) and 70 (2). Push 72. End: 72 waits 0.

Answer `[1, 2, 1, 2, 1, 0]`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Stack of values | You cannot recover the day index | Stack of indices |
| `>=` instead of `>` | Equal days pop each other | Strict warmer |
| Forgetting leftover days | They should stay 0 | Fill 0, never write them |
| Scanning left | You answer "previous hotter" | This prompt is to the right |

## Interview moves

- Say "decreasing stack of unresolved days" before the loop.
- Draw the pops for 70. That one day resolves two waiters.
- Histogram rectangle is the same stack with widths. Name it if they look bored.

## Cross-links

- [The next greater is waiting on a stack](../../patterns/monotonic-stack.md) (id: monotonic-stack)
- [Matched crate tags](../valid-brackets/lesson.md) (id: valid-brackets)
- [Collapse overlapping ranges](../../patterns/merge-intervals.md) (id: merge-intervals)
- [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers)
