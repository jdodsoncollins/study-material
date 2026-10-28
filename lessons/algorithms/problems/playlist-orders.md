---
id: playlist-orders
title: Every play order for a short queue
slug: playlist-orders
kind: problem
track: algorithms
difficulty: core
estimated_minutes: 14
summary: List every ordering of distinct tracks by choosing an unused track for each slot, recursing, and un-choosing before the next try.
tags:
  - algorithms
  - algorithms/backtracking
  - interviews
  - interviews/leetcode
prerequisites:
  - dfs-backtracking
  - recursion-call-stack
related:
  - dfs-backtracking
  - spare-subsets
  - exact-baskets
  - recursion-call-stack
company_signal: []
sources_consulted: []
updated: 2026-10-28
status: canonical
---

# Every play order for a short queue

## Snapshot

- n distinct items have n! orderings. You must list all of them, so the output alone is n · n! values.
- Backtracking fills one slot at a time: pick any unused item, recurse to the next slot, then un-pick.
- A `used` flag per item makes "unused" an O(1) check. Without it you scan the path each time.
- Subsets ask "in or out?" per item. Permutations ask "which item goes here?" per slot. Different trees, same choose / recurse / un-choose.

## Prompt

A music app wants to preview every possible play order for a three-track queue before shuffling:

```
tracks = ["lofi", "jazz", "punk"]
```

Return every ordering of the tracks. Track names are distinct. Any order of the orderings is fine. For an empty queue, return one empty ordering: `[[]]`.

This is the same shape as "permutations of distinct values."

## Recognition signals

| Cue | Why it matters |
| --- | --- |
| "all orderings / arrangements / schedules" | Permutations; n! leaves |
| n ≤ 8 or so | 8! = 40,320 is fine; 12! is about 479 million |
| Items are distinct | No duplicate-skipping needed |
| "next ordering after this one" | A different, in-place algorithm (next permutation), not full enumeration |
| Order does not matter | That is subsets or combinations, not permutations |

## Worked approach

### ELI5

Three empty slots for tonight's queue.

1. Slot 1: try each track that is not already placed. Say you place `lofi`.
2. Slot 2: try each remaining track. Place `jazz`.
3. Slot 3: only `punk` is left. Place it. The queue is full; write it down.
4. Now **take `punk` back out**, then take `jazz` back out, and try `punk` in slot 2 instead.
5. When every choice for slot 1 has been tried, you are done.

Step 4 is the whole trick: you undo your last choice before trying the next one, so a single shared queue serves every branch.

### Syntax

```ts
const path: string[] = [];
const used = [false, false, false];
used[0] = true; path.push("lofi");   // choose
console.log(path, used);
path.pop(); used[0] = false;         // un-choose
console.log(path, used);             // back to empty
```

### Then the details

```ts
function allOrders(tracks: string[]): string[][] {
  const out: string[][] = [];
  const path: string[] = [];
  const used = tracks.map(() => false);
  const walk = () => {
    if (path.length === tracks.length) { out.push([...path]); return; }
    for (let i = 0; i < tracks.length; i++) {
      if (used[i]) continue;
      used[i] = true; path.push(tracks[i]);
      walk();
      path.pop(); used[i] = false;
    }
  };
  walk();
  return out;
}

console.log(allOrders(["lofi", "jazz", "punk"]));
// [["lofi","jazz","punk"], ["lofi","punk","jazz"], ["jazz","lofi","punk"],
//  ["jazz","punk","lofi"], ["punk","lofi","jazz"], ["punk","jazz","lofi"]]
console.log(allOrders([])); // [[]]
```

`out.push([...path])` copies. `out.push(path)` stores the same array six times, and after the last un-choose every entry is `[]`.

## Complexity

| Approach | Time | Space | Notes |
| --- | --- | --- | --- |
| Backtracking with `used` flags | O(n · n!) | O(n) recursion + path, plus output | The n is the copy at each leaf |
| Backtracking scanning `path.includes` | O(n² · n!) | O(n) | Works; slower for no reason |
| Swap-in-place (Heap's algorithm or swap recursion) | O(n · n!) | O(n) | No `used` array; mutates the input |
| Insert each new item into every gap of previous orders | O(n · n!) | O(n · n!) all at once | Builds every order in memory |

## Walkthrough

### Easy

`["lofi", "jazz", "punk"]`.

1. Slot 1 = `lofi`. Slot 2 = `jazz`. Slot 3 = `punk`. Record `[lofi, jazz, punk]`.
2. Un-choose `punk`, un-choose `jazz`. Slot 2 = `punk`. Slot 3 = `jazz`. Record `[lofi, punk, jazz]`.
3. Un-choose back to empty. Slot 1 = `jazz`, and the two orders under it follow the same way.
4. Slot 1 = `punk` gives the last two.

Six orders, which is 3!.

### Medium

Two tracks: `["ads", "news"]` gives `[["ads","news"], ["news","ads"]]`. One track gives `[["ads"]]`. Empty gives `[[]]`: one way to order nothing. If you return `[]` for empty, say why and confirm with the interviewer; tests here expect `[[]]`.

### Hard

"The queue has repeats: `["lofi", "lofi", "jazz"]`; list distinct orders only." Now 3! = 6 would include duplicates; there are 3 distinct orders. Sort the items, then at each slot skip item `i` if it equals item `i − 1` and item `i − 1` is **not** currently used. That rule makes equal tracks always come out in their original relative order, so each distinct arrangement is produced once.

"Return only the k-th order (1-based) without listing all of them." Use the factorial number system: with 3 tracks, each first-slot choice covers 2! = 2 orders, so order 5 starts with the third track. That is O(n²), not O(n!).

**Try it:** how many orders does a 10-track queue have, and is listing them reasonable for a preview screen? (3,628,800; no.)

## Pitfalls

| Trap | What happens | Fix |
| --- | --- | --- |
| `out.push(path)` | Every result is the same, finally empty, array | Copy at the leaf |
| Forgetting `used[i] = false` | Later branches think the item is still placed; results go missing | Un-choose mirrors choose, line for line |
| Starting the loop at `start` like subsets | Only produces one order | Permutations loop over **all** items every slot |
| Using permutations for "choose 2 of 5" | Counts `[a,b]` and `[b,a]` separately | That is combinations |
| No size check | n = 12 hangs the tab | State n! up front |

## Interview moves

- Say the count first: "n! orders, each of length n, so O(n · n!) is optimal for listing them."
- Draw the first two levels of the tree and point at where you un-choose.
- Contrast with subsets in one sentence so the interviewer hears you know the difference.
- For duplicates, state the skip rule before coding it.

## Cross-links

- [Explore, undo, try the next branch](../patterns/dfs-backtracking.md) (id: dfs-backtracking)
- [Every subset of selected items](./spare-subsets/lesson.md) (id: spare-subsets)
- [Every basket that spends a meal credit exactly](./exact-baskets.md) (id: exact-baskets)
- [Recursion is a stack you didn't allocate](../../cs/recursion-call-stack.md) (id: recursion-call-stack)
- [Big-O as a conversation](../../cs/big-o.md) (id: big-o)
