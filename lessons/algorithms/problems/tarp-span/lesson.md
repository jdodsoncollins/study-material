---
id: tarp-span
title: Two posts and a tarp
slug: tarp-span
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Start at both ends of a post row and always walk the shorter post inward so each move can only raise the limiting height.
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
company_signal:
  - name: Meta
    evidence: Candidate phone-screen reports list max-area-between-two-lines as the usual two-pointer medium after pair-sum.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Tagged OA lists keep the two-wall water-area prompt next to 3-sum.
    year: 2026
    confidence: high
sources_consulted:
  - LeetCode Top 100 Liked (Container With Most Water, 2026)
  - r/leetcode two-pointer tagged threads
updated: 2026-09-03
status: canonical
---

# Two posts and a tarp

## Snapshot

- Posts in a line, heights given. A tarp between two posts holds `min(h[i], h[j]) * (j - i)` units of rain.
- You want the maximum. Nested pairs are O(n²).
- Start `i` at 0, `j` at n-1. The width is as large as it will ever be. The short post is the limit, so move that one.
- Moving the tall post cannot help: width drops and the min cannot rise.

## Prompt

Dock posts, heights `posts = [3, 1, 7, 2, 6, 4, 5]`. Stretch a tarp between any two. Return the most rain that tarp can hold. Posts have width 1. The tarp does not sag.

This is the two-wall area problem. The heights are not the textbook `[1,8,6,2,5,4,8,3,7]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Max area between two indices | Two pointers, not a stack |
| Height * width, min of the pair | Short side is the bottleneck |
| "trapping rain in valleys" | Different problem (monotonic stack / two-pass) |
| Sorted input | Not required; you still start at the ends |

## Worked approach

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

Ties: move either side. Moving both in one step can skip a candidate; move one.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested pairs | O(n²) | O(1) | Fine for n < ~200 |
| End-inward, move the short post | O(n) | O(1) | Default |

## Walkthrough

`posts = [3, 1, 7, 2, 6, 4, 5]`

[Move the short post](viz/span.md)

1. `i=0,j=6`: min(3,5)*6 = 18. 3 is shorter. `i++`.
2. `i=1` height 1. Area 5. `i++`.
3. `i=2,j=6`: min(7,5)*4 = 20. 5 is shorter. `j--`.
4. Remaining pairs are narrower. Best stays 20 (posts 2 and 6).

Check: 7 and 5, four gaps, min 5 → 20. 3 and 5 at the ends is 18.

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
