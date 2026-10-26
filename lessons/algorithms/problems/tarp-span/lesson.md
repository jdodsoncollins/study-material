---
id: tarp-span
title: Choose two boundaries for the largest area
slug: tarp-span
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Compare boundary areas and discard the shorter endpoint because it cannot improve with a narrower partner.
tags:
  - algorithms
  - algorithms/two-pointers
  - algorithms/arrays
  - algorithms/greedy
  - interviews
  - interviews/leetcode
prerequisites:
  - two-pointers
related:
  - two-pointers
  - three-sum
  - sliding-window
  - two-sum
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Choose two boundaries for the largest area

## Snapshot

- Posts in a line, heights given. A tarp between two posts holds `min(h[i], h[j]) * (j - i)` units of rain.
- You want the maximum. Nested pairs are O(n²).
- Start `i` at 0, `j` at n-1. The width is as large as it will ever be. The short post is the limit, so move that one.
- Moving the tall post cannot help: width drops and the min cannot rise.

## Prompt

A chart editor shows vertical boundaries with heights `posts = [3,1,7,2,6,4,5]` at unit-spaced x coordinates. Choose two to maximize `min(height[i], height[j]) × (j−i)`. Heights are nonnegative. Return 0 when fewer than two boundaries exist.

This is the two-wall area problem. The heights are not the textbook `[1,8,6,2,5,4,8,3,7]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Max area between two indices | Two pointers, not a stack |
| Height * width, min of the pair | Short side is the bottleneck |
| "trapping rain in valleys" | Different problem (monotonic stack / two-pass) |
| Sorted input | Not required; you still start at the ends |

## Worked approach

Same two fingers as [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers). The invariant changes: you are maximizing area, not hitting a sum.

### ELI5

Posts in a line. A tarp between two posts holds `min(height) * width`.

1. Start as wide as possible: leftmost post and rightmost post.
2. The short post is the lid. The tall post cannot lift that lid.
3. So walk the short post inward. Width drops by 1; maybe the next post is taller and the area grows.
4. Keep the best area you have seen.

Moving the tall post is wasted motion: width falls and the min cannot rise.

### Syntax

```ts
let i = 0, j = 6;
const h = Math.min(3, 5);
console.log(h * (j - i)); // width 6
```

### Then the details

```ts
function tarpRain(posts: number[]): number {
  let i = 0, j = posts.length - 1, best = 0;
  while (i < j) {
    const h = posts[i] < posts[j] ? posts[i] : posts[j];
    best = Math.max(best, h * (j - i));
    if (posts[i] < posts[j]) i += 1;
    else j -= 1;
  }
  return best;
}

console.log(tarpRain([3, 1, 7, 2, 6, 4, 5])); // 20
console.log(tarpRain([4, 4]));                 // 4
```

On equal heights, moving either side is sufficient. Moving both is also safe for finding the maximum area, since any narrower pair retaining either equal endpoint cannot improve the area just measured.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested pairs | O(n²) | O(1) | Useful as a small-input reference solution |
| End-inward, move the short post | O(n) | O(1) | Default |

## Walkthrough

[Move the short post](viz/span.md)

### Easy

Two posts `[4, 4]`. Width 1, min 4, area 4. The loop runs once.

### Medium

`posts = [3, 1, 7, 2, 6, 4, 5]`

1. `i=0,j=6`: min(3,5)*6 = 18. 3 is shorter. `i++`.
2. `i=1` height 1. Area 5. `i++`.
3. `i=2,j=6`: min(7,5)*4 = 20. 5 is shorter. `j--`.
4. Remaining pairs are narrower. Best stays 20.

### Hard

On tied heights, explain why neither equal endpoint can improve the current area with a narrower partner. The sample moves one for simplicity. Do not confuse this with "trapping rain in valleys" (that is a stack / two-pass). Unsorted is fine — you still start at the ends.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Moving the tall post | You shrink width with no chance to raise min | Move the short one |
| Using `j - i + 1` | Off-by-one width | Width is index difference |
| Confusing this with trapping rain | You start summing valleys | Two posts, one tarp |
| Sorting the heights | Positions are the width | Leave the array in place |

## Interview moves

- Draw two posts and say why the short one has to move. That sentence is the round.
- If they ask for the actual indices, keep `bestI`/`bestJ` when `best` updates.
- Trapping-rain-water is the follow-up. Name it; do not start coding it.

## Cross-links

- [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Three-value search](../three-sum/lesson.md) (id: three-sum)
- [Grow and shrink a live range](../../patterns/sliding-window/lesson.md) (id: sliding-window)
- [Pair lookup instead of nested scanning](../two-sum/lesson.md) (id: two-sum)
