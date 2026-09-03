---
id: recursion-call-stack
title: Recursion is a stack you didn't allocate
slug: recursion-call-stack
kind: concept
track: cs
difficulty: core
estimated_minutes: 13
summary: Each recursive call pushes a frame; depth is memory, branching is time, and "just recurse" blows up when the graph is not a tree.
tags:
  - cs
  - cs/data-structures
  - cs/os
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - trees-graphs
  - os-memory
  - processes-threads
  - big-o
company_signal:
  - name: Google
    evidence: Tree/backtracking phone screens still ask candidates to name stack depth and to rewrite a recursive walk as an explicit stack when n is large.
    year: 2026
    confidence: high
sources_consulted:
  - Undergrad call-stack / activation-record notes
  - r/leetcode threads on stack-overflow on deep left-skewed trees
  - Language notes that JS/TS does not guarantee tail-call optimization
updated: 2026-09-02
status: canonical
---

# Recursion is a stack you didn't allocate

## Snapshot

- A function call pushes a **frame**: locals, arguments, return address. Return pops it.
- Recursion is that stack growing with your problem, not a different machine.
- Time often follows the *call tree*. Space often follows the *deepest chain* still live.
- JS/TS engines do not promise tail-call optimization. A "tail recursive" loop can still overflow.

## Why it shows up in interviews

Tree, graph, and backtracking prompts are recursion in costume. Interviewers listen for two sentences: what is the base case, and how deep can this go. "This is O(n) space because of the stack" is the line that separates people who drew the frames from people who only wrote the pretty function.

## Core idea

Unbox a nested gift. Each box is a frame.

```
unwrap(box3)
  unwrap(box2)
    unwrap(box1)     ← three frames live at once
      base: empty
```

Depth 3, space O(depth). If each box contains *two* boxes, frames still peak at the depth, but the *number of calls* is ~2^depth. That is why naive Fibonacci is exponential time and linear stack: the tree is fat, the spine is not.

```
fib(5)
  fib(4)  fib(3)
  ... overlapping subtrees, no sharing
```

Memoization collapses the DAG. An explicit stack does the same walk without the language's call limit.

## Worked example

Count folders in a nested crate manifest. Each crate has a name and children.

```ts
type Crate = { name: string; kids: Crate[] };

function count(crate: Crate): number {
  let n = 1;
  for (const kid of crate.kids) n += count(kid);
  return n;
}
```

| Input shape | Time | Extra space (stack) | Risk |
| --- | --- | --- | --- |
| Balanced tree, n nodes | O(n) | O(log n) | Fine |
| Linked-list-shaped tree | O(n) | O(n) | Stack overflow at ~10^4 in many VMs |
| Naive fib(n) | O(φ^n) | O(n) | Time dies first |
| Memo fib(n) | O(n) | O(n) heap + O(n) stack | Stack still O(n) unless you loop |

Iterative rewrite: push crates onto `stack: Crate[]` yourself. Same O(n) time, same O(height) space, but the heap array can be huge and you control it.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| No base case | Infinite recursion | Write the empty-node return first |
| Recursing on a graph without `seen` | Cycle → blow the stack | See [trees-graphs](./trees-graphs.md) (id: trees-graphs) |
| Quoting O(1) space for DFS | You hid O(height) in the call stack | Count frames as memory |
| Trusting tail-call in TypeScript | Overflow on a 20k-long spine | Write a loop |

## How to talk about it

"Recursion is an implicit stack. I'll state the base case, the recursive case, then the depth. For a balanced tree that is log n frames; for a skewed tree it is n, so I might prefer an explicit stack. Time is the size of the call tree, not the size of the source function. If subproblems overlap I memoize; if they don't, I just walk."

If they ask to convert to iteration: "I push a frame object `{ node, state }` onto an array and loop. The `state` field is where I was in the children list — that replaces the return address."

## Cross-links

- [Trees are graphs with a promise](./trees-graphs.md) (id: trees-graphs)
- [Virtual memory is a lie the CPU believes](./os-memory.md) (id: os-memory)
- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
