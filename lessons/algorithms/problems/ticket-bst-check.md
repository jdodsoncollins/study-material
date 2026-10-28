---
id: ticket-bst-check
title: Audit a ticket-id search tree
slug: ticket-bst-check
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: A binary search tree is valid only if every node fits the bounds set by all its ancestors, so pass a low and high limit down the recursion.
tags:
  - algorithms
  - algorithms/trees
  - interviews
  - interviews/leetcode
prerequisites:
  - tree-dfs
related:
  - tree-dfs
  - split-point
  - kth-latency
  - binary-search
company_signal: []
sources_consulted:
  - https://algs4.cs.princeton.edu/32bst/
updated: 2026-10-28
status: canonical
---

# Audit a ticket-id search tree

## Snapshot

- Same shape as "validate a binary search tree." Ids are unique, so an equal key anywhere is a violation.
- The rule is about whole subtrees: everything left of a node is smaller, everything right is larger. Comparing a node only to its children is the classic wrong answer.
- Pass `(low, high)` down: going left tightens `high`, going right tightens `low`.
- Equivalent check: an inorder walk must be strictly increasing.

## Prompt

A help-desk service keeps open ticket ids in an in-memory binary search tree. A rebalancing script had a bug, and you need to check the result before the service trusts it again.

Level-order, `null` for a missing child: `[50, 30, 70, 20, 45, 60, 80, null, null, 35, 55]`.

```
          50
        /    \
      30      70
     /  \    /  \
   20   45  60  80
        / \
      35   55
```

Return `false`. 55 is larger than its parent 45, which looks fine, but it sits in 50's left subtree and is larger than 50. Replace 55 with 48 and the tree is valid.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Is this a valid BST?" | Bounds or inorder |
| Constraint involves ancestors, not just the parent | Carry state down the recursion |
| "Find the two swapped nodes" | Inorder; look for the out-of-order pairs |
| Keys can be equal | Ask which side equal keys go on, or whether they are allowed |

## Worked approach

### ELI5

Every ticket inherits a fence from the tickets above it.

1. The root may be any id: the fence is (−∞, +∞).
2. Step left from a node with id x: the fence's top becomes x.
3. Step right from x: the fence's bottom becomes x.
4. Any id outside its fence (or on it) means the tree is broken.

### Syntax

```ts
const low = 45, high = 50;      // fence for 45's right child
console.log(55 > low && 55 < high); // false: 55 is outside
console.log(48 > low && 48 < high); // true
```

### Then the details

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };

function isSearchTree(n: TreeNode | null, low = -Infinity, high = Infinity): boolean {
  if (!n) return true;
  if (n.v <= low || n.v >= high) return false;
  return isSearchTree(n.L, low, n.v) && isSearchTree(n.R, n.v, high);
}

const leaf = (v: number): TreeNode => ({ v, L: null, R: null });
const build = (bad: number): TreeNode => ({
  v: 50,
  L: { v: 30, L: leaf(20), R: { v: 45, L: leaf(35), R: leaf(bad) } },
  R: { v: 70, L: leaf(60), R: leaf(80) },
});
console.log(isSearchTree(build(55))); // false
console.log(isSearchTree(build(48))); // true
console.log(isSearchTree(null));      // true: an empty index is valid
```

The footgun is the sentinel. Seeding bounds with `0` or with the smallest 32-bit int fails when an id equals the sentinel. `-Infinity` and `Infinity` (or `null` meaning "no bound") avoid it.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Bounds recursion | O(n) | O(h) | Stops at the first violation |
| Inorder, compare with previous | O(n) | O(h) | Iterative stack works too |
| Inorder into an array, then check sorted | O(n) | O(n) | Simple but more memory |
| Check each node against its subtree's min and max by rescanning | O(n²) worst case | O(h) | What bounds avoid |

## Walkthrough

### Easy

`[50, 30, 70]`. 30 is in (−∞, 50); 70 is in (50, ∞). Valid.

### Medium

The prompt, depth-first, left before right:

1. 50 in (−∞, ∞). Go left with fence (−∞, 50).
2. 30 fits. 20 in (−∞, 30) fits. 45 in (30, 50) fits.
3. 35 in (30, 45) fits. 55 in (45, 50): 55 ≥ 50. Return false. The right subtree is never visited.

Inorder agrees: `20, 30, 35, 45, 55, 50, ...` drops from 55 to 50.

### Hard

`[20, 10, 30, null, null, 15]`: 15 is the left child of 30, so it passes the local check (15 < 30). Its fence is (20, 30), and 15 ≤ 20. Invalid.

Duplicates: `[10, 10]` and `[10, null, 10]` are both invalid under "ids are unique." If the product instead allows duplicates in the right subtree, a node may equal the bound it inherited by going right but not the one from going left: the test becomes `n.v < low || n.v >= high`. Say so before coding; the two sides are no longer symmetric.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Comparing only with direct children | Accepts the prompt tree | Pass bounds from all ancestors |
| `<` vs `<=` | Duplicates slip through or valid trees fail | Decide the rule for equal keys first |
| Sentinel bounds like 0 or −2³¹ | Wrong when a real id equals the sentinel | `±Infinity`, or null for "none" |
| Inorder with a "previous" that starts at 0 | First negative id fails | Start previous as undefined |
| Building a sorted copy and comparing with `sort()` | O(n log n) and `sort()` on numbers sorts as strings by default | Compare neighbours in the inorder array |

## Interview moves

- Draw the prompt tree and point at 55: "locally fine, globally wrong." That shows you know the trap.
- Say the fence rule in one sentence before coding.
- Ask about equal keys and the value range.
- Offer inorder as the second approach and say why both are O(n).

## Cross-links

- [Visit a subtree before its sibling](../patterns/tree-dfs/lesson.md) (id: tree-dfs)
- [Where two order-id lookups part ways](./split-point/lesson.md) (id: split-point)
- [k-th fastest request in a latency tree](./kth-latency.md) (id: kth-latency)
- [Halve a sorted list until one slot is left](../patterns/binary-search/lesson.md) (id: binary-search)
- [Trees are graphs with a promise](../../cs/trees-graphs.md) (id: trees-graphs)
