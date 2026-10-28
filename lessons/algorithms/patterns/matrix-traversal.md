---
id: matrix-traversal
title: Walk a grid without falling off the edge
slug: matrix-traversal
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 15
summary: Move through a 2-D grid with a bounds check, a direction table, in-place marks, and layer-by-layer walks, and rotate a square image without a second copy.
tags:
  - algorithms
  - algorithms/arrays
  - interviews
  - interviews/leetcode
prerequisites:
  - arrays-vs-linked-lists
related:
  - spiral-read
  - number-of-islands
  - desk-paths
  - bfs
  - dp-2d
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Walk a grid without falling off the edge

## Snapshot

- A grid is `grid[row][col]`. Row first, column second, every time. Say it before you write a loop.
- Four small tools do most of the work: a **bounds check**, a **direction table** (`[dr, dc]` pairs), an **in-place mark** so you do not revisit, and a **layer walk** that peels the grid from the outside in.
- Rotating a square 90° clockwise sends `(r, c)` to `(c, n − 1 − r)`. In place, move four cells at a time around each layer.
- Non-square grids change shape when rotated. That rules out a true in-place rotation of a JS array of rows.

## Prompt

A photo upload service stores a tiny square thumbnail as brightness values:

```
12  40   7
33  90  18
 5  61  24
```

Rotate it 90° clockwise **in place** (no second grid). Then say what changes for a 3×4 image.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| `grid[r][c]`, "neighbors", "adjacent cells" | Direction table plus bounds check |
| "in place" / "O(1) extra space" | Mark cells by overwriting, or swap in cycles |
| "spiral", "rotate", "border", "ring" | Layer walk with four shrinking bounds |
| "connected region", "flood" | Grid is a graph; see the islands and BFS lessons |
| "number of routes", "cheapest path moving right/down" | Grid DP, not traversal |

## Worked approach

### ELI5

Think of the thumbnail as a set of picture frames nested inside each other. A 3×3 image has one outer frame and one center pixel.

1. Take the outer frame. Every pixel on the top edge moves to the right edge, right goes to bottom, bottom to left, left to top.
2. Do it four pixels at a time: hold the top one in your hand, slide left into top, bottom into left, right into bottom, then drop the held one into right.
3. Step one pixel along the edge and repeat until that frame is done.
4. Move to the next frame inward. The center pixel of an odd-size image never moves.

### Syntax

```ts
const grid = [[12, 40, 7], [33, 90, 18], [5, 61, 24]];
const rows = grid.length, cols = grid[0]?.length ?? 0;
const DIRS = [[-1, 0], [0, 1], [1, 0], [0, -1]]; // up, right, down, left
const inside = (r: number, c: number) => r >= 0 && r < rows && c >= 0 && c < cols;

const r = 0, c = 2; // top-right pixel, value 7
for (const [dr, dc] of DIRS) {
  if (inside(r + dr, c + dc)) console.log(grid[r + dr][c + dc]); // 18, then 40
}
```

The `inside` helper is the first thing to write in any grid problem. Use `grid[0]?.length ?? 0` so an empty grid does not crash.

### Then the details

```ts
function rotateClockwise(img: number[][]): number[][] {
  const n = img.length;
  for (let layer = 0; layer < Math.floor(n / 2); layer++) {
    const last = n - 1 - layer;
    for (let i = layer; i < last; i++) {
      const off = i - layer;
      const top = img[layer][i];
      img[layer][i] = img[last - off][layer];          // left -> top
      img[last - off][layer] = img[last][last - off];  // bottom -> left
      img[last][last - off] = img[i][last];            // right -> bottom
      img[i][last] = top;                              // top -> right
    }
  }
  return img;
}

console.log(rotateClockwise([[12, 40, 7], [33, 90, 18], [5, 61, 24]]));
// [[5, 33, 12], [61, 90, 40], [24, 18, 7]]
console.log(rotateClockwise([])); // []
```

The inner loop stops at `last`, not `last + 1`. The corner at the end of an edge is the start of the next edge; moving it twice undoes it.

