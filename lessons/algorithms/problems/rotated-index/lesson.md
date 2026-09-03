---
id: rotated-index
title: Lookup in a rotated pallet index
slug: rotated-index
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: A rotated sorted ring still has one sorted half; binary search the half that is sorted and that can contain the target.
tags:
  - algorithms
  - algorithms/binary-search
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - binary-search-on-answer
related:
  - binary-search-on-answer
  - two-pointers
  - indexes
  - hashing-internals
company_signal:
  - name: Meta
    evidence: Candidate phone-screen reports list rotated-array search as the standard binary-search medium.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: OA writeups keep rotated-search next to plain binary search.
    year: 2026
    confidence: high
sources_consulted:
  - LeetCode Top 100 Liked (Search in Rotated Sorted Array, 2026)
  - r/leetcode binary-search tagged threads
updated: 2026-09-03
status: canonical
---

# Lookup in a rotated pallet index

## Snapshot

- A once-sorted unique array was rotated at an unknown pivot. Find `target`'s index, or -1.
- One of the two halves around `mid` is still sorted. That is the fact you test.
- If the sorted half can contain `target`, throw away the other half. Else throw away the sorted half.
- Duplicates (`[3,1,3,3,3]`) break the "which half is sorted" test. That is a different, slower prompt.

## Prompt

Pallet ids, rotated: `ids = [18, 21, 4, 7, 11, 15]`. Find `target = 11`. If `target = 5`, it is missing.

This is rotated sorted search. The ring is not `[4,5,6,7,0,1,2]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Sorted then rotated, unique | One sorted half per step |
| Find the minimum | Same idea, no target |
| Duplicates allowed | You may have to shrink `hi` by one |
| Unsorted | Hash, not binary search |

## Worked approach

```ts
function rotatedIndex(ids: number[], target: number): number {
  let lo = 0, hi = ids.length - 1;
  while (lo <= hi) {
    const mid = lo + Math.floor((hi - lo) / 2);
    if (ids[mid] === target) return mid;
    if (ids[lo] <= ids[mid]) {
      if (ids[lo] <= target && target < ids[mid]) hi = mid - 1;
      else lo = mid + 1;
    } else {
      if (ids[mid] < target && target <= ids[hi]) lo = mid + 1;
      else hi = mid - 1;
    }
  }
  return -1;
}

console.log(rotatedIndex([18, 21, 4, 7, 11, 15], 11)); // 4
console.log(rotatedIndex([18, 21, 4, 7, 11, 15], 5));  // -1
```

`lo <= mid` means the left half is sorted (including a one-element half). Use `<` on the target vs `mid` so you do not steal a case the equality check already handled.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Linear scan | O(n) | O(1) | They will ask why you did not binary search |
| Binary search the sorted half | O(log n) | O(1) | Default |
| Find pivot, then two searches | O(log n) | O(1) | Extra pass, same bound |

## Walkthrough

`ids = [18, 21, 4, 7, 11, 15]`, target 11

[Drop the half that cannot hold it](viz/half.md)

1. lo=0, hi=5, mid=2, value 4. Left `[18,21,4]` is not sorted. Right is sorted and 11 lives there. `lo = 3`.
2. lo=3, hi=5, mid=4, value 11. Return 4.

Target 5, same first cut: 4 < 5 ≤ 15, so `lo = 3` again. Next mid is 11, 5 is not in the sorted left `[7,11]`, so `lo` walks to 15, then off the end. `-1`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Always shrinking the unsorted half | You drop the target | Ask "can the *sorted* half contain it?" |
| `lo + hi >> 1` overflow theater | Fine in JS, still write `lo + (hi-lo)//2` | Habit |
| `while (lo < hi)` without a last check | Miss a singleton | `lo <= hi` |
| Treating equals as rotated | Duplicate prompt | This lesson assumes unique ids |

## Interview moves

- Point at mid and say which half is sorted. Then say whether the target can live there.
- If they add duplicates, tell them the worst case becomes O(n).
- Finding the rotation point first is extra work. One loop is enough.

## Cross-links

- [Binary search the feasible number](../../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Indexes are precomputed answers](../../../cs/indexes.md) (id: indexes)
- [Why a map is "O(1)" until it isn't](../../../cs/hashing-internals.md) (id: hashing-internals)
