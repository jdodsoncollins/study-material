---
id: arrays-vs-linked-lists
title: Contiguous slots versus pointer chasing
slug: arrays-vs-linked-lists
kind: concept
track: cs
difficulty: intro
estimated_minutes: 12
summary: Arrays buy random access and cache lines; linked lists buy cheap splices if you already hold the node.
tags:
  - cs
  - cs/data-structures
  - cs/os
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - big-o
  - hashing-internals
  - os-memory
  - two-pointers
company_signal:
  - name: Amazon
    evidence: OA and phone-screen writeups still mix array two-pointer prompts with "reverse a linked list" / cycle detection as default list warmups.
    year: 2026
    confidence: high
sources_consulted:
  - Cache-line and locality notes from systems courses
  - r/leetcode threads contrasting array vs list follow-ups
  - Common list patterns (reverse, merge, cycle) in Blind 75 lists
updated: 2026-09-02
status: canonical
---

# Contiguous slots versus pointer chasing

## Snapshot

- An array is a block of slots. Index `i` is address + `i * width`. That is O(1) random access.
- A linked list is nodes elsewhere in memory, each holding a pointer to the next. Finding the k-th node is O(k).
- Inserting in the *middle of an array* shifts neighbors. Inserting *after a node you already hold* in a list is O(1) pointer swings.
- Real machines make arrays faster than the Big-O table suggests, because a cache line pulls neighbors for free.

## Why it shows up in interviews

They are not asking you to implement `std::vector`. They are asking whether you pick the structure that matches the hot operation: scan, index, splice, or grow.

A common wrong answer: "linked lists are faster at inserts." Faster than *what*, at *which position*, *do you already have the node?*

## Core idea

Layout is the whole plot.

```
array:   [a][b][c][d][e]     index 3 is one multiply-add
list:    a → b → c → d → e   index 3 is three pointer hops
```

Hops miss cache. Scans over arrays hit cache. That is why two-pointer and sliding-window problems are almost always arrays, and why "linked list" problems are really pointer puzzles (reverse, merge, detect a cycle), not performance plays.

## Comparison

A box-office printer holds tonight's ticket stubs.

| Job | Array | Singly linked list |
| --- | --- | --- |
| Read stub #400 | O(1) | O(n) walk from the head |
| Append at the end | O(1) amortized if you doubled capacity | O(1) if you keep a tail pointer, else O(n) |
| Delete the current node | O(n) shift | O(1) if you have the *previous* node |
| Insert at head | O(n) shift | O(1) |
| Locality | Excellent | Poor; nodes scatter |
| Extra memory | Almost none | One pointer per node |

```ts
type Node = { seat: number; next: Node | null };

function seatAt(head: Node | null, index: number): number | null {
  let cur = head;
  for (let i = 0; i < index; i++) {
    if (!cur) return null;
    cur = cur.next;
  }
  return cur ? cur.seat : null;
}
```

That loop is the tax you pay for "flexible inserts." An array would have been `seats[index]`.

## Common mistakes

- Claiming O(1) insert on a list when you only have the head and a target *value* — you still walk O(n) to find the spot.
- Using a list because "it grows." Arrays grow too, by doubling; the amortized append is O(1).
- Forgetting the previous pointer on a singly linked delete. Interviewers love this.
- Ignoring cache: an O(n) array scan often beats an O(n) list scan by a large constant.

## How to talk about it

"If I need the k-th item or a two-pointer scan, I want an array. If the puzzle hands me a node and asks to splice or reverse, I want a list and I will keep a `prev` pointer. I will not pick a list for speed; I pick it because the interface is a node, not an index."

If they follow with "what about a deque?": "A ring buffer / circular array still wins on locality. A list-backed deque wins only if middle splices dominate."

## Cross-links

- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Virtual memory is a lie the CPU believes](./os-memory.md) (id: os-memory)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Two pointers](../algorithms/patterns/two-pointers.md) (id: two-pointers)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum.md) (id: two-sum)
