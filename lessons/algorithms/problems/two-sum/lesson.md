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
updated: 2026-09-12
status: canonical
---

# Pair lookup instead of nested scanning

## Snapshot

- You are handed a bag of integers and a target total. Return any two distinct positions whose values add to that total.
- Nested loops are correct and too slow the moment the bag is thousands of items.
- The useful trick is a map from *value already seen* to *index*, so each new number asks "have I already seen the partner I need?"
- Interviewers are checking whether you reach O(n) without wrecking correctness on duplicates.

## Prompt

A checkout cart has item prices `prices = [4, 11, 8, 3, 15]`. A gift card covers exactly `target = 19` if the shopper picks two items. Return the indices of any two items that add to 19. Each item may be used once. If nothing works, say so.

This is the same shape as the famous "two sum" interview question. The numbers are not the textbook `[2, 7, 11, 15]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "two values that add to X" | Pair search, not subarray |
| Unsorted input, need indices | Sorting would scramble positions unless you store original indices |
| "each used at most once" | You cannot pair a number with itself unless two copies exist |
| n up to 10^5 | O(n²) will time out |

## Worked approach

This is [hash-maps](../../patterns/hash-maps.md) (id: hash-maps) applied to one prompt. Apply it the same way: ELI5, then the three Map calls, then lookup-before-insert.

### ELI5

The gift card is $19. You walk the cart once, left to right, with a map of prices you have already seen.

1. Item 0 costs 4. Need 15. Map empty. Store `4 → 0`.
2. Item 1 costs 11. Need 8. Miss. Store `11 → 1`.
3. Item 2 costs 8. Need 11. The map has it at index 1. Stop. Those two items.

You never pair an item with itself: the price you just stored is for a *later* item to find. Look up first, then insert.

### Syntax

```ts
const seen = new Map<number, number>();
seen.set(11, 1);
console.log(seen.get(19 - 8)); // 1
console.log(seen.get(15));     // undefined
```

### Then the details

Walk once. Look up the partner, then insert this price.

```ts
function pairIndices(prices: number[], target: number): [number, number] | null {
  const seen = new Map<number, number>();
  for (let i = 0; i < prices.length; i++) {
    const need = target - prices[i];
    const partner = seen.get(need);
    if (partner !== undefined) return [partner, i];
    seen.set(prices[i], i);
  }
  return null;
}

console.log(pairIndices([4, 11, 8, 3, 15], 19)); // [1, 2]
console.log(pairIndices([6, 6], 12));            // [0, 1]

```

If the interviewer then says "the list is already sorted, just return the values," switch to two pointers from both ends. That is a different lesson.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested loops | O(n²) | O(1) | Fine for n < ~200, a trap otherwise |
| Hash map of complements | O(n) expected | O(n) | Default answer |
| Sort + two pointers | O(n log n) | O(n) if you keep original indices | Use when they forbid extra memory *or* input is sorted |

## Walkthrough

[Walk the cart](viz/walk.md)

### Easy

`prices = [4, 11, 8, 3, 15]`, `target = 19`

1. `4` → need `15`. Map empty. Store `4 → 0`.
2. `11` → need `8`. Miss. Store `11 → 1`.
3. `8` → need `11`. Hit at index 1. Return `[1, 2]`.

Check: `11 + 8 = 19`.

### Medium

A miss: `target = 10` on the same list. Every `need` is absent. Return `null`. Narrate one miss out loud so you do not freeze when the happy path is not there.

### Hard

`[6, 6]`, target `12` must return both indices. The map stores the first `6`; the second `6` finds it. Do not write `if (need === w) skip`. Insert-first would return `[0, 0]`.

If they then say "the list is already sorted, just return the values," switch to [two-pointers](../../patterns/two-pointers/lesson.md) (id: two-pointers).

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

- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Three-value search](../three-sum/lesson.md) (id: three-sum)
- [Two pointers](../../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
