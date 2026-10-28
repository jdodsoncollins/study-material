---
id: binary-search
title: Halve a sorted list until one slot is left
slug: binary-search
kind: pattern
track: algorithms
difficulty: intro
estimated_minutes: 14
summary: Keep a half-open range that must contain the answer, compare at the middle, and throw away the half that cannot hold it.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/binary-search
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
  - two-pointers
related:
  - binary-search-on-answer
  - rotated-index
  - two-pointers
  - merge-intervals
company_signal: []
sources_consulted:
  - https://docs.python.org/3/library/bisect.html
  - https://en.cppreference.com/w/cpp/algorithm/lower_bound
  - https://en.cppreference.com/w/cpp/algorithm/upper_bound
updated: 2026-10-28
status: canonical
---

# Halve a sorted list until one slot is left

## Snapshot

- Needs sorted input (or any yes/no test that flips once from "no" to "yes" along the array).
- Each comparison throws away half of what is left, so n = 1,000,000 takes about 20 steps.
- The safest default is the *lower bound*: the first index whose value is at least the target. Exact lookup, upper bound, and counting all reuse it.
- Pick one range convention (here half-open `[lo, hi)`) and keep it everywhere. Mixing conventions causes most bugs.

## Prompt

A chat thread stores message timestamps in seconds, oldest first: `stamps = [3, 8, 8, 8, 15, 21, 30]`.

1. Is there a message at second 15? Return its index, or −1.
2. The user taps "jump to 0:10". Return the index of the first message at or after second 10.
3. How many messages were sent at exactly second 8?

Answers: `4`, `4`, and `3`. Do it without scanning the whole thread.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Input is sorted, n is large, you need one position | Halving beats a scan |
| "first at or after", "last before", "insert position" | Lower or upper bound, not exact match |
| "How many equal to x" in sorted data | Upper bound minus lower bound |
| A yes/no test is false, then true, along the array | Same loop; the test replaces `<` |
| The answer is a number you could guess and check | Search the answer space instead: [binary search on the answer](../binary-search-on-answer.md) |

## Worked approach

[Narrow the range](viz/bounds.md)

### ELI5

Drag the scroll bar of a long chat to the middle and read the time on screen.

1. Too early? Everything above is also too early. Keep only the lower half.
2. Late enough? This might be the one, but an earlier one might be too. Keep this message and the upper half.
3. Repeat until only one spot is left. That spot is the first message at or after the time you wanted.

The rule you never break: the answer is always inside the range you are still looking at.

### Syntax

```ts
const stamps = [3, 8, 8, 8, 15, 21, 30];
let lo = 0;
let hi = stamps.length; // half-open: hi is one past the last candidate
const mid = lo + Math.floor((hi - lo) / 2);
console.log(mid, stamps[mid]); // 3 8
```

### Then the details

Write `lowerBound` once. The other questions are one line each on top of it.

```ts
// First index i with a[i] >= target. Returns a.length if every value is smaller.
function lowerBound(a: number[], target: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] < target) lo = mid + 1; // mid is too early, and so is everything before it
    else hi = mid;                     // mid might be the answer; keep it
  }
  return lo;
}

// First index i with a[i] > target.
function upperBound(a: number[], target: number): number {
  let lo = 0;
  let hi = a.length;
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (a[mid] <= target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function indexOf(a: number[], target: number): number {
  const i = lowerBound(a, target);
  return i < a.length && a[i] === target ? i : -1;
}

const stamps = [3, 8, 8, 8, 15, 21, 30];
console.log(indexOf(stamps, 15));                             // 4
console.log(lowerBound(stamps, 10));                          // 4
console.log(upperBound(stamps, 8) - lowerBound(stamps, 8));   // 3
console.log(indexOf(stamps, 31), lowerBound(stamps, 31));     // -1 7
```

The footgun is the update rule. When the middle *could* be the answer, keep it with `hi = mid`. Writing `hi = mid - 1` with a half-open range skips answers; writing `lo = mid` instead of `mid + 1` can loop forever when two slots remain.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Linear scan | O(n) | O(1) | Fine once; wasteful for repeated lookups |
| Lower / upper bound | O(log n) | O(1) | Default on sorted arrays |
| Hash map of value → index | O(1) expected per lookup | O(n) | Exact match only; cannot answer "first at or after" |
| Sort, then many searches | O(n log n + q log n) | O(n) for a copy | Worth it when q is large |

## Walkthrough

### Easy

`indexOf(stamps, 15)` with `stamps = [3, 8, 8, 8, 15, 21, 30]`:

1. `[0, 7)`, mid 3, value 8 < 15 → `lo = 4`.
2. `[4, 7)`, mid 5, value 21 ≥ 15 → `hi = 5`.
3. `[4, 5)`, mid 4, value 15 ≥ 15 → `hi = 4`.
4. `lo = hi = 4`, and `stamps[4] === 15`. Answer 4.

### Medium

Jump to second 10 has no exact match. Lower bound still answers it:

1. `[0, 7)`, mid 3, 8 < 10 → `lo = 4`.
2. `[4, 7)`, mid 5, 21 ≥ 10 → `hi = 5`.
3. `[4, 5)`, mid 4, 15 ≥ 10 → `hi = 4`. Answer 4: the message at 15.

Count of 8s: lower bound of 8 is 1 (mid 3 → `hi = 3`, mid 1 → `hi = 1`, mid 0 → `lo = 1`). Upper bound of 8 is 4 (mid 3 → `lo = 4`, mid 5 → `hi = 5`, mid 4 → `hi = 4`). `4 − 1 = 3`.

### Hard

Second 31 is after every message. Lower bound returns 7, which equals `stamps.length`. That is a valid answer ("insert at the end"), so check `i < a.length` before reading `a[i]`. An empty thread returns 0 from both bounds, and `indexOf` returns −1.

Follow-up: "find the last message at or before second 20." That is `upperBound(stamps, 20) − 1 = 5 − 1 = 4` (second 15). If the result is −1, no such message exists.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Mixing `while (lo <= hi)` with `hi = a.length` | Reads one past the end | Half-open pairs with `lo < hi`; closed pairs with `lo <= hi` and `hi = n − 1` |
| `hi = mid − 1` while searching for a first match | Skips the answer when `mid` was it | Keep `hi = mid` |
| `lo = mid` | Infinite loop when `hi = lo + 1` | Always `lo = mid + 1` |
| `(lo + hi) / 2` with 32-bit ints | Overflows in Java or C++ for very large arrays | `lo + (hi − lo) / 2`; JavaScript numbers are exact well beyond array lengths |
| Running it on unsorted data | Returns a confident wrong index | Sort first, or prove the yes/no test only flips once |

## Interview moves

- Say the invariant out loud: "everything before `lo` is too small; everything from `hi` on is big enough."
- Ask what to return on a miss: −1, the insert position, or null. Lower bound gives you the insert position for free.
- Trace the two-element case (`[8, 15]`) before you claim the loop terminates.
- If duplicates matter, say which one they want: first, last, or any.
- If the array is rotated or the answer is a speed or capacity, name the variant: [rotated lookup](../../problems/rotated-index/lesson.md) or [search on the answer](../binary-search-on-answer.md).

## Cross-links

- [Binary search the feasible number](../binary-search-on-answer.md) (id: binary-search-on-answer)
- [Lookup in a rotated sorted index](../../problems/rotated-index/lesson.md) (id: rotated-index)
- [Squeeze from both ends](../two-pointers/lesson.md) (id: two-pointers)
- [Collapse overlapping ranges](../merge-intervals.md) (id: merge-intervals)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
