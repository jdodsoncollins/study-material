---
id: sliding-window
title: Grow and shrink a live range
slug: sliding-window
kind: pattern
track: algorithms
difficulty: core
estimated_minutes: 14
summary: Maintain a contiguous slice whose invariant you restore by expanding the right edge and shrinking the left.
tags:
  - algorithms
  - algorithms/arrays
  - algorithms/strings
  - algorithms/sliding-window
  - interviews/leetcode
prerequisites:
  - two-pointers
  - hash-maps
related:
  - longest-unique-window
  - two-pointers
  - hash-maps
  - dp-1d
company_signal:
  - name: Meta
    evidence: Candidate phone-screen reports and tagged lists keep putting unique-substring / at-most-k-distinct windows in the first thirty minutes.
    year: 2026
    confidence: high
  - name: Google
    evidence: Prep threads treat variable windows over strings as a default onsite warmup.
    year: 2026
    confidence: medium
sources_consulted:
  - Blind 75 / NeetCode pattern lists (2026)
  - r/leetcode sliding-window frequency threads
updated: 2026-09-02
status: canonical
---

# Grow and shrink a live range

## Snapshot

- The answer lives in a *contiguous* slice. If gaps are allowed, this is the wrong pattern.
- Right pointer only advances. Left pointer only advances. Each index enters and leaves the window at most once.
- The window holds an invariant: sum ≤ budget, all unique, at most k distinct, and so on.
- Fixed-size windows are a warmup. Variable windows are the interview.

## Prompt

A radio desk logs one-letter zone codes as crates roll past: `zones = "abcbadef"`. Find the longest stretch of tape where no zone letter repeats. Return the length.

Same shape as the classic unique-substring problem. The tape is a warehouse radio log so the letters are not the textbook `"abcabcbb"`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "longest / shortest subarray / substring" | Contiguous, so a window |
| "at most k distinct" / "no repeats" | Invariant on the bag of contents |
| "sum at most S" | Running total, shrink when over |
| Need a subsequence, not a subarray | Window is wrong; think DP or two pointers on a copy |

## Worked approach

[window](viz/window.md)

Advance `right`. Record the last index of each letter. If the new letter was already inside the window, jump `left` just past that last index. Track the best width.

```ts
function longestUniqueRun(zones: string): number {
  const last = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < zones.length; right++) {
    const ch = zones[right];
    const prev = last.get(ch);
    if (prev !== undefined && prev >= left) left = prev + 1;
    last.set(ch, right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}

console.log(longestUniqueRun("abcbadef")); // 6
console.log(longestUniqueRun("bbbb"));     // 1

```

Do not rebuild the map each shrink. Amortized O(n) only holds if both pointers travel one way.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Nested left/right | O(n²) | O(1) | Rechecks the same slice |
| Two pointers + map / counts | O(n) | O(alphabet) | Default |
| Fixed window of size k | O(n) | O(1) extra | Simpler cousin; still name it |

## Walkthrough

`zones = "abcbadef"`

1. `a b c` — all new. Width 3. Map `{a:0,b:1,c:2}`.
2. Next `b` last seen at 1, still inside. Jump left to 2. Window is `c b`. Width 2.
3. `a` is new to this window. `cba`. Width 3.
4. `d e f` all new. Window `cbadef`. Width 6.

Best is 6. The repeat of `b` never forces you to restart from scratch; you only throw away the stale prefix.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Moving left back | Infinite loop or quadratic | Left only increases |
| Counting a letter outside the window | False "duplicate" | Compare last index against `left` |
| Using a set and scanning to delete | Hidden O(n²) | Store last index or a count |
| Off-by-one width | `right - left` without `+ 1` | Write the formula once and reuse it |

## Interview moves

- State the invariant before touching code: "window always has unique letters."
- Draw the two pointers. Interviewers watch whether left ever decreases.
- Ask if the alphabet is tiny (array of 256) or general (map).
- If they add "at most k distinct," swap the map for counts and shrink while `counts.size > k`.

## Cross-links

- [Longest unique radio run](../../problems/longest-unique-window.md) (id: longest-unique-window)
- [Squeeze from both ends](../two-pointers/lesson.md) (id: two-pointers)
- [Hash maps as an index](../hash-maps.md) (id: hash-maps)
- [Reuse the last few answers](../dp-1d.md) (id: dp-1d)
- [Pair lookup instead of nested scanning](../../problems/two-sum/lesson.md) (id: two-sum)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../../strategy/pattern-first-prep.md) (id: pattern-first-prep)
