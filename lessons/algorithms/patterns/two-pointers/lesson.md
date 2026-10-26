---
id: two-pointers
title: Squeeze from both ends
slug: two-pointers
kind: pattern
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Walk a sorted sequence from both ends so each comparison discards a whole side of the search.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/two-pointers
  - interviews
  - interviews/leetcode
prerequisites:
  - arrays-vs-linked-lists
related:
  - two-sum
  - three-sum
  - tarp-span
  - sliding-window
  - fast-slow-pointers
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Squeeze from both ends

## Snapshot

- Two indices start at opposite ends (or one stays, one walks) and only ever move inward.
- Sorting first is the usual tax. After that, each comparison throws away a whole prefix or suffix.
- Use this when the input is ordered, or when you are allowed to order it and you do not need original indices.
- Same family as sliding window, different contract: here the useful pair is not a contiguous slice.

## Prompt

A checkout cart's prices, already sorted: `prices = [3, 5, 8, 12, 14, 21]`. A gift card covers exactly `limit = 26` if two items are chosen. Return any pair of values that add to 26. You may not reuse an item.

This is the sorted-input variant of pair-sum. For original indices in unsorted input, a hash map is convenient; sorting decorated value/index pairs is another option with different cost.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "array is sorted" or "you may sort" | Ends become meaningful |
| Pair / triplet that hits a target | Inward pointers beat nested loops |
| "container with most water" shape | Area is min-height times width; move the short wall |
| Need original indices | Do not sort in place; stash `(value, index)` or switch to a map |

## Worked approach

[squeeze](viz/squeeze.md)

### ELI5

The cart is already cheap-to-expensive.

1. Put a finger on the cheapest item and a finger on the most expensive.
2. Add them.
3. Too light? Even the dearest leftover partner is not enough. Drop the cheap item: slide the left finger right.
4. Too heavy? The expensive item is the problem. Slide the right finger left.
5. Equal? Those two items.

You only ever move inward.

### Syntax

```ts
let left = 0;
let right = 5; // last index of a 6-item cart
console.log(left < right);
left += 1;  // sum was short
right -= 1; // sum was long
console.log(left, right);
```

Two integers. No map.

### Then the details

The move is legal only because the array is sorted. If the largest remaining partner makes the sum too small, every other remaining partner also fails with the current left value.

```ts
function cartPair(prices: number[], limit: number): [number, number] | null {
  let left = 0;
  let right = prices.length - 1;
  while (left < right) {
    const sum = prices[left] + prices[right];
    if (sum === limit) return [prices[left], prices[right]];
    if (sum < limit) left += 1;
    else right -= 1;
  }
  return null;
}

console.log(cartPair([3, 5, 8, 12, 14, 21], 26)); // [5, 21]
console.log(cartPair([3, 5, 8, 12, 14, 21], 22)); // [8, 14]
```

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested loops | O(n²) | O(1) | Correct, dead on large n |
| Already sorted + two pointers | O(n) | O(1) auxiliary | The code shown here |
| Sort + two pointers | O(n log n) | Depends on sorting/copying | Sorting is a separate preprocessing cost |
| Hash map of complements | O(n) expected | O(n) | Better when unsorted and indices matter |

## Walkthrough

### Easy

`prices = [3, 5, 8, 12, 14, 21]`, `limit = 26`

1. `3 + 21 = 24` too small. Advance left.
2. `5 + 21 = 26`. Return `[5, 21]`.

### Medium

Limit `22` on the same sheet. `3+21=24` shrink right → `3+14=17` grow left → `5+14=19` grow → `8+14=22`. Hit `[8, 14]`.

### Hard

They want original indices and the bag is unsorted. Do not sort in place. Either keep `(value, index)` tuples, or switch to [Hash maps as an index](../hash-maps.md) (id: hash-maps). For unique value pairs with duplicates, moving both pointers after a hit and skipping equal values is valid. Enumerating all index pairs is a different contract. `left < right` so you never pair an item with itself.

**Try it:** on `[3,5,8,12,14,21]` with target 100, why can the left pointer move without losing a solution? Even pairing it with the largest remaining value is too small. The return is null.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `left <= right` and pairing an item with itself | Odd-length array invents a pair | Require `left < right` |
| Sorting then returning original indices | Indices lie | Keep tuples, or do not sort |
| Confusing unique value pairs with all index pairs | Duplicate combinations can be omitted | For unique value pairs, move both and skip equal values; all index pairs need multiplicity handling |
| Using this on an unsorted list | Wrong answers, confidently | Sort first, or switch patterns |

## Interview moves

- Say out loud: "If I may sort, two pointers. If I must return indices, hash."
- Ask whether the pair must be unique, and whether duplicates exist.
- For the "max area" cousin, narrate why you move the shorter side, not the longer.
- Name the sliding-window cousin so they know you are not mixing contracts.

## Cross-links

- [Pair lookup instead of nested scanning](../../problems/two-sum/lesson.md) (id: two-sum)
- [Three-value search](../../problems/three-sum/lesson.md) (id: three-sum)
- [Choose two boundaries for the largest area](../../problems/tarp-span/lesson.md) (id: tarp-span)
- [Grow and shrink a live range](../sliding-window/lesson.md) (id: sliding-window)
- [Two speeds, one list](../fast-slow-pointers.md) (id: fast-slow-pointers)
- [Hash maps as an index](../hash-maps.md) (id: hash-maps)
- [Contiguous slots versus pointer chasing](../../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
