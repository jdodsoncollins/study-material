---
id: coin-change
title: Fewest tokens for a fare
slug: coin-change
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Fill a one-dimensional table of fewest tokens for each amount so greedy mistakes cannot hide in a local choice.
tags:
  - algorithms
  - algorithms/dynamic-programming
  - interviews/leetcode
prerequisites:
  - dp-1d
related:
  - dp-1d
  - binary-search-on-answer
  - heaps-top-k
  - dfs-backtracking
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list coin-change / fewest-denominations as the standard 1D DP medium.
    year: 2026
    confidence: high
  - name: Google
    evidence: Phone-screen writeups describe unbounded-knapsack fare/coin variants as a common DP ask.
    year: 2025
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode DP tagged threads
updated: 2026-09-02
status: canonical
---

# Fewest tokens for a fare

## Snapshot

- Unlimited supply of each token. Make exact `amount` with the fewest pieces. Impossible → -1.
- Greedy biggest-first is wrong unless the denomination set is proven canonical.
- `dp[x]` is the fewest tokens to make x. `dp[0] = 0`. Take `min` over `dp[x - token] + 1`.
- "Number of combinations" is a sibling recurrence. Do not mix it with "fewest."

## Prompt

A tram hopper accepts tokens `tokens = [2, 5, 9]`. A rider owes `amount = 13`. Tokens may be reused. Return the fewest tokens that total 13, or -1 if the hopper cannot make that fare.

This is coin change, told as a fare box. The set is not US coins, on purpose.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Fewest pieces, unlimited supply | Unbounded knapsack / 1D DP |
| "number of ways" | Different fill; tokens outer for combinations |
| Each token used at most once | 0/1 knapsack; walk capacity backward |
| Denominations like 1,5,10,25 | Greedy happens to work; still show the table unless they insist |

## Worked approach

```ts
function fewestTokens(tokens: number[], amount: number): number {
  const dp = Array(amount + 1).fill(Infinity);
  dp[0] = 0;
  for (let x = 1; x <= amount; x++) {
    for (const t of tokens) {
      if (t <= x) dp[x] = Math.min(dp[x], dp[x - t] + 1);
    }
  }
  return Number.isFinite(dp[amount]) ? dp[amount] : -1;
}

console.log(fewestTokens([2, 5, 9], 13)); // 3  (9+2+2)
console.log(fewestTokens([2, 5, 9], 1));  // -1

```

If they also want one actual combination, keep `pick[x] = t` whenever you improve `dp[x]`, then walk back from `amount`.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Recurse remaining fare | Exponential | O(amount / min token) | Memo turns it into the table |
| 1D DP | O(amount · tokens) | O(amount) | Default |
| Greedy | O(tokens log) | O(1) | Wrong on this set |

## Walkthrough

`tokens = [2, 5, 9]`, `amount = 13`

1. Even amounts 2,4,6,8,10,12 can be all twos. `dp[2] = 1`, `dp[4] = 2`, …
2. `dp[5] = 1`. `dp[7] = dp[5]+1 = 2` (5+2), better than three 2s plus leftover.
3. `dp[9] = 1`. `dp[11] = 2` (9+2). `dp[13] = min(dp[11]+1, dp[8]+1, dp[4]+1) = 3`.

One optimal: 9 + 2 + 2. Greedy 9 + 5 leftover 0? 9+5=14, overshoot. Greedy 9 then 2s also lands on 3. Try amount 10 with `[6, 5, 1]`: greedy 6+1+1+1+1 vs table 5+5. That is the counterexample to say out loud.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Greedy on a non-canonical set | Wrong fewest | Table, plus a counterexample |
| `dp` sized `amount` | Cannot write `dp[amount]` | Length `amount + 1` |
| Returning `Infinity` | Caller blows up | Convert to -1 |
| Combinations loop order | Counts permutations as distinct | Tokens outer, amounts inner |

## Interview moves

- Kill greedy first: "If they were US coins I might greedy. These are not."
- Speak the cell before the loops.
- Ask whether order matters (no) and whether a token can be reused (yes).
- Binary search on the *count* of tokens is a worse idea here; the predicate is not simpler than the DP. Name that so they know you considered it.

## Cross-links

- [Reuse the last few answers](../patterns/dp-1d.md) (id: dp-1d)
- [Binary search the feasible number](../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Fill a grid of overlapping subproblems](../patterns/dp-2d.md) (id: dp-2d)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
