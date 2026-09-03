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
  - interviews/leetcode
prerequisites:
  - trees-graphs
related:
  - bfs
  - number-of-islands
  - trie
  - valid-brackets
company_signal:
  - name: Meta
    evidence: Candidate onsite reports frequently mention permutations, subsets, and board-search prompts as backtracking.
    year: 2026
    confidence: high
  - name: Google
    evidence: Phone-screen writeups describe word-search / combination-sum style DFS as a recurring medium.
    year: 2025
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode backtracking tagged threads
updated: 2026-09-02
status: canonical
---

# Explore, undo, try the next branch

## Snapshot

- DFS on a graph visits nodes. Backtracking DFS on a *decision tree* builds partial answers.
- The three lines that matter: choose, recurse, un-choose. Forget the un-choose and every path shares a mutated array.
- Prune as soon as a partial path cannot win. That is the difference between 4^n and something that finishes.
- Use BFS when you need shortest. Use backtracking when you need all valid constructions, or any construction under constraints.

## Prompt

A locker's digit wheels can be set to `digits = [1, 2, 4]`. You must pick a combination of length 2, order matters, no digit reused. List every combination.

Then, on a warehouse floor of letters, find whether the word `CRANE` can be walked with 4-direction steps, using each cell at most once.

The first is permutations. The second is board search. Same choose/undo skeleton.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "all combinations / permutations / subsets" | Decision tree, not a greedy scan |
| "word on a board" / "place n queens" | DFS with a visited mark you must undo |
| Constraints that fail early | Prune; do not generate then filter |
| Shortest sequence | Wrong; that is BFS |

## Worked approach

Keep a path array and a used mask. Push, recurse, pop. Copy the path into the answer when it is full.

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
| Generate all, filter later | n! · extra | n! | Usually too slow |
| Backtracking with prune | bounded by the tree size | O(depth) plus answers | Default |
| BFS of partial states | similar time, more memory | queue of paths | Use only for shortest construction |

## Walkthrough

`digits = [1, 2, 4]`, length 2.

1. Pick 1. Branch: 2 → `[1,2]`; 4 → `[1,4]`. Undo 1.
2. Pick 2. Branch: `[2,1]`, `[2,4]`.
3. Pick 4. Branch: `[4,1]`, `[4,2]`.

Six pairs. The undo is visible: after `[1,2]` you pop 2, then try 4, then pop 1 before touching 2 as a start.

Board search adds a cell mark: set `floor[r][c] = '#'`, recurse four ways, restore the letter.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Not copying the path | Answer list is n copies of the last path | `[...path]` |
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
- [Pallet clusters on a flooded floor](../problems/number-of-islands.md) (id: number-of-islands)
- [Prefix trees as a walking index](./trie.md) (id: trie)
- [Matched crate tags](../problems/valid-brackets.md) (id: valid-brackets)
- [Trees and graphs](../../cs/trees-graphs.md) (id: trees-graphs)
- [Fill a grid of overlapping subproblems](./dp-2d.md) (id: dp-2d)
- [How to run a pattern-first loop](../strategy/pattern-first-prep.md) (id: pattern-first-prep)
