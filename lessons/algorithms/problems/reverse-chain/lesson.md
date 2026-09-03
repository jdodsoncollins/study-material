---
id: reverse-chain
title: Flip the pallet chain
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
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list reverse-linked-list as a near-universal linked-list easy.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone screens still use in-place reversal as the warmup before k-group reverse.
    year: 2026
    confidence: high
sources_consulted:
  - LeetCode Top 100 Liked (Reverse Linked List, 2026)
  - r/leetcode linked-list tagged threads
updated: 2026-09-03
status: canonical
---

# Flip the pallet chain

## Snapshot

- Singly linked nodes. Reverse the `next` pointers so the old tail is the new head.
- Three handles: `prev`, `cur`, `nxt`. Swing `cur.next` to `prev`, then slide all three.
- Recursion works and uses the call stack as `prev`. Iterative is the default on a whiteboard.
- Empty list and single node are already reversed.

## Prompt

Pallets on a chain, head to tail: `4 → 9 → 1 → 7`. Reverse the chain in place. Return the new head. Do not allocate n new nodes.

This is reverse-linked-list. The values are dock marks, not `1→2→3→4→5`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Reverse a singly linked list | Pointer swing |
| Reverse in groups of k | Same swing, plus group boundaries |
| Doubly linked | Also move `prev`; LRU already does this |
| Reverse a subarray | Two pointers on an array, different lesson |

## Worked approach

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

Save `nxt` before you overwrite `cur.next`. That is the whole trick.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Iterative swing | O(n) | O(1) | Default |
| Recurse to tail, rewind | O(n) | O(n) stack | Fine if they ask recursion |
| Copy into an array | O(n) | O(n) | Correct and they will frown |

## Walkthrough

`4 → 9 → 1 → 7`

[Swing next to prev](viz/swing.md)

1. prev=null, cur=4. nxt=9. 4.next=null. prev=4, cur=9.
2. nxt=1. 9.next=4. prev=9, cur=1.
3. nxt=7. 1.next=9. prev=1, cur=7.
4. nxt=null. 7.next=1. prev=7, cur=null. Head is 7.

`7 → 1 → 9 → 4`. Old 4.next is null, so it is the tail.

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

- [Arrays versus linked lists](../../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [A forklift looping the same aisle](../aisle-loop/lesson.md) (id: aisle-loop)
- [Scanner memory with eviction](../lru-cache/lesson.md) (id: lru-cache)
- [Two speeds, one list](../../patterns/fast-slow-pointers.md) (id: fast-slow-pointers)
