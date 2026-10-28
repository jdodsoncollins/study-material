---
id: bit-manipulation
title: Flags packed into one integer
slug: bit-manipulation
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Treat an integer as a row of on/off switches, test and flip them with masks, cancel pairs with xor, and know where JavaScript's 32-bit bitwise rules bite.
tags:
  - algorithms
  - algorithms/bits
  - cs
  - cs/data-structures
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - unpaired-id
  - floating-point
  - hash-maps
  - spare-subsets
company_signal: []
sources_consulted:
  - https://tc39.es/ecma262/#sec-binary-bitwise-operators
  - https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Unsigned_right_shift
  - Henry S. Warren Jr., Hacker's Delight (2nd ed., 2012), chapters 2 and 5 (rightmost-bit tricks, population count)
updated: 2026-10-28
status: canonical
---

# Flags packed into one integer

## Snapshot

- An integer is a row of bits. Bit `i` is worth `2^i`. A **mask** is an integer with exactly the bits you care about turned on.
- Four moves cover most interview code: test `x & m`, set `x | m`, clear `x & ~m`, toggle `x ^ m`.
- Xor cancels pairs: `a ^ a = 0` and `a ^ 0 = a`, in any order. That finds the one unmatched value in linear time and constant space.
- `x & (x - 1)` drops the lowest set bit. Loop it to count bits; test it once to ask "is this a power of two?"
- JavaScript's `& | ^ ~ << >>` work on **32-bit signed** integers. Bit 31 is the sign. Past 32 bits, use `BigInt` or do not use bits.

## Prompt

A shared document stores each role's permissions in one integer:

| Bit | Permission |
| --- | --- |
| 0 | view |
| 1 | comment |
| 2 | edit |
| 3 | share |
| 4 | delete |

The "reviewer" role is `mask = 22` (binary `10110`). Answer, using bit operations only:

1. Which permissions does it have, and how many?
2. Does it have `share`?
3. Return the mask after granting `view` and revoking `edit`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| A small fixed set of yes/no flags (≤ 31 in JS numbers) | One integer replaces a set; compare, store, and copy in O(1) |
| "every element appears twice except one" | Xor everything; pairs cancel |
| "count set bits" / "power of two" | `x & (x - 1)` |
| "all subsets of n ≤ 20 items" | Loop `mask` from `0` to `2^n − 1`; bit `i` means "item i is in" |
| Constant extra space with integer data | Bits may be the only memory you are allowed |
| Ids or values that can exceed 2³¹ | JS bitwise ops will truncate them silently |

## Worked approach

### ELI5

Picture five light switches in a row, rightmost is switch 0. `22` means switches 1, 2, and 4 are on.

1. **Test** a switch: cover every switch except that one (the mask), and look whether any light comes through.
2. **Set**: flip that switch on, leave the others alone.
3. **Clear**: build a mask with every switch on *except* that one, and keep only what both have on.
4. **Count**: repeatedly turn off the rightmost lit switch and count how many times you did it.

### Syntax

```ts
const mask = 0b10110;             // 22
const SHARE = 1 << 3;             // 8
console.log(mask.toString(2));    // "10110"
console.log((mask & SHARE) !== 0); // false: test
console.log(mask | (1 << 0));     // 23: set view
console.log(mask & ~(1 << 2));    // 18: clear edit
console.log(mask ^ (1 << 4));     // 6: toggle delete
```

Compare the test against `0`, not against `true`. `mask & SHARE` is a number, `8` or `0`.

### Then the details

```ts
const NAMES = ["view", "comment", "edit", "share", "delete"];

function describe(mask: number): { names: string[]; count: number } {
  const names = NAMES.filter((_, bit) => (mask & (1 << bit)) !== 0);
  let x = mask >>> 0; // read as unsigned so bit 31 is not a sign problem
  let count = 0;
  while (x !== 0) {
    x &= x - 1; // drop the lowest set bit
    count++;
  }
  return { names, count };
}

function regrant(mask: number): number {
  return (mask | (1 << 0)) & ~(1 << 2);
}

console.log(describe(22)); // { names: ["comment", "edit", "delete"], count: 3 }
console.log(regrant(22));  // 19, binary 10011
console.log(describe(0));  // { names: [], count: 0 }
```

**The JavaScript footguns.** Per the ECMAScript spec, `&`, `|`, `^`, `~`, `<<`, and `>>` convert both operands to 32-bit signed integers (ToInt32) and return a signed result; `>>>` returns an unsigned 32-bit result.

