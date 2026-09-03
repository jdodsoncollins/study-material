---
id: valid-brackets
title: Matched crate tags
slug: valid-brackets
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: Push opening tags onto a stack and pop only when the matching closer arrives; leftover opens or a mismatched pop means the packing is illegal.
tags:
  - algorithms
  - algorithms/stacks
  - algorithms/strings
  - interviews/leetcode
prerequisites:
  - arrays-vs-linked-lists
related:
  - monotonic-stack
  - dfs-backtracking
  - two-pointers
  - lru-cache
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list parentheses-validation as a near-universal easy.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone-screen writeups still use nested-tag validation as a five-minute warmup before a harder stack problem.
    year: 2026
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode stack tagged threads
updated: 2026-09-02
status: canonical
---

# Matched crate tags

## Snapshot

- Three tag pairs: `()`, `[]`, `{}`. They must nest, not just count.
- A stack of unmatched openers is the entire state. Closers only look at the top.
- Counting open vs close is necessary and not sufficient. `([)]` has equal counts and is illegal.
- This is a plain stack, not a monotonic stack. Next-greater is a different lesson.

## Prompt

Packers wrap crates with three strap types. An open strap must close with the same type, and wraps nest. Given a tape of strap marks `tape = "[{()}]()"`, return whether the packing is legal. Empty tape is legal. Any closer with no opener, or a type mismatch, is illegal.

Same shape as bracket validation. The tape is warehouse straps, not a textbook `"()[]{}"`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Nested open/close pairs | Stack |
| Multiple kinds of delimiters | Map closer → opener |
| "generate all valid" | Backtracking, not this problem |
| HTML-like tags with names | Still a stack; the payload is a string, not a char |

## Worked approach

```ts
function strapsOk(tape: string): boolean {
  const match: Record<string, string> = { ")": "(", "]": "[", "}": "{" };
  const stack: string[] = [];
  for (const ch of tape) {
    if (ch === "(" || ch === "[" || ch === "{") {
      stack.push(ch);
      continue;
    }
    const want = match[ch];
    if (!want || stack.pop() !== want) return false;
  }
  return stack.length === 0;
}

console.log(strapsOk("[{()}]()")); // true
console.log(strapsOk("[({)]"));    // false

```

Pop on an empty stack is a mismatch. End of tape with leftovers is a mismatch. Do not special-case even length; `"([)]"` is even and wrong.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Count each pair independently | O(n) | O(1) | Misses interleaving |
| Replace innermost pairs in a loop | O(n²) | O(n) | Correct, slow |
| Stack | O(n) | O(n) | Default |

## Walkthrough

`tape = "[{()}]()"`

1. Push `[`, `{`, `(`.
2. `)` matches `(`. Pop. `{` still on top.
3. `}` matches `{`. Pop. `[` still on top.
4. `]` matches `[`. Stack empty.
5. `(` push, `)` pop. Empty. Legal.

Illegal cousin `"[({)]"`: after `[ { (` the first closer `)` matches, then `]` sees `{` and fails.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Only checking counts | `([)]` passes | Compare types on pop |
| Forgetting leftover opens | `"(["` passes | Require empty stack at end |
| Popping an empty stack | Crash or undefined | Return false when pop misses |
| Treating this as two pointers | Cannot nest arbitrarily | Stack, not L/R indices |

## Interview moves

- Draw the stack for `([)]` unprompted. That one example kills the counter.
- Ask whether only these three pairs exist, and whether extra characters can appear.
- If they ask to *return* the index of the first error, keep the index on the stack, not just the char.
- Generation of valid tapes is the backtracking follow-up; say so and wait.

## Cross-links

- [The next greater is waiting on a stack](../patterns/monotonic-stack.md) (id: monotonic-stack)
- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Squeeze from both ends](../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Scanner memory with eviction](./lru-cache/lesson.md) (id: lru-cache)
- [Arrays versus linked lists](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
