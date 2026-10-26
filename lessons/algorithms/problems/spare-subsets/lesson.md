---
id: spare-subsets
title: Every subset of selected items
slug: spare-subsets
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Explore include-or-skip decisions and copy the current selection at each completed path.
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
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Every subset of selected items

## Snapshot

- Distinct parts. Return every subset, including empty and the full set. Order of subsets does not matter.
- At index `i`: skip `parts[i]`, or push it, recurse, pop.
- Iterative doubling (start `[[]]`, for each part append a copy-plus-part) is the same tree flattened. Either is fine.
- Duplicates in the input is a different prompt: sort and skip equal neighbors.

## Prompt

A shopping-list UI offers item IDs `parts = [7,2,9]`. List every possible selection, including choosing nothing. IDs are distinct and each item may be selected at most once.

This is the power set. The parts are not `[1,2,3]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| All subsets | Include/skip DFS |
| All permutations | Swap-in-place DFS, different tree |
| Combinations that sum to target | Same DFS plus a remaining budget |
| Duplicates in input | Sort, skip equals after a skip branch |

## Worked approach

### ELI5

For each item, explore two choices: leave it out, then include it. Once every item has a choice, copy the current selection into the results. Undo the inclusion before exploring a sibling branch.

### Syntax

```ts
const selected = [7];
console.log([...selected], [...selected,2]); // skip 2, take 2
```

### Then the details

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

### Easy

1. Skip 7, skip 2, skip 9 → `[]`.

### Medium

2. Skip 7, skip 2, take 9 → `[9]`.
3. Skip 7, take 2, then skip/take 9 → `[2]`, `[2,9]`.
4. Take 7, then the same suffix → `[7]`, `[7,9]`, `[7,2]`, `[7,2,9]`.

Eight rows. `2^3`.

### Hard

Empty input has one subset, the empty selection: `[[]]`. With n distinct items there are 2^n subsets, so large outputs are unavoidable. If duplicate values are added, decide whether selections distinguish item identity or should collapse equal value subsets.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `out.push(path)` | All rows alias the same mutable path | `path.slice()` |
| Forgetting empty | Off-by-one vs `2^n` | Push when `i === n`, even if path is empty |
| Permuting instead of subsetting | Extra rows, duplicates | Index moves forward, no swaps |
| Mutating `parts` | Later branches see a scramble | Leave the input alone |

## Interview moves

- Draw the binary tree of skip/take for three items. Count leaves: 8.
- For unique subsets with duplicate values, a loop-based DFS can sort and skip equal siblings using `i > start && a[i] === a[i-1]`. In this binary include/skip version, the skip branch must advance past the whole run of equal values; do not paste a loop condition into a different recursion structure.
- Permutations is the next sentence. Do not start it.

## Cross-links

- [Explore, undo, try the next branch](../../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Matched brackets in a line of code](../valid-brackets/lesson.md) (id: valid-brackets)
- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Land clusters on a map](../number-of-islands/lesson.md) (id: number-of-islands)