| Expression | Result | Why |
| --- | --- | --- |
| `1 << 31` | `-2147483648` | Bit 31 is the sign bit |
| `(1 << 31) >>> 0` | `2147483648` | `>>> 0` reinterprets as unsigned |
| `1 << 32` | `1` | Shift counts are taken mod 32 |
| `(2 ** 32) >> 0` | `0` | High bits are discarded |
| `(2 ** 31 + 5) >> 0` | `-2147483643` | Wraps into the negative range |
| `~22` | `-23` | `~x` is `-x - 1` in two's complement |
| `5n >>> 1n` | `TypeError` | `BigInt` has no unsigned right shift; use `>>` |

So: keep JS flag masks to bits 0–30 if you want plain positive numbers, read results with `>>> 0` if you use bit 31, and switch to `BigInt` (`1n << 40n`) for wider masks. ECMAScript has `Math.clz32` (count leading zeros) but, as of ES2025, no built-in popcount.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| `Set<string>` of permissions | O(k) to copy or compare | O(k) | Clear, slower, fine for big flag sets |
| One integer mask | O(1) test/set/clear/compare | O(1) | Up to 31 or 32 flags in a JS number |
| Popcount by `x & (x - 1)` | O(set bits) | O(1) | At most 32 iterations for a 32-bit value |
| Popcount by testing every bit | O(width) | O(1) | Simpler; same bound for fixed width |

## Walkthrough

### Easy

`mask = 22 = 10110`.

1. Bit 0: `22 & 1 = 0`. No view.
2. Bit 1: `22 & 2 = 2`. Comment.
3. Bit 2: `22 & 4 = 4`. Edit.
4. Bit 3: `22 & 8 = 0`. No share. That answers question 2.
5. Bit 4: `22 & 16 = 16`. Delete.

Count with the drop-lowest loop: `10110 → 10100 → 10000 → 0`. Three steps, three permissions.

### Medium

Grant view, revoke edit: `22 | 1 = 23 (10111)`, then `23 & ~4`. `~4` is `...11011`, so `10111 & 11011 = 10011 = 19`. Order matters only when the same bit is both set and cleared; here they are different bits.

A diff between two roles is xor: old `22` (`10110`) versus new `19` (`10011`) gives `22 ^ 19 = 5` (`00101`): bits 0 and 2 changed. That is how an audit log can show "view added, edit removed" from two integers.

### Hard

The product adds a 33rd permission. `1 << 32` is `1`, so "permission 32" silently aliases "view". Either store masks as `BigInt` (`1n << 32n`, and use `>>` not `>>>`), split into two 32-bit words, or move to a set of names. Say this out loud before the interviewer finds it.

A second follow-up: "find the one request id with no matching response" is xor-all; see [The one request without a reply](../problems/unpaired-id.md) (id: unpaired-id).

**Try it:** `x & -x` keeps only the lowest set bit. Predict `22 & -22` before running it. (Answer: `2`.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `if (mask & FLAG === FLAG)` | `===` binds tighter than `&`, so this is `mask & true` | Parenthesize: `(mask & FLAG) !== 0` |
| Using bit 31 in JS | Negative numbers in logs and comparisons | `>>> 0` to read unsigned, or stay at bits 0–30 |
| Masks wider than 32 bits | Shift wraps, high bits vanish | `BigInt`, or two words |
| Xor on ids above 2³¹ | ToInt32 truncates them; wrong answer | `BigInt` xor, or a hash set |
| Popcount loop on a negative number without `>>> 0` | Works, but confuses readers | Normalize to unsigned first |
| Using bits when a `Set` is clearer | Unreadable code for no gain | Bits when the flag set is fixed and small, or space is the constraint |

## Interview moves

- State the width: "These are 32-bit signed in JavaScript, so I have 31 safe flags."
- Name each idiom as you write it: "test, set, clear, toggle, drop-lowest."
- When the prompt says "appears twice except one," say "xor cancels pairs" before anything else.
- If you enumerate subsets with masks, say the n limit: 2²⁰ is about a million, 2³⁰ is about a billion.

## Cross-links

- [The one request without a reply](../problems/unpaired-id.md) (id: unpaired-id)
- [Floats are scientific notation, not decimals](../../cs/floating-point.md) (id: floating-point)
- [Every subset of selected items](../problems/spare-subsets/lesson.md) (id: spare-subsets)
- [Hash maps as an index](./hash-maps.md) (id: hash-maps)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
