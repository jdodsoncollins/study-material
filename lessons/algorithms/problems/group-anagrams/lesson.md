---
id: group-anagrams
title: SKUs that share a packing cipher
slug: group-anagrams
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Group tags that are the same letters in a different order by using the sorted letters as the map key.
tags:
  - algorithms
  - algorithms/hash-maps
  - algorithms/strings
  - interviews
  - interviews/leetcode
prerequisites:
  - hash-maps
related:
  - hash-maps
  - two-sum
  - hashing-internals
  - longest-unique-window
company_signal:
  - name: Amazon
    evidence: Candidate OA reports list anagram-grouping as a default hash-map medium after two-sum.
    year: 2026
    confidence: high
  - name: Meta
    evidence: Phone-screen writeups treat sorted-key grouping as the follow-up once complement lookup is done.
    year: 2026
    confidence: medium
sources_consulted:
  - LeetCode Top 100 Liked (Group Anagrams, 2026)
  - r/leetcode hash-map tagged threads
updated: 2026-09-03
status: canonical
---

# SKUs that share a packing cipher

## Snapshot

- Two tags belong together if one is a rearrangement of the other. Order inside a group does not matter.
- Sort the letters of each tag. That string is the bucket key. Count-sort of 26 letters is the same idea if the alphabet is tiny.
- You do not compare every pair. You hash once per tag.
- Empty input yields empty groups. A singleton is still a group of one.

## Prompt

Receiving prints SKU tags `tags = ["oak", "koa", "bin", "nib", "crate"]`. Two tags are the same part if they use the same letters. Return the groups. Order of groups and order inside a group may vary.

This is group-anagrams. The tags are dock SKUs, not a textbook `["eat","tea","tan"]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "same letters, different order" | Anagram key |
| Group, not "is this pair an anagram" | Map from key → list |
| Unicode / mixed case | Ask; v1 is lowercase a-z |
| n up to 10^4, length up to 100 | O(n k log k) is the budget |

## Worked approach

Walk once. For each tag, sort characters, push the original into `map.get(key)`.

```ts
function packGroups(tags: string[]): string[][] {
  const buckets = new Map<string, string[]>();
  for (const tag of tags) {
    const key = tag.split("").sort().join("");
    const g = buckets.get(key);
    if (g) g.push(tag);
    else buckets.set(key, [tag]);
  }
  const out: string[][] = [];
  buckets.forEach((g) => out.push(g));
  return out;
}

console.log(packGroups(["oak", "koa", "bin", "nib", "crate"]));
console.log(packGroups(["dock"]));
```

`oak` and `koa` share `ako`. `bin` and `nib` share `bin`. `crate` is alone.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Pairwise compare | O(n² k) | O(n k) | Fine for a handful, not 10^4 |
| Sorted-letter key | O(n k log k) | O(n k) | Default |
| 26-count tuple as key | O(n k) | O(n k) | Use if they forbid sorting letters |

## Walkthrough

`tags = ["oak", "koa", "bin", "nib", "crate"]`

[Bucket by sorted letters](viz/bucket.md)

1. `oak` → key `ako`. New bucket.
2. `koa` → `ako`. Same bucket.
3. `bin` → `bin`. New.
4. `nib` → `bin`. Same.
5. `crate` → `acert`. Alone.

Three groups.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Using the tag itself as the key | Every SKU is a singleton | Sort or count |
| Sorting the list of tags | Groups unrelated words alphabetically | Sort *letters*, not the array |
| Mutating the input strings | Later reads see scrambled SKUs | Split/sort a copy |
| Forgetting singletons | `crate` vanishes | Every tag is inserted once |

## Interview moves

- State the key before you write the loop.
- Ask case, unicode, and whether `"oak"` and `"Oak"` match.
- If they want O(nk), switch the key to a 26-length count joined by commas. Do not invent a hash of counts that collides.
- Pair-anagram is a different prompt. This one is grouping.

## Cross-links

- [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps)
- [Pair lookup instead of nested scanning](../two-sum/lesson.md) (id: two-sum)
- [Why a map is "O(1)" until it isn't](../../../cs/hashing-internals.md) (id: hashing-internals)
- [Longest unique radio run](../longest-unique-window/lesson.md) (id: longest-unique-window)
