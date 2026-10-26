---
id: binary-search-on-answer
title: Binary search the feasible number
slug: binary-search-on-answer
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Search the numeric answer, not the array index, by testing a monotonic feasibility predicate.
tags:
  - algorithms
  - algorithms/binary-search
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - coin-change
  - rotated-index
  - heaps-top-k
  - kth-largest
  - dp-1d
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Binary search the feasible number

## Snapshot

- The array is not what you bisect. You bisect the *answer space*: speed, capacity, deadline, cut count.
- You need a predicate `can(x)` that is monotonic: if `x` works, every larger (or every smaller) also works.
- Each test is usually O(n). Total time is O(n log range).
- If `can(x)` is not monotonic, this binary search is invalid. Reconsider the state and constraints before choosing another technique.

## Prompt

n video files of sizes `files = [7, 3, 11, 5]`. You have `hours = 8` to transcode them. Speed is "units per hour." Find the minimum integer speed that finishes on time. A file may span several hours, but each hour works on at most one file; leftover capacity in its final hour is unused. Sizes are positive integers, and there must be at least one hour per file.

This is the "minimum feasible rate" family (Koko / split-array), restated as a transcode deadline.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "minimum X such that we can finish" | Answer is a number; search it |
| "allocate / split into k groups, minimize the max" | Same monotonic shape |
| Feasibility is easy, optimality is not | `can(x)` is the whole trick |
| Values up to 10^9, n up to 10^5 | Log the range, do not scan it |

## Worked approach

### ELI5

Start with speeds from 1 through the largest file size. At the upper bound every file takes one hour, so it is feasible under our hours constraint. Test a middle speed by adding each file’s rounded-up hour count. A faster speed cannot increase that count.

### Syntax

```ts
const files = [7, 3, 11, 5];
console.log(files.map(size => Math.ceil(size / 4))); // [2,1,3,2]
console.log(files.reduce((hours, size) => hours + Math.ceil(size / 4), 0)); // 8
```

### Then the details

```ts
function minSpeed(files: number[], hours: number): number {
  if (files.length === 0) return 0;
  if (!Number.isSafeInteger(hours) || hours < files.length) return -1;
  let lo = 1;
  let hi = files.reduce((max, size) => Math.max(max, size), 0);
  const can = (speed: number) => {
    let used = 0;
    for (const size of files) {
      used += Math.ceil(size / speed);
      if (used > hours) return false;
    }
    return used <= hours;
  };
  while (lo < hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (can(mid)) hi = mid;
    else lo = mid + 1;
  }
  return lo;
}

console.log(minSpeed([7, 3, 11, 5], 8)); // 4
console.log(minSpeed([7, 3, 11, 5], 4)); // 11
console.log(minSpeed([7, 3, 11, 5], 3)); // -1: too few hours

```

When `can(mid)` is true you still try smaller, so `hi = mid`, not `mid - 1`, if you want the *minimum* that works.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Try every speed from 1 to max | O(n · max) | O(1) | Impossible at 10^9 |
| Binary search + O(n) predicate | O(n log max) | O(1) | Default |

## Walkthrough

`files = [7, 3, 11, 5]`, `hours = 8`

### Easy

1. Range `[1, 11]`. Mid 6: hours = ceil(7/6)+ceil(3/6)+ceil(11/6)+ceil(5/6) = 2+1+2+1 = 6 ≤ 8. Try slower.

### Medium

2. Mid 3: 3+1+4+2 = 10 > 8. Need faster.
3. The range is now `[4,6]`. Mid 5 uses 2+1+3+1 = 7 hours, so set hi to 5.
4. Mid 4 uses 2+1+3+2 = 8 hours, so set hi to 4. The bounds meet: answer 4.

Check: 4 units/hour clears 7 in two hours, 3 in one, 11 in three, 5 in two. Total 8.

### Hard

With only three hours and four positive files, no speed works under the one-file-per-hour rule. Return −1. Empty input needs zero work and returns 0. Explain why the feasibility of the initial upper bound matters.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Integer overflow on `(lo+hi)/2` | Infinite loop in some languages | `lo + Math.floor((hi-lo)/2)` |
| `hi = mid - 1` on a "minimum true" search | Skips the answer | Keep `hi = mid` when `can` is true |
| Predicate that is not monotonic | Binary search returns garbage | Prove the yes-region is a suffix or prefix |
| Ignoring numeric range | Large sums or midpoint arithmetic can lose integer precision | Keep sizes and bounds within the safe integer contract, or use bigint arithmetic |

## Interview moves

- Write `can(x)` first, on the board, with one example. Only then wrap binary search.
- State the invariant: "all speeds < lo fail; all speeds ≥ hi succeed."
- Ask whether a file can split across hours. That changes the predicate, not the pattern.
- If they want the *count* of ways, this is the wrong tool; that is DP.

## Cross-links

- [Fewest tokens for a fare](../problems/coin-change/lesson.md) (id: coin-change)
- [Keep only the interesting k](./heaps-top-k.md) (id: heaps-top-k)
- [k-th highest view count](../problems/kth-largest/lesson.md) (id: kth-largest)
- [Reuse the last few answers](./dp-1d.md) (id: dp-1d)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
