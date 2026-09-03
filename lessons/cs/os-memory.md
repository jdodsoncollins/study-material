---
id: os-memory
title: Virtual memory is a lie the CPU believes
slug: os-memory
kind: concept
track: cs
difficulty: core
estimated_minutes: 14
summary: Each process sees a private virtual address space; the OS maps pages to RAM or disk, and cache lines make layout matter more than Big-O admits.
tags:
  - cs
  - cs/os
  - cs/data-structures
  - interviews/system-design
prerequisites:
  - arrays-vs-linked-lists
related:
  - processes-threads
  - arrays-vs-linked-lists
  - recursion-call-stack
  - caching
company_signal:
  - name: Google
    evidence: Systems-flavored screens still ask virtual vs physical, page faults, and why a linked-list scan thrashes cache compared to an array.
    year: 2026
    confidence: medium
sources_consulted:
  - Undergrad virtual memory / TLB / page-fault notes
  - Cache-line locality discussions in systems interview prep
  - OS copy-on-write fork behavior as commonly taught
updated: 2026-09-02
status: canonical
---

# Virtual memory is a lie the CPU believes

## Snapshot

- Your pointer is a **virtual** address. The MMU translates it to a **physical** frame via page tables, cached in the TLB.
- Memory is handed out in **pages** (often 4 KiB). Touch a missing page → page fault → OS finds a frame or pulls from disk.
- A process's layout: text (code), globals, heap growing up, stack growing down. They do not share this map with other processes.
- CPU caches move **cache lines** (~64 bytes), not single ints. Sequential arrays ride for free; pointer chasing does not.

## Why it shows up in interviews

Design rounds ask "what happens if the working set no longer fits in RAM?" Coding rounds ask why the array solution beats the list solution by more than the O-notation. Both answers live here: locality, paging, and the fact that "I have 16 GB" does not mean your process's random 16 GB is fast.

## Core idea

Think of apartment mailboxes. The number on the box (virtual) is what tenants use. The post office (OS) keeps a directory that says box 12B currently maps to crate 4096 in the basement (physical). If the crate was hauled to off-site storage (swap), the next letter waits.

```
virtual page  →  page table  →  physical frame
                    ↑
                  TLB hit = cheap
                  miss → walk tables
                  no mapping → fault
```

**Stack** frames vanish when the function returns. **Heap** allocations live until you free them (or the GC says so). A deep recursion is a stack of pages, not a heap problem; see [recursion-call-stack](./recursion-call-stack.md) (id: recursion-call-stack).

Copy-on-write: `fork` clones the page *map*, not the bytes. The child writes a page → OS copies that page only. Cheap until someone mutates everything.

## Worked example

Sum 1 million crate weights two ways: packed `number[]` versus a linked list of nodes.

| Access pattern | What the hardware does | Feel |
| --- | --- | --- |
| Walk `weights[i]` in order | One cache line feeds ~8 floats; prefetcher guesses ahead | Fast |
| Walk `node.next` | Each node may sit on its own line / page | Slow, same Big-O |
| Random index into a huge array | TLB misses, then cache misses | Fine until it isn't |
| Touch 50 GB working set on a 16 GB box | Page faults, disk (or kill) | Thrash |

```ts
function sumPacked(weights: number[]): number {
  let s = 0;
  for (let i = 0; i < weights.length; i++) s += weights[i];
  return s;
}
```

That loop is O(n) *and* friendly. The list version is O(n) *and* hostile. In a systems interview, say both.

## Common mistakes

- Equating "virtual memory" with "swap file." Virtual memory is the map; swap is one backing store.
- Thinking threads have separate heaps. They share the process map; only stacks are per-thread.
- Ignoring alignment / cache lines when two cores write adjacent fields (false sharing).
- Claiming malloc is O(1) in the OS sense. User-space allocators are fast *until* they need a new page.

## How to talk about it

"Each process has its own virtual address space. Pages map to RAM through the TLB. If I care about speed I pack data so a cache line does useful work — arrays over node graphs. If the working set outgrows RAM, we page-fault; that's a latency cliff, not a gentle slope. Threads share that map; processes do not."

If they ask about mmap: "It's asking the OS to map a file into that virtual space so loads and stores *are* the I/O, still in page-sized chunks."

## Cross-links

- [Address spaces versus shared work](./processes-threads.md) (id: processes-threads)
- [Contiguous slots versus pointer chasing](./arrays-vs-linked-lists.md) (id: arrays-vs-linked-lists)
- [Recursion is a stack you didn't allocate](./recursion-call-stack.md) (id: recursion-call-stack)
- [Cache as a second store](../system-design/foundations/caching/lesson.md) (id: caching)
- [Why a map is "O(1)" until it isn't](./hashing-internals.md) (id: hashing-internals)