A shorter equivalent: **transpose** (swap `img[r][c]` with `img[c][r]` for `c > r`), then **reverse each row**. Same O(n²), easier to get right under pressure. Mention both; write the one you can verify.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Copy into a new grid, `out[c][n-1-r] = img[r][c]` | O(n²) | O(n²) | Simplest, required for non-square |
| Four-way swap per layer | O(n²) | O(1) | Each cell moves exactly once |
| Transpose then reverse rows | O(n²) | O(1) | Each cell moves at most twice |
| Neighbor scan of every cell | O(rows · cols · 4) | O(1) | Direction table + bounds |

## Walkthrough

### Easy

3×3, one layer (`layer = 0`, `last = 2`), two four-cycles.

1. `i = 0`: hold top-left `12`. Bottom-left `5` → top-left. Bottom-right `24` → bottom-left. Top-right `7` → bottom-right. `12` → top-right.
2. `i = 1`: hold top-middle `40`. Left-middle `33` → top. Bottom-middle `61` → left. Right-middle `18` → bottom. `40` → right.
3. Center `90` stays.

Result rows: `[5, 33, 12]`, `[61, 90, 40]`, `[24, 18, 7]`. Check one cell with the formula: `12` was at `(0, 0)` and lands at `(0, 2)`.

### Medium

**In-place marking, not rotation.** On the original thumbnail, flag every pixel brighter than all four of its in-bounds neighbors, without a separate `visited` grid. Scan with the direction table; you can store a mark by negating a value (brightness is never negative), and read `Math.abs` when comparing. Only `90` qualifies: its neighbors are `40`, `18`, `61`, `33`. The corner `7` has neighbors `40` and `18`, so it is not a peak. The negation trick is the same idea as sinking land in [Land clusters on a map](../problems/number-of-islands/lesson.md) (id: number-of-islands): the grid is its own visited set. Ask first whether you may mutate the input.

### Hard

A 3×4 image (3 rows, 4 columns) rotates into a 4×3 image. The row arrays change length and count, so "in place" no longer means anything useful in JS: allocate `out` with `cols` rows of `rows` entries and write `out[c][rows - 1 - r] = img[r][c]`. If the interviewer insists on O(1) extra space for a non-square matrix, ask whether it is one flat buffer (then it is an in-place transpose by cycle-following, which is a much harder problem) and say so plainly.

The same layer walk with four shrinking bounds reads a grid in spiral order; see [Read a tile grid in a spiral](../problems/spiral-read/lesson.md) (id: spiral-read).

**Try it:** rotate a 4×4 grid holding `1..16` row by row. The first row should become `[13, 9, 5, 1]`. How many four-cycles run in total? (Three for the outer layer, one for the inner.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `grid[c][r]` by habit | Transposed reads; wrong on non-square grids | Name variables `r`, `c`; row first always |
| Inner loop to `last` inclusive | Corners rotated twice | `i < last` |
| `grid[0].length` on `[]` | `TypeError` | `grid[0]?.length ?? 0` |
| Checking bounds after indexing | `grid[-1]` is `undefined`, then `undefined[c]` throws | Check `inside(r, c)` before you touch `grid[r]` |
| Marking in place without asking | Caller's data is destroyed | Ask, or restore marks at the end |
| Promising in-place rotate for 3×4 | Impossible with an array of rows | Allocate the 4×3 result |

## Interview moves

- Write `rows`, `cols`, `inside`, and `DIRS` first, before the problem-specific logic. It reads as fluency.
- For rotation, state the formula `(r, c) → (c, n − 1 − r)` and check one corner by hand.
- Offer transpose-then-reverse as the "less error-prone" version.
- Ask whether diagonal neighbors count. Four versus eight changes many answers.

## Cross-links

- [Read a tile grid in a spiral](../problems/spiral-read/lesson.md) (id: spiral-read)
- [Land clusters on a map](../problems/number-of-islands/lesson.md) (id: number-of-islands)
- [Expand level by level](./bfs/lesson.md) (id: bfs)
- [Count routes using only right and down](../problems/desk-paths/lesson.md) (id: desk-paths)
- [Fill a grid of overlapping subproblems](./dp-2d.md) (id: dp-2d)
- [Contiguous slots versus pointer chasing](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
