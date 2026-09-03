---
id: two-sum
title: Pair lookup instead of nested scanning
slug: two-sum
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Find two values that add to a target by remembering the complement you still need, not by checking every pair.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/hash-maps
  - interviews/leetcode
prerequisites:
  - hash-maps
related:
  - three-sum
  - two-pointers
  - hash-maps
  - big-o
company_signal:
  - name: Meta
    evidence: Phone-screen writeups and LeetCode company tags keep listing pair-sum / complement-index problems as warmups.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Tagged-list prep threads treat this family as a default OA/phone screen.
    year: 2025
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode Meta and Amazon tagged-list threads
updated: 2026-09-02
status: canonical
---

# Pair lookup instead of nested scanning

## Snapshot

- You are handed a bag of integers and a target total. Return any two distinct positions whose values add to that total.
- Nested loops are correct and too slow the moment the bag is thousands of items.
- The useful trick is a map from *value already seen* to *index*, so each new number asks "have I already seen the partner I need?"
- Interviewers are checking whether you reach O(n) without wrecking correctness on duplicates.

## Prompt

A warehouse scanner dumps a list of bin weights, `weights = [4, 11, 8, 3, 15]`. A forklift can carry exactly `target = 19` if it picks two bins. Return the indices of any two bins that add to 19. Each bin may be used once. If nothing works, say so.

This is the same shape as the famous "two sum" interview question. The story is a warehouse so the numbers are not the textbook `[2, 7, 11, 15]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "two values that add to X" | Pair search, not subarray |
| Unsorted input, need indices | Sorting would scramble positions unless you store original indices |
| "each used at most once" | You cannot pair a number with itself unless two copies exist |
| n up to 10^5 | O(n²) will time out |

## Worked approach

Walk the list once. For weight `w` at index `i`, compute `need = target - w`. If `need` is already in the map, you are done. Otherwise record `w → i`.

```ts
function pairIndices(weights: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < weights.length; i++) {
    const need = target - weights[i];
    const partner = seen.get(need);
    if (partner !== undefined) return [partner, i];
    seen.set(weights[i], i);
  }
  return null;
}
```

If the interviewer then says "the list is already sorted, just return the values," switch to two pointers from both ends. That is a different lesson.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested loops | O(n²) | O(1) | Fine for n < ~200, a trap otherwise |
| Hash map of complements | O(n) expected | O(n) | Default answer |
| Sort + two pointers | O(n log n) | O(n) if you keep original indices | Use when they forbid extra memory *or* input is sorted |

## Walkthrough

`weights = [4, 11, 8, 3, 15]`, `target = 19`

1. `4` → need `15`. Map empty. Store `4 → 0`.
2. `11` → need `8`. Miss. Store `11 → 1`.
3. `8` → need `11`. Hit at index 1. Return `[1, 2]`.

Check: `11 + 8 = 19`. Bins 1 and 2.

A duplicate-value trap: `[6, 6]`, target `12` must return both indices. The map stores the first `6`; the second `6` finds it. Do not write `if (need === w) skip`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Pairing an index with itself | `[10]`, target `20` falsely succeeds | Look up *before* inserting the current index |
| Overwriting duplicate keys | Later copy hides the earlier index you needed | For this problem the last index is fine; for "all pairs" it is not |
| Sorting in place then returning indices | Indices no longer match the original array | Keep `(value, index)` tuples |
| Claiming O(1) hash time as a law | Pathological collisions | Say "expected O(n)" |

## Interview moves

- Start by stating brute force, then kill it with n.
- Ask whether multiple valid pairs may exist (return any).
- Ask whether values can be negative (yes; the same map still works).
- If they want constant extra memory, pivot to sort + two pointers and admit you lose original indices unless you stash them.

## Cross-links

- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Three-value search](./three-sum.md) (id: three-sum)
- [Two pointers](../patterns/two-pointers.md) (id: two-pointers)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
