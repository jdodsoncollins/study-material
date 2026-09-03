---
id: spare-subsets
title: Every subset of spare parts
slug: spare-subsets
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Walk the parts left to right, branching on include-or-skip, and push a copy of the path when the decision string ends.
tags:
  - algorithms
  - algorithms/backtracking
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - dfs-backtracking
related:
  - dfs-backtracking
  - valid-brackets
  - hash-maps
  - number-of-islands
company_signal:
  - name: Meta
    evidence: Candidate onsite reports list subsets / permutations as the default backtracking warmup.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: OA writeups treat power-set generation as the first include-or-skip DFS.
    year: 2026
    confidence: medium
sources_consulted:
  - LeetCode Top 100 Liked (Subsets, 2026)
  - r/leetcode backtracking tagged threads
updated: 2026-09-03
status: canonical
---

# Every subset of spare parts

## Snapshot

- Distinct parts. Return every subset, including empty and the full set. Order of subsets does not matter.
- At index `i`: skip `parts[i]`, or push it, recurse, pop. That is the whole tree.
- Iterative doubling (start `[[]]`, for each part append a copy-plus-part) is the same tree flattened. Either is fine.
- Duplicates in the input is a different prompt: sort and skip equal neighbors.

## Prompt

Spare bin, part numbers `parts = [7, 2, 9]`. List every subset of parts you could throw on a truck. Empty is legal. Each part at most once.

This is the power set. The parts are not `[1,2,3]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| All subsets | Include/skip DFS |
| All permutations | Swap-in-place DFS, different tree |
| Combinations that sum to target | Same DFS plus a remaining budget |
| Duplicates in input | Sort, skip equals after a skip branch |

## Worked approach

```ts
function spareSets(parts: number[]): number[][] {
  const out: number[][] = [];
  const path: number[] = [];
  const go = (i: number) => {
    if (i === parts.length) {
      out.push(path.slice());
      return;
    }
    go(i + 1);
    path.push(parts[i]);
    go(i + 1);
    path.pop();
  };
  go(0);
  return out;
}

console.log(spareSets([7, 2, 9]).length); // 8
console.log(spareSets([]).length);        // 1
```

Push a *copy* of `path`. If you push `path` itself, every row in `out` mutates together.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Include/skip DFS | O(n 2^n) | O(n) extra besides output | Default |
| Iterative doubling | O(n 2^n) | O(n 2^n) | Same work, no recursion |
| Bit masks `0..(1<<n)-1` | O(n 2^n) | O(1) extra | n ≤ 20 |

## Walkthrough

`parts = [7, 2, 9]`

[Include or skip](viz/branch.md)

1. Skip 7, skip 2, skip 9 → `[]`.
2. Skip 7, skip 2, take 9 → `[9]`.
3. Skip 7, take 2, then skip/take 9 → `[2]`, `[2,9]`.
4. Take 7, then the same suffix → `[7]`, `[7,9]`, `[7,2]`, `[7,2,9]`.

Eight rows. `2^3`.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `out.push(path)` | All rows become the last path | `path.slice()` |
| Forgetting empty | Off-by-one vs `2^n` | Push when `i === n`, even if path is empty |
| Permuting instead of subsetting | Extra rows, duplicates | Index moves forward, no swaps |
| Mutating `parts` | Later branches see a scramble | Leave the input alone |

## Interview moves

- Draw the binary tree of skip/take for three items. Count leaves: 8.
- If they add duplicates, sort first and `if (i>start && a[i]===a[i-1]) continue` on the skip side.
- Permutations is the next sentence. Do not start it.

## Cross-links

- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Matched crate tags](../valid-brackets/lesson.md) (id: valid-brackets)
- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Pallet clusters on a flooded floor](../number-of-islands/lesson.md) (id: number-of-islands)
