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
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - trees-graphs
  - os-memory
  - processes-threads
  - big-o
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Recursion is a stack you didn't allocate

## Snapshot

- A function call pushes a **frame**: locals, arguments, return address. Return pops it.
- Recursion is that stack growing with your problem, not a different machine.
- Time often follows the *call tree*. Space often follows the *deepest chain* still live.
- Tail-call optimization is not portable across JavaScript runtimes; TypeScript does not add it. A "tail recursive" loop can still overflow.

## Why it shows up in interviews

Tree, graph, and backtracking prompts are recursion in costume. Interviewers listen for two sentences: what is the base case, and how deep can this go. "The stack uses O(height) frames" is the line that separates people who drew the frames from people who only wrote the pretty function.

## Core idea

### ELI5

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

Memoization reuses answers to repeated states; it does not remove the dependency graph or the recursive depth. An explicit stack does the same walk without the language's call limit.

## Worked example

### Easy

Predict how many folders the sample visits: `src`, `app`, `index`, and `lib`, for a total of four.

### Medium

Trace the live calls at `index`: `count(src) → count(app) → count(index)`. There are three frames, although four nodes are visited overall.

### Hard

Replace this tree with a chain of 100,000 folders. The work stays linear, but a recursive implementation may exceed the runtime’s stack limit. Explain how an explicit stack avoids that limit.

Count folders in a nested filesystem tree. Each folder has a name and children.

```ts
type Folder = { name: string; kids: Folder[] };

function count(folder: Folder): number {
  let n = 1;
  for (const kid of folder.kids) n += count(kid);
  return n;
}

const src: Folder = {
  name: "src",
  kids: [
    { name: "app", kids: [{ name: "index", kids: [] }] },
    { name: "lib", kids: [] },
  ],
};
console.log(count(src)); // 4

```

| Input shape | Time | Extra space (stack) | Risk |
| --- | --- | --- | --- |
| Balanced tree, n nodes | O(n) | O(log n) | Fine |
| Linked-list-shaped tree | O(n) | O(n) | Stack limit depends on runtime, frame size, and configuration |
| Naive fib(n) | O(φ^n) | O(n) | Exponential work grows quickly |
| Memo fib(n) | O(n) | O(n) heap + O(n) stack | Stack still O(n) unless you loop |

An explicit stack avoids the language call-stack limit, but its space depends on what it stores. Pushing all children of a general tree can require O(n) pending nodes (consider a root with n−1 children). To retain O(height) traversal state, store one frame per ancestor with the next child index.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| No base case | Infinite recursion | Write the empty-node return first |
| Recursing on a graph without `seen` | Cycle → blow the stack | See [Trees are graphs with a promise](./trees-graphs.md) (id: trees-graphs) |
| Quoting O(1) space for DFS | You hid O(height) in the call stack | Count frames as memory |
| Trusting tail-call in TypeScript | Overflow on a 20k-long spine | Write a loop |

## How to talk about it

"Recursion is an implicit stack. I'll state the base case, the recursive case, then the depth. For a balanced tree that is log n frames; for a skewed tree it is n, so I might prefer an explicit stack. Time is the size of the call tree, not the size of the source function. If subproblems overlap I memoize; if they don't, I just walk."

If they ask to convert to iteration: "I push a frame object `{ node, state }` onto an array and loop. The `state` field is where I was in the children list — that replaces the return address."

## Cross-links

- [Trees are graphs with a promise](./trees-graphs.md) (id: trees-graphs)
- [Virtual addresses, physical pages, and locality](./os-memory.md) (id: os-memory)
- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
