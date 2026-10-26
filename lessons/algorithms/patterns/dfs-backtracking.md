---
id: dfs-backtracking
title: Explore, undo, try the next branch
slug: dfs-backtracking
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Walk a decision tree depth-first, pushing a choice onto the path and popping it before the next try.
tags:
  - algorithms
  - algorithms/backtracking
  - algorithms/graphs
  - interviews
  - interviews/leetcode
prerequisites:
  - trees-graphs
related:
  - bfs
  - spare-subsets
  - number-of-islands
  - trie
  - valid-brackets
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Explore, undo, try the next branch

## Snapshot

- DFS on a graph visits nodes. Backtracking DFS on a *decision tree* builds partial answers.
- The three lines that matter: choose, recurse, un-choose. Forget the un-choose and every path shares a mutated array.
- Prune when a partial choice cannot lead to a valid answer. Pruning can reduce work but may leave exponential worst-case growth.
- Use BFS when you need shortest. Use backtracking when you need all valid constructions, or any construction under constraints.

## Prompt

A locker's digit wheels can be set to `digits = [1, 2, 4]`. You must pick a combination of length 2, order matters, no digit reused. List every combination.

Then, on a letter grid, find whether the word `CRANE` can be walked with 4-direction steps, using each cell at most once.

The digits are distinct. The first task enumerates ordered pairs (permutations of length two). The second is board search. Same choose/undo skeleton.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "all combinations / permutations / subsets" | Decision tree, not a greedy scan |
| "word on a board" / "place n queens" | DFS with a visited mark you must undo |
| Constraints that fail early | Prune; do not generate then filter |
| Shortest sequence | Wrong; that is BFS |

## Worked approach

### ELI5

Keep a path array and a used mask. Push, recurse, pop. Copy the path into the answer when it is full.

### Syntax

```ts
const path = [1];
path.push(2);
console.log([...path]); // [1,2]: copy the current answer
path.pop();
console.log(path); // [1]: restore the earlier choice
```

### Then the details

```ts
function lockerPairs(digits: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const used = new Array(digits.length).fill(false);
  const dfs = () => {
    if (path.length === 2) {
      out.push([...path]);
      return;
    }
    for (let i = 0; i < digits.length; i++) {
      if (used[i]) continue;
      used[i] = true;
      path.push(digits[i]);
      dfs();
      path.pop();
      used[i] = false;
    }
  };
  dfs();
  return out;
}

console.log(lockerPairs([1, 2, 4]));

```

Copy with `[...path]`. Pushing `path` itself stores the same array over and over.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| All ordered pairs of distinct input positions | Θ(n²) | Θ(n²) output | The sample produces n(n−1) pairs |
| General backtracking | Depends on the decision tree and output copying | State, recursion depth, and output | No universal polynomial bound |
| BFS of partial states | similar time, more memory | queue of paths | Use only for shortest construction |

## Walkthrough

`digits = [1, 2, 4]`, length 2.

### Easy

1. Pick 1. Branch: 2 → `[1,2]`; 4 → `[1,4]`. Undo 1.

### Medium

2. Pick 2. Branch: `[2,1]`, `[2,4]`.
3. Pick 4. Branch: `[4,1]`, `[4,2]`.

Six pairs. The undo is visible: after `[1,2]` you pop 2, then try 4, then pop 1 before touching 2 as a start.

Board search adds a cell mark: set `floor[r][c] = '#'`, recurse four ways, restore the letter.

### Hard

Change the input to `[1,1,4]`. The sample treats positions as distinct and emits duplicate value pairs. If the contract requires unique value sequences, sort and skip an equal unused sibling at the same decision depth. State which contract you implement.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Not copying the path | Stored entries alias one array and can all end up empty | `[...path]` |
| Not undoing a board mark | Later branches see a destroyed grid | Restore on the way back |
| Sorting-sensitive duplicates skipped wrong | Missing or repeated subsets | Sort first, skip `nums[i] === nums[i-1]` when `i` is a sibling |
| Recursing after a prune fail without return | Extra work, sometimes wrong | Return when the partial is dead |

## Interview moves

- Say the state: "index, path, remaining budget." If you cannot name the state, you cannot code it.
- Estimate the tree size before they ask. `P(3,2) = 6` is a better opener than silence.
- Ask whether order matters and whether duplicates in the input should collapse.
- If they then ask for the *count* only, mention DP on bitmasks as a follow-up, not as the first draft.

## Cross-links

- [Expand level by level](./bfs/lesson.md) (id: bfs)
- [Land clusters on a map](../problems/number-of-islands/lesson.md) (id: number-of-islands)
- [Prefix trees as a walking index](./trie.md) (id: trie)
- [Matched brackets in a line of code](../problems/valid-brackets/lesson.md) (id: valid-brackets)
- [Trees are graphs with a promise](../../cs/trees-graphs.md) (id: trees-graphs)
- [Fill a grid of overlapping subproblems](./dp-2d.md) (id: dp-2d)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
