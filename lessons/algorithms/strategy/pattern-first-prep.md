---
id: pattern-first-prep
title: How to run a pattern-first loop
slug: pattern-first-prep
kind: strategy
track: algorithms
difficulty: intro
estimated_minutes: 16
summary: Learn about fourteen reusable templates, then drill two or three problems each, instead of grinding hundreds of one-off prompts.
tags:
  - algorithms
  - interviews/leetcode
prerequisites: []
related:
  - two-pointers
  - hash-maps
  - interview-framework
  - two-sum
company_signal:
  - name: Meta
    evidence: Candidate prep threads repeatedly say phone screens recycle the same pattern families more than they recycle exact prompts.
    year: 2026
    confidence: medium
  - name: Amazon
    evidence: OA writeups and tagged-list discussions treat a short pattern catalog as more predictive than a 500-problem streak.
    year: 2026
    confidence: medium
sources_consulted:
  - Teamblind "Blind 75" origin threads (community list, not an official bank)
  - NeetCode pattern grouping writeups (2026)
  - r/leetcode frequency and tagged-list threads
updated: 2026-09-11
status: canonical
---

# How to run a pattern-first loop

## Snapshot

- Interview coding rounds test *recognition speed* more than novelty. The graph of prompts is wide; the graph of ideas is not.
- Roughly fourteen patterns cover the bulk of phone screens: maps, two pointers, windows, fast-slow, binary search on the answer, BFS, DFS/backtracking, heaps, intervals, monotonic stacks, union-find, 1D DP, 2D DP, topo sort, tries.
- A famous 75-problem community list started as a Teamblind post: one engineer’s short set, not a leaked company exam. Treat it as a sampling frame, not scripture.
- Grinding 500 random items without naming the pattern is how people stay busy and still freeze on a restated warehouse story.

## Why it shows up in interviews

Companies do not need you to have seen the exact prompt. They need you to classify a new story in two minutes, pick a template, and talk while you adapt it. Pattern-first prep is how you practice that classification, not how you memorize titles.

Candidate reports across Meta, Amazon, and Google tagged lists keep rhyming: pair-sum, unique window, island flood, k-th largest, course order. Different numbers, same moves. That is the point of this catalog.

## Core idea

Each pattern lesson on this path is written as an ease-into, not a dump of the final function. Read it in this order, then stop and try the next problem from a blank buffer.

### How to read the next lesson

1. **Snapshot + Prompt** — what the clerk is holding. Do not peek at code.
2. **ELI5** — fake-code / numbered steps. If you cannot say this out loud, you are not ready for syntax.
3. **Syntax** — the three method calls (`Map.set`, two indices, `stack.push`). Run it in your head.
4. **Then the details** — the one footgun (lookup before insert, sort then squeeze, skip duplicates).
5. **Walkthrough Easy / Medium / Hard** — same story, one twist, then the follow-up they ask in the room.
6. **Complexity + Interview moves** — the sentence you say before you type.

That is how you *apply* the technique, not how you collect greens.

### Drill loop (after you can say the ELI5)

1. Name the invariant in one sentence.
2. Paper-solve two problems: one easy, one with a twist (duplicates, indices, a miss).
3. Re-solve one of them a week later from a blank buffer, narrating out loud.
4. File a miss as "I did not recognize X," not as "I need fifty more problems."

Stop adding new patterns until the current ones are boring. Breadth without retrieval is entertainment.

### What to say when you open each Index lesson

| Lesson | First sentence (apply the technique) |
| --- | --- |
| [hash-maps](../patterns/hash-maps.md) (id: hash-maps) | The key is the question I will ask later; the value is the answer I already have. |
| [hashing-internals](../../cs/hashing-internals.md) (id: hashing-internals) | Expected O(1), not a law; collisions and resizes are why. |
| [two-sum](../problems/two-sum/lesson.md) (id: two-sum) | For this weight, have I already seen the complement? Look up, then insert. |
| [group-anagrams](../problems/group-anagrams/lesson.md) (id: group-anagrams) | The map key is a signature (sorted letters), the value is a list. |
| [two-pointers](../patterns/two-pointers/lesson.md) (id: two-pointers) | Sorted, so each comparison throws away a whole side. |
| [three-sum](../problems/three-sum/lesson.md) (id: three-sum) | Pin one value, squeeze the other two; skip duplicates. |
| [tarp-span](../problems/tarp-span/lesson.md) (id: tarp-span) | Width starts max; move the short post because it is the limit. |
| [valid-brackets](../problems/valid-brackets/lesson.md) (id: valid-brackets) | Closers only look at the top of the unmatched openers. |

