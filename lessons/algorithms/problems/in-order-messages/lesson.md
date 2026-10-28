---
id: in-order-messages
title: Keep the longest already-ordered run of message ids
slug: in-order-messages
kind: problem
track: algorithms
difficulty: deep
estimated_minutes: 20
summary: Find the longest strictly increasing subsequence, first with an O(n²) table and then with patience piles and binary search in O(n log n).
tags:
  - algorithms
  - algorithms/dynamic-programming
  - algorithms/binary-search
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-1d
  - binary-search-on-answer
related:
  - dp-1d
  - binary-search-on-answer
  - typo-distance
  - skip-bay
company_signal: []
sources_consulted:
  - "David Aldous and Persi Diaconis, Longest increasing subsequences: from patience sorting to the Baik-Deift-Johansson theorem, Bulletin of the AMS 36 (1999)"
  - Michael L. Fredman, On computing the length of longest increasing subsequences, Discrete Mathematics 11 (1975)
updated: 2026-10-28
status: canonical
---

# Keep the longest already-ordered run of message ids

## Snapshot

- A **subsequence** keeps relative order but may skip items. A subarray may not skip. This problem is the subsequence one.
- The O(n²) DP: `best[i]` is the length of the longest rising chain that **ends at** item `i`. Look back at every smaller earlier item.
- The O(n log n) version keeps `tops[k]`: the smallest possible last value of any rising chain of length `k + 1`. Each new value replaces the first top that is ≥ it, found by binary search.
- `tops` is **not** an answer subsequence. Only its length is meaningful unless you store parent links.

## Prompt

A chat client receives a burst of messages after reconnecting. Retries scrambled the order, so the message ids arrive as:

```
ids = [12, 3, 9, 4, 15, 10, 18, 6]
```

The client keeps the longest set of messages that is already in increasing id order (without reordering them) and re-inserts the rest one by one. Return the length of the longest strictly increasing subsequence. Ids are integers; the list may be empty.

With 8 messages and a longest chain of 4, the client moves 8 − 4 = 4 messages. This is the same shape as "longest increasing subsequence."

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "longest increasing / rising / ordered subsequence" | LIS |
| "fewest items to remove (or move) so the rest is sorted" | n − LIS |
| "stack boxes / nest envelopes" in two dimensions | Sort by one key, LIS on the other |
| n up to 10⁵ | O(n²) is 10¹⁰; you need the binary-search version |
| Contiguous run required | That is a single scan, not LIS |

## Worked approach

[Patience piles](viz/piles.md)

### ELI5

**First the table.** Walk the ids left to right. For each id, ask: "Of the chains I already found that end on a smaller id, which is longest? Mine is that plus one." Write that number under the id. The biggest number written is the answer.

**Then the piles.** Deal the ids like solitaire cards onto piles in a row.

1. Look at the top card of each pile, left to right.
2. Put the new card on the **leftmost** pile whose top is **≥** the card.
3. If no top is that big, start a new pile on the right.
4. The number of piles is the answer.

Why it works: pile k's top is the smallest id that can end a chain of length k + 1. A smaller ending is always better, because more future ids can follow it. Tops stay sorted left to right, so step 2 is a binary search.

### Syntax

The O(n²) table, so the recurrence is on the board before anything clever:

```ts
const ids = [12, 3, 9, 4, 15, 10, 18, 6];
const best = ids.map(() => 1);
for (let i = 0; i < ids.length; i++)
  for (let j = 0; j < i; j++)
    if (ids[j] < ids[i]) best[i] = Math.max(best[i], best[j] + 1);
console.log(best);                 // [1, 1, 2, 2, 3, 3, 4, 3]
console.log(Math.max(0, ...best)); // 4
```

### Then the details

Replace the inner loop with a lower-bound binary search over `tops`.

```ts
function longestRising(ids: number[]): number {
  const tops: number[] = [];
  for (const id of ids) {
    let lo = 0, hi = tops.length;          // find first top >= id
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (tops[mid] < id) lo = mid + 1;
      else hi = mid;
    }
    tops[lo] = id;                          // replace, or append when lo === length
  }
  return tops.length;
}

console.log(longestRising([12, 3, 9, 4, 15, 10, 18, 6])); // 4
console.log(longestRising([7, 7, 7]));                    // 1 (strict)
console.log(longestRising([]));                           // 0
```

