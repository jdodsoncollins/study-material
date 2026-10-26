---
id: pattern-first-prep
title: How to run a pattern-first loop
slug: pattern-first-prep
kind: strategy
track: algorithms
difficulty: intro
estimated_minutes: 16
summary: Learn reusable ideas through worked examples, independent attempts, feedback, and spaced review.
tags:
  - algorithms
  - interviews
  - interviews/leetcode
prerequisites: []
related:
  - two-pointers
  - hash-maps
  - interview-framework
  - two-sum
company_signal: []
sources_consulted:
  - https://ies.ed.gov/ncee/wwc/PracticeGuide/1
updated: 2026-10-26
status: canonical
---

# How to run a pattern-first loop

## Snapshot

- Pattern recognition helps you propose an approach; correctness still depends on the prompt’s constraints and a valid invariant.
- This curriculum groups practice into fifteen families: maps, two pointers, windows, fast-slow, binary search on the answer, BFS, DFS/backtracking, heaps, intervals, monotonic stacks, union-find, 1D DP, 2D DP, topo sort, tries.
- A public problem list can suggest practice topics. It does not establish which questions a particular interview will use.
- Use independent attempts to check transfer: can you explain why the idea fits a new example without looking at a solution?

## Why it shows up in interviews

Coding practice should help you reason about an unfamiliar prompt. A pattern name is a hypothesis, not a proof. Check its assumptions, explain a correct baseline, and test the proposed improvement on an example and a counterexample.

## Core idea

Read Kernel first (cost, layout), then Index (maps, then squeeze). Inside a lesson, read in this order, then try the next problem from a blank buffer.

### How to read the next lesson

1. **Snapshot + Prompt** — what the clerk is holding. Do not peek at code.
2. **ELI5** — fake-code / numbered steps. Explain the invariant in your own words; use the example or diagram if it is still unclear.
3. **Syntax** — the three method calls (`Map.set`, two indices, `stack.push`). Run it in your head.
4. **Then the details** — the one footgun (lookup before insert, sort then squeeze, skip duplicates).
5. **Walkthrough Easy / Medium / Hard** — same story, one twist, then the follow-up they ask in the room.
6. **Complexity + Interview moves** — the sentence you say before you type.

### Drill loop (after you can say the ELI5)

1. Study one worked example, then cover the next step and predict it. Compare your answer with the trace.
2. Complete a nearby problem with one twist, such as duplicates or original indices. Reduce hints as the idea becomes familiar.
3. Attempt a fresh problem independently. If stuck, take the smallest useful hint, then retry without it.
4. Review after a delay and mix related ideas so the title no longer gives away the technique. Adjust the interval to what you can recall.
5. Record the specific miss: recognition, invariant, implementation, edge case, or explanation. Use that diagnosis to choose the next exercise.

Move forward when you can explain and apply an idea with some independence; continue reviewing older material. General learning guidance supports worked-example/problem alternation, retrieval, and spacing. It does not establish a single optimal coding schedule.

### What to say when you open each lesson

Kernel — name the cost before the trick.

| Lesson | First sentence |
| --- | --- |
| [Big-O as a conversation](../../cs/big-o.md) (id: big-o) | Define n, estimate the work, then compare time and space. |
| [Contiguous slots versus pointer chasing](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists) | Choose by the operations and references the caller already has. |
| [Floats are scientific notation, not decimals](../../cs/floating-point.md) (id: floating-point) | Specify units, precision, and range before choosing a numeric type. |
| [Bytes are not characters](../../cs/encoding-unicode.md) (id: encoding-unicode) | `.length` is units, not letters. |

Index — hash, then squeeze.