Kernel first: [big-o](../../cs/big-o.md) (id: big-o) so you can name why nested loops die, [arrays-vs-linked-lists](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists) so you know why these prompts are arrays.

The Blind 75 list is useful as a *coverage checklist* because it was built to be short. It is not a ranking of company questions. If a prompt is not on it, still ask "which pattern?" before you search for a solution.

## Comparison

| Plan | What you actually practice | Failure mode |
| --- | --- | --- |
| 500 random accepted | Syntax, not transfer | New story, old panic |
| Memorize a 75-title list | Titles | Warehouse restatement looks unknown |
| ~14 patterns × 2–3 problems, spaced | Recognition + invariant | None, if you keep a miss log |
| Patterns with no timed narration | Silent coding | You go quiet in the room |

## Common mistakes

- Treating NeetCode or Blind 75 as official leaked banks. They are community aggregations. Say that if an interviewer asks how you prepped.
- Skipping the brute-force sentence. Pattern-first still starts with "nested loops work, n is too big."
- Drilling only the happy-path code and never the follow-up (indices vs values, k-distinct window, cycle vs order).
- Mixing two-pointers, sliding window, and fast-slow because they all have two indices. The contracts differ.
- Jumping to DP because the problem looks "hard." If it is contiguous, try a window. If it is unweighted shortest, try BFS.

## How to talk about it

In the room, lead with the pattern name, then the invariant, then the complexity kill-shot. "This is a complement index; nested pairs are n²; I will store values I have already walked." That is the interview-framework move applied to algorithms.

When you miss, write one line: cue you ignored, pattern you should have named, pitfall that bit you. That log is worth more than another hundred greens.

## Cross-links

Read Kernel, then Index, in path order. Later stages stay on this list so the coverage checklist is one place.

Kernel

- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [Arrays versus linked lists](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Floats are scientific notation, not decimals](../../cs/floating-point.md) (id: floating-point)
- [Bytes are not characters](../../cs/encoding-unicode.md) (id: encoding-unicode)

Index — hash

- [Hashing internals](../../cs/hashing-internals.md) (id: hashing-internals)
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../problems/two-sum/lesson.md) (id: two-sum)
- [SKUs that share a packing cipher](../problems/group-anagrams/lesson.md) (id: group-anagrams)

Index — squeeze

- [Squeeze from both ends](../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Three-value search](../problems/three-sum/lesson.md) (id: three-sum)
- [Two posts and a tarp](../problems/tarp-span/lesson.md) (id: tarp-span)
- [Matched crate tags](../problems/valid-brackets/lesson.md) (id: valid-brackets)

Later patterns (same read order once Index is boring)

- [Grow and shrink a live range](../patterns/sliding-window/lesson.md) (id: sliding-window)
- [Two speeds, one list](../patterns/fast-slow-pointers.md) (id: fast-slow-pointers)
- [Binary search the feasible number](../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Expand level by level](../patterns/bfs/lesson.md) (id: bfs)
- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Collapse overlapping ranges](../patterns/merge-intervals.md) (id: merge-intervals)
- [The next greater is waiting on a stack](../patterns/monotonic-stack.md) (id: monotonic-stack)
- [Cluster membership in nearly constant time](../patterns/union-find/lesson.md) (id: union-find)
- [Reuse the last few answers](../patterns/dp-1d.md) (id: dp-1d)
- [Fill a grid of overlapping subproblems](../patterns/dp-2d.md) (id: dp-2d)
- [Order by prerequisites](../patterns/topological-sort/lesson.md) (id: topological-sort)
- [Prefix trees as a walking index](../patterns/trie.md) (id: trie)
- [Interview framework](./interview-framework.md) (id: interview-framework)
- [Trees and graphs](../../cs/trees-graphs.md) (id: trees-graphs)
- [What an index actually stores](../../cs/indexes.md) (id: indexes)
