---
id: reverse-chain
title: Reverse a next-pointer chain
slug: reverse-chain
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: Reverse a singly linked chain in place by swinging each next pointer to the previous node as you walk.
tags:
  - algorithms
  - algorithms/linked-lists
  - interviews
  - interviews/leetcode
prerequisites:
  - arrays-vs-linked-lists
related:
  - arrays-vs-linked-lists
  - aisle-loop
  - lru-cache
  - fast-slow-pointers
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Reverse a next-pointer chain

## Snapshot

- Singly linked nodes. Reverse the `next` pointers so the old tail is the new head.
- Three handles: `prev`, `cur`, `nxt`. Swing `cur.next` to `prev`, then slide all three.
- Recursion works and uses the call stack as `prev`. Iterative is the default on a whiteboard.
- Empty list and single node are already reversed.

## Prompt

A playlist's `next` pointers, head to tail: `4 → 9 → 1 → 7`. Reverse the chain in place. Return the new head. Do not allocate n new nodes.

This is reverse-linked-list. The values are not `1→2→3→4→5`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Reverse a singly linked list | Pointer swing |
| Reverse in groups of k | Same swing, plus group boundaries |
| Doubly linked | Also move `prev`; LRU already does this |
| Reverse a subarray | Two pointers on an array, different lesson |

## Worked approach

### ELI5

Keep the already-reversed prefix in prev and the untouched suffix at cur. Save cur’s next node before redirecting its link. Then move cur into the reversed prefix and continue with the saved suffix.

### Syntax

```ts
const before = [4,9,1,7];
console.log([...before].reverse()); // [7,1,9,4]: target order, not the pointer algorithm
```

### Then the details

```ts
type Node = { val: number; next: Node | null };

function reverse(head: Node | null): Node | null {
  let prev: Node | null = null;
  let cur = head;
  while (cur) {
    const nxt = cur.next;
    cur.next = prev;
    prev = cur;
    cur = nxt;
  }
  return prev;
}

function fromArr(vals: number[]): Node | null {
  let head: Node | null = null;
  for (let i = vals.length - 1; i >= 0; i--) head = { val: vals[i], next: head };
  return head;
}

function toArr(head: Node | null): number[] {
  const out: number[] = [];
  while (head) {
    out.push(head.val);
    head = head.next;
  }
  return out;
}

console.log(toArr(reverse(fromArr([4, 9, 1, 7])))); // [7, 1, 9, 4]
console.log(toArr(reverse(fromArr([5]))));          // [5]
```

Save `nxt` before you overwrite `cur.next`. The input must be an acyclic list. The conversion helpers allocate arrays/nodes for the demonstration; the reverse operation itself uses O(1) auxiliary space.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Iterative swing | O(n) | O(1) | Default |
| Recurse to tail, rewind | O(n) | O(n) stack | Fine if they ask recursion |
| Copy into an array | O(n) | O(n) | Extra storage does not meet the in-place requirement |

## Walkthrough

`4 → 9 → 1 → 7`

[Swing next to prev](viz/swing.md)

### Easy

1. prev=null, cur=4. nxt=9. 4.next=null. prev=4, cur=9.

### Medium

2. nxt=1. 9.next=4. prev=9, cur=1.
3. nxt=7. 1.next=9. prev=1, cur=7.
4. nxt=null. 7.next=1. prev=7, cur=null. Head is 7.

`7 → 1 → 9 → 4`. Old 4.next is null, so it is the tail.

### Hard

Reverse an empty list: prev remains null, which is the new head. Reverse one node: save null, point next to null, and return that node. For a sublist reversal, preserve the links immediately before and after the target range.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Forgetting `nxt` | You orphan the rest of the chain | Save `cur.next` first |
| Returning `cur` | Always null | Return `prev` |
| Cycle from a stale pointer | Infinite walk later | Each node is swung once |
| Recursing without a base case | Stack blowup on empty | Return `head` when it is null or a tail |

## Interview moves

- Draw four boxes and three arrows. Narrate one swing out loud.
- Ask whether they want a new list or in-place.
- k-group reverse is the follow-up. Same three handles, plus a dummy before each group.

## Cross-links

- [Contiguous slots versus pointer chasing](../../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [A next-pointer that loops](../aisle-loop/lesson.md) (id: aisle-loop)
- [A lookup cache with least-recently-used eviction](../lru-cache/lesson.md) (id: lru-cache)
- [Two speeds, one list](../../patterns/fast-slow-pointers.md) (id: fast-slow-pointers)
