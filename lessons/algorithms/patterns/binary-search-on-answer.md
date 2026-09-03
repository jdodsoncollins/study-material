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
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - coin-change
  - rotated-index
  - heaps-top-k
  - kth-largest
  - dp-1d
company_signal:
  - name: Google
    evidence: Candidate onsite reports keep describing "minimum speed / capacity to finish by deadline" prompts as binary-search-on-answer.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Tagged-list threads list koko-style eating / split-array variants as medium follow-ups after vanilla binary search.
    year: 2026
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode binary-search-on-answer threads
updated: 2026-09-02
status: canonical
---

# Binary search the feasible number

## Snapshot

- The array is not what you bisect. You bisect the *answer space*: speed, capacity, deadline, cut count.
- You need a predicate `can(x)` that is monotonic: if `x` works, every larger (or every smaller) also works.
- Each test is usually O(n). Total time is O(n log range).
- If `can(x)` is not monotonic, this pattern is a lie. Fall back to DP or a heap.

## Prompt

A conveyor must clear crates of sizes `crates = [7, 3, 11, 5]` before the 5pm truck. Speed is "units of mass per hour." Hours available: `hours = 8`. Find the minimum integer speed that finishes on time. A crate cannot be split across two hours, but a slow hour can sit idle after a small crate.

This is the "minimum feasible rate" family, restated as a dock deadline.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "minimum X such that we can finish" | Answer is a number; search it |
| "allocate / split into k groups, minimize the max" | Same monotonic shape |
| Feasibility is easy, optimality is not | `can(x)` is the whole trick |
| Values up to 10^9, n up to 10^5 | Log the range, do not scan it |

## Worked approach

Lower bound is 1 (or max crate if you cannot split a crate across hours). Upper bound is max crate (one crate per hour) or sum. Bisect. `can(speed)` walks crates and counts hours needed.

```ts
function minSpeed(crates: number[], hours: number): number {
  let lo = 1;
  let hi = Math.max(...crates);
  const can = (speed: number) => {
    let used = 0;
    for (const mass of crates) used += Math.ceil(mass / speed);
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

```

When `can(mid)` is true you still try smaller, so `hi = mid`, not `mid - 1`, if you want the *minimum* that works.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Try every speed from 1 to max | O(n · max) | O(1) | Impossible at 10^9 |
| Binary search + O(n) predicate | O(n log max) | O(1) | Default |
| DP over splits | O(n² k) typical | O(nk) | Use when `can` is not monotonic |

## Walkthrough

`crates = [7, 3, 11, 5]`, `hours = 8`

1. Range `[1, 11]`. Mid 6: hours = ceil(7/6)+ceil(3/6)+ceil(11/6)+ceil(5/6) = 2+1+2+1 = 6 ≤ 8. Try slower.
2. Mid 3: 3+1+4+2 = 10 > 8. Need faster.
3. Mid 4: 2+1+3+2 = 8. Works. Try slower.
4. Mid 3 already failed. Answer 4.

Check: 4 units/hour clears 7 in two hours, 3 in one, 11 in three, 5 in two. Total 8.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Integer overflow on `(lo+hi)/2` | Infinite loop in some languages | `lo + Math.floor((hi-lo)/2)` |
| `hi = mid - 1` on a "minimum true" search | Skips the answer | Keep `hi = mid` when `can` is true |
| Predicate that is not monotonic | Binary search returns garbage | Prove the yes-region is a suffix or prefix |
| Using float ceil carelessly | `Math.ceil` on integers is fine; on money it is not | Integer math: `Math.floor((mass + speed - 1) / speed)` |

## Interview moves

- Write `can(x)` first, on the board, with one example. Only then wrap binary search.
- State the invariant: "all speeds < lo fail; all speeds ≥ hi succeed."
- Ask whether a crate can split across hours. That changes the predicate, not the pattern.
- If they want the *count* of ways, this is the wrong tool; that is DP.

## Cross-links

- [Fewest tokens for a fare](../problems/coin-change/lesson.md) (id: coin-change)
- [Keep only the interesting k](./heaps-top-k.md) (id: heaps-top-k)
- [k-th busiest dock](../problems/kth-largest/lesson.md) (id: kth-largest)
- [Reuse the last few answers](./dp-1d.md) (id: dp-1d)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
