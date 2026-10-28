---
id: cpu-caches-locality
title: CPU caches and the cost of a jump
slug: cpu-caches-locality
kind: concept
track: cs
difficulty: core
estimated_minutes: 15
summary: Memory moves in cache lines, so the order you touch data can change speed severalfold at the same Big-O; false sharing makes independent counters fight over one line.
tags:
  - cs
  - cs/os
  - cs/concurrency
  - cs/data-structures
  - interviews
  - interviews/system-design
prerequisites:
  - arrays-vs-linked-lists
related:
  - arrays-vs-linked-lists
  - os-memory
  - locks-and-concurrency
  - big-o
  - processes-threads
company_signal: []
sources_consulted:
  - https://lwn.net/Articles/250967/
updated: 2026-10-28
status: canonical
---

# CPU caches and the cost of a jump

## Snapshot

- A CPU reads memory through a hierarchy of caches (commonly L1, L2, L3). Each level is larger and slower than the one before; main memory is slower still.
- Data moves in **cache lines**, commonly 64 bytes on x86-64 and many ARM cores; some designs use 128 bytes. Touching one byte brings in its whole line.
- **Spatial locality:** using neighbors of what you just used is cheap. **Temporal locality:** reusing something soon is cheap. Both decide hit rates.
- Two loops with the same Big-O can differ severalfold in speed because of access order. Arrays walked in order are the friendliest pattern; pointer chasing is the least.
- **False sharing:** two threads write different variables that sit in the same line, and the line bounces between cores even though no data is actually shared.

## Why it shows up in interviews

"Why is an array faster than a linked list when both are O(n) to scan?" and "why did adding threads make the counter slower?" are both cache questions. In system design, the same reasoning explains columnar storage, batching, and why an in-memory hash table with poor locality underperforms its Big-O. A short explanation with lines, locality, and one illustrative number is what interviewers want.

## Core idea

### ELI5

The CPU keeps a small desk next to it and a large library down the hall. Fetching from the library takes a long walk, so whenever it goes, it carries back a whole shelf section (a cache line), not one page. If your next request is on the same shelf section, it is already on the desk. If every request is on a different section, the CPU spends its time walking.

### Illustrative latencies

These are order-of-magnitude figures for a recent desktop or server core, for reasoning only. Real values vary by processor, frequency, and load.

| Level | Rough size | Rough latency |
| --- | --- | --- |
| L1 data | tens of KB per core | ~1 ns (a few cycles) |
| L2 | hundreds of KB to a few MB per core | ~3–5 ns |
| L3 | several to tens of MB, shared | ~10–40 ns |
| Main memory | GBs | ~80–120 ns |

The gap between L1 and memory is roughly 100×. Hardware prefetchers hide much of it for sequential and simple strided access, which is another reason in-order array walks are fast.

### Layout choices

- **Row-major traversal of a row-major array** walks consecutive addresses. Column-major traversal of the same array jumps a full row each step.
- **Array of structs vs struct of arrays:** if a hot loop reads only `price` from a million products, a separate `prices` array packs eight 8-byte prices per 64-byte line. An array of full product records may bring in one price per line.
- **Linked structures** place nodes wherever the allocator put them, so each step can be a miss. B-trees put many keys per node partly for this reason.

### False sharing

Thread A increments `counters[0]` and thread B increments `counters[1]`. They are separate variables, but if both live in one 64-byte line, each write invalidates the other core's copy of that line, and the cores take turns owning it. Throughput can drop below single-threaded. Fixes: pad or align each hot per-thread variable to its own line, or keep per-thread counts in local variables and combine them at the end.

## Worked example

A photo editor stores a 64×64 grid of 8-byte pixel values in row-major order (row 0, then row 1, ...). Assume 64-byte lines and a tiny 32-line cache with least-recently-used eviction. The cache is deliberately small so the effect is visible; real caches are larger, and the same effect appears at larger sizes.

### Easy

Row-major traversal: each line holds 8 pixels, so every 8th access misses. 4,096 pixels ÷ 8 = 512 misses.

### Medium

Column-major traversal: consecutive accesses are 64 × 8 = 512 bytes apart, a different line each time. One column touches 64 lines, more than the 32-line cache holds, so by the time the next column needs a line it has been evicted. Every access misses: 4,096 misses, 8× the row-major count, with the same O(n²) loop.

### Hard

Two worker threads each count edited pixels in `counts[0]` and `counts[1]`, 8-byte integers that are adjacent in memory. Addresses 0 and 8 are in the same 64-byte line, so the threads falsely share it. Padding each counter to 64 bytes puts them at addresses 0 and 64, different lines. The sketch counts misses for both traversals and checks which counters share a line.

```ts
function countMisses(addresses: number[], lineBytes: number, cacheLines: number): number {
  const cache = new Map<number, true>(); // insertion order doubles as LRU order
  let misses = 0;
  for (const addr of addresses) {
    const line = Math.floor(addr / lineBytes);
    if (cache.has(line)) cache.delete(line);
    else { misses++; if (cache.size === cacheLines) cache.delete(cache.keys().next().value!); }
    cache.set(line, true);
  }
  return misses;
}

const N = 64, ELEM = 8;
const rowMajor: number[] = [], colMajor: number[] = [];
for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) rowMajor.push((r * N + c) * ELEM);
for (let c = 0; c < N; c++) for (let r = 0; r < N; r++) colMajor.push((r * N + c) * ELEM);
console.log(countMisses(rowMajor, 64, 32), countMisses(colMajor, 64, 32)); // 512 4096

const sameLine = (a: number, b: number, line = 64) => Math.floor(a / line) === Math.floor(b / line);
console.log(sameLine(0, 8), sameLine(0, 64)); // true false: adjacent counters share a line; padded ones don't
```

This is a model with one cache level and no prefetching. It shows the shape of the effect, not real timings.

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "Same Big-O, same speed" | Column-major or pointer-heavy code runs several times slower | Consider access order and layout |
| Quoting cache latencies as facts | Numbers that are wrong for the machine | Label as illustrative; measure on the target |
| Per-thread counters in one array | False sharing; adding threads slows things down | Pad to a line, or accumulate locally |
| Assuming 64-byte lines everywhere | Padding too small on some processors | Check the platform; pad generously when it matters |
| Linked list for a hot scan | Miss per node | Contiguous array, or nodes holding many items |
| Micro-optimizing locality before measuring | Effort spent on a cold path | Profile first; fix the hot loop |

## How to talk about it

"Both loops are O(n²), but the grid is row-major, so walking by column jumps 512 bytes per step and misses on every access in a small cache, about eight times the misses of the row walk. I'd swap the loop order. For the per-thread counters, they're adjacent 8-byte values in one cache line, so the cores fight over it; I'd keep counts in locals and sum at the end, or pad each to its own line."

## Cross-links

- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Virtual addresses, physical pages, and locality](./os-memory.md) (id: os-memory)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
- [Big-O as a conversation](./big-o.md) (id: big-o)
- [Which sort, and what it costs you](./sorting-tradeoffs.md) (id: sorting-tradeoffs)
- [Reachable or garbage, and who pays for the pause](./garbage-collection.md) (id: garbage-collection)
