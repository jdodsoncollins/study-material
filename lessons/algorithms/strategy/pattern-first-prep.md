---
id: pattern-first-prep
title: How to run a pattern-first loop
slug: pattern-first-prep
kind: strategy
track: algorithms
difficulty: intro
estimated_minutes: 14
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
updated: 2026-09-02
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

For each pattern, do this loop:

1. Read the pattern lesson until you can say the invariant in one sentence.
2. Solve two problems on paper, one easy, one that adds a twist (duplicates, indices, a follow-up).
3. Re-solve one of them a week later from a blank buffer, narrating out loud.
4. File a miss as "I did not recognize X," not as "I need fifty more problems."

Stop adding new patterns until the current ones are boring. Breadth without retrieval is entertainment.

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

- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Squeeze from both ends](../patterns/two-pointers.md) (id: two-pointers)
- [Grow and shrink a live range](../patterns/sliding-window.md) (id: sliding-window)
- [Two speeds, one list](../patterns/fast-slow-pointers.md) (id: fast-slow-pointers)
- [Binary search the feasible number](../patterns/binary-search-on-answer.md) (id: binary-search-on-answer)
- [Expand level by level](../patterns/bfs.md) (id: bfs)
- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Keep only the interesting k](../patterns/heaps-top-k.md) (id: heaps-top-k)
- [Collapse overlapping ranges](../patterns/merge-intervals.md) (id: merge-intervals)
- [The next greater is waiting on a stack](../patterns/monotonic-stack.md) (id: monotonic-stack)
- [Cluster membership in nearly constant time](../patterns/union-find.md) (id: union-find)
- [Reuse the last few answers](../patterns/dp-1d.md) (id: dp-1d)
- [Fill a grid of overlapping subproblems](../patterns/dp-2d.md) (id: dp-2d)
- [Order by prerequisites](../patterns/topological-sort.md) (id: topological-sort)
- [Prefix trees as a walking index](../patterns/trie.md) (id: trie)
- [Pair lookup instead of nested scanning](../problems/two-sum/lesson.md) (id: two-sum)
- [Interview framework](./interview-framework.md) (id: interview-framework)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [Hashing internals](../../cs/hashing-internals.md) (id: hashing-internals)
- [Trees and graphs](../../cs/trees-graphs.md) (id: trees-graphs)
- [Arrays versus linked lists](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [What an index actually stores](../../cs/indexes.md) (id: indexes)
