---
id: kth-latency
title: k-th fastest request in a latency tree
slug: kth-latency
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Inorder on a binary search tree visits keys in sorted order, so stop the walk at the k-th node; keep subtree sizes when queries repeat.
tags:
  - algorithms
  - algorithms/trees
  - algorithms/stacks
  - interviews
  - interviews/leetcode
prerequisites:
  - tree-dfs
related:
  - tree-dfs
  - kth-largest
  - ticket-bst-check
  - heaps-top-k
company_signal: []
sources_consulted:
  - https://algs4.cs.princeton.edu/32bst/
updated: 2026-10-28
status: canonical
---

# k-th fastest request in a latency tree

## Snapshot

- Same shape as "k-th smallest element in a BST."
- Inorder visits a BST's keys in increasing order. Count as you go and stop at k.
- Iterative inorder with an explicit stack stops cleanly; it costs O(h + k), not O(n).
- If the tree changes and the question repeats, store each node's subtree size and answer in O(h).

## Prompt

A monitoring agent keeps the latencies (milliseconds) of recent requests in a binary search tree. Level-order, `null` for a missing child: `[42, 17, 88, 8, 30, 61, 95, null, 12, 25]`.

```
            42
         /      \
       17        88
      /  \      /  \
     8    30   61   95
      \   /
      12 25
```

Return the k-th smallest latency (k starts at 1). For `k = 4`, return `25`. If k is outside 1..n, return `null`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "k-th smallest / largest" and the data is a BST | Inorder (or reverse inorder) and stop |
| Same question on an unsorted array | Heap or quickselect: [k-th highest](./kth-largest/lesson.md) |
| Inserts and deletes between queries | Augment nodes with subtree size |
| "Median" of a BST | k = ⌈n/2⌉ with sizes known |

## Worked approach

### ELI5

The tree already knows the sorted order; you just have to read it left to right.

1. Go as far left as you can. That is the fastest request.
2. Each time you "read" a node, count it. When the count hits k, stop.
3. After reading a node, its right subtree comes next, starting again at that subtree's leftmost node.

### Syntax

```ts
const sorted = [8, 12, 17, 25, 30, 42, 61, 88, 95]; // what inorder produces
const k = 4;
console.log(sorted[k - 1]); // 25, but we want it without building this array
```

### Then the details

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };

function kthSmallest(root: TreeNode | null, k: number): number | null {
  const stack: TreeNode[] = [];
  let cur = root;
  let seen = 0;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.L; }
    const n = stack.pop()!;
    seen++;
    if (seen === k) return n.v;
    cur = n.R;
  }
  return null; // k < 1 or k > n
}

const leaf = (v: number): TreeNode => ({ v, L: null, R: null });
const latencies: TreeNode = {
  v: 42,
  L: { v: 17, L: { v: 8, L: null, R: leaf(12) }, R: { v: 30, L: leaf(25), R: null } },
  R: { v: 88, L: leaf(61), R: leaf(95) },
};
console.log(kthSmallest(latencies, 4));  // 25
console.log(kthSmallest(latencies, 9));  // 95
console.log(kthSmallest(latencies, 10)); // null
```

The detail: the early return is the point. Recursion that pushes everything into an array and indexes `[k - 1]` is correct, but it always does O(n) work and O(n) memory.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Full inorder into an array | O(n) | O(n) | Simplest to say first |
| Iterative inorder, stop at k | O(h + k) | O(h) | Default |
| Subtree sizes on each node | O(h) per query | O(n) for the sizes | Keep sizes updated on insert/delete |

## Walkthrough

### Easy

`k = 1`: slide left from 42 to 17 to 8. 8 has no left child, so it is the first node read. Answer 8.

### Medium

`k = 4`:

1. Push 42, 17, 8. Pop 8 (count 1). Go to 8's right child 12.
2. Push 12. Pop 12 (count 2). No right child.
3. Pop 17 (count 3). Go to 30, push 30, slide left, push 25.
4. Pop 25 (count 4). Return 25. Nodes 30, 42, and the whole right side are never read.

### Hard

The agent inserts a latency every second and the dashboard asks for k-th smallest constantly. Store `size` on each node (nodes in its subtree). Sizes here: 42 → 9, 17 → 5, 8 → 2, 30 → 2, 88 → 3, leaves → 1.

At a node, let `left = size(L)`. If `k ≤ left`, go left. If `k = left + 1`, this node is the answer. Otherwise go right with `k − left − 1`.

For `k = 4`: at 42, left size 5 ≥ 4 → go left. At 17, left size 2, `4 > 3` → go right with `k = 1`. At 30, left size 1 ≥ 1 → go left. At 25, left size 0 and `k = 1` → answer 25. Every insert or delete must update sizes along its path, and a balanced tree keeps h near log n.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| k treated as 0-based | Returns the next value up | Confirm 1-based; count from 1 |
| Recursion that keeps going after finding the answer | O(n) every time | Return early, or use the stack version |
| No bounds check on k | Crash or `undefined` | Return null when the walk ends |
| Using reverse inorder for "smallest" | Returns the k-th largest | Left first for smallest, right first for largest |

## Interview moves

- Say "inorder of a BST is sorted" first; it is the whole idea.
- Write the iterative version so the early exit is obvious.
- Ask whether the tree changes between queries. That is the cue for subtree sizes.
- Mention that a balanced tree is what makes O(h) mean O(log n).

## Cross-links

- [Visit a subtree before its sibling](../patterns/tree-dfs/lesson.md) (id: tree-dfs)
- [k-th highest view count](./kth-largest/lesson.md) (id: kth-largest)
- [Audit a ticket-id search tree](./ticket-bst-check.md) (id: ticket-bst-check)
- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Where two order-id lookups part ways](./split-point/lesson.md) (id: split-point)
