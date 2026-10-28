---
id: reach-last-page
title: Can the jumps reach the last page
slug: reach-last-page
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Scan once while tracking the farthest page reachable so far; if the scan ever passes that frontier, the end is unreachable.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/greedy
  - interviews
  - interviews/leetcode
prerequisites:
  - greedy
related:
  - greedy
  - dp-1d
  - bfs
  - one-trade
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Can the jumps reach the last page

## Snapshot

- Page `i` links forward to each of the next `jumps[i]` pages. Start on page 0. Can you reach the last page?
- Greedy invariant: `farthest` = the furthest page any reachable page links to. Every page up to `farthest` is reachable, because links cover every page in between.
- Scan left to right. If `i > farthest`, page `i` is unreachable and so is everything after it. Return false.
- O(n) time, O(1) space. The DP ("is page i reachable?") is O(n²) in the worst case and teaches why greedy is safe here.

## Prompt

A long onboarding guide is split into pages. Page `i` has links to each of the next `jumps[i]` pages (a page with `0` has no forward links). A reader starts on page 0.

```
jumps = [2, 4, 1, 0, 0, 3]
```

Return `true` if the reader can reach the last page by following forward links, otherwise `false`. The guide has at least one page; a one-page guide is already at the end.

This is the same shape as the "jump game" reachability question.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "each position lets you move up to k forward" | Reachable set is always a prefix |
| "can you reach the end" (yes/no) | Track one frontier number |
| "fewest jumps to reach the end" | Still greedy, by levels (BFS on ranges) |
| Moves can go backward or skip arbitrary positions | Not a prefix any more; real BFS/DFS |
| Zeros in the input | The only way to get stuck; trace one |

## Worked approach

### ELI5

Walk the pages in order with a sticky note that says "I can get at least this far."

1. The note starts at page 0.
2. On page `i`, first check: is `i` past the note? Then you could never have arrived here. Answer no.
3. Otherwise, page `i` links up to `i + jumps[i]`. If that beats the note, update the note.
4. If you walk off the end without failing, answer yes.

The note only grows. You never need to remember *how* you got somewhere, only how far you can get.

### Syntax

```ts
let farthest = 0;
const jumps = [2, 4, 1, 0, 0, 3];
farthest = Math.max(farthest, 0 + jumps[0]); // page 0 reaches page 2
farthest = Math.max(farthest, 1 + jumps[1]); // page 1 reaches page 5
console.log(farthest >= jumps.length - 1);   // true
```

### Then the details

```ts
function canReachEnd(jumps: number[]): boolean {
  let farthest = 0;
  for (let i = 0; i < jumps.length; i++) {
    if (i > farthest) return false;           // stranded before page i
    farthest = Math.max(farthest, i + jumps[i]);
  }
  return true;
}

console.log(canReachEnd([2, 4, 1, 0, 0, 3])); // true
console.log(canReachEnd([2, 1, 1, 0, 3]));    // false
console.log(canReachEnd([0]));                // true: already on the last page
```

**Why the greedy is safe.** The reachable pages always form a prefix `0..farthest`: if page `p` is reachable and links up to `p + k`, every page between is linked too. So "is the end reachable?" is exactly "does the prefix ever cover the end?" You can stop early when `farthest >= jumps.length - 1`; the version above also works without the early exit.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| DFS over every path | Exponential without memo | O(n) | Correct, no reason to |
| DP: `ok[i]` if some earlier reachable `j` has `j + jumps[j] >= i` | O(n²) worst case | O(n) | Good stepping stone |
| Greedy frontier | O(n) | O(1) | Default |
| Fewest jumps, greedy by levels | O(n) | O(1) | Follow-up below |

## Walkthrough

### Easy

`jumps = [2, 4, 1, 0, 0, 3]`, last page is 5.

1. `i = 0`: `0 ≤ 0`. `farthest = max(0, 2) = 2`.
2. `i = 1`: `1 ≤ 2`. `farthest = max(2, 5) = 5`. Already covers page 5.
3. `i = 2..5` are all `≤ 5`. Return `true`.

Route: page 0 → 1 → 5. The zeros at pages 3 and 4 never matter because page 1 jumps over them.

### Medium

`jumps = [2, 1, 1, 0, 3]`, last page is 4.

1. `i = 0`: `farthest = 2`.
2. `i = 1`: `farthest = max(2, 2) = 2`.
3. `i = 2`: `farthest = max(2, 3) = 3`.
4. `i = 3`: `farthest = max(3, 3 + 0) = 3`.
5. `i = 4`: `4 > 3`. Return `false`.

Every route funnels into page 3, which has no links. The `3` on page 4 is never usable.

### Hard

"Fewest clicks to reach the last page" (assume it is reachable). Think in levels, like BFS on ranges: with 0 clicks you cover `[0, 0]`; with 1 click you cover up to the farthest any page in that range links to; and so on. Track `levelEnd` (end of the current click count's range) and `farthest`. When `i` reaches `levelEnd`, you must click once more and set `levelEnd = farthest`. On `[2, 4, 1, 0, 0, 3]`: 0 clicks covers page 0; 1 click covers pages 1–2; 2 clicks covers up to page 5. Answer 2.

Why plain "always jump as far as you can from where you stand" is **not** the fewest-clicks answer: from page 0 the biggest jump lands on page 2, which reaches only page 3, and then you are stuck. The right move is the page *within reach* whose own reach is largest (page 1). That is the levels argument, not "biggest step."

**Try it:** `[1, 0, 1]`. What does the scan return, and at which `i`? (`false` at `i = 2`, since `farthest` stays 1.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Checking `i > farthest` after updating | A stranded page "rescues" itself | Check first, then update |
| Simulating "jump max from here" | Gets stuck on a zero you could have skipped | Track the frontier, not one position |
| Returning false for `[0]` | One-page guide is already done | Start is the end when `n = 1` |
| Off-by-one target | Compares with `n` instead of `n − 1` | Last page index is `n − 1` |
| Using this when moves are not "up to k" | Reachable set is not a prefix | BFS over a real graph |

## Interview moves

- Say the invariant first: "Reachable pages are always a prefix, so one number describes them."
- Mention the O(n²) DP in one sentence and why the prefix fact collapses it.
- Trace the zero case; that is where interviewers poke.
- For the fewest-clicks follow-up, say "BFS by levels, but the levels are ranges, so it is still O(n)."

## Cross-links

- [Commit to the safe choice, then prove it](../patterns/greedy.md) (id: greedy)
- [Reuse the last few answers](../patterns/dp-1d.md) (id: dp-1d)
- [Expand level by level](../patterns/bfs/lesson.md) (id: bfs)
- [One buy, one sell on the tape](./one-trade/lesson.md) (id: one-trade)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
