---
id: shortest-cover
title: Shortest log stretch that shows every required event
slug: shortest-cover
kind: problem
track: algorithms
difficulty: deep
estimated_minutes: 20
summary: Grow a window until it owes nothing, then shrink it from the left while it still covers, counting debts per character so each step is O(1).
tags:
  - algorithms
  - algorithms/strings
  - algorithms/sliding-window
  - algorithms/hash-maps
  - interviews
  - interviews/leetcode
prerequisites:
  - sliding-window
  - hash-maps
related:
  - sliding-window
  - longest-unique-window
  - hash-maps
  - group-anagrams
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Shortest log stretch that shows every required event

## Snapshot

- Find the shortest contiguous substring of `log` that contains every character of `need`, **with multiplicity** (`"TTB"` needs two `T`s).
- Variable-size window, opposite rhythm from "longest unique": here you grow until the window is **valid**, then shrink while it **stays** valid, recording the best at each valid moment.
- Keep `owed[ch]`: how many more of `ch` the window still needs (negative means surplus). Keep one integer `missing` = total still owed. The window covers exactly when `missing === 0`.
- Both edges only move right, so the scan is O(|log| + |need|).

## Prompt

A deploy audit view highlights the shortest stretch of an event log that proves a release was reviewed. Each event is one letter: `A` approval, `B` build, `C` canary, `D` deploy, `E` email, `F` flag change.

```
log  = "ADBECFBAC"
need = "ABC"
```

Return the shortest substring of `log` containing at least one `A`, one `B`, and one `C`. If several are equally short, return the leftmost. If none exists, or `need` is empty, return `""`.

This is the same shape as "minimum window substring."

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "shortest / minimum substring containing all of" | Grow-to-valid, shrink-while-valid window |
| Required set has repeats | Counts, not a set |
| Contiguous range | Windows work; a subsequence would not |
| "longest substring with at most …" | Same machinery, opposite record point |
| Need is much smaller than the log | O(n) one pass instead of checking every substring |

## Worked approach

[Grow then shrink](viz/cover.md)

### ELI5

You owe a list of events: one `A`, one `B`, one `C`.

1. Slide the right finger along the log. Each time it lands on an event you still owe, cross one off.
2. The moment you owe nothing, the stretch between your fingers is a valid highlight. Note its length.
3. Now try to make it shorter: lift the left finger forward one event at a time. If the event you drop was one you needed (and you had no spare), you owe it again. Stop shrinking.
4. Go back to step 1.

Every event enters the window once (right finger) and leaves once (left finger).

### Syntax

```ts
const owed = new Map<string, number>([["A", 1], ["B", 1], ["C", 1]]);
let missing = 3;
// right finger lands on "B"
if ((owed.get("B") ?? 0) > 0) missing--;
owed.set("B", owed.get("B")! - 1);
console.log(owed.get("B"), missing); // 0 2
```

`owed` may go negative: `-1` means one spare copy inside the window. That is what lets the left edge drop a duplicate without becoming invalid.

### Then the details

```ts
function shortestCover(log: string, need: string): string {
  if (need.length === 0) return "";
  const owed = new Map<string, number>();
  for (const ch of need) owed.set(ch, (owed.get(ch) ?? 0) + 1);
  let missing = need.length, bestStart = 0, bestLen = Infinity, left = 0;
  for (let right = 0; right < log.length; right++) {
    const ch = log[right];
    if (owed.has(ch)) {
      if (owed.get(ch)! > 0) missing--;
      owed.set(ch, owed.get(ch)! - 1);
    }
    while (missing === 0) {
      if (right - left + 1 < bestLen) { bestLen = right - left + 1; bestStart = left; }
      const gone = log[left];
      if (owed.has(gone)) {
        owed.set(gone, owed.get(gone)! + 1);
        if (owed.get(gone)! > 0) missing++;
      }
      left++;
    }
  }
  return bestLen === Infinity ? "" : log.slice(bestStart, bestStart + bestLen);
}

console.log(shortestCover("ADBECFBAC", "ABC")); // "BAC"
console.log(shortestCover("TBUTLTDB", "TTB"));  // "TBUT"
console.log(shortestCover("ABC", "ABCD"));      // ""
```

