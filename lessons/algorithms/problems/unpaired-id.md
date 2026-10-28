---
id: unpaired-id
title: The one request without a reply
slug: unpaired-id
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: When every id appears exactly twice except one, xor all of them; pairs cancel and the unmatched id is what remains, in O(n) time and O(1) space.
tags:
  - algorithms
  - algorithms/bits
  - algorithms/hash-maps
  - interviews
  - interviews/leetcode
prerequisites:
  - bit-manipulation
related:
  - bit-manipulation
  - hash-maps
  - two-sum
  - group-anagrams
company_signal: []
sources_consulted:
  - https://tc39.es/ecma262/#sec-binary-bitwise-operators
updated: 2026-10-28
status: canonical
---

# The one request without a reply

## Snapshot

- Every id appears exactly twice except one, which appears once. Find that one.
- Xor is its own inverse: `a ^ a = 0`, `a ^ 0 = a`, and order does not matter. Xor every id; each pair cancels.
- O(n) time, O(1) space. A count map is also O(n) but uses O(n) memory.
- In JavaScript, xor converts to 32-bit signed integers. Ids above 2³¹ − 1 need `BigInt` or a map.

## Prompt

A service writes one log line when a request starts and one when its reply is sent. Both lines carry the same request id. After a crash, the merged log ids are:

```
ids = [104, 77, 9, 104, 9]
```

Exactly one request never got a reply, so its id appears once; every other id appears exactly twice. Return the unmatched id. Ids are integers in the 32-bit signed range. Use constant extra space.

This is the same shape as "single number."

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "every element twice except one" | Xor all; pairs cancel |
| "constant extra space" plus integers | Bits, not a map |
| "every element three times except one" | Count each bit position mod 3 instead of xor |
| "two elements appear once" | Xor all, split by one differing bit, xor each group |
| Ids are strings or huge numbers | Map of counts, or `BigInt` xor |

## Worked approach

### ELI5

Imagine a light switch for every bit position. Start with every switch off.

1. For each id, flip the switches that are on in that id.
2. An id that shows up twice flips the same switches twice. Back where they were.
3. The one id that shows up once flips its switches only once.
4. When you finish, the switches that are on spell out the unmatched id.

The order of the log does not matter, because flipping is the same whichever order you do it.

### Syntax

```ts
console.log(104 ^ 104);      // 0: a pair cancels
console.log(77 ^ 0);         // 77: xor with zero changes nothing
console.log(104 ^ 77 ^ 104); // 77: order does not matter
```

### Then the details

```ts
function unpaired(ids: number[]): number {
  let x = 0;
  for (const id of ids) x ^= id;
  return x;
}

console.log(unpaired([104, 77, 9, 104, 9])); // 77
console.log(unpaired([-5, 3, 3]));           // -5: negatives are fine in 32-bit range
console.log(unpaired([0]));                  // 0
```

The footgun is width, not logic. Per ECMAScript, `^` runs ToInt32 on both operands:

```ts
const big = 2 ** 40 + 7;               // a 41-bit id, still a safe integer
console.log(big ^ 0);                  // 7: the high bits are gone
console.log(Number(BigInt(big) ^ 0n)); // 1099511627783: BigInt keeps them
```

If ids can exceed 32 bits, xor them as `BigInt`, or count with a `Map` and return the key whose count is 1.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| For each id, count it in the whole list | O(n²) | O(1) | Baseline |
| Sort, then check neighbors | O(n log n) | O(1) to O(n) by sort | Mutates or copies |
| `Map` of counts | O(n) expected | O(n) | Works for any id type |
| `Set`: add, delete on second sight | O(n) expected | O(n) | Leftover element is the answer |
| Xor all | O(n) | O(1) | Default; 32-bit ids in JS |

## Walkthrough

### Easy

`ids = [104, 77, 9, 104, 9]`. In binary, `104 = 1101000`, `77 = 1001101`, `9 = 0001001`.

1. `0 ^ 104 = 104`.
2. `104 ^ 77 = 37` (`0100101`).
3. `37 ^ 9 = 44` (`0101100`).
4. `44 ^ 104 = 68` (`1000100`). The 104 has cancelled.
5. `68 ^ 9 = 77`. The 9 has cancelled.

Answer `77`. The intermediate values look random; only the final one means anything.

### Medium

Negatives and zero: `[-5, 3, 3]` gives `-5`, and `[0]` gives `0`. The answer can be zero, so do not use `0` as a "not found" sentinel. The contract says exactly one unmatched id exists; if the log might have none, xor would return `0` and you could not tell. Ask.

### Hard

"Two requests lost their replies." Xor everything to get `a ^ b`, which is nonzero because `a ≠ b`. Pick any set bit of it, for example the lowest, `d = (a ^ b) & -(a ^ b)`. Every id has that bit either on or off; `a` and `b` land in different groups and each pair lands together. Xor each group separately. On `[104, 77, 9, 104, 9, 31]` the two unmatched ids are `77` and `31`.

"Every id appears three times except one." Pair cancellation no longer works. Count, for each of the 32 bit positions, how many ids have that bit set, and keep the positions whose count is not a multiple of three. That rebuilds the unmatched id in O(32 · n).

**Try it:** what is `unpaired([12, 12, 12])` and why is it not a valid input? (`12`; the contract says pairs, and three copies is one pair plus one leftover, which xor happens to report anyway.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Ids above 2³¹ − 1 | ToInt32 truncates; wrong answer, no error | `BigInt` xor or a count map |
| Using xor when counts can be 3, 4, … | Even counts cancel, odd counts do not; result is meaningless | Ask what the multiplicities are |
| String ids | `"a" ^ "a"` is `0`, and so is `"a" ^ "b"` | Map of counts |
| Treating `0` as "not found" | An id of 0 is a valid answer | Validate separately if needed |
| Sorting first to "simplify" | O(n log n) and mutation | Xor needs no order |

## Interview moves

- Give the map answer first in one sentence, then say "with constant space, xor, because pairs cancel."
- State the three xor facts: self-inverse, identity with 0, order-free.
- Volunteer the JS 32-bit caveat and the `BigInt` fix.
- Have the two-unmatched follow-up ready; it is the usual next question.

## Cross-links

- [Flags packed into one integer](../patterns/bit-manipulation.md) (id: bit-manipulation)
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](./two-sum/lesson.md) (id: two-sum)
- [Group search tokens by their letters](./group-anagrams/lesson.md) (id: group-anagrams)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
