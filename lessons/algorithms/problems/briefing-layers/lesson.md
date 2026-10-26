---
id: briefing-layers
title: Shift briefings by depth
slug: briefing-layers
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Queue the nodes of one depth, drain that whole depth, then the children you enqueued are the next briefing.
tags:
  - algorithms
  - algorithms/trees
  - algorithms/graphs
  - interviews
  - interviews/leetcode
prerequisites:
  - bfs
  - trees-graphs
related:
  - bfs
  - trees-graphs
  - dfs-backtracking
  - number-of-islands
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Shift briefings by depth

## Snapshot

- Binary tree. Return values grouped by depth, left to right, root first.
- BFS with a queue. The trick is to snapshot `queue.length` at the start of a depth so you know how many nodes belong to this briefing.
- DFS with a `depth` argument also works: push into `out[depth]`. BFS is the one they expect you to name.
- Empty tree: `[]`, not `[[]]`.

## Prompt

Org chart of shift leads:

```
      8
     / \
    3   12
   / \  / \
  1  6 10 14
```

Return `[[8], [3, 12], [1, 6, 10, 14]]`.

This is level-order. The values are not `[3,9,20,null,null,15,7]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Group by depth | BFS, or DFS into `out[d]` |
| Zigzag / rightmost only | Same layers, extra reverse or take last |
| Serialize the tree | Still BFS, keep the nulls |
| Inorder / preorder | DFS, not this |

## Worked approach

### ELI5

Process one whole level at a time. Put each node’s value in the current row and its children in a separate next-level list. Replace the queue only after the current level is complete.

### Syntax

```ts
const level = [8], nextLevel = [3,12];
console.log([level,nextLevel]); // two separate depth groups
```

### Then the details

```ts
type Node = { v: number; L: Node | null; R: Node | null };

function briefings(root: Node | null): number[][] {
  if (!root) return [];
  const out: number[][] = [];
  let q: Node[] = [root];
  while (q.length) {
    const n = q.length;
    const row: number[] = [];
    const next: Node[] = [];
    for (let i = 0; i < n; i++) {
      const cur = q[i];
      row.push(cur.v);
      if (cur.L) next.push(cur.L);
      if (cur.R) next.push(cur.R);
    }
    out.push(row);
    q = next;
  }
  return out;
}

const tree: Node = {
  v: 8,
  L: { v: 3, L: { v: 1, L: null, R: null }, R: { v: 6, L: null, R: null } },
  R: { v: 12, L: { v: 10, L: null, R: null }, R: { v: 14, L: null, R: null } },
};
console.log(briefings(tree));
console.log(briefings(null));
```

This implementation separates current-level q from next, which preserves the layer boundary. In a single growing queue, snapshot the current level’s end before adding children.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| BFS by layer | O(n) | O(width) auxiliary + O(n) output | Default |
| DFS into `out[depth]` | O(n) | O(height) auxiliary + O(n) output | Fine if they want recursion |

## Walkthrough

The tree in the prompt.

[Drain one depth](viz/layers.md)

### Easy

1. Queue `[8]`. Row `[8]`. Enqueue 3, 12.

### Medium

2. Queue `[3,12]`. Row `[3,12]`. Enqueue 1, 6, 10, 14.
3. Queue of four leaves. Row `[1,6,10,14]`. Nothing left.

Three briefings.

### Hard

For a chain of nodes, each output row contains one value, and the queue stays small. For a wide final level, queue space grows with that width. An empty tree returns []; repeated values stay in their original positions and are not deduplicated.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| One flat BFS list | You lose the grouping | Fence with `q.length` |
| Returning `[[]]` for empty | Extra empty briefing | Guard `if (!root)` |
| DFS without a depth index | Layers scramble | Push into `out[depth]`, creating the row if needed |
| Enqueueing null children | `null.v` crash, or holes they did not ask for | Check `L`/`R` before push |

## Interview moves

- Draw the three rows before you code.
- Zigzag is "reverse odd rows." Right-side view is "last node in each row."
- If they want a linked-list per layer, the same fence applies.

## Cross-links

- [Expand level by level](../../patterns/bfs/lesson.md) (id: bfs)
- [Trees are graphs with a promise](../../../cs/trees-graphs.md) (id: trees-graphs)
- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Land clusters on a map](../number-of-islands/lesson.md) (id: number-of-islands)
