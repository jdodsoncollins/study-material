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
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-1d
related:
  - dp-1d
  - binary-search-on-answer
  - heaps-top-k
  - dfs-backtracking
company_signal: []
sources_consulted: []
updated: 2026-10-26
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

Assume positive integer token values and a nonnegative integer amount small enough for the table. Duplicate denominations do not change the minimum.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Fewest pieces, unlimited supply | Unbounded knapsack / 1D DP |
| "number of ways" | Different fill; tokens outer for combinations |
| Each token used at most once | 0/1 knapsack; walk capacity backward |
| Denominations like 1,5,10,25 | Greedy happens to work; still show the table unless they insist |

## Worked approach

### ELI5

For every amount x, ask which token could be the final token. If token t fits and x−t is reachable, that choice uses dp[x−t]+1 tokens. Keep the smallest of those choices; leave impossible amounts unreachable.

### Syntax

```ts
const dp = [0,Infinity,1,Infinity,2,1];
console.log(dp[5] + 1); // 2 tokens make 7: 5 + 2
```

### Then the details

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
| Greedy | O(k log k + k), for k denominations | O(1) | Wrong on this set |

## Walkthrough

`tokens = [2, 5, 9]`, `amount = 13`

[Fill the fare table](viz/table.md)

### Easy

1. Even amounts 2,4,6,8,10,12 can be all twos. `dp[2] = 1`, `dp[4] = 2`, …

### Medium

2. `dp[5] = 1`. `dp[7] = dp[5]+1 = 2` (5+2), while twos alone cannot make this odd amount.
3. `dp[9] = 1`. `dp[11] = 2` (9+2). `dp[13] = min(dp[11]+1, dp[8]+1, dp[4]+1) = 3`.

One optimum is 9+2+2. Largest-first happens to work for amount 13, but fails on the same denominations at amount 10: taking 9 leaves an impossible remainder 1, while 5+5 uses two tokens. A strategy must work for every input in the contract, not only the walkthrough.

### Hard

Amount zero needs zero tokens, even with an empty token list. A positive amount with an empty list is unreachable. To return a combination as well as the count, follow saved token choices backward; each step must strictly reduce the amount.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Greedy on a non-canonical set | Wrong fewest | Table, plus a counterexample |
| `dp` sized `amount` | Cannot write `dp[amount]` | Length `amount + 1` |
| Returning `Infinity` | Caller blows up | Convert to -1 |
| Combinations loop order | Counts permutations as distinct | Tokens outer, amounts inner |

## Interview moves

- Give the amount-10 counterexample before choosing DP; a nonstandard denomination set alone is not a proof that greedy fails.
- Speak the cell before the loops.
- Ask whether order matters (no) and whether a token can be reused (yes).
- Binary search on the *count* of tokens is a worse idea here; the predicate is not simpler than the DP. Name that so they know you considered it.

## Cross-links

- [Reuse the last few answers](../../patterns/dp-1d.md) (id: dp-1d)
- [Binary search the feasible number](../../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Keep only the interesting k](../../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Fill a grid of overlapping subproblems](../../patterns/dp-2d.md) (id: dp-2d)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../../strategy/pattern-first-prep.md) (id: pattern-first-prep)
