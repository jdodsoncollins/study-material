---
id: tree-dfs
title: Visit a subtree before its sibling
slug: tree-dfs
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 16
summary: Depth-first tree walks finish one child's whole subtree before the next; where you touch the node (before, between, after) decides what the walk is good for.
tags:
  - algorithms
  - algorithms/trees
  - algorithms/stacks
  - interviews
  - interviews/leetcode
prerequisites:
  - recursion-call-stack
  - trees-graphs
related:
  - bfs
  - briefing-layers
  - dfs-backtracking
  - recursion-call-stack
  - support-flow-depth
  - ticket-bst-check
company_signal: []
sources_consulted:
  - https://algs4.cs.princeton.edu/32bst/
updated: 2026-10-28
status: canonical
---

# Visit a subtree before its sibling

## Snapshot

- Three orders, one skeleton: **pre**order touches a node before its children, **in**order between left and right, **post**order after both.
- Preorder copies or serializes a tree. Inorder on a binary search tree yields sorted keys. Postorder computes anything that needs the children's answers first (height, size, "delete children first").
- Recursion uses the call stack; its depth is the tree's height. A 10,000-node chain can overflow it, so know the explicit-stack version.
- BST property: every key in the left subtree is smaller than the node, every key in the right subtree is larger. It is a promise about whole subtrees, not just children.

## Prompt

A contact picker caches user ids in a binary search tree so it can show them sorted. As a level-order array (`null` for a missing child): `[40, 20, 60, 10, 30, 50, 70]`.

```
        40
       /  \
     20    60
    / \    / \
  10  30  50  70
```

Return the ids in preorder, inorder, and postorder:

- preorder `[40, 20, 10, 30, 60, 50, 70]`
- inorder `[10, 20, 30, 40, 50, 60, 70]`
- postorder `[10, 30, 20, 50, 70, 60, 40]`

Then produce inorder without recursion.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Sorted output from a BST", "k-th smallest", "validate a BST" | Inorder |
| "Copy / save / serialize the tree" | Preorder, with markers for missing children |
| "Height", "size", "is it balanced", "sum of subtree" | Postorder: children answer first |
| "Group by depth", "nearest", "right side view" | Breadth-first, not this: [level by level](../bfs/lesson.md) |
| Tree can be a long chain (n up to 10^5) | Explicit stack, or confirm the recursion limit |

## Worked approach

[Three orders on one tree](viz/orders.md)

### ELI5

Walk around the outside of the tree with your left hand on it, starting at the top.

1. You pass every node three times: on the way down, between its two children, and on the way back up.
2. Write the id the first time you pass: preorder.
3. Write it the second time: inorder.
4. Write it the third time: postorder.

Same walk. Only the moment you write changes.

### Syntax

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };
const leaf = (v: number): TreeNode => ({ v, L: null, R: null });
const root: TreeNode = { v: 20, L: leaf(10), R: leaf(30) };

const out: number[] = [];
function inorder(n: TreeNode | null): void {
  if (!n) return;   // empty subtree: nothing to do
  inorder(n.L);
  out.push(n.v);    // move this line up for preorder, down for postorder
  inorder(n.R);
}
inorder(root);
console.log(out); // [10, 20, 30]
```

### Then the details

All three orders recursively, then inorder with a stack you own. The stack holds "nodes whose left side I am still finishing."

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };
const leaf = (v: number): TreeNode => ({ v, L: null, R: null });
const ids: TreeNode = {
  v: 40,
  L: { v: 20, L: leaf(10), R: leaf(30) },
  R: { v: 60, L: leaf(50), R: leaf(70) },
};

function orders(root: TreeNode | null) {
  const pre: number[] = [], ino: number[] = [], post: number[] = [];
  const walk = (n: TreeNode | null): void => {
    if (!n) return;
    pre.push(n.v);
    walk(n.L);
    ino.push(n.v);
    walk(n.R);
    post.push(n.v);
  };
  walk(root);
  return { pre, ino, post };
}

function inorderIterative(root: TreeNode | null): number[] {
  const out: number[] = [];
  const stack: TreeNode[] = [];
  let cur = root;
  while (cur || stack.length) {
    while (cur) { stack.push(cur); cur = cur.L; } // slide all the way left
    const n = stack.pop()!;
    out.push(n.v);                                // left side done: emit
    cur = n.R;                                    // then do the right subtree
  }
  return out;
}

console.log(orders(ids));
console.log(inorderIterative(ids)); // [10, 20, 30, 40, 50, 60, 70]
console.log(inorderIterative(null)); // []
```

