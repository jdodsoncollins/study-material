---
id: fast-slow-pointers
title: Two speeds, one list
slug: fast-slow-pointers
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Move two pointers at different speeds to find a cycle, a midpoint, or the k-th node from the end without extra memory.
tags:
  - algorithms
  - algorithms/two-pointers
  - algorithms/linked-lists
  - interviews/leetcode
prerequisites:
  - arrays-vs-linked-lists
  - two-pointers
related:
  - two-pointers
  - arrays-vs-linked-lists
  - lru-cache
  - valid-brackets
company_signal:
  - name: Amazon
    evidence: Linked-list cycle and "middle of the list" variants show up constantly in candidate OA reports.
    year: 2026
    confidence: high
  - name: Microsoft
    evidence: Tagged-list threads still treat tortoise-and-hare list questions as a phone-screen staple.
    year: 2025
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode linked-list cycle threads
updated: 2026-09-02
status: canonical
---

# Two speeds, one list

## Snapshot

- Same list, two pointers, different step sizes. Classic is `slow = slow.next`, `fast = fast.next.next`.
- You get a cycle check, the midpoint, or a node k from the tail, all in O(1) extra memory.
- Arrays can fake this with indices. The interview usually hands you a singly linked list so you cannot jump.
- Fast-slow is not two-ends. Two-ends needs a reverse direction or a known length.

## Prompt

A GPS logger stores pings as a singly linked chain. A buggy firmware sometimes stitches the tail back onto an earlier ping, so the recorder loops forever. Given the head of `Ping` nodes, return whether a loop exists. If it does, also return the ping where the loop begins.

The chain is a trail of dock-gate pings, not the textbook `1 → 2 → 3 → 2`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Singly linked list, O(1) extra space | You cannot store every node |
| "cycle" / "loop" / "repeat visit" | Fast meets slow iff a cycle exists |
| "middle node" / "split in half" | Fast hits null when slow is mid |
| "k-th from the end" | Fast gets a k-step head start, then both walk |

## Worked approach

Send `fast` two hops and `slow` one hop. If they meet, a cycle exists. To find the entrance, reset one pointer to head and walk both one hop at a time; they meet at the entrance.

```ts
type Ping = { id: number; next: Ping | null };

function loopStart(head: Ping | null): Ping | null {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) {
      let seek = head;
      while (seek !== slow) {
        seek = seek!.next;
        slow = slow!.next;
      }
      return slow;
    }
  }
  return null;
}
```

Null-check `fast` and `fast.next` before the double hop. Empty and single-node lists are not cycles unless they self-link.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Store seen nodes in a set | O(n) | O(n) | Fine if they allow memory |
| Fast / slow | O(n) | O(1) | Default interview answer |
| Reverse the list | O(n) | O(1) | Destroys input; does not find the entrance cleanly |

## Walkthrough

Pings `A → B → C → D → E → C` (E stitches back to C).

1. Start both on A.
2. Slow: B, C, D. Fast: C, E, D. Meet at D.
3. Reset seek to A. Walk: seek A/B/C, slow D/E/C. Meet at C.

C is the loop start. Distance from head to entrance equals distance from meeting point to entrance around the cycle.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Advancing fast without checking `.next` | Crash on the last node | `while (fast && fast.next)` |
| Comparing values instead of identity | Duplicate ids look like a cycle | Compare node references |
| Returning the meeting point as the start | Meeting point is usually mid-cycle | Reset one pointer to head |
| Using this on a random-access array | Works, but two-ends or a set is clearer | Pick the pattern that matches access |

## Interview moves

- Ask whether you may mark nodes. If yes, a `visited` flag is simpler; they usually say no.
- Sketch the two-runner race in one sentence: "fast laps slow iff the track is circular."
- For midpoint problems, say what happens on even length (you take the second mid unless they specify).
- Tie it to LRU only as "I still need a real doubly linked list for O(1) unlink," not as a cycle trick.

## Cross-links

- [Squeeze from both ends](./two-pointers.md) (id: two-pointers)
- [Arrays versus linked lists](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Scanner memory with eviction](../problems/lru-cache.md) (id: lru-cache)
- [Matched crate tags](../problems/valid-brackets.md) (id: valid-brackets)
- [Hash maps as an index](./hash-maps.md) (id: hash-maps)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
