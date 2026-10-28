---
id: spiral-read
title: Read a tile grid in a spiral
slug: spiral-read
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 15
summary: Walk the outer ring of a grid with four shrinking bounds, top then right then bottom then left, and guard the last two edges so a single leftover row or column is not read twice.
tags:
  - algorithms
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - matrix-traversal
related:
  - matrix-traversal
  - number-of-islands
  - desk-paths
  - others-product
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Read a tile grid in a spiral

## Snapshot

- Read every cell of an `r × c` grid clockwise from the top-left, ring by ring, inward.
- Four bounds, `top`, `bottom`, `left`, `right`, describe the unread rectangle. Read one edge, then move that bound inward.
- After reading top and right, the rectangle may have collapsed to nothing. Check `top <= bottom` before the bottom edge and `left <= right` before the left edge.
- O(r · c) time. O(1) extra besides the output.

## Prompt

A photo app's "reveal" animation shows thumbnails of a contact sheet in a clockwise spiral, starting at the top-left. The sheet's tile ids are:

```
 7  1  4  9
 2  8  6  3
 5  0 11 10
```

Return the tile ids in the order they are revealed. The grid is rectangular (every row has the same length) and may be empty.

This is the same shape as "spiral matrix." The tiles are original.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "spiral", "clockwise", "ring by ring" | Layer walk with four bounds |
| Non-square grid | The center is a row or a column, not one cell |
| "generate a spiral" (fill 1..n²) | Same walk, writing instead of reading |
| "rotate" | Same layers, different move; see the matrix lesson |
| Arbitrary turns or obstacles | Direction table + visited marks instead of bounds |

## Worked approach

[Shrink the bounds](viz/bounds.md)

### ELI5

Put four rulers around the unread part of the grid.

1. Read along the top ruler left to right. Slide the top ruler down one row.
2. Read down the right ruler. Slide it left one column.
3. If the top ruler has not crossed the bottom, read the bottom ruler right to left. Slide it up.
4. If the left ruler has not crossed the right, read up the left ruler. Slide it right.
5. Repeat while the rulers still enclose something.

Steps 3 and 4 have an "if" because after steps 1 and 2 there may be nothing left. Without it, part of a lone middle row gets read a second time, backward.

### Syntax

```ts
const grid = [[7, 1, 4, 9], [2, 8, 6, 3], [5, 0, 11, 10]];
let top = 0, bottom = grid.length - 1, left = 0, right = grid[0].length - 1;
const ring: number[] = [];
for (let c = left; c <= right; c++) ring.push(grid[top][c]);
top++;
console.log(ring, { top, bottom, left, right }); // [7, 1, 4, 9], top is now 1
```

### Then the details

```ts
function spiralOrder(grid: number[][]): number[] {
  const out: number[] = [];
  if (grid.length === 0 || grid[0].length === 0) return out;
  let top = 0, bottom = grid.length - 1, left = 0, right = grid[0].length - 1;
  while (top <= bottom && left <= right) {
    for (let c = left; c <= right; c++) out.push(grid[top][c]);
    top++;
    for (let r = top; r <= bottom; r++) out.push(grid[r][right]);
    right--;
    if (top <= bottom) {
      for (let c = right; c >= left; c--) out.push(grid[bottom][c]);
      bottom--;
    }
    if (left <= right) {
      for (let r = bottom; r >= top; r--) out.push(grid[r][left]);
      left++;
    }
  }
  return out;
}

console.log(spiralOrder([[7, 1, 4, 9], [2, 8, 6, 3], [5, 0, 11, 10]]));
// [7, 1, 4, 9, 3, 10, 11, 0, 5, 2, 8, 6]
console.log(spiralOrder([[4], [8], [15]])); // [4, 8, 15]
console.log(spiralOrder([]));               // []
```

The two `if` guards are the problem. Most wrong answers are a missing guard.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Four bounds | O(r · c) | O(1) extra | Default |
| Direction table + `visited` grid | O(r · c) | O(r · c) | Turn right when the next cell is out or seen |
| Direction table + marking cells in place | O(r · c) | O(1) extra | Destroys the input; ask first |
| Peel the top row, rotate the rest counter-clockwise, repeat | O(r · c · min(r, c)) | O(r · c) | Cute, slow |

## Walkthrough

### Easy

Bounds start `top 0, bottom 2, left 0, right 3`.

1. Top row, columns 0–3: `7 1 4 9`. `top = 1`.
2. Right column, rows 1–2: `3 10`. `right = 2`.
3. `top 1 ≤ bottom 2`: bottom row, columns 2→0: `11 0 5`. `bottom = 1`.
4. `left 0 ≤ right 2`: left column, rows 1→1: `2`. `left = 1`.
5. Loop again (`top 1 ≤ bottom 1`, `left 1 ≤ right 2`). Top row 1, columns 1–2: `8 6`. `top = 2`.
6. Right column, rows 2..1: nothing. `right = 1`.
7. `top 2 > bottom 1`: skip bottom. `left 1 ≤ right 1`: left column, rows 1→2: nothing (`r` starts at 1 and needs `r ≥ 2`). `left = 2`.
8. Loop ends.

Output `[7, 1, 4, 9, 3, 10, 11, 0, 5, 2, 8, 6]`, all 12 tiles once.

### Medium

A single column `[[4], [8], [15]]`. Top row reads `4`; `top = 1`. Right column reads `8, 15`; `right = -1`. Now `top 1 ≤ bottom 2`, so the bottom edge runs, but its loop is `c` from `-1` down to `0`: nothing. `bottom = 1`. Then `left 0 > right -1`: skip. Output `[4, 8, 15]`.

Remove the `left <= right` guard and the left edge reads rows 1 → 1 at column 0: `8` again. That is the classic duplicate.

### Hard

"Write ids 1..12 into an empty 3 × 4 sheet in spiral order" (generate, not read). Same bounds, same guards, but `grid[r][c] = next++` instead of `out.push(...)`. "Counter-clockwise, starting top-left" swaps the order to left column down, bottom row right, right column up, top row left, with the same shrinking rule.

"Spiral **outward** from the center" for an animation that starts in the middle: the reversed inward order is one answer, but note it turns counter-clockwise and its starting cell depends on the grid shape. Ask which center and which direction the designer wants before coding.

**Try it:** `spiralOrder([[1, 2, 3]])`. Which edges run? (Top reads all three; right reads nothing since `top` is now past `bottom`; the bottom guard fails; the left guard passes but its loop is empty.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| No guard before the bottom edge | Single middle row read twice | `if (top <= bottom)` |
| No guard before the left edge | Single middle column read twice | `if (left <= right)` |
| `grid[0].length` on `[]` | `TypeError` | Return early on empty |
| Updating a bound before its edge loop | Skips a row or column | Read, then move the bound |
| Mixing `r` and `c` in `grid[r][c]` | Wrong cells on non-square grids | Row first, always |

## Interview moves

- Name the four bounds and the invariant: "they enclose exactly the unread cells."
- Point at the two guards as you write them and say which shape each one protects.
- Test on 3 × 4 and on a single column before saying you are done.
- Offer the direction-table version if they want a general "turn right when blocked" walk.

## Cross-links

- [Walk a grid without falling off the edge](../../patterns/matrix-traversal.md) (id: matrix-traversal)
- [Land clusters on a map](../number-of-islands/lesson.md) (id: number-of-islands)
- [Count routes using only right and down](../desk-paths/lesson.md) (id: desk-paths)
- [Score without each feature, no division](../others-product.md) (id: others-product)
- [Contiguous slots versus pointer chasing](../../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
