---
id: greedy
title: Commit to the safe choice, then prove it
slug: greedy
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Make one locally best choice at a time and never revisit it, but only after an exchange argument shows that choice can start some optimal answer.
tags:
  - algorithms
  - algorithms/greedy
  - algorithms/intervals
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
  - merge-intervals
related:
  - reach-last-page
  - coin-change
  - merge-intervals
  - heaps-top-k
  - dp-1d
company_signal: []
sources_consulted:
  - Kleinberg and Tardos, Algorithm Design (2005), chapter 4 Greedy Algorithms (stays-ahead and exchange arguments)
  - Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms (4th ed., 2022), Greedy Algorithms chapter (activity selection)
updated: 2026-10-28
status: canonical
---

# Commit to the safe choice, then prove it

## Snapshot

- A greedy algorithm makes one choice, keeps it forever, and moves on. No table, no undo.
- It is fast and short. It is also wrong far more often than it looks, so the proof is part of the answer.
- The standard proof is an **exchange argument**: take any optimal answer, swap its first choice for yours, and show it is still valid and no worse.
- If you cannot find a rule that survives the swap, write the DP. A counterexample beats a hunch.

## Prompt

One conference room. Booking requests for tomorrow, as `[start, end)` hours:

```
requests = [[9, 12], [10, 11], [11, 14], [13, 15], [14, 16], [12, 13]]
```

Meetings may run back to back (one ending at 13 and another starting at 13 is fine). Approve as many requests as possible. Return the approved list.

This is the same shape as classic interval scheduling (activity selection). The numbers are original.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "maximum number of non-overlapping" | Earliest finish time is the classic safe choice |
| A sort by one key makes the rest obvious | Greedy usually starts with a sort |
| "can you reach / is it possible" with a running frontier | Track the best frontier so far; see the reach problem |
| Each item has a **value** or **weight** you must sum | Greedy usually breaks; weighted versions need DP |
| Coins, but the set is not the usual 1/5/10/25 | Greedy-by-largest can fail; test small amounts |

## Worked approach

### ELI5

You are the room's calendar clerk.

1. Line up the requests by **when they finish**, earliest first.
2. Approve the first one. The room is now busy until it ends.
3. Walk down the line. If a request starts after the room frees up, approve it and move the "free at" time to its end. Otherwise skip it.
4. Never go back and swap.

Why finish time and not start time or length? Finishing first leaves the most room for everything after. That sentence is the intuition; the exchange argument below is the proof.

### Syntax

```ts
const requests = [[9, 12], [10, 11], [12, 13]];
requests.sort((a, b) => a[1] - b[1]); // by end hour
let freeAt = -Infinity;
console.log(requests, freeAt);
```

One sort and one number of state. That is the whole data structure.

### Then the details

```ts
function mostMeetings(requests: number[][]): number[][] {
  const byEnd = [...requests].sort((a, b) => a[1] - b[1]);
  const kept: number[][] = [];
  let freeAt = -Infinity;
  for (const [start, end] of byEnd) {
    if (start >= freeAt) { // >= because [12, 13) and [13, 15) do not clash
      kept.push([start, end]);
      freeAt = end;
    }
  }
  return kept;
}

console.log(mostMeetings([[9, 12], [10, 11], [11, 14], [13, 15], [14, 16], [12, 13]]));
// [[10, 11], [12, 13], [13, 15]]
console.log(mostMeetings([])); // []
```

**The exchange argument, out loud.** Let `g` be the request that ends earliest. Take any optimal schedule and call its first meeting `o`. Because `g` ends no later than `o`, replace `o` with `g`: every other meeting in that schedule started after `o` ended, so it also starts after `g` ends. Same count, still valid. So some optimal answer begins with `g`. Remove everything that clashes with `g` and repeat the argument on what is left.

The proof is what makes the code correct. Other plausible rules fail it:

| Rule | Counterexample | Greedy gets | Best |
| --- | --- | --- | --- |
| Earliest start | `[0,10], [1,2], [3,4]` | 1 | 2 |
| Shortest meeting | `[1,5], [4,7], [6,10]` | 1 (`[4,7]`) | 2 |
| Earliest end | none; the swap holds | — | — |

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Try every subset | O(2ⁿ · n) | O(n) | Correct baseline for tiny n |
| Sort by end, then scan | O(n log n) | O(n) for the sorted copy | The sort dominates |
| Already sorted by end | O(n) | O(1) extra besides output | Say so if the input arrives sorted |

## Walkthrough

### Easy

Sorted by end: `[10,11]`, `[9,12]`, `[12,13]`, `[11,14]`, `[13,15]`, `[14,16]`.

1. `[10,11]`: room free since forever. Approve. Free at 11.
2. `[9,12]` starts at 9 < 11. Skip.
3. `[12,13]` starts at 12 ≥ 11. Approve. Free at 13.
4. `[11,14]` starts at 11 < 13. Skip.
5. `[13,15]` starts at 13 ≥ 13. Approve. Free at 15.
6. `[14,16]` starts at 14 < 15. Skip.

Three meetings. No four-meeting schedule exists: after any first meeting, the remaining ones overlap too much.

### Medium

Change one rule: the room manager wants the **fewest rooms** that fit *every* request. That is a different greedy: sort by start, keep a min-heap of end times, reuse a room when the earliest-ending one is free. Same family, different proof. See [Keep only the interesting k](./heaps-top-k.md) (id: heaps-top-k) for the heap.

### Hard

Each meeting now has a value (a customer demo is worth 5, a standup 1), and you maximize total value. Earliest-end greedy breaks: `[0,10]` worth 5 versus `[0,2]` and `[3,4]` worth 1 each. Greedy keeps the two small ones (total 2) and drops the demo (5). This is weighted interval scheduling: sort by end, then `best[i] = max(best[i-1], value[i] + best[last compatible])`, which is [Reuse the last few answers](./dp-1d.md) (id: dp-1d).

Coins are the other classic trap. With tokens `[2, 5, 9]` and amount 10, largest-first takes 9 and gets stuck; `5 + 5` works. See [Fewest tokens for a fare](../problems/coin-change/lesson.md) (id: coin-change).

**Try it:** fractional knapsack (you may take part of an item) is greedy by value per unit; 0/1 knapsack is not. Find a two-item example where taking the best ratio first loses in the 0/1 version.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Picking the rule that "feels" right | Earliest start or shortest-first fails on three intervals | Try three-item counterexamples before coding |
| `start > freeAt` instead of `>=` | Back-to-back meetings rejected | Ask whether endpoints are open or closed |
| Sorting the caller's array in place | Caller's data reordered | Copy first, or say you are mutating |
| Using greedy once values are attached | Silent wrong totals | Switch to DP when you sum weights |
| No proof | Interviewer cannot tell luck from understanding | One sentence of exchange argument |

## Interview moves

- Say the brute force, then propose the rule, then **immediately** test it on a tiny adversarial case.
- Name the proof style: "exchange argument: any optimal answer can start with my choice."
- If a counterexample appears, say "greedy is out, this is a DP" and move. That pivot is a strong signal, not a failure.
- Ask whether endpoints touch, whether input is sorted, and whether you return the count or the list.

## Cross-links

- [Can the jumps reach the last page](../problems/reach-last-page.md) (id: reach-last-page)
- [Collapse overlapping ranges](./merge-intervals.md) (id: merge-intervals)
- [Fewest tokens for a fare](../problems/coin-change/lesson.md) (id: coin-change)
- [Keep only the interesting k](./heaps-top-k.md) (id: heaps-top-k)
- [Reuse the last few answers](./dp-1d.md) (id: dp-1d)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
