---
id: processes-threads
title: Address spaces versus shared work
slug: processes-threads
kind: concept
track: cs
difficulty: core
estimated_minutes: 13
summary: A process is an isolated virtual memory map plus handles; a thread is a stack and a register set that shares that map with its siblings.
tags:
  - cs
  - cs/os
  - cs/concurrency
  - interviews/system-design
prerequisites:
  - os-memory
related:
  - os-memory
  - locks-and-concurrency
  - http-and-tcp
  - recursion-call-stack
company_signal:
  - name: Amazon
    evidence: Backend screens still ask process vs thread, when to isolate a crash, and why a thread pool is not "free parallelism."
    year: 2026
    confidence: high
sources_consulted:
  - Undergrad process/thread/context-switch notes
  - Candidate-reported OS warmup questions on isolation vs shared memory
  - Node/JS event-loop vs worker-thread comparisons in backend interviews
updated: 2026-09-02
status: canonical
---

# Address spaces versus shared work

## Snapshot

- A **process** is a program in execution: virtual memory, file descriptors, credentials. Crash it and siblings live.
- A **thread** is a schedulable stack inside a process. Threads share heap, globals, and sockets. Crash one, usually the process dies.
- Switching processes is heavier (page tables, TLB) than switching threads, but isolation is the feature.
- Parallelism needs extra cores *and* a plan for shared state. More threads ≠ more speed.

## Why it shows up in interviews

Design a worker pool, a browser sandbox, or a Node service and someone will ask "process or thread?" They want isolation vs communication cost, not a textbook definition. Wrong answer: "threads are faster so always threads." Right answer: "threads share memory so I need locks; processes isolate faults and force me onto pipes or RPC."

## Core idea

A food truck is a process. Cooks are threads. They share the fridge (heap) and the one gas line (sockets). Two trucks are two processes: separate fridges, talk by handing tickets through the window (IPC).

```
process A                     process B
  thread A1  ─┐                 thread B1
  thread A2  ─┼─ shared heap
  thread A3  ─┘   shared fds
```

Context switch: save registers and stack pointer, pick the next runnable, restore. If the next thread is another process, also switch the address space. That is why thread pools on one service are cheap compared to "one OS process per request" — until a wild write corrupts the shared heap.

In JS, the main event loop is one thread. `Worker` / child processes are how you actually use extra cores. Do not pretend `async` is parallelism.

## Comparison

| Need | Prefer | Cost you accept |
| --- | --- | --- |
| Fault isolation, different users | Processes | IPC, duplication, heavier switch |
| Shared in-memory cache, tight loop | Threads | Locks, races, one crash kills all |
| CPU-bound work in Node | Child process or worker | Serialization at the boundary |
| Huge burst of sockets | Thread pool *or* event loop | Pool size vs latency |
| Secret handling / sandbox | Separate process (or VM) | Setup time |

```ts
// Main thread owns the socket; workers own CPU. Sticky by crate.
function pickWorker(crateId: string, n: number): number {
  let h = 0;
  for (let i = 0; i < crateId.length; i++) h = (h * 31 + crateId.charCodeAt(i)) | 0;
  return Math.abs(h) % n;
}
```

Sticky assignment keeps a crate's in-memory state on one worker so you do not lock across threads. That is the same instinct as sharding.

## Common mistakes

- "Threads don't share memory." They share everything except their stacks.
- Equating goroutines/green threads with OS threads. User-space tasks multiplex onto fewer OS threads.
- Spawning a thread per request with no bound. You thrash the scheduler.
- Using a process pool and then sharing a mutable file without advisory locks.

## How to talk about it

"I use processes when I want a crash or a leak to stay in its box — browsers, plugin hosts, CI jobs. I use threads when workers need the same in-memory structure and I am willing to lock it. In a single-threaded runtime I will not claim async uses extra cores; I will add workers and serialize at the edge."

If they ask fork vs thread: "Fork copy-on-write-clones the map. Great for read-mostly children. The moment both sides mutate heavily, you paid for copies anyway — a thread might have been cheaper."

## Cross-links

- [Virtual memory is a lie the CPU believes](./os-memory.md) (id: os-memory)
- [Locks buy correctness, not speed](./locks-and-concurrency.md) (id: locks-and-concurrency)
- [HTTP is a conversation, TCP is the pipe](./http-and-tcp.md) (id: http-and-tcp)
- [Recursion is a stack you didn't allocate](./recursion-call-stack.md) (id: recursion-call-stack)
- [Split the keyspace on purpose](../system-design/foundations/sharding.md) (id: sharding)
