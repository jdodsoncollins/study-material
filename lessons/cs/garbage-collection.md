---
id: garbage-collection
title: Reachable or garbage, and who pays for the pause
slug: garbage-collection
kind: concept
track: cs
difficulty: core
estimated_minutes: 15
summary: A tracing collector frees whatever cannot be reached from the roots; generational and concurrent designs trade throughput, memory, and pause time, and a reachable-but-forgotten object is still a leak.
tags:
  - cs
  - cs/os
  - cs/data-structures
  - interviews
  - interviews/system-design
prerequisites:
  - os-memory
related:
  - os-memory
  - recursion-call-stack
  - trees-graphs
  - lru-cache
  - processes-threads
company_signal: []
sources_consulted:
  - https://go.dev/doc/gc-guide
  - https://v8.dev/blog/trash-talk
  - https://docs.oracle.com/en/java/javase/21/gctuning/introduction-garbage-collection-tuning.html
updated: 2026-10-28
status: canonical
---

# Reachable or garbage, and who pays for the pause

## Snapshot

- A garbage collector reclaims memory for objects the program can no longer reach. "Reachable" means reachable by following references from **roots**: stack variables, registers, globals, and similar.
- **Reference counting** frees an object when its count drops to zero, immediately, but cannot free cycles without help. **Tracing** collectors (mark-sweep, copying, mark-compact) find live objects from the roots and free the rest, cycles included.
- The **generational hypothesis**: most objects die young. Collecting a small young generation often and the old generation rarely is cheap per byte freed.
- Pauses come from work that must stop application threads. Incremental and concurrent collectors shrink pauses by doing most marking alongside the program, at the cost of barriers and CPU.
- Leaks still happen: an object that is reachable but never used again (a forgotten cache entry, an event listener, a closure) is never collected.

## Why it shows up in interviews

Latency questions in system design ("why is our p99 spiky?") and language questions in coding rounds ("why does this Node service's memory grow?") both lead here. Interviewers want to hear the reachability model, the difference between a pause and a leak, and a practical move such as bounding a cache or measuring allocation rate, rather than "the GC handles it."

## Core idea

### ELI5

Start from everything the program is holding right now, such as local variables and globals. Follow every arrow to every object, and from those to more objects, and put a sticker on each one you reach. Anything without a sticker cannot be used again, so its memory can be reused. Two objects that only point at each other still get no sticker if nothing the program holds leads to them.

### Tracing styles

- **Mark-sweep:** mark reachable objects, then sweep the heap and free unmarked ones. Can fragment memory.
- **Copying:** copy live objects into a fresh region and discard the old region whole. Fast when few objects survive; needs spare space.
- **Mark-compact:** mark, then slide live objects together to remove fragmentation.

### Generations and barriers

Young objects go in a small nursery. A minor collection copies the few survivors out, so its cost is proportional to live young objects, not to the garbage. Objects that survive several minor collections are promoted to the old generation, collected less often with a more expensive algorithm.

To collect the young generation alone, the collector must know about old objects pointing into it. A **write barrier** records such pointers when the program stores them. Concurrent marking also uses barriers so the program cannot hide a live object while the collector is mid-scan.

### Pauses and tuning knobs

Stop-the-world phases pause every application thread. Concurrent collectors keep those phases short, but they need CPU headroom and usually more memory, because garbage accumulates while marking runs. Runtimes expose different knobs. Go's collector, for example, is concurrent and tuned mainly by `GOGC`, which trades heap size for collection frequency, plus a memory limit. Java offers several collectors with different pause and throughput goals. V8 uses a generational design with parallel and concurrent phases. Version details change; read the runtime's guide for the version you run.

### Leaks in collected languages

A collector cannot free what you still reference. Common causes: unbounded maps used as caches, listeners or timers never removed, closures capturing large objects, and growing arrays of "recent" items that are never trimmed. A heap snapshot that shows a growing retained size under one path is the usual evidence.

## Worked example

A chat server keeps sessions. Roots: the `sessions` and `typing` maps and the current request handler's locals.

### Easy

Objects: `sessions → {u1, u2}`, `u1 → profile1`, `u2 → profile2`. The handler holds `msg9`. Marking from the roots reaches `u1, u2, profile1, profile2, msg9`. An old `msg3` has no references and is swept.

### Medium

`u2` logs out and is removed from `sessions`. But `u2.socket` and `socket.owner` point at each other. Reference counting sees counts of 1 on both and frees neither. A tracing collector marks from roots, never reaches either, and frees both.

### Hard

`u2` is removed from `sessions`, but a `typingIndicators` map, also a root, still holds `u2 → timestamp`. Now `u2` is reachable and its whole graph, including a 2 MB history buffer, survives every collection. Memory grows by one entry per logged-out user. Fix: delete from both maps on logout, bound the map with an LRU policy, or use a weak reference structure where the language provides one (`WeakMap` keyed by the user object in JavaScript) so the entry does not keep the user alive.

```ts
type Heap = Record<string, string[]>; // object -> objects it references

function reachable(heap: Heap, roots: string[]): Set<string> {
  const marked = new Set<string>(), stack = [...roots];
  while (stack.length) {
    const obj = stack.pop()!;
    if (marked.has(obj)) continue;
    marked.add(obj);
    for (const ref of heap[obj] ?? []) stack.push(ref);
  }
  return marked;
}
function sweep(heap: Heap, roots: string[]): string[] {
  const live = reachable(heap, roots);
  return Object.keys(heap).filter((o) => !live.has(o)).sort();
}

const heapWith = (typing: string[]): Heap => ({
  sessions: ["u1"], typing, u1: ["profile1"], u2: ["socket2", "history2"],
  socket2: ["u2"], profile1: [], history2: [], msg3: [],
});
const roots = ["sessions", "typing"];
console.log(sweep(heapWith([]), roots));     // [ 'history2', 'msg3', 'socket2', 'u2' ]: the u2/socket2 cycle is freed
console.log(sweep(heapWith(["u2"]), roots)); // [ 'msg3' ]: the typing map keeps u2 alive (the leak)
```

## Common mistakes

| Trap | What happens | Fix |
| --- | --- | --- |
| "GC languages can't leak" | Memory grows until the process is killed | Look for reachable-but-unused objects |
| Unbounded in-process cache | Old generation grows; long collections | Size and evict; or move the cache out of process |
| Blaming GC for every latency spike | Real cause (lock, I/O) missed | Correlate pauses with GC logs or runtime metrics |
| High allocation rate in a hot loop | Frequent minor collections | Reuse buffers; allocate less per request |
| Assuming reference counting handles cycles | Cyclic garbage stays | Break cycles, use weak refs, or a backup tracer |
| Tuning flags copied from a blog | Behavior differs by runtime version | Measure with your runtime's guide and metrics |

## How to talk about it

"Memory climbs per logged-out user, so something still references them. A heap snapshot shows the typing-indicator map retaining user objects, so the collector correctly treats them as live. I'll delete on logout and switch that map to weak keys. Separately, our p99 spikes line up with old-generation collections; reducing the session cache size and allocation per request should shorten those."

## Cross-links

- [Virtual addresses, physical pages, and locality](./os-memory.md) (id: os-memory)
- [Recursion is a stack you didn't allocate](./recursion-call-stack.md) (id: recursion-call-stack)
- [Trees are graphs with a promise](./trees-graphs.md) (id: trees-graphs)
- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [CPU caches and the cost of a jump](./cpu-caches-locality.md) (id: cpu-caches-locality)
