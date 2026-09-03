---
id: trie
title: Prefix trees as a walking index
slug: trie
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Store strings on shared prefix paths so lookup, prefix check, and autocomplete walk character by character.
tags:
  - algorithms
  - algorithms/tries
  - algorithms/strings
  - interviews/leetcode
prerequisites:
  - hash-maps
related:
  - hash-maps
  - dfs-backtracking
  - indexes
  - hashing-internals
company_signal:
  - name: Google
    evidence: Candidate reports treat autocomplete / add-and-search-word as the usual trie prompt.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Tagged-list threads keep prefix-tree implementation questions in OA and phone screens.
    year: 2025
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode trie tagged threads
updated: 2026-09-02
status: canonical
---

# Prefix trees as a walking index

## Snapshot

- Each edge is a character. A node means "this prefix exists." A flag means "this prefix is a complete key."
- Sharing prefixes beats a hash set when the queries are *prefixes*, not full keys.
- Children are a map, or an array of 26 if the alphabet is letters. Do not over-index on Unicode until they ask.
- A trie is an index. Say that. It is the in-memory cousin of a database prefix B-tree.

## Prompt

A parts desk stores SKUs `["BOLT", "BOLT-M8", "BIN", "CRANE"]`. Support `insert(sku)`, `has(sku)` for a full match, and `hasPrefix(p)` for "any SKU starts with p." Then, given a typed prefix `"BOL"`, list the SKUs under it.

This is a trie, told as a warehouse catalog, not a dictionary handout.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "starts with" / autocomplete | Trie, not a hash set |
| "add and search word with dots" | Trie + DFS on children |
| Many strings, shared prefixes | Memory win from sharing |
| Exact lookup only, no prefixes | Hash set is simpler and faster |

## Worked approach

```ts
type Node = { kids: Map<string, Node>; end: boolean };

function newNode(): Node {
  return { kids: new Map(), end: false };
}

class SkuTrie {
  root = newNode();
  insert(sku: string) {
    let n = this.root;
    for (const ch of sku) {
      if (!n.kids.has(ch)) n.kids.set(ch, newNode());
      n = n.kids.get(ch)!;
    }
    n.end = true;
  }
  walk(s: string): Node | null {
    let n: Node | null = this.root;
    for (const ch of s) {
      n = n.kids.get(ch) ?? null;
      if (!n) return null;
    }
    return n;
  }
  has(sku: string) {
    return this.walk(sku)?.end === true;
  }
  hasPrefix(p: string) {
    return this.walk(p) !== null;
  }
}
```

`hasPrefix("BOL")` is true because the walk survives. `has("BOL")` is false unless someone inserted that exact SKU.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Scan every SKU per query | O(n · L) | O(1) extra | Dies with a large catalog |
| Hash set of full keys | O(L) expected exact | O(total chars) | No cheap prefix |
| Trie | O(L) per op | O(total unique prefixes) | Default for prefix |

## Walkthrough

Insert `BOLT`, `BOLT-M8`, `BIN`, `CRANE`.

1. `B → O → L → T (end)`. `BOLT-M8` reuses `BOLT` and extends `- M 8 (end)`.
2. `BIN` shares only `B`, then branches `I → N (end)`.
3. `CRANE` is a disjoint path from the root.
4. `hasPrefix("BOL")` walks B,O,L and stops on a live node. `has("BOL")` sees `end === false`.
5. `has("BIN")` true. `has("CRAN")` false.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Using the prefix node as a hit | `has("BOL")` returns true | Require the `end` flag |
| Storing the full word on every node | Memory blowup | Flag plus a walk, or store words only at ends |
| Forgetting a branch on insert | Later sibling overwrites | Map per node, never a single child char |
| Recursing into missing children on `.` wildcards | Crash | Check `kids.get` before DFS |

## Interview moves

- Ask the alphabet. 26 letters → array. General SKUs → `Map`.
- Distinguish prefix existence from word existence before you write `end`.
- If they want ranked autocomplete, attach counts or a small heap at nodes, and mention a real search index for production.
- For board-word search, the trie prunes DFS: if the current path is not a prefix, stop.

## Cross-links

- [Hash maps as an index](./hash-maps.md) (id: hash-maps)
- [Explore, undo, try the next branch](./dfs-backtracking.md) (id: dfs-backtracking)
- [What an index actually stores](../../cs/indexes.md) (id: indexes)
- [Hashing internals](../../cs/hashing-internals.md) (id: hashing-internals)
- [Grow and shrink a live range](./sliding-window/lesson.md) (id: sliding-window)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
