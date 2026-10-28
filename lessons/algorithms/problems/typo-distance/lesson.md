---
id: typo-distance
title: Fewest edits from a typo to a command
slug: typo-distance
kind: problem
track: algorithms
difficulty: deep
estimated_minutes: 20
summary: Fill a prefix-by-prefix table where each cell is the cheapest of insert, delete, or replace, to get the edit distance a CLI uses for "did you mean".
tags:
  - algorithms
  - algorithms/dynamic-programming
  - algorithms/strings
  - interviews
  - interviews/leetcode
prerequisites:
  - dp-2d
related:
  - dp-2d
  - desk-paths
  - in-order-messages
  - longest-unique-window
company_signal: []
sources_consulted:
  - Robert A. Wagner and Michael J. Fischer, The String-to-String Correction Problem, Journal of the ACM 21(1) (1974)
  - Cormen, Leiserson, Rivest, Stein, Introduction to Algorithms (4th ed., 2022), Dynamic Programming chapter (longest common subsequence)
updated: 2026-10-28
status: canonical
---

# Fewest edits from a typo to a command

## Snapshot

- Edit (Levenshtein) distance: the fewest single-character inserts, deletes, and replacements that turn one string into another.
- `d[i][j]` = distance between the first `i` characters of the typo and the first `j` of the target. The answer is `d[m][n]`.
- Same last character: copy the diagonal. Different: 1 + the smallest of diagonal (replace), up (delete), left (insert).
- First row and column are the cost of building from or erasing to the empty string: `d[0][j] = j`, `d[i][0] = i`.
- O(m · n) time. Two rows of memory if you only need the number.

## Prompt

A command-line tool prints "did you mean …?" when a user mistypes. The user typed:

```
typed = "fecth"
word  = "fetch"
```

Return the edit distance between them, counting insert, delete, and replace as one edit each. Either string may be empty.

This is the same shape as the classic "edit distance" problem. The words are original.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "minimum operations to turn A into B" | Edit distance table |
| Two strings, compare prefixes | 2-D DP indexed by prefix lengths |
| Insert, delete, replace (sometimes with costs) | Each is one neighbor cell |
| "longest common subsequence" | Sibling table: match is diagonal + 1, else max of up/left |
| Swap of adjacent letters counts as one | Damerau variant; one extra case |

## Worked approach

[Fill one cell](viz/cell.md)

### ELI5

Look only at the **last letter** of each string.

1. If they are the same, they cost nothing. The answer is whatever it costs to fix everything before them.
2. If they differ, you have three ways to make the ends agree:
   - **Replace** the typo's last letter with the target's. Then fix both shorter prefixes.
   - **Delete** the typo's last letter. Then fix the shorter typo against the whole target.
   - **Insert** the target's last letter at the end of the typo. Then fix the whole typo against the shorter target.
3. Take the cheapest of the three, plus one for the edit you just made.

Every "then fix…" is a smaller version of the same question. Write them in a grid so you never answer one twice.

### Syntax

```ts
const typed = "fecth", word = "fetch";
const m = typed.length, n = word.length;
const d = Array.from({ length: m + 1 }, (_, i) =>
  Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)));
console.log(d[0]);          // [0, 1, 2, 3, 4, 5]: build "fetch" from nothing
console.log(d.map(r => r[0])); // [0, 1, 2, 3, 4, 5]: erase "fecth" to nothing
```

The grid is `(m + 1) × (n + 1)` because row 0 and column 0 stand for the empty prefix.

### Then the details

Fill row by row. Only the previous row is ever read, so keep two rows.

```ts
function editDistance(typed: string, word: string): number {
  const m = typed.length, n = word.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      if (typed[i - 1] === word[j - 1]) cur[j] = prev[j - 1];
      else cur[j] = 1 + Math.min(prev[j - 1], prev[j], cur[j - 1]); // replace, delete, insert
    }
    prev = cur;
  }
  return prev[n];
}

console.log(editDistance("fecth", "fetch"));  // 2
console.log(editDistance("stash", "status")); // 3
console.log(editDistance("", "push"));        // 4
```