The comparison `tops[mid] < id` gives the **first top ≥ id**, which is right for strictly increasing. For non-decreasing (ties allowed), search for the first top **> id** instead (`tops[mid] <= id`).

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Every subsequence | O(2ⁿ · n) | O(n) | Correct for n ≤ 20 |
| `best[i]` table | O(n²) | O(n) | Easy to explain; also gives parents for free |
| Patience piles + binary search | O(n log n) | O(n) | Default for large n |
| LCS with a sorted copy | O(n²) | O(n²) or O(n) | Works for distinct ids; slower |

## Walkthrough

### Easy

The table for `[12, 3, 9, 4, 15, 10, 18, 6]`:

| i | id | smaller earlier ids (their best) | best |
| --- | --- | --- | --- |
| 0 | 12 | none | 1 |
| 1 | 3 | none | 1 |
| 2 | 9 | 3 (1) | 2 |
| 3 | 4 | 3 (1) | 2 |
| 4 | 15 | 12 (1), 3 (1), 9 (2), 4 (2) | 3 |
| 5 | 10 | 3 (1), 9 (2), 4 (2) | 3 |
| 6 | 18 | …, 15 (3), 10 (3) | 4 |
| 7 | 6 | 3 (1), 4 (2) | 3 |

Answer 4. One chain: `3, 9, 15, 18`.

### Medium

Same ids, piles. Tops after each card:

1. `12` → `[12]`
2. `3` → first top ≥ 3 is 12 → `[3]`
3. `9` → none ≥ 9 → `[3, 9]`
4. `4` → first ≥ 4 is 9 → `[3, 4]`
5. `15` → new pile → `[3, 4, 15]`
6. `10` → replaces 15 → `[3, 4, 10]`
7. `18` → new pile → `[3, 4, 10, 18]`
8. `6` → replaces 10 → `[3, 4, 6, 18]`

Four piles. Note the final tops `3, 4, 6, 18` are not a real subsequence: `6` arrived after `18`. The length is right; the contents are bookkeeping.

### Hard

"Return an actual chain, not just its length." Store indices instead of values in `tops`, plus `parent[i]` = the index that was on top of the previous pile when `i` was placed. After the scan, start from the last pile's top and follow parents. For these ids that walk gives `18 ← 10 ← 4 ← 3`, so `[3, 4, 10, 18]`, which is a valid chain of length 4.

"Image frames are `[width, height]`, and one fits inside another only if both sides are strictly smaller. How many can you nest?" Sort by width ascending and, for equal widths, by height **descending**, then run LIS on the heights. The descending tie-break stops two frames of the same width from chaining.

**Try it:** what does `longestRising` return for `[5, 1, 6, 2, 7, 3, 8]`, and which top does `3` replace? (Tops go `[5] → [1] → [1, 6] → [1, 2] → [1, 2, 7] → [1, 2, 3] → [1, 2, 3, 8]`. The answer is 4, and `3` replaces `7`.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Treating it as a contiguous run | Answers 2 (a run like `3, 9`) instead of 4 | Subsequence may skip |
| Returning `best[n − 1]` | That is the chain ending at the last id, not the best overall | `max` over all `best[i]` |
| Upper bound instead of lower bound | Counts ties as rising: `[7, 7, 7]` gives 3 | First top **≥** id for strict |
| Printing `tops` as the answer | Not a valid subsequence | Parent links if they want the chain |
| `Math.max(...best)` on `[]` | `-Infinity` | Seed with `0`, or guard empty |

## Interview moves

- Define `best[i]` as "longest chain **ending at** i" in one sentence; that phrase is what the interviewer is listening for.
- Write the O(n²) version first unless n is clearly large, then offer the upgrade.
- When you introduce `tops`, state its invariant ("smallest possible tail per length, sorted") and why sorted lets you binary search.
- Volunteer that `tops` is not the subsequence before they ask.

## Cross-links

- [Reuse the last few answers](../../patterns/dp-1d.md) (id: dp-1d)
- [Binary search the feasible number](../../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Fewest edits from a typo to a command](../typo-distance/lesson.md) (id: typo-distance)
- [Choose a maximum sum without adjacent items](../skip-bay/lesson.md) (id: skip-bay)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
