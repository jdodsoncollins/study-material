---
id: support-flow-depth
title: Longest chain of support questions
slug: support-flow-depth
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 10
summary: A tree's depth is one plus the deeper of its two subtrees; compute it bottom-up with postorder recursion or count layers with a queue.
tags:
  - algorithms
  - algorithms/trees
  - interviews
  - interviews/leetcode
prerequisites:
  - tree-dfs
related:
  - tree-dfs
  - briefing-layers
  - bfs
  - tree-codec
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Longest chain of support questions

## Snapshot

- Same shape as "maximum depth of a binary tree." Depth counts nodes on the longest root-to-leaf path, so a single node has depth 1 and an empty tree 0.
- Postorder: a node's depth needs both children's depths first.
- Breadth-first works too: count how many layers you drain.
- Recursion depth equals tree height. A lopsided flow is a chain, so mention the iterative option.

## Prompt

A help-center bot asks yes/no questions. Each question has an optional "yes" follow-up (left) and "no" follow-up (right). Product wants to know the most questions any user can be asked before reaching an answer.

The flow as a level-order array of question ids, `null` for "no follow-up": `[1, 2, 3, null, 4, 5, 6, null, null, 7]`.

```
        1
      /   \
     2     3
      \   / \
       4 5   6
        /
       7
```

Return `4` (the path 1 → 3 → 5 → 7).

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "Deepest", "longest root-to-leaf", "most steps" in a tree | Height via postorder |
| Answer for a node depends on answers for its children | Postorder recursion |
| "Shallowest leaf" instead | Breadth-first stops at the first leaf; DFS must check both children exist |
| Tree may be a long chain | Iterative BFS or an explicit stack |

## Worked approach

### ELI5

Ask each question card: "how long is the longest chain starting at you?"

1. A missing card answers 0.
2. A card asks its yes-card and its no-card, takes the bigger answer, and adds 1 for itself.
3. The top card's answer is the result.

### Syntax

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };
const n7: TreeNode = { v: 7, L: null, R: null };
const n5: TreeNode = { v: 5, L: n7, R: null };
// depth(5) = 1 + max(depth(7), depth(null)) = 1 + max(1, 0)
console.log(1 + Math.max(1, 0)); // 2
console.log(n5.L === n7);        // true
```

### Then the details

```ts
type TreeNode = { v: number; L: TreeNode | null; R: TreeNode | null };

function depth(n: TreeNode | null): number {
  if (!n) return 0;
  return 1 + Math.max(depth(n.L), depth(n.R));
}

// Layer counting, no recursion.
function depthByLayers(root: TreeNode | null): number {
  let layer = root ? [root] : [];
  let count = 0;
  while (layer.length) {
    count++;
    const next: TreeNode[] = [];
    for (const n of layer) {
      if (n.L) next.push(n.L);
      if (n.R) next.push(n.R);
    }
    layer = next;
  }
  return count;
}

const leaf = (v: number): TreeNode => ({ v, L: null, R: null });
const flow: TreeNode = {
  v: 1,
  L: { v: 2, L: null, R: leaf(4) },
  R: { v: 3, L: { v: 5, L: leaf(7), R: null }, R: leaf(6) },
};
console.log(depth(flow), depthByLayers(flow)); // 4 4
console.log(depth(null), depthByLayers(null)); // 0 0
```

The detail people trip on: depth counts nodes here. Some prompts count edges (a single node has height 0). Ask, then subtract 1 if needed.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Recursive postorder | O(n) | O(h) call stack | h = n for a chain |
| BFS layer count | O(n) | O(width) | No recursion limit |
| Explicit stack of (node, depth) | O(n) | O(h) | Iterative DFS |

## Walkthrough

### Easy

`[9]`: one question. `depth(9) = 1 + max(0, 0) = 1`.

### Medium

The prompt, bottom-up:

1. 4, 7, 6 are leaves: each 1.
2. 2 has only a "no" child 4: `1 + max(0, 1) = 2`.
3. 5 has only a "yes" child 7: `1 + max(1, 0) = 2`.
4. 3: `1 + max(depth 5 = 2, depth 6 = 1) = 3`.
5. 1: `1 + max(2, 3) = 4`.

### Hard

Lopsided flow `[1, null, 2, null, 3, null, 4]`: every question has only a "no" follow-up. Depth 4, and the recursion goes 4 deep. At 100,000 questions that is 100,000 frames, which may exceed the engine's stack. `depthByLayers` handles it with one small array per layer.

Follow-up: "shallowest answer" (minimum depth). A node with one child is not a leaf, so `1 + min(left, right)` is wrong when one side is 0. BFS that stops at the first node with no children is cleanest; for the prompt that is node 4 or 6 at depth 3.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Returning 1 for an empty tree | Off by one everywhere | `if (!n) return 0` |
| Counting edges when they asked for nodes (or reverse) | Off by one | Ask which; state it |
| Copying max-depth logic for min-depth | One-child nodes report 1 | Only true leaves end a path |
| Global counter mutated during recursion | Wrong after the first branch returns | Return values, do not share state |

## Interview moves

- Say "postorder: each node needs both children's answers" before writing.
- Write the two-line recursion, then offer the BFS version in case the tree is deep.
- Trace one node with a single child so the interviewer sees `max(0, x)` is handled.
- If asked for min depth, explain why it is not the mirror image.

## Cross-links

- [Visit a subtree before its sibling](../patterns/tree-dfs/lesson.md) (id: tree-dfs)
- [Shift briefings by depth](./briefing-layers/lesson.md) (id: briefing-layers)
- [Expand level by level](../patterns/bfs/lesson.md) (id: bfs)
- [Save and restore a question tree](./tree-codec.md) (id: tree-codec)
- [Recursion is a stack you didn't allocate](../../cs/recursion-call-stack.md) (id: recursion-call-stack)
