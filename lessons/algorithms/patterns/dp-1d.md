---
id: dp-1d
title: Reuse the last few answers
slug: dp-1d
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: When a subproblem depends on a prefix of the input, store one number per prefix instead of recomputing the tree.
tags:
  - algorithms
  - algorithms/dynamic-programming
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - coin-change
  - dp-2d
  - binary-search-on-answer
  - dfs-backtracking
company_signal:
  - name: Amazon
    evidence: Candidate OA reports keep listing house-robber / climb-stairs / coin-change as the 1D DP cluster.
    year: 2026
    confidence: high
  - name: Google
    evidence: Phone-screen writeups describe "min cost to reach n" style recurrences as a common medium.
    year: 2026
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode 1D DP tagged threads
updated: 2026-09-02
status: canonical
---

# Reuse the last few answers

## Snapshot

- Define `dp[i]` in one sentence: the best answer using the first i items, or to reach position i.
- The recurrence must look only at earlier cells. If it looks at later cells, you have the fill order wrong.
- Most 1D DPs collapse to a handful of rolling variables. Keep the array first; compress after it is correct.
- Greedy is not 1D DP. If a local choice can poison a later one, you need the table.

## Prompt

A vending hopper takes tokens of values `tokens = [1, 6, 10]`. A rider needs fare `amount = 12`. Return the fewest tokens that sum to 12, or -1 if impossible. Order does not matter; unlimited supply of each token.

This is unbounded knapsack / coin change, told as a tram fare box.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "fewest / number of ways to make amount n" | `dp[x]` from smaller amounts |
| "max profit with no two adjacent" | `dp[i] = max(dp[i-1], dp[i-2] + a[i])` |
| "reach step n, 1 or 2 at a time" | Fibonacci in a hat |
| Two changing dimensions (index *and* budget) | That is 2D. Do not fake it with one array unless you know the fill direction |

## Worked approach

`dp[x]` = fewest tokens to make x. `dp[0] = 0`. For each amount, try each token that fits.

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

console.log(fewestTokens([1, 6, 10], 12)); // 2  (6+6, not 10+1+1)
console.log(fewestTokens([6, 10], 5));     // -1

```

Loop amount in the outer position for "number of tokens." If you need *combinations not permutations*, loop tokens outside and amounts inside so each token is considered once per amount.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Recurse on remaining fare | Exponential | O(amount) stack | Need a memo to survive |
| 1D table | O(amount · tokens) | O(amount) | Default |
| Greedy biggest token | O(tokens log) | O(1) | Wrong for `[1,6,10]` and 12 |

## Walkthrough

`tokens = [1, 6, 10]`, `amount = 12`

1. `dp[0] = 0`.
2. `dp[1]..dp[5]` all 1,2,3,4,5 using ones.
3. `dp[6] = min(6 ones, 1 six) = 1`.
4. `dp[10] = 1` via the 10. `dp[11] = 2`, `dp[12] = min(dp[11]+1, dp[6]+1, dp[2]+1) = 2` (two sixes).

Greedy would take 10 + 1 + 1 and answer 3. The table beats it.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Leaving `Infinity` in the answer | `Infinity` leaks to the caller | Map non-finite to -1 |
| Greedy on canonical coin systems | Works on US coins, fails here | Table unless they prove canonical |
| Off-by-one array of size `amount` | Cannot store `dp[amount]` | Size `amount + 1` |
| Mixing "ways" and "fewest" | Counts instead of min | Separate recurrences |

## Interview moves

- Speak the cell: "dp[x] is the fewest tokens to make fare x."
- Show a greedy counterexample before they ask why you did not take the 10.
- If they add "print one actual combination," keep a `prev[x]` parent pointer.
- Mention rolling variables for the adjacent-only cousin, not for coin change.

## Cross-links

- [Fewest tokens for a fare](../problems/coin-change.md) (id: coin-change)
- [Fill a grid of overlapping subproblems](./dp-2d.md) (id: dp-2d)
- [Binary search the feasible number](./binary-search-on-answer.md) (id: binary-search-on-answer)
- [Explore, undo, try the next branch](./dfs-backtracking.md) (id: dfs-backtracking)
- [Keep only the interesting k](./heaps-top-k.md) (id: heaps-top-k)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