The record happens **inside** the shrink loop, before dropping the left event. Recording after the loop measures a window that no longer covers.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Every substring, count each | O(n² · σ) or O(n³) | O(σ) | σ is the alphabet size |
| Every start, extend until covered | O(n²) | O(σ) | Better, still quadratic |
| Sliding window with `owed` + `missing` | O(n + m) | O(σ) | Default; n = log length, m = need length |
| Window over only the relevant positions | O(n + m) | O(n) | Faster when the log is mostly irrelevant events |

## Walkthrough

### Easy

`log = "ADBECFBAC"`, `need = "ABC"`.

1. Right moves over `A D B E C`. At index 4 the window `ADBEC` owes nothing. Record length 5.
2. Shrink: drop `A`. Now `A` is owed again. Stop. Window `DBEC`.
3. Right over `F B` (spare `B`, `owed[B] = -1`) and `A` at index 7. Covers: `DBECFBA`, length 7, not better.
4. Shrink: drop `D` (irrelevant), `B` (spare, still covered), `E`, `C` (needed). Valid windows on the way were 6, 5, 4 long: `BECFBA`, `ECFBA`, `CFBA` (length 4, new best).
5. Right over `C` at index 8. `FBAC` covers, length 4, ties, not strictly better. Drop `F`: `BAC`, length 3, new best. Drop `B`: owed again.

Answer `"BAC"`.

### Medium

Repeats in `need`. The CI log `"TBUTLTDB"` (T test, B build, U upload, L lint, D deploy) and `need = "TTB"`. `owed` starts `{T: 2, B: 1}`, `missing = 3`. After `T B U T`, missing is 0: record `TBUT` (4). Dropping `T` makes `T` owed again. The rest of the log never produces a shorter cover; `TLTDB` is 5. Answer `"TBUT"`. A set instead of counts would wrongly accept `TBU`, which has only one test.

### Hard

"Need has a letter the log never contains" (`need = "ABCD"` on `"ABC"`): `missing` never reaches 0, return `""`. "Need is empty": return `""` by contract; ask, since some definitions say the empty window always covers.

"The log is a live stream; keep showing a highlight that ends at the newest event." The window already does this: whenever the shrink loop runs for a new event, the last window it records is the shortest cover ending at that event. Nothing needs to be re-scanned.

"Return all shortest covers." Record every window whose length equals the best, and reset the list when you find a strictly shorter one.

**Try it:** `shortestCover("CBDAEBCA", "ABC")`. Which window is recorded last as the new best? (`"BCA"`, at the end. The earlier `CBDA` has length 4.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| A `Set` for `need` | `"TTB"` accepts one `T` | Counts per character |
| Recording after the shrink loop | Reports an invalid window | Record inside, before dropping left |
| Incrementing `missing` on every drop of a needed letter | Spares counted as debts | Only when `owed` rises above 0 |
| `<=` when updating best | Returns the rightmost tie | Strict `<` keeps the leftmost |
| Rebuilding counts for each window | O(n²) or worse | Update incrementally on enter and leave |
| Ignoring non-ASCII text | Surrogate pairs split | Iterate by code point if the log is not ASCII |

## Interview moves

- Say the two invariants: "`owed` is what the window still needs; `missing` is the sum of positive `owed`."
- Contrast with longest-unique: "There I record while valid and grow; here I record while valid and shrink."
- Trace the first valid window and the first shrink by hand; the interviewer will watch the spare-copy case.
- Ask about ties, empty `need`, and case sensitivity before coding.

## Cross-links

- [Grow and shrink a live range](../../patterns/sliding-window/lesson.md) (id: sliding-window)
- [Longest substring without repeated letters](../longest-unique-window/lesson.md) (id: longest-unique-window)
- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Group search tokens by their letters](../group-anagrams/lesson.md) (id: group-anagrams)
- [Big-O as a conversation](../../../cs/big-o.md) (id: big-o)
