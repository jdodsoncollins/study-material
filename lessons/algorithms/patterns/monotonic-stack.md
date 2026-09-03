---
id: monotonic-stack
title: The next greater is waiting on a stack
slug: monotonic-stack
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Keep a stack of decreasing (or increasing) candidates so each item finds its next greater or smaller in amortized constant time.
tags:
  - algorithms
  - algorithms/stacks
  - algorithms/arrays
  - interviews/leetcode
prerequisites:
  - arrays-vs-linked-lists
related:
  - valid-brackets
  - next-hotter
  - merge-intervals
  - two-pointers
  - heaps-top-k
company_signal:
  - name: Google
    evidence: Candidate reports list next-greater / daily-temperature style stack prompts as a common medium.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Tagged-list threads keep histogram-rectangle and next-greater-element in OA circulation.
    year: 2025
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode monotonic-stack threads
updated: 2026-09-02
status: canonical
---

# The next greater is waiting on a stack

## Snapshot

- Each index waits on a stack until a later value breaks the monotonic invariant.
- Decreasing stack → next greater. Increasing stack → next smaller. Pick one and stick to it.
- Every index is pushed once and popped once, so O(n) even though the inner loop looks nested.
- Parentheses matching is a stack, but not a monotonic one. Do not mash the two.

## Prompt

A dock thermometer records `temps = [14, 13, 16, 15, 19, 12]`. For each hour, how many hours until a strictly warmer reading? If none, put 0.

This is the "next greater to the right" family, told as a weather strip on a warehouse wall.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "next greater / next smaller" | Monotonic stack |
| "how many days until warmer" | Next greater, store indices |
| "largest rectangle in a histogram" | Next smaller on both sides |
| "validate brackets" | Plain stack, not monotonic |

## Worked approach

Store indices of unresolved hours. Walk left to right. While the current temp is warmer than `temps[stack.top]`, pop and write the wait.

```ts
function hoursUntilWarmer(temps: number[]): number[] {
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

console.log(hoursUntilWarmer([14, 13, 16, 15, 19, 12])); // [2, 1, 2, 1, 0, 0]

```

The stack of temps is decreasing (strictly, if you require a strictly warmer hour). Equals stay on the stack.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested scan to the right | O(n²) | O(1) extra | Timeout bait |
| Monotonic stack | O(n) | O(n) | Default |
| Sparse table / RMQ | O(n log n) build | O(n log n) | Overkill here |

## Walkthrough

`temps = [14, 13, 16, 15, 19, 12]`

1. Push 0 (14). 13 is colder; push 1.
2. 16 is warmer than 13 and 14. Pop 1 → wait 1. Pop 0 → wait 2. Push 2.
3. 15 colder than 16; push 3.
4. 19 warmer than 15 and 16. Pop 3 → wait 1. Pop 2 → wait 2. Push 4.
5. 12 colder; push 5. End. Unresolved stay 0.

Answer `[2, 1, 2, 1, 0, 0]`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Storing values, not indices | You cannot compute distance | Push indices |
| `>=` when they want strict | Equal temps fire too early | Match the inequality to the prompt |
| Forgetting leftover zeros | Fine for "none," wrong if they want `-1` | Fill the default they asked for |
| Using a queue | FIFO cannot see the nearest left candidate | Stack |

## Interview moves

- State the invariant: "stack indices have decreasing temps, all waiting for a warmer hour."
- Walk one pop on the board so they see amortized O(n).
- Ask whether equal counts as warmer. One word changes the while-condition.
- If they pivot to histogram area, say "next smaller to the left and to the right, same stack twice."

## Cross-links

- [Matched crate tags](../problems/valid-brackets/lesson.md) (id: valid-brackets)
- [Collapse overlapping ranges](./merge-intervals.md) (id: merge-intervals)
- [Squeeze from both ends](./two-pointers/lesson.md) (id: two-pointers)
- [Keep only the interesting k](./heaps-top-k.md) (id: heaps-top-k)
- [Arrays versus linked lists](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
