---
id: group-anagrams
title: Group search tokens by their letters
slug: group-anagrams
kind: problem
track: algorithms
difficulty: intro
estimated_minutes: 12
summary: Group search tokens by a canonical signature of their letters, preserving duplicates and singletons.
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
company_signal: []
sources_consulted: []
updated: 2026-10-26
status: canonical
---

# Group search tokens by their letters

## Snapshot

- Two tags belong together if one is a rearrangement of the other. Order inside a group does not matter.
- Sort the letters of each tag. That string is the bucket key. Count-sort of 26 letters is the same idea if the alphabet is tiny.
- You do not compare every pair. You hash once per tag.
- Empty input yields empty groups. A singleton is still a group of one.

## Prompt

Search query tokens `tags = ["oak", "koa", "tab", "bat", "crate"]`. Two tokens are the same anagram if they use the same letters. Return the groups. Order of groups and order inside a group may vary.

This is group-anagrams. The tokens are not a textbook `["eat","tea","tan"]`.

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "same letters, different order" | Anagram key |
| Group, not "is this pair an anagram" | Map from key → list |
| Unicode / mixed case | Ask; v1 is lowercase a-z |
| n up to 10^4, length up to 100 | O(n k log k) is the budget |

## Worked approach

Same shoebox as [Hash maps as an index](../../patterns/hash-maps.md) (id: hash-maps). The key is no longer the SKU. It is a *signature* of the letters.

### ELI5

Two tokens belong in the same group if their letter counts match.

1. Take `oak`. Sort the letters. You get `ako`. That is the drawer label.
2. Drop `oak` in drawer `ako`.
3. Take `koa`. Sort. Also `ako`. Same drawer.
4. `crate` sorts to `acert`. New drawer, alone.

You never compare every pair. You hash once per tag.

### Syntax

```ts
const key = "koa".split("").sort().join("");
console.log(key); // "ako"
const buckets = new Map<string, string[]>();
buckets.set(key, ["oak"]);
buckets.get(key)!.push("koa");
console.log(buckets.get("ako")); // ["oak", "koa"]
```

### Then the details

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

console.log(packGroups(["oak", "koa", "tab", "bat", "crate"]));
console.log(packGroups(["solo"]));
```

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Pairwise compare | O(n² k) | O(n k) | Fine for a handful, not 10^4 |
| Sorted-letter key | O(n k log k) | O(n k) | Default |
| 26-count tuple as key | O(n k) | O(n k) | Use if they forbid sorting letters |

## Walkthrough

[Bucket by sorted letters](viz/bucket.md)

### Easy

`tags = ["oak", "koa"]`. Both sort to `ako`. One group of two.

### Medium

`tags = ["oak", "koa", "tab", "bat", "crate"]`

1. `oak` → `ako`. New.
2. `koa` → `ako`. Same.
3. `tab` → `abt`. New.
4. `bat` → `abt`. Same.
5. `crate` → `acert`. Alone.

Three groups. Singletons stay.

### Hard

They forbid sorting letters. Count 26 letters into a tuple and use that string as the key (`a1c1e1r1t1`). Same shoebox, cheaper when `k` is large. Mixed case / Unicode: ask; v1 is lowercase a-z. Empty input → no groups.

**Try it:** group `["", "", "a"]`. Both empty strings share the empty signature, so the result has a two-item empty-string group and a singleton a. This lesson assumes lowercase ASCII tokens.

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| Using the tag itself as the key | Every SKU is a singleton | Sort or count |
| Sorting the list of tags | Groups unrelated words alphabetically | Sort *letters*, not the array |
| Confusing string and array mutation | JavaScript strings are immutable, but arrays are not | Sort the character array returned by split, preserving the original token |
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
- [Longest substring without repeated letters](../longest-unique-window/lesson.md) (id: longest-unique-window)
