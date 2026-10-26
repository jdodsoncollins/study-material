---
id: floating-point
title: Floats are scientific notation, not decimals
slug: floating-point
kind: concept
track: cs
difficulty: intro
estimated_minutes: 12
summary: Binary floating point approximates many decimal fractions; choose numeric types, comparison rules, and rounding policies to match the task.
tags:
  - cs
  - cs/complexity
  - interviews
  - interviews/leetcode
prerequisites: []
related:
  - encoding-unicode
  - big-o
  - hashing-internals
company_signal: []
sources_consulted:
  - https://docs.python.org/3/tutorial/floatingpoint.html
  - https://tc39.es/ecma262/multipage/numbers-and-dates.html#sec-number.max_safe_integer
updated: 2026-10-26
status: canonical
---

# Floats are scientific notation, not decimals

## Snapshot

- JavaScript `number` uses IEEE-754 binary64. Normal values have 53 bits of significand precision, including an implicit leading bit; subnormal values use a different encoding.
- Fractions such as 3/8 have finite binary expansions. Fractions such as 1/10 do not, so they are rounded to representable values.
- `0.1 + 0.2 === 0.3` is false. Rounding is deterministic, not random.
- All integers from −(2^53−1) through 2^53−1 are safe integers. Some larger integers are exact, but adjacent integers can collapse to the same `number`.

## Why it shows up in interviews

A numeric representation is part of the problem contract. A price, measurement, and identifier may need different rules. Explain the required precision, range, rounding rule, and comparison before choosing a type.

## Core idea

### ELI5

Think of scientific notation with a fixed number of binary digits. For example, 13 is `1.101 × 2³` in binary. One tenth repeats forever in base two, so a finite format stores an approximation. Arithmetic rounds again when the result needs more precision than the format has.

An exact comparison can be appropriate for safe integers or a deliberately exact result. For approximate measurements, choose tolerances based on the domain and expected error. A universal epsilon cannot decide whether two values are interchangeable for every application.

`NaN` means the result is not a number and is unequal to itself. Infinities and signed zero need explicit handling in algorithms that accept them.

## Worked example

### Easy

Predict `0.1 + 0.2 === 0.3`, then run the sample. The sum is `0.30000000000000004`, so the comparison is false. By contrast, adding three copies of `10 / 3` rounds to exactly 10 in JavaScript. Inexact inputs do not mean every final result differs from the intended value.

### Medium

Split a 1,000-cent bill three ways. Giving everyone 333 cents loses one cent. Divide in integers, then allocate the remainder using a stated rule: the first share gets the extra cent.

```ts
function splitCents(total: number, people: number): number[] {
  if (!Number.isSafeInteger(total) || total < 0 ||
      !Number.isSafeInteger(people) || people < 1) throw new Error("Invalid inputs");
  const base = Math.floor(total / people);
  const remainder = total % people;
  return Array.from({ length: people }, (_, i) => base + (i < remainder ? 1 : 0));
}
function nearlyEqual(a: number, b: number, absTol = 1e-12, relTol = 1e-9): boolean {
  if (a === b) return true;
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
  return Math.abs(a - b) <= Math.max(absTol, relTol * Math.max(Math.abs(a), Math.abs(b)));
}
console.log(0.1 + 0.2 === 0.3); // false
console.log(splitCents(1000, 3), splitCents(2, 3)); // [334,333,333] [1,1,0]
console.log(nearlyEqual(0.1 + 0.2, 0.3), nearlyEqual(Infinity, 1)); // true false
```

The tolerance helper assumes nonnegative, finite tolerance arguments. It is a comparison policy, not a cure for accumulated numerical error. The split function starts with an integer amount; converting an already rounded dollar amount to cents cannot recover lost information.

### Hard

`2 ** 53` is representable, but `2 ** 53 + 1` rounds to the same value. Use strings for large identifiers crossing JSON boundaries, or `bigint` with an explicit serialization format. Ordinary `JSON.stringify` does not serialize bigint values automatically.

| Need | Suitable representation | Check |
| --- | --- | --- |
| Currency in a fixed minor unit | Safe integer cents, bigint, or decimal arithmetic | Currency scale, range, and rounding rule |
| Inventory count | Safe integer number or bigint | Nonnegative values and overflow |
| Physical measurement | Floating point | Units and acceptable error |
| Large opaque identifier | String | Preserve the original digits |

**Try it:** split 1,001 cents among three people before running the function. The answer is `[334,334,333]`; the sum must stay 1,001 and shares differ by at most one cent.

## Common mistakes

- Calling 2^53 the last *safe* integer. `Number.MAX_SAFE_INTEGER` is 2^53−1.
- Rounding every share independently without reconciling the total.
- Treating all exact comparisons as wrong. Decide whether the values should be exact or approximate.
- Rejecting `a - b` as a comparator for finite numbers. It is useful for numeric sorting; define a policy if inputs can include `NaN` or infinities.
- Assuming multiplying a decimal amount by 100 always produces an integer. Parse a specified decimal format or use decimal arithmetic when that boundary must be exact.

## How to talk about it

“I need exact cents here, so I will keep integer minor units within the safe range and allocate any remainder explicitly. For measurements, I would choose a tolerance from the error budget. For large IDs, I preserve digits as strings.”

## Cross-links

- [Bytes are not characters](./encoding-unicode.md) (id: encoding-unicode)
- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum)
- [Indexes are precomputed answers](./indexes.md) (id: indexes)
