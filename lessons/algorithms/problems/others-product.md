---
id: others-product
title: Score without each feature, no division
slug: others-product
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: For every position, multiply the product of everything before it by the product of everything after it, using two passes and no division so zeros are safe.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/dynamic-programming
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-1d
related:
  - dp-1d
  - one-trade
  - two-sum
  - in-order-messages
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Score without each feature, no division

## Snapshot

- For each index `i`, return the product of every value **except** `values[i]`.
- Division (`total / values[i]`) breaks on zero and is often banned outright. Do not reach for it.
- `answer[i] = (product of everything left of i) × (product of everything right of i)`. Both sides are running products: yesterday's prefix times one more value.
- Two passes, O(n) time, O(1) extra space if the output array does not count.

## Prompt

A feed-ranking experiment multiplies integer feature boosts into one score. The boosts for one post are:

```
weights = [3, 2, 5, 4]
```

For an ablation report, return, for each feature, the score you would get **without** that feature: the product of all the other weights. Do not use division. Weights may be zero or negative. An empty list returns `[]`.

This is the same shape as "product of array except self."

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "for each i, combine everything except i" | Prefix and suffix aggregates |
| "without division" | The interviewer is steering you off `total / x` |
| Zeros allowed | Division would be wrong or undefined |
| "O(1) extra space besides the output" | Reuse the output array for one of the passes |
| Sum instead of product | Same trick; there `total − x` happens to be fine |

## Worked approach

### ELI5

Line the weights up: `3 2 5 4`.

1. Walk left to right holding a running product, starting at 1. Before you multiply in each weight, write the running product under it. Those are "everything to my left."
2. Walk right to left with a fresh running product, starting at 1. Before you multiply in each weight, multiply it into what you wrote under that weight. Now each slot holds "left × right."

Nobody ever divides, so a zero is just another number.

### Syntax

```ts
const weights = [3, 2, 5, 4];
let before = 1;
const left = weights.map(w => { const out = before; before *= w; return out; });
console.log(left); // [1, 3, 6, 30]: product of everything to the left
```

### Then the details

Write the left products into the output, then fold the right products in on the way back. No second array.

```ts
function othersProduct(weights: number[]): number[] {
  const out: number[] = Array(weights.length).fill(1);
  let before = 1;
  for (let i = 0; i < weights.length; i++) { out[i] = before; before *= weights[i]; }
  let after = 1;
  for (let i = weights.length - 1; i >= 0; i--) { out[i] *= after; after *= weights[i]; }
  return out;
}

console.log(othersProduct([3, 2, 5, 4])); // [40, 60, 24, 30]
console.log(othersProduct([4, 0, 5]));    // [0, 20, 0]
console.log(othersProduct([]));           // []
```

The order inside each loop matters: **write, then multiply**. Multiplying first includes `weights[i]` in its own answer.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| For each i, multiply all others | O(n²) | O(1) extra | Correct baseline |
| Total product, divide by each | O(n) | O(1) | Wrong with zeros; usually disallowed |
| Separate prefix and suffix arrays | O(n) | O(n) extra | Easiest to explain |
| Prefix in output, suffix as a running number | O(n) | O(1) extra | Default answer |

## Walkthrough

### Easy

`weights = [3, 2, 5, 4]`.

Left pass (write, then multiply): `out = [1, 3, 6, 30]`, `before` ends at 120.

Right pass:

1. `i = 3`: `out[3] = 30 × 1 = 30`. `after = 4`.
2. `i = 2`: `out[2] = 6 × 4 = 24`. `after = 20`.
3. `i = 1`: `out[1] = 3 × 20 = 60`. `after = 40`.
4. `i = 0`: `out[0] = 1 × 40 = 40`.

Result `[40, 60, 24, 30]`. Check one: without the 2, `3 × 5 × 4 = 60`.

### Medium

One zero: `[4, 0, 5]`. Left pass `[1, 4, 0]`. Right pass: `out[2] = 0 × 1 = 0`, `after = 5`; `out[1] = 4 × 5 = 20`, `after = 0`; `out[0] = 1 × 0 = 0`. Result `[0, 20, 0]`: only the zero's own slot survives. Two zeros, `[0, 3, 0]`, give `[0, 0, 0]`. Division would have produced `NaN` or `Infinity` here.

### Hard

"Weights can be large." The product of 30 boosts of size 10 is 10³⁰, far past `Number.MAX_SAFE_INTEGER` (about 9 × 10¹⁵). The doubles lose exact digits silently. Options: use `BigInt` if exact integers matter, work in log space (sum of logs) if only ranking matters, or compute modulo a prime if the problem says so. Say which you would pick and why.

A JavaScript detail: `[2, 0, -3]` returns `[0, -6, 0]`, but the first entry is actually `-0` (`0 × -3`). It prints as `0` and `-0 === 0` is true, so it rarely matters; `Object.is` would tell them apart.

**Try it:** what does `othersProduct([7])` return, and why is that the right answer? (`[1]`: the product of no numbers is 1, the empty product.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `total / weights[i]` | Zero weight gives `NaN` or `Infinity` | Prefix and suffix products |
| Multiply then write | Each slot includes its own weight | Write the running product first |
| Initializing the running product to 0 | Everything is 0 | Start at 1, the empty product |
| Counting zeros and special-casing | Works, but more branches to get wrong | The two-pass version needs no special cases |
| Ignoring overflow | Silent precision loss past 2⁵³ | `BigInt`, logs, or a modulus |

## Interview moves

- Say the division answer, then immediately say why it fails on zero. Then say "prefix times suffix."
- Write the left-product array for the example on the board before coding.
- Point out the O(1)-extra-space version reuses the output.
- Bring up overflow yourself if the weights are not small.

## Cross-links

- [Reuse the last few answers](../patterns/dp-1d.md) (id: dp-1d)
- [One buy, one sell on the tape](./one-trade/lesson.md) (id: one-trade)
- [Pair lookup instead of nested scanning](./two-sum/lesson.md) (id: two-sum)
- [Floats are scientific notation, not decimals](../../cs/floating-point.md) (id: floating-point)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