The footgun: a base case that checks children (`if (!n.L && !n.R)`) instead of the node itself. Check `if (!n) return` and every shape, including a node with one child, works.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Recursive pre/in/post | O(n) | O(h) call stack | h is height: log n if balanced, n for a chain |
| Explicit stack | O(n) | O(h) heap memory | No engine recursion limit |
| Morris traversal | O(n) | O(1) extra | Temporarily rewires pointers; mention, rarely required |

## Walkthrough

### Easy

Postorder for the prompt tree. A node is written only after both children report back:

1. 10 has no children → write 10. 30 → write 30. Both children of 20 done → write 20.
2. Same on the right: 50, 70, then 60.
3. Root last: 40. Result `[10, 30, 20, 50, 70, 60, 40]`.

### Medium

Explicit-stack inorder on the same tree:

1. Slide left: push 40, 20, 10. Pop 10, write it. 10 has no right child.
2. Pop 20, write it. Move to 30: push 30, pop 30, write it.
3. Pop 40, write it. Move to 60: slide left, push 60, 50. Pop 50, pop 60, then push and pop 70.
4. Result `[10, 20, 30, 40, 50, 60, 70]`. The stack never held more than 3 nodes: the height.

### Hard

"Is inorder sorted?" is a valid BST test only if keys are unique (or you have a rule for equal keys). Take `[40, 20, 60, 10, 45]`: 45 is the right child of 20. Every parent-child pair passes a local check (45 > 20). But 45 sits in 40's left subtree and 45 > 40, so the tree is not a BST. Inorder exposes it: `[10, 20, 45, 40, 60]` is not increasing. See [ticket-bst-check](../../problems/ticket-bst-check.md).

Chain of 10,000 nodes: the recursive version needs 10,000 frames. Whether that fits depends on the engine and its stack size, so do not promise it. The explicit stack has no such limit.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Checking only parent vs. child for the BST rule | Accepts trees that break the rule deeper down | Pass bounds down, or check inorder is strictly increasing |
| Base case on children instead of the node | One-child nodes crash or get skipped | `if (!n) return` |
| Sharing one output array across calls without resetting | Old results leak into new ones | Create the array inside the function |
| Assuming recursion depth is log n | Skewed trees overflow the stack | Ask about shape; offer the explicit stack |
| Calling it "DFS" without saying which order | Interviewer cannot tell if you know why | Name the order and the reason |

## Interview moves

- Before coding, say which order and why: "I need children's heights first, so postorder."
- Write the null base case first; it is the line that makes every shape work.
- For BST questions, state the full-subtree rule, not the parent-child rule.
- Offer the explicit-stack version when the tree may be deep, and say its space is still O(h).
- If they want levels, switch to breadth-first and say so.

## Cross-links

- [Expand level by level](../bfs/lesson.md) (id: bfs)
- [Shift briefings by depth](../../problems/briefing-layers/lesson.md) (id: briefing-layers)
- [Explore, undo, try the next branch](../dfs-backtracking.md) (id: dfs-backtracking)
- [Recursion is a stack you didn't allocate](../../../cs/recursion-call-stack.md) (id: recursion-call-stack)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Longest chain of support questions](../../problems/support-flow-depth.md) (id: support-flow-depth)
- [Audit a ticket-id search tree](../../problems/ticket-bst-check.md) (id: ticket-bst-check)
- [Where two order-id lookups part ways](../../problems/split-point/lesson.md) (id: split-point)
