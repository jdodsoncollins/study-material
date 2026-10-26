---
id: lru-cache
title: A lookup cache with least-recently-used eviction
slug: lru-cache
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Combine expected constant-time hash lookup with a doubly linked recency list to update and evict entries.
tags:
  - algorithms
  - algorithms/hash-maps
  - algorithms/linked-lists
  - interviews
  - interviews/leetcode
prerequisites:
  - hash-maps
  - arrays-vs-linked-lists
related:
  - hash-maps
  - arrays-vs-linked-lists
  - indexes
  - hashing-internals
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# A lookup cache with least-recently-used eviction

## Snapshot

- Capacity is small. Keys must be readable in O(1) and eviction must be O(1).
- Map: key → node. List: most recent at the head, least recent at the tail.
- `get` and `put` both count as a use. A `put` on an existing key updates the value and refreshes recency.
- An array plus timestamps is O(n) eviction. That fails the interview.

## Prompt

A shopping app caches product locations for the last `capacity` SKUs it looked up. Implement `get(sku)` and `put(sku, bin)`. If the memory is full, drop the SKU that was used least recently. `get` returns the bin or `-1`.

Example capacity 2: put `N-4 → 17`, put `K-11 → 8`, get `N-4` (hit 17), put `CRANE → 3` (evicts `K-11`), get `K-11` (miss).

A cache hit refreshes recency; a miss does not insert a value.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| O(1) get and put with eviction | Map + doubly linked list |
| "least recently used" | Recency order, not insertion order (that is FIFO) |
| Capacity 1 / duplicate puts | Refresh, do not store two nodes |
| Concurrent cache | Different round; lock or sharded maps |

## Worked approach

[evict](viz/evict.md)

### ELI5

Keep two structures synchronized: a map locates a key’s node, and a doubly linked list records recency. A hit moves its node to the front. Adding a new key beyond capacity removes the last real node from both structures. Sentinels make boundary updates uniform.

### Syntax

```ts
const recency = ["N-4","K-11"];
console.log(recency.at(-1)); // K-11: least recent in this example
```

### Then the details

```ts
class Node {
  prev: Node | null = null;
  next: Node | null = null;
  key: string;
  val: number;
  constructor(key: string, val: number) {
    this.key = key;
    this.val = val;
  }
}

class LruCache {
  private map = new Map<string, Node>();
  private head = new Node("", 0);
  private tail = new Node("", 0);
  private cap: number;
  constructor(cap: number) {
    this.cap = cap;
    if (!Number.isInteger(cap) || cap < 0) throw new Error("Invalid capacity");
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

const mem = new LruCache(2);
mem.put("N-4", 17);
mem.put("K-11", 8);
console.log(mem.get("N-4"));  // 17
mem.put("CRANE", 3);
console.log(mem.get("K-11")); // -1 evicted
console.log(mem.get("N-4"));  // 17

```

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Array of pairs, scan for LRU | O(n) per op | O(capacity) | Reject |
| Map + timestamps | O(n) eviction | O(capacity) | Reject |
| Map + doubly linked list | O(1) expected per op | O(capacity) | Default |
| `Map` insertion order (JS) | Depends on implementation; average sublinear access is specified | O(capacity) | Delete and reinsert to refresh order; a list makes the recency operations explicit |

## Walkthrough

Capacity 2.

### Easy

1. `put N-4,17`. List: N-4.

### Medium

2. `put K-11,8`. List: K-11, N-4.
3. `get N-4` → 17. List: N-4, K-11.
4. `put CRANE,3`. Full; evict tail K-11. List: CRANE, N-4.
5. `get K-11` → -1. `get N-4` → 17.

### Hard

At capacity zero, each put immediately evicts its new entry and every get misses. Updating an existing key at positive capacity must change its value and recency without evicting another key. This sample reserves −1 for a miss; use a different result type if −1 is a valid stored value.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Singly linked list | Tail eviction is O(n) | Doubly linked |
| Evicting on update of an existing key | Wrong victim | Update in place, no size change |
| Forgetting to delete the map entry | Ghost keys after eviction | `map.delete(lru.key)` |
| Assuming Map.set refreshes an existing key’s order | Updating a value leaves insertion order unchanged | A Map-based LRU must delete and reinsert a hit or update |

## Interview moves

- Draw two boxes: "index" and "recency list." Point at them while you talk.
- Ask whether `get` on a miss should count as a use (no) and whether capacity can be 0.
- Tie it to production caches: this is the policy, not the distributed cache. Hashing internals and indexes are the next sentences if they steer toward systems.
- If they ask LFU, say "need frequency buckets, not just a recency list."

## Cross-links

- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Contiguous slots versus pointer chasing](../../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Indexes are precomputed answers](../../../cs/indexes.md) (id: indexes)
- [Why a map is "O(1)" until it isn't](../../../cs/hashing-internals.md) (id: hashing-internals)
- [Two speeds, one list](../../patterns/fast-slow-pointers.md) (id: fast-slow-pointers)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
