---
id: split-point
title: Where two order-id lookups part ways
slug: split-point
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: In a binary search tree, the lowest common ancestor of two keys is the first node on the root path whose key lies between them, found in one walk down.
tags:
  - algorithms
  - algorithms/trees
  - algorithms/binary-search
  - interviews
  - interviews/leetcode
prerequisites:
  - tree-dfs
  - ticket-bst-check
related:
  - ticket-bst-check
  - kth-latency
  - tree-dfs
  - binary-search
company_signal: []
sources_consulted:
  - https://algs4.cs.princeton.edu/32bst/
updated: 2026-10-28
status: canonical
---

# Where two order-id lookups part ways

## Snapshot

- Same shape as "lowest common ancestor in a binary search tree."
- Both keys smaller than the node: go left. Both larger: go right. Otherwise this node is the answer.
- "Otherwise" includes the node equalling one of the keys: a node counts as its own ancestor.
- O(h) time, O(1) space iteratively. It never looks at the other subtree.
- In a plain binary tree (no ordering) this shortcut is gone; you need the postorder version.

## Prompt

An order service keeps order ids in a binary search tree. A range query for orders between two ids starts at the deepest node whose subtree holds both, because that is where the two lookups stop sharing a path.

Level-order, `null` for a missing child: `[40, 18, 66, 9, 27, 51, 80, null, null, 22, 33]`.

```
          40
        /    \
      18      66
     /  \    /  \
    9   27  51  80
       /  \
      22  33
```

Both ids are present. Return the split node's id:

- `(22, 33)` → `27`
- `(9, 33)` → `18`
- `(22, 80)` → `40`
- `(27, 33)` → `27`

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Lowest common ancestor" and the tree is a BST | Walk down using comparisons only |
| Same question on a plain binary tree | Postorder: return what each subtree found |
| Many LCA queries on a fixed tree | Precompute (binary lifting, Euler tour); mention only |
| Keys might be missing | Confirm both exist, or verify with two searches first |

## Worked approach

[Walk down until the keys split](viz/fork.md)

### ELI5

Two people look up two order ids, starting together at the root.

1. At each node, each person decides left or right.
2. If both turn the same way, they keep walking together.
3. The first node where they would turn different ways (or where one of them has already arrived) is the split point.

### Syntax

```ts
const node = 27, a = 22, b = 33;
console.log(a < node && b < node); // false: not both left
console.log(a > node && b > node); // false: not both right, so 27 is the split
```

### Then the details

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };

function splitPoint(root: TreeNode | null, a: number, b: number): number | null {
  const lo = Math.min(a, b), hi = Math.max(a, b);
  let cur = root;
  while (cur) {
    if (hi < cur.v) cur = cur.L;       // both smaller
    else if (lo > cur.v) cur = cur.R;  // both larger
    else return cur.v;                 // lo <= cur.v <= hi
  }
  return null; // only reached if the tree is empty or a key is missing
}

const leaf = (v: number): TreeNode => ({ v, L: null, R: null });
const orders: TreeNode = {
  v: 40,
  L: { v: 18, L: leaf(9), R: { v: 27, L: leaf(22), R: leaf(33) } },
  R: { v: 66, L: leaf(51), R: leaf(80) },
};
console.log(splitPoint(orders, 22, 33)); // 27
console.log(splitPoint(orders, 9, 33));  // 18
console.log(splitPoint(orders, 22, 80)); // 40
console.log(splitPoint(orders, 33, 27)); // 27: order of arguments does not matter
```

The detail: normalize to `lo`/`hi` first. Then a single pair of comparisons covers "a left, b right," "b left, a right," and "one of them is this node."

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Iterative BST walk | O(h) | O(1) | Default |
| Recursive BST walk | O(h) | O(h) | Same logic |
| Record both root paths, compare | O(h) | O(h) | Works, more code |
| General binary-tree LCA (postorder) | O(n) | O(h) | Ignores the ordering |

## Walkthrough

### Easy

`(22, 33)`: at 40, both smaller → left. At 18, both larger → right. At 27, 22 ≤ 27 ≤ 33 → answer 27.

### Medium

`(9, 33)`: at 40, both smaller → left. At 18, 9 ≤ 18 ≤ 33 → answer 18. The walk stops at depth 2 and never visits 27.

`(22, 80)`: at 40 already, 22 ≤ 40 ≤ 80 → answer 40, the root.

### Hard

`(27, 33)`: at 40 left, at 18 right, at 27 the low key equals the node → answer 27. The node is its own ancestor. Code that stops only when the two keys turn different ways (a strict `lo < cur.v < hi`) has no rule for this node, and it either keeps walking into a subtree that holds only 33 or never stops.

Follow-up: "the tree is no longer ordered." Then recurse: return the node if it matches a key; otherwise ask both children; if both return something, this node is the split; if one does, pass it up. O(n), because there is no comparison to prune with.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Strict inequalities | Misses the case where one key is the ancestor | `lo <= cur.v <= hi` is the stop |
| Not normalizing `a`, `b` | Half the cases go the wrong way | `lo = min`, `hi = max` |
| Using the general O(n) algorithm on a BST | Correct but ignores the ordering | Say why the BST walk is O(h) |
| Assuming both keys exist | Returns a node for a missing key | Ask; if unsure, verify with two lookups |

## Interview moves

- Ask: "is it a BST, and are both keys guaranteed present?"
- Trace one case where the answer is the root and one where the answer is a key.
- Point out O(h): log n when balanced, n when the tree is a chain.
- Be ready to switch to the plain-tree version and explain the cost change.

## Cross-links

- [Audit a ticket-id search tree](../ticket-bst-check.md) (id: ticket-bst-check)
- [k-th fastest request in a latency tree](../kth-latency.md) (id: kth-latency)
- [Visit a subtree before its sibling](../../patterns/tree-dfs/lesson.md) (id: tree-dfs)
- [Halve a sorted list until one slot is left](../../patterns/binary-search/lesson.md) (id: binary-search)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
