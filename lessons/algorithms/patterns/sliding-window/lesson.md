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
  - interviews
  - interviews/leetcode
prerequisites:
  - two-pointers
  - hash-maps
related:
  - longest-unique-window
  - two-pointers
  - hash-maps
  - dp-1d
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Grow and shrink a live range

## Snapshot

- The answer lives in a *contiguous* slice. If gaps are allowed, this is the wrong pattern.
- Right pointer only advances. Left pointer only advances. Each index enters and leaves the window at most once.
- The window holds an invariant: sum ≤ budget, all unique, at most k distinct, and so on.
- Fixed-size and variable-size windows have different update rules; identify which the prompt needs.

## Prompt

A search box logs one-letter keystrokes: `typed = "abcbadef"`. Find the longest stretch of the string where no letter repeats. Return the length.

Assume ASCII letters for this example. For general text, decide whether the unit is code points or graphemes before indexing.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "longest / shortest subarray / substring" | A window is a candidate; prove its shrink rule |
| "at most k distinct" / "no repeats" | Invariant on the bag of contents |
| "sum at most S" with nonnegative values | Shrinking cannot increase the sum; negative values need another argument |
| Need a subsequence, not a subarray | Window is wrong; think DP or two pointers on a copy |

## Worked approach

[window](viz/window.md)

### ELI5

A live range on a tape. Two fingers: left and right. Right only walks forward. Left only walks forward.

1. Slide right onto the next letter.
2. If that letter is already between the fingers, slide left just past the old copy.
3. The letters between the fingers stay unique. Remember the widest gap you have seen.

Left never goes backward. That is what keeps it linear.

### Syntax

```ts
let left = 0;
let right = 0;
console.log(right - left + 1); // width, including both ends
left += 1; // throw away a stale prefix, never decrease
console.log(left <= right);
```

### Then the details

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
| Extend each start with a seen set | O(n²) expected | O(min(n, alphabet)) | Repeats work across starts |
| Two pointers + map / counts | O(n) expected | O(min(n, alphabet)) | Assumes constant-cost key operations |
| Fixed window of size k | O(n) with constant-cost updates | Depends on maintained state | A running sum differs from a frequency map |

## Walkthrough

### Easy

`zones = "bbbb"`. Every letter repeats. Width stays 1.

### Medium

`zones = "abcbadef"`

1. `a b c` all new. Width 3. Map `{a:0,b:1,c:2}`.
2. Next `b` last seen at 1, still inside. Jump left to 2. Window is `cb`. Width 2.
3. `a` is new to this window. `cba`. Width 3.
4. `d e f` all new. Window `cbadef`. Width 6.

Best is 6. The repeat of `b` does not restart the scan; you only throw away the stale prefix.

### Hard

Follow-up: at most k distinct letters. Swap last-index for counts, and shrink while `counts.size > k`. A specified small alphabet can use a count array. ASCII has 128 codes; a 256-entry array covers bytes, not arbitrary Unicode.

**Try it:** trace `abba`. The final `a` was seen before the current left edge. Moving left backward would incorrectly count `bba`; the correct best length is 2.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Moving left back | Can include a duplicate and overstate the answer | Left only increases |
| Counting a letter outside the window | False "duplicate" | Compare last index against `left` |
| Rebuilding or rescanning the entire window each step | Can add quadratic work | Incremental set deletion is linear overall if each index leaves once |
| Off-by-one width | `right - left` without `+ 1` | Write the formula once and reuse it |

## Interview moves

- State the invariant before touching code: "window always has unique letters."
- Draw the two pointers. Interviewers watch whether left ever decreases.
- Ask if the alphabet is tiny (array of 256) or general (map).
- If they add "at most k distinct," swap the map for counts and shrink while `counts.size > k`.

## Cross-links

- [Longest substring without repeated letters](../../problems/longest-unique-window/lesson.md) (id: longest-unique-window)
- [Squeeze from both ends](../two-pointers/lesson.md) (id: two-pointers)
- [Hash maps as an index](../hash-maps.md) (id: hash-maps)
- [Reuse the last few answers](../dp-1d.md) (id: dp-1d)
- [Pair lookup instead of nested scanning](../../problems/two-sum/lesson.md) (id: two-sum)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
- [How to run a pattern-first loop](../../strategy/pattern-first-prep.md) (id: pattern-first-prep)
