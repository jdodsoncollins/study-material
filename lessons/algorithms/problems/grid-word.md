---
id: grid-word
title: Trace a word through a letter grid
slug: grid-word
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 16
summary: Try each matching start tile, extend one neighbouring tile at a time, mark tiles in use on the way in, and unmark them on the way out.
tags:
  - algorithms
  - algorithms/graphs
  - algorithms/backtracking
  - algorithms/strings
  - interviews
  - interviews/leetcode
prerequisites:
  - dfs-backtracking
  - number-of-islands
related:
  - dfs-backtracking
  - number-of-islands
  - trie
  - spare-subsets
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Trace a word through a letter grid

## Snapshot

- Same shape as "word search." Up, down, left, right; a tile may be used once per word.
- Backtracking, not flood fill: a tile used by one failed attempt must be free again for the next attempt. Mark on the way in, unmark on the way out.
- Prune on the first mismatched letter. Most branches die after one or two letters.
- Worst case is roughly rows · cols · 3^(L−1) for a word of length L: four directions for the first step, then at most three (you cannot step back onto the tile you came from).

## Prompt

A news app runs a daily word puzzle. The player drags through neighbouring tiles (no diagonals) to spell a word, and cannot reuse a tile within one word.

```
grid = ["CATS",
        "OREA",
        "DELM"]
```

Return whether each word can be traced:

- `"CORE"` → `true` (C, then down to O, right to R, right to E)
- `"TEAM"` → `true`
- `"DEAL"` → `false`
- `"RER"` → `false` (the only R would be used twice)

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Find a path in a grid that spells / matches a sequence | DFS from each start, with backtracking |
| "Each cell at most once" per path | Mark in, unmark out |
| Many words against one grid | Build a [trie](../patterns/trie.md) of the words and walk it during one DFS |
| "Count cells connected to a start" | Flood fill, no unmarking: [islands](./number-of-islands/lesson.md) |

## Worked approach

### ELI5

Put your finger on a tile that matches the first letter.

1. If the tile does not match the letter you need, back off.
2. If it matches and that was the last letter, you found the word.
3. Otherwise, cover the tile with a coin so you cannot reuse it, and try each of the four neighbours for the next letter.
4. Whatever happened, take the coin off before you back off. Another attempt may need this tile.

### Syntax

```ts
const grid = ["CATS", "OREA", "DELM"].map((row) => row.split(""));
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
grid[1][1] = "#";        // in use
console.log(grid[1].join("")); // O#EA
grid[1][1] = "R";        // released on the way back
console.log(dirs.length, grid[1].join("")); // 4 OREA
```

### Then the details

```ts
function hasWord(rows: string[], word: string): boolean {
  if (word.length === 0) return true;
  const g = rows.map((r) => r.split(""));
  const R = g.length, C = g[0]?.length ?? 0;
  const dfs = (r: number, c: number, i: number): boolean => {
    if (r < 0 || c < 0 || r >= R || c >= C || g[r][c] !== word[i]) return false;
    if (i === word.length - 1) return true;
    const keep = g[r][c];
    g[r][c] = "#"; // mark on the way in
    const found =
      dfs(r + 1, c, i + 1) || dfs(r - 1, c, i + 1) ||
      dfs(r, c + 1, i + 1) || dfs(r, c - 1, i + 1);
    g[r][c] = keep; // unmark on the way out
    return found;
  };
  for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) if (dfs(r, c, 0)) return true;
  return false;
}

const puzzle = ["CATS", "OREA", "DELM"];
console.log(hasWord(puzzle, "CORE"), hasWord(puzzle, "TEAM")); // true true
console.log(hasWord(puzzle, "DEAL"), hasWord(puzzle, "RER"));  // false false
```

The detail is the unmark line. It must run whether the branch succeeded or failed; putting it only on the failure path is fine for a yes/no answer, but forgetting it entirely makes later start tiles see a grid full of `#`.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| DFS from every tile, backtracking | O(R · C · 3^(L−1)) worst case | O(L) recursion | Usually far less with early mismatch |
| Same, with a letter-count precheck | Same worst case | O(alphabet) | Rejects impossible words in O(R · C) |
| Many words: trie + one DFS | Depends on the trie's branching | O(total word length) | Avoids one full search per word |

## Walkthrough

### Easy

`"CORE"`. Scan finds C at (0,0). Down to O (1,0) matches. From O: down is D, no; up is the C in use, no; right is R (1,1), match. From R the code tries down first: E (2,1), match, and that is the last letter. True. (Going right to E (1,2) would also have worked.)

### Medium

`"DEAL"`. D is only at (2,0). Next E: up is O, no; right is E (2,1), match. From (2,1) we need A: up is R, right is L, left is D (in use, shows `#`). Every branch fails. Unmark (2,1), unmark (2,0). No other D exists. False.

`"TEAM"`: T (0,2), down to E (1,2), right to A (1,3), down to M (2,3). True.

### Hard

`"RER"`. The single R at (1,1) is marked `#`. Its E neighbours are (1,2) and (2,1). Neither has an unmarked R next to it, because the only R is the one in use. False. Without marking, the search would happily step back onto (1,1) and say true.

Cheap pruning to mention: count letters. The grid has one R and `"RER"` needs two, so you can return false before searching. Another: if the last letter of the word is rarer in the grid than the first, search the reversed word instead; the answer is the same and fewer starts match.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| No marking | Reuses tiles; `"RER"` returns true | Mark on the way in |
| Marking without unmarking | Later starts fail on tiles a dead branch touched | Restore on the way out |
| A shared `visited` set that is never cleared between starts | Same bug as above | Restore, or create per start |
| Diagonal moves | Finds words the rules forbid | Four directions unless told otherwise |
| Bounds check after indexing | `g[-1]` is `undefined`, and `undefined[c]` throws | Check bounds first |
| Empty word or empty grid | Crash or wrong answer | Decide: empty word true; empty grid false for a nonempty word |

## Interview moves

- Say "backtracking: mark in, unmark out" and point at both lines.
- State the worst-case bound and that early mismatch makes it fast in practice.
- Ask whether you may mutate the grid. If not, use a `seen` boolean grid with the same in/out discipline.
- If they give a list of words, move to the trie version and explain why it shares work.

## Cross-links

- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Land clusters on a map](./number-of-islands/lesson.md) (id: number-of-islands)
- [Prefix trees as a walking index](../patterns/trie.md) (id: trie)
- [Every subset of selected items](./spare-subsets/lesson.md) (id: spare-subsets)
- [Recursion is a stack you didn't allocate](../../cs/recursion-call-stack.md) (id: recursion-call-stack)
