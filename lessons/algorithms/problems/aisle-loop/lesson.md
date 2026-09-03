---
id: aisle-loop
title: A forklift looping the same aisle
slug: aisle-loop
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: Walk a linked chain with a slow pointer and a fast pointer; if they meet, the chain loops.
tags:
  - algorithms
  - algorithms/linked-lists
  - algorithms/two-pointers
  - interviews
  - interviews/leetcode
prerequisites:
  - fast-slow-pointers
related:
  - fast-slow-pointers
  - reverse-chain
  - lru-cache
  - two-pointers
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list linked-list cycle detection as the standard fast-slow easy.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone-screen writeups treat tortoise/hare as the follow-up after reverse-list.
    year: 2026
    confidence: medium
sources_consulted:
  - LeetCode Top 100 Liked (Linked List Cycle, 2026)
  - r/leetcode linked-list tagged threads
updated: 2026-09-03
status: canonical
---

# A forklift looping the same aisle

## Snapshot

- A singly linked chain may have a later node pointing at an earlier one. Detect that. You do not have to name the entry yet.
- Slow walks one, fast walks two. If there is a loop they meet. If fast hits null, there is no loop.
- A visited set also works and uses O(n) memory. Fast-slow is the O(1) extra they want.
- Finding the entry node is a second phase: reset one pointer to head, walk both at speed one.

## Prompt

Aisle nodes `3 → 9 → 1 → 4`, and `4.next` points back at `9`. Return whether a forklift following `next` would loop forever. A second chain `5 → 8 → 2` ends at null.

This is cycle detection. The values are bay numbers, not `1→2→3→2`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "does this list loop" | Fast-slow |
| "where does the loop start" | Meet, then walk from head |
| Find the middle | Same speeds, stop when fast hits the end |
| Graph with branches | Not a list; visited set / color |

## Worked approach

```ts
type Node = { val: number; next: Node | null };

function loops(head: Node | null): boolean {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}

const a: Node = { val: 3, next: null };
const b: Node = { val: 9, next: null };
const c: Node = { val: 1, next: null };
const d: Node = { val: 4, next: null };
a.next = b; b.next = c; c.next = d; d.next = b;
const e: Node = { val: 5, next: { val: 8, next: { val: 2, next: null } } };
console.log(loops(a)); // true
console.log(loops(e)); // false
```

Compare nodes by identity, not by `val`. Duplicate bay numbers are allowed.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Hash of seen nodes | O(n) | O(n) | Honest first draft |
| Fast-slow | O(n) | O(1) | Default |

## Walkthrough

`3 → 9 → 1 → 4 ↘ 9`

[Meet inside the loop](viz/meet.md)

1. slow and fast start on 3.
2. slow=9, fast=1.
3. slow=1, fast=9 (4.next is 9).
4. slow=4, fast=4. Meet. Loop.

On `5 → 8 → 2`, fast reaches null after 2. No meet.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Comparing `val` | False cycle on duplicate numbers | `===` on the object |
| Not checking `fast.next` | Crash on the last node | Loop condition is `fast && fast.next` |
| Moving slow twice | They stay in lockstep | One vs two |
| Returning the meet node as the entry | Wrong node | Second phase from head |

## Interview moves

- Draw the four nodes and the back edge. Walk both pointers with your fingers.
- If they want the entry, say Floyd's second phase. Do not start unless they ask.
- A visited set is a valid fallback if they forbid mutating your mental model of two speeds.

## Cross-links

- [Two speeds, one list](../../patterns/fast-slow-pointers.md) (id: fast-slow-pointers)
- [Flip the pallet chain](../reverse-chain/lesson.md) (id: reverse-chain)
- [Scanner memory with eviction](../lru-cache/lesson.md) (id: lru-cache)
- [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers)
