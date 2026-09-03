---
id: one-trade
title: One buy, one sell on the tape
slug: one-trade
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: Walk the price tape once, keep the cheapest buy so far, and record the best sell minus that buy.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/greedy
  - algorithms/dynamic-programming
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-1d
related:
  - dp-1d
  - two-pointers
  - skip-bay
  - hash-maps
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list single-buy single-sell profit as a default easy after two-sum.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone-screen writeups use one-trade profit as the warmup before cooldown / two-trade variants.
    year: 2026
    confidence: high
sources_consulted:
  - LeetCode Top 100 Liked (Best Time to Buy and Sell Stock, 2026)
  - r/leetcode greedy / DP tagged threads
updated: 2026-09-03
status: canonical
---

# One buy, one sell on the tape

## Snapshot

- Prices in time order. Buy once, sell once, later. Profit is `sell - buy`. If every day is worse, return 0. You may not sell short.
- Nested day-pairs are O(n²). One pass is enough: track the lowest price seen, and the best `price - lowest`.
- This is a 1-D running state, not a window that shrinks. You never throw the lowest away unless a new day is cheaper.
- Two trades, cooldown, or fees are different recurrences. Do not start those until they ask.

## Prompt

Pallet-spot quotes for the shift, dollars: `tape = [9, 3, 8, 1, 6, 4]`. You may buy one lot and sell one lot later. Return the best profit. If the tape only falls, return 0.

This is the one-buy one-sell profit question. The tape is not `[7,1,5,3,6,4]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| One buy, one sell, chronological | Running min |
| "as many trades as you want" | Sum of uphill segments, different problem |
| Cooldown / at most k trades | Extra DP dimensions |
| Need the two indices | Store `buyDay` when you update the min |

## Worked approach

```ts
function oneLot(tape: number[]): number {
  let low = tape[0] ?? 0;
  let best = 0;
  for (let i = 1; i < tape.length; i++) {
    const p = tape[i];
    if (p - low > best) best = p - low;
    if (p < low) low = p;
  }
  return best;
}

console.log(oneLot([9, 3, 8, 1, 6, 4])); // 5
console.log(oneLot([9, 7, 4]));          // 0
```

Update profit before you update `low`, or a same-day buy/sell of 0 slips in. Same-day is allowed and worth 0, so the order only matters for clarity.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested buy/sell days | O(n²) | O(1) | Easy to write, dies at 10^5 |
| Running min | O(n) | O(1) | Default |
| Kadane on diffs | O(n) | O(1) | Same math, heavier to explain |

## Walkthrough

`tape = [9, 3, 8, 1, 6, 4]`

[Track the cheapest buy](viz/low.md)

1. low=9, best=0.
2. 3 is cheaper. low=3. Profit still 0.
3. 8 - 3 = 5. best=5.
4. 1 is cheaper. low=1. best stays 5.
5. 6 - 1 = 5. Tie. 4 - 1 = 3.

Best is 5: buy at 3, sell at 8, or buy at 1, sell at 6.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Returning a negative | They wanted 0 on a falling tape | `best` starts at 0 |
| Selling before buying | You used a future min | Min is only from the left |
| Two-trade code on a one-trade prompt | Overbuild, bugs | One scalar min |
| Mutating the array into diffs | Harder to recover indices | Keep the raw tape |

## Interview moves

- Say "I will not short, and I will not trade twice" before the loop.
- If they add a second trade, you need two states, not a second min. Sketch `hold1/sold1/hold2/sold2`.
- Binary search does not help. The tape is not sorted.

## Cross-links

- [Reuse the last few answers](../../patterns/dp-1d.md) (id: dp-1d)
- [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Skip a neighboring bay](../skip-bay/lesson.md) (id: skip-bay)
- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
