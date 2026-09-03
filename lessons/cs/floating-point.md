---
id: floating-point
title: Floats are scientific notation, not decimals
slug: floating-point
kind: concept
track: cs
difficulty: intro
estimated_minutes: 12
summary: IEEE-754 floats store a sign, a power of two, and a short mantissa; most decimals never land exactly, and money should not live there.
tags:
  - cs
  - cs/complexity
  - interviews/leetcode
prerequisites: []
related:
  - encoding-unicode
  - big-o
  - hashing-internals
company_signal:
  - name: Stripe
    evidence: Payments screens and take-homes still ding candidates who store currency in float or compare totals with `===`.
    year: 2026
    confidence: medium
sources_consulted:
  - IEEE-754 binary64 layout as taught in intro architecture / numerical courses
  - JS number (IEEE-754, 2^53-1 safe integer) language notes
  - Classic 0.1 + 0.2 interview warmup threads
updated: 2026-09-02
status: canonical
---

# Floats are scientific notation, not decimals

## Snapshot

- A typical `number` in JS/TS is IEEE-754 **binary64**: 1 sign bit, 11 exponent bits, 52 mantissa bits (plus an implicit 1).
- It represents values of the form ±(1.mantissa) × 2^(exponent). Fractions that are not dyadic (1/2, 1/4, 1/8, …) cannot be exact.
- `0.1 + 0.2 !== 0.3`. That is the format, not a broken VM.
- Integers are exact only up to 2^53 − 1. Past that, IDs start aliasing.

## Why it shows up in interviews

They are checking whether you will put money, scores, or snowflake IDs in a float. They also check whether you know `NaN !== NaN` and why a sort comparator that subtracts floats is a landmine. A 90-second answer names the bits, names the trap, names the alternative (integer cents, decimal type, string IDs).

## Core idea

Write 13 as 1.101 × 2^3 if you only have binary digits. Now try to write 0.1. There is no finite binary expansion, so the stored value is the *nearest* 52-bit approximation. Adding two approximations does not cancel the error.

```
0.1  →  0.0001100110011... repeating in binary
      stored as a rounded 52-bit slice
```

Special values: `+Inf`, `-Inf`, `NaN` (failed math), and **two zeros** (`+0` and `-0`) that compare equal but divide into different infinities.

Never use `===` on computed floats. Compare with a tolerance *relative to magnitude*, or better, do not use floats for that domain.

## Worked example

Three diners split a $10 tab stored as dollars.

```ts
const share = 10.0 / 3.0;           // 3.333... not 3.33
const back = share + share + share; // not exactly 10

function nearlyEqual(a: number, b: number, eps = 1e-9): boolean {
  return Math.abs(a - b) <= eps * Math.max(1, Math.abs(a), Math.abs(b));
}

function cents(dollars: number): number {
  return Math.round(dollars * 100); // still a trap if dollars was already dirty
}

console.log(share, back, nearlyEqual(back, 10), cents(share));

```

| Job | Use | Avoid |
| --- | --- | --- |
| Money, inventory counts | Integer cents / DECIMAL | `number` dollars |
| Graphics, physics, ML | Float / SIMD | Exact equality |
| IDs past 2^53 | String or bigint | JSON numbers in JS |
| Loop `x += 0.1` until 1 | Integer loop, scale later | Float counter |

JSON has one number type. A 64-bit order ID through `JSON.parse` in JS is already rounded. Send it as a string.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| `if (sum === 0.3)` | Randomly false | Epsilon, or integer math |
| Float as a map key | `0.1 + 0.2` misses `0.3` | Canonicalize or don't |
| `NaN` checks with `===` | Always false | `Number.isNaN` |
| Sorting by `a - b` on floats | Overflow / NaN wrecks order | Comparator with defined NaN policy |
| Accumulating millions of tiny values | Rounding bias | Kahan, or higher precision |

## How to talk about it

"Floats are binary scientific notation with a short mantissa. I will not store money there; I will store integer cents. I will not compare computed floats with equality. If they hand me JS, I will also refuse to put 64-bit IDs in `number` because 2^53 is the last safe integer."

If they ask why `Math.round(1.005 * 100)` is ugly: "1.005 is not exact in binary, so it may already be 1.004999… before you round. Scale at the boundary, or use a decimal library."

## Cross-links

- [Bytes are not characters](./encoding-unicode.md) (id: encoding-unicode)
- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum)
- [Indexes are precomputed answers](./indexes.md) (id: indexes)
