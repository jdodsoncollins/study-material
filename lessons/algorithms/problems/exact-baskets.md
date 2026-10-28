---
id: exact-baskets
title: Every basket that spends a meal credit exactly
slug: exact-baskets
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 15
summary: List every multiset of menu prices that sums to a credit by recursing with a start index that may repeat the current item but never goes back.
tags:
  - algorithms
  - algorithms/backtracking
  - interviews
  - interviews/leetcode
prerequisites:
  - dfs-backtracking
related:
  - dfs-backtracking
  - playlist-orders
  - spare-subsets
  - coin-change
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Every basket that spends a meal credit exactly

## Snapshot

- Distinct positive prices, unlimited quantity of each, one exact total. List every basket, where a basket is a multiset: `[2, 3, 3]` and `[3, 2, 3]` are the same basket.
- Backtracking with a **start index**: from item `i` you may take item `i` again or anything after it, never anything before. That alone kills duplicate orderings.
- Sort the prices so you can stop the loop as soon as one price is bigger than what is left.
- Counting baskets (not listing them) is a DP; see the coin lesson. Listing needs the search.

## Prompt

A food-delivery app gives a `credit = 8` dollar voucher that only applies if the basket totals exactly 8. The menu has items priced:

```
prices = [2, 3, 5]
```

Each item may be ordered any number of times. Return every distinct basket (as a list of prices) that totals exactly 8. Inner order and outer order do not matter. A credit of 0 has one basket: the empty one.

This is the same shape as "combination sum" with reuse allowed.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "all combinations that sum to" | Backtracking over a sorted list |
| "may reuse" / "unlimited" | Recurse with the same index `i` |
| "each used once" | Recurse with `i + 1` instead |
| Order inside an answer does not matter | Start index, never loop from 0 |
| Only the **count** or the **fewest** | DP table, not enumeration |

## Worked approach

### ELI5

You are filling a basket with $8 to spend, walking the menu cheapest first.

1. At each step, pick the next item **from where you are on the menu or later**. Never from earlier.
2. Put a $2 item in. $6 left. You may still pick $2 again, or move on to $3 or $5.
3. Whenever exactly $0 is left, write the basket down.
4. Whenever the next price is more than what is left, stop looking further down the menu: everything after it costs even more.
5. Take the last item back out and try the next menu item instead.

Because you never go back up the menu, you never build `[3, 2, ...]` after already building `[2, 3, ...]`.

### Syntax

```ts
const menu = [5, 2, 3].sort((a, b) => a - b); // [2, 3, 5]
const basket: number[] = [];
basket.push(menu[0]);           // choose $2
console.log(basket, 8 - 2);     // [2] 6 left
basket.pop();                   // un-choose
console.log(basket);
```

### Then the details

```ts
function exactBaskets(prices: number[], credit: number): number[][] {
  const menu = [...new Set(prices)].sort((a, b) => a - b);
  const out: number[][] = [];
  const basket: number[] = [];
  const walk = (start: number, left: number) => {
    if (left === 0) { out.push([...basket]); return; }
    for (let i = start; i < menu.length; i++) {
      if (menu[i] > left) break;       // sorted, so nothing later fits either
      basket.push(menu[i]);
      walk(i, left - menu[i]);         // i, not i + 1: reuse allowed
      basket.pop();
    }
  };
  walk(0, credit);
  return out;
}

console.log(exactBaskets([2, 3, 5], 8));  // [[2,2,2,2], [2,3,3], [3,5]]
console.log(exactBaskets([4, 6], 7));     // []
```

The `break` is only correct because `menu` is sorted. On an unsorted menu it would skip cheaper items that come later. `Set` guards against a duplicate price creating duplicate baskets.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Try every sequence, dedupe by sorting each | Exponential, plus dedupe cost | Large | Generates permutations of the same basket |
| Backtracking with start index | Exponential in credit / min price; output-sensitive | O(credit / min price) recursion depth | Default answer |
| DP counting `ways[x] += ways[x − p]` | O(credit · items) | O(credit) | Counts baskets, cannot list them |

A clean bound is hard to state. Say: depth is at most `credit / min(prices)`, branching is at most the number of items, and the work is dominated by the size of the output when many baskets exist.

## Walkthrough

### Easy

`prices = [2, 3, 5]`, `credit = 8`.

1. `[2]` left 6 → `[2,2]` left 4 → `[2,2,2]` left 2 → `[2,2,2,2]` left 0. Record.
2. Back at `[2,2,2]` left 2: try 3, too big, break.
3. Back at `[2,2]` left 4: try 3 → `[2,2,3]` left 1; nothing fits. Try 5, too big.
4. Back at `[2]` left 6: try 3 → `[2,3]` left 3 → from index 1: `[2,3,3]` left 0. Record. Try 5 at left 6 → `[2,5]` left 1; nothing fits.
5. Start with 3: `[3]` left 5 → `[3,3]` left 2, nothing at index ≥ 1 fits → `[3,5]` left 0. Record.
6. Start with 5: `[5]` left 3, only 5 allowed, too big.

Three baskets: `[2,2,2,2]`, `[2,3,3]`, `[3,5]`.

### Medium

Raise the credit to 10. Baskets: `[2,2,2,2,2]`, `[2,2,3,3]`, `[2,3,5]`, `[5,5]`. Four. Check by counting with the DP from the coin lesson: `ways[10] = 4`. A miss: prices `[4, 6]`, credit 7, returns `[]` because every total is even.

### Hard

"Each item at most once, and the menu has duplicate prices: `[2, 2, 3, 5]`, credit 7." Recurse with `i + 1`, and inside the loop skip `menu[i]` when `i > start` and it equals `menu[i − 1]` (keep the original list, sorted, without `Set`). Result: `[2, 2, 3]`, `[2, 5]`. Without the skip you would print `[2, 5]` twice.

**Try it:** with `prices = [1]` and `credit = 30`, how many baskets and how deep is the recursion? (One basket; depth 30. Now try `prices = [1, 2]`, credit 30: 16 baskets, still depth 30.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Loop from 0 every call | `[2,3,3]`, `[3,2,3]`, `[3,3,2]` all appear | Pass `start`, loop from it |
| Recurse with `i + 1` when reuse is allowed | `[2,2,2,2]` never appears | Recurse with `i` |
| `break` on an unsorted menu | Cheaper items after a pricey one are skipped | Sort first, or use `continue` |
| Pushing `basket` without copying | All results alias one array | `[...basket]` |
| Zero or negative prices | Infinite recursion | Ask; the problem assumes positive prices |

## Interview moves

- Ask: reuse allowed? Duplicates in input? Return baskets or a count?
- Say "start index removes permutations of the same basket" before writing the loop.
- Point at the `break` and say why sorting makes it safe.
- If they only want the count, pivot to the DP in one sentence.

## Cross-links

- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Every play order for a short queue](./playlist-orders.md) (id: playlist-orders)
- [Every subset of selected items](./spare-subsets/lesson.md) (id: spare-subsets)
- [Fewest tokens for a fare](./coin-change/lesson.md) (id: coin-change)
- [Reuse the last few answers](../patterns/dp-1d.md) (id: dp-1d)
