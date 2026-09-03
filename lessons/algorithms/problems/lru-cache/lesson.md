---
id: lru-cache
title: Scanner memory with eviction
slug: lru-cache
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Pair a hash map with a doubly linked list so get and put both move a key to most-recent and evict the tail in constant time.
tags:
  - algorithms
  - algorithms/hash-maps
  - algorithms/linked-lists
  - interviews/leetcode
prerequisites:
  - hash-maps
  - arrays-vs-linked-lists
related:
  - hash-maps
  - arrays-vs-linked-lists
  - indexes
  - hashing-internals
company_signal:
  - name: Amazon
    evidence: Candidate reports list LRU implementation as a recurring OA/phone-screen systems-flavored coding question.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Onsite writeups describe "implement a cache with eviction" as a common design-in-code prompt.
    year: 2026
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode LRU tagged threads
updated: 2026-09-02
status: canonical
---

# Scanner memory with eviction

## Snapshot

- Capacity is small. Keys must be readable in O(1) and eviction must be O(1).
- Map: key → node. List: most recent at the head, least recent at the tail.
- `get` and `put` both count as a use. A `put` on an existing key updates the value and refreshes recency.
- An array plus timestamps is O(n) eviction. That fails the interview.

## Prompt

A handheld scanner remembers the last `capacity` SKUs it looked up, because the radio is slow. Implement `get(sku)` and `put(sku, bin)`. If the memory is full, drop the SKU that was used least recently. `get` returns the bin or `-1`.

Example capacity 2: put `N-4 → 17`, put `K-11 → 8`, get `N-4` (hit 17), put `CRANE → 3` (evicts `K-11`), get `K-11` (miss).

This is LRU cache, told as scanner memory.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| O(1) get and put with eviction | Map + doubly linked list |
| "least recently used" | Recency order, not insertion order (that is FIFO) |
| Capacity 1 / duplicate puts | Refresh, do not store two nodes |
| Concurrent cache | Different round; lock or sharded maps |

## Worked approach

[evict](viz/evict.md)

Sentinel head and tail so unlink never special-cases empty. Move-to-head is unlink then insert after head.

```ts
class Node {
  constructor(
    public key: string,
    public val: number,
    public prev: Node | null = null,
    public next: Node | null = null,
  ) {}
}

class ScannerMem {
  private map = new Map<string, Node>();
  private head = new Node("", 0);
  private tail = new Node("", 0);
  constructor(private cap: number) {
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }
  private unlink(n: Node) {
    n.prev!.next = n.next;
    n.next!.prev = n.prev;
  }
  private toHead(n: Node) {
    n.next = this.head.next;
    n.prev = this.head;
    this.head.next!.prev = n;
    this.head.next = n;
  }
  get(key: string): number {
    const n = this.map.get(key);
    if (!n) return -1;
    this.unlink(n);
    this.toHead(n);
    return n.val;
  }
  put(key: string, val: number) {
    const n = this.map.get(key);
    if (n) {
      n.val = val;
      this.unlink(n);
      this.toHead(n);
      return;
    }
    const fresh = new Node(key, val);
    this.map.set(key, fresh);
    this.toHead(fresh);
    if (this.map.size > this.cap) {
      const lru = this.tail.prev!;
      this.unlink(lru);
      this.map.delete(lru.key);
    }
  }
}
```

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Array of pairs, scan for LRU | O(n) per op | O(capacity) | Reject |
| Map + timestamps | O(n) eviction | O(capacity) | Reject |
| Map + doubly linked list | O(1) per op | O(capacity) | Default |
| `Map` insertion order (JS) | O(1) in practice | O(capacity) | Mention as a language gift; still implement the list |

## Walkthrough

Capacity 2.

1. `put N-4,17`. List: N-4.
2. `put K-11,8`. List: K-11, N-4.
3. `get N-4` → 17. List: N-4, K-11.
4. `put CRANE,3`. Full; evict tail K-11. List: CRANE, N-4.
5. `get K-11` → -1. `get N-4` → 17.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Singly linked list | Tail eviction is O(n) | Doubly linked |
| Evicting on update of an existing key | Wrong victim | Update in place, no size change |
| Forgetting to delete the map entry | Ghost keys after eviction | `map.delete(lru.key)` |
| Using JS `Map` order without saying so | Looks like you skipped the data structure | Implement the list, then mention the language shortcut |

## Interview moves

- Draw two boxes: "index" and "recency list." Point at them while you talk.
- Ask whether `get` on a miss should count as a use (no) and whether capacity can be 0.
- Tie it to production caches: this is the policy, not the distributed cache. Hashing internals and indexes are the next sentences if they steer toward systems.
- If they ask LFU, say "need frequency buckets, not just a recency list."

## Cross-links

- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Arrays versus linked lists](../../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [What an index actually stores](../../../cs/indexes.md) (id: indexes)
- [Hashing internals](../../../cs/hashing-internals.md) (id: hashing-internals)
- [Two speeds, one list](../../patterns/fast-slow-pointers.md) (id: fast-slow-pointers)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
