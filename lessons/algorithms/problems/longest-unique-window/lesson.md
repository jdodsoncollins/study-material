---
id: longest-unique-window
title: Longest unique radio run
slug: longest-unique-window
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 12
summary: Slide a window over a stream of symbols, jumping the left edge past the last repeat so the live slice stays unique.
tags:
  - algorithms
  - algorithms/strings
  - algorithms/sliding-window
  - algorithms/hash-maps
  - interviews/leetcode
prerequisites:
  - sliding-window
  - hash-maps
related:
  - sliding-window
  - hash-maps
  - two-pointers
  - dp-1d
company_signal:
  - name: Meta
    evidence: Candidate phone-screen reports keep listing longest unique substring as the sliding-window warmup.
    year: 2026
    confidence: high
  - name: Amazon
    evidence: Tagged-list threads treat unique-window string problems as a default OA easy/medium.
    year: 2025
    confidence: high
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode sliding-window tagged threads
updated: 2026-09-02
status: canonical
---

# Longest unique radio run

## Snapshot

- Longest contiguous slice with all unique symbols. Gaps would make it a subsequence, which is a different problem.
- Right pointer walks once. Left pointer only jumps forward, to one past the previous copy of the new symbol.
- Store last-seen index, not just a set, so the jump is O(1).
- Alphabet size is the space budget. Bytes → 256-slot array. General unicode → map.

## Prompt

Night-shift radios log which zone a picker entered, one letter per ping: `log = "mparkpklane"`. A replay tool wants the longest stretch of tape where no zone letter repeats, so overlapping coverage is easy to hear. Return that length.

Same shape as the famous unique-substring question. The tape is a zone log, not `"abcabcbb"`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| Longest substring, not subsequence | Window, not DP-LCS |
| "without repeating" | Invariant is uniqueness |
| Stream / tape / log | Online; do not restart a scan at every index |
| At most k distinct (follow-up) | Counts instead of last-index, shrink while size > k |

## Worked approach

```ts
function longestUnique(log: string): number {
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < log.length; right++) {
    const ch = log[right];
    const prev = last.get(ch);
    if (prev !== undefined && prev >= left) left = prev + 1;
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}

console.log(longestUnique("mparkpklane")); // 6
console.log(longestUnique("aaaa"));        // 1

```

The `prev >= left` guard is the whole correctness story. A letter seen *before* the current window is stale and must not move left.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Restart a set at every left | O(n²) | O(alphabet) | Common first draft |
| Two pointers + last index | O(n) | O(alphabet) | Default |
| DP `dp[i]` from `dp[i-1]` | O(n) | O(alphabet) | Same idea, heavier to write |

## Walkthrough

`log = "mparkpklane"`

[Slide past the repeat](viz/slide.md)

1. `m p a r k` all new. Width 5. Map ends at `k → 4`.
2. Next `p` last seen at 1, still inside. Jump left to 2. Window `arkp`. Width 4.
3. Next `k` last seen at 4, inside. Jump left to 5. Window `pk`. Width 2.
4. `l a n e` all new to this window. `p` at 5, `k` at 6, then `lane`. Window `pklane`. Width 6.

Best is 6 (`pklane`). Check: p,k,l,a,n,e are unique.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Using a set and `left++` one by one without deleting | Set lies about membership | Delete as you shrink, or store last index |
| Jumping left backward | Window invariant dies | `left = Math.max(left, prev + 1)` |
| Counting bytes vs characters | Surrogate pairs split | Ask the alphabet |
| Returning the window string but tracking only length | Off-by-one slice | Save `left` when `best` updates |

## Interview moves

- State the invariant: "log[left..right] has unique letters."
- Ask whether they want the length or the slice, and whether the alphabet is ASCII.
- Offer the k-distinct follow-up unprompted. It is the same skeleton with a count map.
- If they forbid extra memory, say you cannot beat O(n²) in the worst alphabet; then they usually allow the map.

## Cross-links

- [Grow and shrink a live range](../../patterns/sliding-window/lesson.md) (id: sliding-window)
- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Squeeze from both ends](../../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Reuse the last few answers](../../patterns/dp-1d.md) (id: dp-1d)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../../strategy/pattern-first-prep.md) (id: pattern-first-prep)
