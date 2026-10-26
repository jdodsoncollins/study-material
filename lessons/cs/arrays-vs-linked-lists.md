---
id: arrays-vs-linked-lists
title: Contiguous slots versus pointer chasing
slug: arrays-vs-linked-lists
kind: concept
track: cs
difficulty: intro
estimated_minutes: 12
summary: Arrays provide indexed access and compact storage; linked lists support local splices when you already have the required node references.
tags:
  - cs
  - cs/data-structures
  - cs/os
  - interviews
  - interviews/leetcode
prerequisites:
  - big-o
related:
  - big-o
  - hashing-internals
  - os-memory
  - reverse-chain
  - aisle-loop
company_signal: []
sources_consulted:
  - https://opendatastructures.org/ods-java/2_Array_Based_Lists.html
  - https://opendatastructures.org/ods-java/3_Linked_Lists.html
updated: 2026-10-26
status: canonical
---

# Contiguous slots versus pointer chasing

## Snapshot

- An array is a block of slots. Index `i` is address + `i * width`. That is O(1) random access.
- A linked list is nodes elsewhere in memory, each holding a pointer to the next. Finding the k-th node is O(k).
- Inserting in the *middle of an array* shifts neighbors. Inserting *after a node you already hold* in a list is O(1) pointer swings.
- Contiguous storage often helps scans reuse cache lines. Actual speed also depends on element layout, allocation, and the workload.

## Why it shows up in interviews

Choosing between these structures means identifying the frequent operation: scan, index, splice, or grow. State what references the caller already has before comparing costs.

A common wrong answer: "linked lists are faster at inserts." Faster than *what*, at *which position*, *do you already have the node?*

## Core idea

### ELI5

An array is a row of lockers, numbered. Locker 3 is "start + 3 × width." You walk straight to it.

A linked list is a scavenger hunt. Each envelope has a note saying where the next envelope lives. To get the fourth envelope you follow three notes.

Inserting in the *middle of the lockers* means sliding everyone down. Inserting *after an envelope you are already holding* is two note rewrites.

```
array:   [a][b][c][d][e]     index 3 is one multiply-add
list:    a → b → c → d → e   index 3 is three pointer hops
```

A contiguous scan can reuse nearby data; following scattered pointers can require more memory loads. Neither guarantees a cache hit or miss. This is a model of fixed-width arrays and linked nodes: JavaScript `Array` does not promise a particular physical representation.

### Predict before reading the table

A playlist contains 400 tracks. You have its array, or only the head of its linked list. Which representation can reach index 399 without visiting the preceding tracks? Now change the task: insert after a node you already hold. Explain why that changes the answer.

## Comparison

Assume `n` items, fixed-size values or references, and a dynamic array that grows geometrically. Costs below exclude locating a node unless stated.

| Job | Array | Singly linked list |
| --- | --- | --- |
| Read index k | O(1) | O(k + 1), at most O(n), from the head |
| Append at the end | O(1) amortized; a resize can take O(n) | O(1) if you keep a tail pointer, else O(n) |
| Delete the current node | O(n) shift | O(1) with the previous node, or when deleting the head |
| Insert at head | O(n) shift | O(1) |
| Locality | Nearby slots often share cache lines | Depends on allocation; nodes may be scattered |
| Extra memory | Reserved unused capacity in a dynamic array | Next pointer per node, plus allocation overhead |

```ts
type Node = { seat: number; next: Node | null };

function seatAt(head: Node | null, index: number): number | null {
  if (!Number.isInteger(index) || index < 0) return null;
  let cur = head;
  for (let i = 0; i < index; i++) {
    if (!cur) return null;
    cur = cur.next;
  }
  return cur ? cur.seat : null;
}

const head: Node = { seat: 10, next: { seat: 20, next: { seat: 30, next: null } } };
console.log(seatAt(head, 0), seatAt(head, 2), seatAt(head, 9)); // 10 30 null
console.log(seatAt(head, -1), seatAt(null, 0)); // null null

```

The loop follows one link per position. An array lookup would use `seats[index]`; this function uses `null` to report an invalid or missing index.

**Check your understanding:** append one track with only a head pointer, then with both head and tail. The first needs a traversal; the second updates the old tail and the tail reference. Keeping a tail does not make an arbitrary middle lookup constant time.

## Common mistakes

- Claiming O(1) insert on a list when you only have the head and a target *value* — you still walk O(n) to find the spot.
- Using a list because "it grows." Dynamic arrays grow too. Geometric capacity growth supports amortized O(1) append.
- Forgetting the previous pointer when deleting an arbitrary singly linked node while preserving node identities.
- Ignoring cache: an O(n) array scan often beats an O(n) list scan by a large constant.

## How to talk about it

"If I need the k-th item or a two-pointer scan, I want an array. If the puzzle hands me a node and asks to splice or reverse, I want a list and I will keep a `prev` pointer. I will not pick a list for speed; I pick it because the interface is a node, not an index."

If they follow with "what about a deque?": "A ring buffer supports efficient operations at both ends and often has good locality. A linked representation offers different allocation and reference-stability tradeoffs. I would compare the actual operations before choosing."

## Cross-links

- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Virtual addresses, physical pages, and locality](./os-memory.md) (id: os-memory)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
- [Squeeze from both ends](../algorithms/patterns/two-pointers/lesson.md) (id: two-pointers)
- [Pair lookup instead of nested scanning](../algorithms/problems/two-sum/lesson.md) (id: two-sum)
