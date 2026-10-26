---
id: os-memory
title: Virtual addresses, physical pages, and locality
slug: os-memory
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: Understand virtual address mappings, page faults, and how locality can affect measured performance.
tags:
  - cs
  - cs/os
  - cs/data-structures
  - interviews
  - interviews/system-design
prerequisites:
  - arrays-vs-linked-lists
related:
  - processes-threads
  - arrays-vs-linked-lists
  - recursion-call-stack
  - caching
company_signal: []
sources_consulted:
  - https://pages.cs.wisc.edu/~remzi/OSTEP/
updated: 2026-10-26
status: canonical
---

# Virtual addresses, physical pages, and locality

## Snapshot

- Your pointer is a **virtual** address. The MMU translates it to a **physical** frame via page tables, cached in the TLB.
- Memory is handed out in **pages** (often 4 KiB). An access can fault because a page is absent or access is disallowed. Some faults allocate or map memory without disk I/O; others read backing storage or terminate the process.
- A process typically has mappings for code, data, heaps, and thread stacks. Exact placement and growth depend on the platform. Separate processes can explicitly share mappings.
- CPU caches transfer **cache lines** (commonly 64 bytes, architecture dependent). Contiguous access can reuse those lines; scattered nodes can need more loads.

## Why it shows up in interviews

Design rounds ask "what happens if the working set no longer fits in RAM?" Coding rounds ask why the array solution beats the list solution by more than the O-notation. Both answers live here: locality, paging, and the fact that "I have 16 GB" does not mean your process's random 16 GB is fast.

## Core idea

### ELI5

Think of apartment mailboxes. The number on the box (virtual) is what tenants use. The post office (OS) keeps a directory that says box 12B currently maps to shelf 4096 in the basement (physical). If that shelf was hauled to off-site storage (swap), the next letter waits.

```
virtual page  →  page table  →  physical frame
                    ↑
                  TLB hit = cheap
                  miss → walk tables
                  no mapping → fault
```

**Stack** frames vanish when the function returns. **Heap** allocations live until you free them (or the GC says so). A deep recursion is a stack of pages, not a heap problem; see [Recursion is a stack you didn't allocate](./recursion-call-stack.md) (id: recursion-call-stack).

Copy-on-write: `fork` clones the page *map*, not the bytes. The child writes a page → OS copies that page only. Cheap until someone mutates everything.

## Worked example

### Easy

Predict the sum in the example before running it: 41. Every element is read once.

### Medium

Now compare two layouts with the same O(n) traversal. Which one makes adjacent values more likely to share a cache line?

### Hard

Suppose the hot working set exceeds available RAM. Explain why more virtual address space does not supply more physical memory.

Sum 1 million integers two ways: a contiguous `Float64Array` versus a linked list of nodes.

| Access pattern | What the hardware does | Feel |
| --- | --- | --- |
| Walk `weights[i]` in order | A 64-byte line can hold eight aligned 8-byte elements; prefetch may help | Fast |
| Walk `node.next` | Each node may sit on its own line / page | Slow, same Big-O |
| Random index into a huge array | TLB misses, then cache misses | Fine until it isn't |
| Touch 50 GB working set on a 16 GB box | Page faults, disk (or kill) | Thrash |

```ts
function sumPacked(weights: Float64Array): number {
  let s = 0;
  for (let i = 0; i < weights.length; i++) s += weights[i];
  return s;
}

console.log(sumPacked(new Float64Array([4, 11, 8, 3, 15]))); // 41

```

Both traversals are O(n). Layout can change cache behavior and constants; benchmark the actual runtime rather than promising a universal speed ratio.

## Common mistakes

- Equating "virtual memory" with "swap file." Virtual memory is the map; swap is one backing store.
- Thinking threads have separate heaps. They share the process map; stacks and thread-local state are distinct, although they remain in the process address space.
- Ignoring alignment / cache lines when two cores write adjacent fields (false sharing).
- Claiming malloc is O(1) in the OS sense. User-space allocators are fast *until* they need a new page.

## How to talk about it

"Each process has its own virtual address space. Page tables describe mappings; the TLB caches translations. If I care about speed I pack data so a cache line does useful work — arrays over node graphs. If the working set outgrows RAM, paging, reclaim, or allocation failure can dominate latency. Threads share the address space; processes have separate spaces and may explicitly share pages."

If they ask about mmap: "It's asking the OS to map a file into that virtual space so loads and stores *are* the I/O, still in page-sized chunks."

## Cross-links

- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Recursion is a stack you didn't allocate](./recursion-call-stack.md) (id: recursion-call-stack)
- [Remembering the expensive answer nearby](../system-design/foundations/caching/lesson.md) (id: caching)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