| Lesson | First sentence (apply the technique) |
| --- | --- |
| [Why a map is "O(1)" until it isn't](../../cs/hashing-internals.md) (id: hashing-internals) | Expected O(1); collisions and resizes are why. |
| [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps) | The key is the question I will ask later; the value is the answer I already have. |
| [Pair lookup instead of nested scanning](../problems/two-sum/lesson.md) (id: two-sum) | For this weight, have I already seen the complement? Look up, then insert. |
| [Group search tokens by their letters](../problems/group-anagrams/lesson.md) (id: group-anagrams) | The map key is a signature (sorted letters), the value is a list. |
| [Squeeze from both ends](../patterns/two-pointers/lesson.md) (id: two-pointers) | Sorted, so each comparison throws away a whole side. |
| [Three-value search](../problems/three-sum/lesson.md) (id: three-sum) | Pin one value, squeeze the other two; skip duplicates. |
| [Choose two boundaries for the largest area](../problems/tarp-span/lesson.md) (id: tarp-span) | Width starts max; move the short post because it is the limit. |
| [Matched brackets in a line of code](../problems/valid-brackets/lesson.md) (id: valid-brackets) | Closers only look at the top of the unmatched openers. This is a stack, sitting next to squeeze so Index has a "remember what you opened" drill. |

Before searching for a solution, write what you know, what you tried, and where the reasoning failed. That gives the explanation a question to answer.

## Comparison

| Plan | What you actually practice | Failure mode |
| --- | --- | --- |
| Many problems with immediate solution viewing | Familiarity with solutions | Recognition can feel like independent ability |
| Memorize problem titles | Recall of named examples | A different presentation hides the connection |
| Worked examples, independent problems, and spaced review | Reasoning and retrieval | Hints must gradually fade; check a fresh problem |
| Patterns with no timed narration | Silent coding | You go quiet in the room |

## Common mistakes

- Treating NeetCode or Blind 75 as official leaked banks. They are community aggregations. Say that if an interviewer asks how you prepped.
- Skipping the brute-force sentence. Pattern-first still starts with "nested loops work, n is too big."
- Drilling only the happy-path code and never the follow-up (indices vs values, k-distinct window, cycle vs order).
- Mixing two-pointers, sliding window, and fast-slow because they all have two indices. The contracts differ.
- Jumping to DP because the problem looks "hard." A contiguous range suggests considering a window, but shrinking must have a valid monotonic rule. Unweighted shortest paths suggest BFS.

## How to talk about it

In the room, clarify the contract, give a baseline, then explain the invariant and complexity of the improvement. "This is a complement index; nested pairs are n²; I will store values I have already walked."

When you miss, write one line: cue you ignored, pattern you should have named, pitfall that bit you. Then choose a small exercise that directly tests the missing step.

## Cross-links

Read Kernel, then Index, in path order. Later stages stay on this list so the coverage checklist is one place.

Kernel

- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
- [Contiguous slots versus pointer chasing](../../cs/arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Floats are scientific notation, not decimals](../../cs/floating-point.md) (id: floating-point)
- [Bytes are not characters](../../cs/encoding-unicode.md) (id: encoding-unicode)

Index — hash

- [Why a map is "O(1)" until it isn't](../../cs/hashing-internals.md) (id: hashing-internals)
- [Hash maps as an index](../patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../problems/two-sum/lesson.md) (id: two-sum)
- [Group search tokens by their letters](../problems/group-anagrams/lesson.md) (id: group-anagrams)

Index — squeeze

- [Squeeze from both ends](../patterns/two-pointers/lesson.md) (id: two-pointers)
- [Three-value search](../problems/three-sum/lesson.md) (id: three-sum)
- [Choose two boundaries for the largest area](../problems/tarp-span/lesson.md) (id: tarp-span)
- [Matched brackets in a line of code](../problems/valid-brackets/lesson.md) (id: valid-brackets)

Later stages (Window through Judge) use the same read order: ELI5, then syntax or the first sketch, then details, then easy / medium / hard.

Later patterns (same read order, with continued review)

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
- [Forty-five minutes is a navigation problem](../../system-design/foundations/interview-framework.md) (id: interview-framework)
- [Trees are graphs with a promise](../../cs/trees-graphs.md) (id: trees-graphs)
- [Indexes are precomputed answers](../../cs/indexes.md) (id: indexes)