The index shift is the footgun: cell `(i, j)` compares `typed[i - 1]` with `word[j - 1]`. Off by one here gives believable but wrong numbers.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Plain recursion on the three choices | O(3^(m+n)) | O(m + n) stack | Correct, explodes fast |
| Memoized recursion | O(m · n) | O(m · n) | Same table, filled lazily |
| Full table | O(m · n) | O(m · n) | Needed if you also want the edit script |
| Two rows | O(m · n) | O(min(m, n)) if you put the shorter string on the columns | Distance only |
| Banded (stop if distance > k) | O(k · min(m, n)) | O(k) | What a "did you mean" check really wants |

## Walkthrough

### Easy

`"fecth"` (rows) versus `"fetch"` (columns):

| | ∅ | f | e | t | c | h |
| --- | --- | --- | --- | --- | --- | --- |
| ∅ | 0 | 1 | 2 | 3 | 4 | 5 |
| f | 1 | 0 | 1 | 2 | 3 | 4 |
| e | 2 | 1 | 0 | 1 | 2 | 3 |
| c | 3 | 2 | 1 | 1 | 1 | 2 |
| t | 4 | 3 | 2 | 1 | 2 | 2 |
| h | 5 | 4 | 3 | 2 | 2 | 2 |

1. `f`/`f` and `e`/`e` match: copy diagonals, `0` and `0`.
2. Row `c`, column `t`: differ. `1 + min(diag 0, up 1, left 1) = 1`.
3. Row `c`, column `c`: match, copy the diagonal (row `e`, column `t`) = `1`.
4. Row `t`, column `t`: match, copy diagonal (row `c`, column `e`) = `1`.
5. Bottom-right: `h`/`h` match, copy diagonal (row `t`, column `c`) = `2`.

Distance 2: replace `c` with `t` and `t` with `c`. Swapping two adjacent letters costs two plain edits.

### Medium

`"stash"` versus `"status"` is 3. The shared prefix `sta` costs 0 (three diagonal copies). Then `sh` must become `tus`: replace `s→t`, replace `h→u`, insert `s`. One string empty: `""` versus `"push"` is 4, which is just row 0.

### Hard

**"Count a swap of neighbors as one edit."** That is the optimal-string-alignment form of Damerau–Levenshtein. Add one more candidate: if `typed[i-1] === word[j-2]` and `typed[i-2] === word[j-1]`, also consider `d[i-2][j-2] + 1`. Under that rule `"fecth"` to `"fetch"` is 1. This needs the row from two steps back, so keep three rows.

**"Suggest the closest command."** Run the distance from `"fecth"` to each known command: `fetch 2`, `merge 4`, `reset 4`, `stash 4`, `status 5`. Suggest `fetch` only if the best distance is small relative to the word length. Where to cut off is a product choice, not a standard; say the number you would pick and why. With a threshold k, stop filling a row as soon as every cell in it exceeds k.

**"Show the edits."** Keep the full table and walk back from `(m, n)`: diagonal on a match, otherwise to whichever neighbor produced the minimum.

**Try it:** fill the table for `"pul"` versus `"pull"` and predict the answer before you do. (1: one insert.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Grid sized `m × n` | No room for the empty prefix; first row is wrong | `(m + 1) × (n + 1)` |
| Comparing `typed[i]` with `word[j]` | Off-by-one, plausible wrong answers | Cell `(i, j)` compares `i − 1`, `j − 1` |
| Adding 1 on a match | Overcounts every shared letter | Match copies the diagonal exactly |
| Two rows but reading `cur[j − 1]` before writing it | Insert case uses stale data | Fill `j` left to right; seed `cur[0] = i` |
| Assuming a swap is one edit | Wrong for plain Levenshtein | Ask which operations count |
| Splitting by UTF-16 code units | An emoji counts as two letters | Iterate code points or graphemes if text is not ASCII |

## Interview moves

- Say the state in words: "`d[i][j]` is the cost to turn the first i letters into the first j."
- Draw the three arrows into one cell and label them replace, delete, insert. That diagram is the solution.
- Fill a small corner of the table out loud before coding.
- Offer the two-row optimization and the banded early exit; both show you thought about how it is used.

## Cross-links

- [Fill a grid of overlapping subproblems](../../patterns/dp-2d.md) (id: dp-2d)
- [Count routes using only right and down](../desk-paths/lesson.md) (id: desk-paths)
- [Keep the longest already-ordered run of message ids](../in-order-messages/lesson.md) (id: in-order-messages)
- [Longest substring without repeated letters](../longest-unique-window/lesson.md) (id: longest-unique-window)
- [Bytes are not characters](../../../cs/encoding-unicode.md) (id: encoding-unicode)
